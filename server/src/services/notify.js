// Notification broadcast. In dev this logs to the console; swap sendEmail for
// nodemailer (or any provider) to send real mail without touching callers.
import { pool } from '../db/pool.js';
import { sendPushNotifications, webPushReady } from '../routes/push.js';

function currentMonthYear() {
  // Avoid Date.now() pitfalls in tests by deriving from a passed value when possible.
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${m}`;
}

// Stub: replace with real email transport later.
async function sendEmail(to, subject, body) {
  console.log(`[notify] EMAIL -> ${to} | ${subject}\n         ${body}`);
}

/**
 * Find every member still flagged Unpaid for the cycle and broadcast a reminder.
 * @param {string} [monthYear] defaults to the current month.
 * @returns {Promise<number>} count of reminders sent.
 */
export async function broadcastUnpaidReminders(monthYear = currentMonthYear()) {
  const { rows: unpaid } = await pool.query(
    `SELECT u.id, u.email, u.name, u.room_no
       FROM users u
       LEFT JOIN payments p
         ON p.user_id = u.id AND p.month_year = $1
      WHERE COALESCE(p.status, 'Unpaid') = 'Unpaid'`,
    [monthYear]
  );

  let pushSent = 0;
  for (const u of unpaid) {
    await sendEmail(
      u.email,
      `UnmadHouse: Invoice due for Room ${u.room_no}`,
      `System Alert: Monthly Invoice generated for Room ${u.room_no} (${monthYear}). Please process your payment.`
    );
    // Also push to the user's subscribed devices.
    if (webPushReady) {
      try {
        pushSent += await sendPushNotifications(u.id, {
          title: `Invoice due — ${monthYear}`,
          body: `Your UnmadHouse invoice for ${monthYear} is unpaid. Please settle it.`,
          icon: '/icon-192.png',
          data: { url: '/app/invoice' },
        });
      } catch (e) {
        console.error(`[push] failed for user ${u.id}:`, e.message);
      }
    }
  }

  console.log(`[notify] ${unpaid.length} unpaid reminder(s) broadcast for ${monthYear} (${pushSent} push).`);
  return unpaid.length;
}

export { currentMonthYear };
