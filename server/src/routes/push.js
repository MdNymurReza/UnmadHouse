import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import webpush from 'web-push';

// Generate once and keep in .env — or use these dev defaults.
// In production, run: require('web-push').generateVAPIDKeys() and store in env vars.
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@unmadhouse.local';

let webPushReady = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  webPushReady = true;
  console.log('[push] web-push configured');
} else {
  console.warn('[push] VAPID keys not set — push notifications disabled. Generate keys: npx web-push generate-vapid-keys');
}

const router = Router();
router.use(verifyJWT);

// GET /api/push/key — public VAPID key for the browser.
router.get('/key', (_req, res) => {
  res.json({ publicKey: webPushReady ? VAPID_PUBLIC : null });
});

// POST /api/push/subscribe — store a PushSubscription for this user.
router.post('/subscribe', async (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, subscription)
     VALUES ($1, $2) ON CONFLICT (user_id, subscription) DO NOTHING`,
    [req.user.id, JSON.stringify(sub)]
  );
  res.json({ ok: true });
});

// POST /api/push/unsubscribe — remove a subscription.
router.post('/unsubscribe', async (req, res) => {
  const { endpoint } = req.body || {};
  await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription->>'endpoint' = $2`,
    [req.user.id, endpoint]
  );
  res.json({ ok: true });
});

// Exported for use by the cron notify module.
export async function sendPushNotifications(userId, payload) {
  if (!webPushReady) return 0;
  const { rows } = await pool.query(
    `SELECT subscription FROM push_subscriptions WHERE user_id = $1`, [userId]
  );
  let sent = 0;
  for (const { subscription } of rows) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent++;
    } catch (err) {
      // If the subscription is gone (410), clean it up.
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query(`DELETE FROM push_subscriptions WHERE subscription = $1`, [JSON.stringify(subscription)]);
      }
    }
  }
  return sent;
}

export default router;
// Export readiness flag for notify.js.
export { webPushReady };
