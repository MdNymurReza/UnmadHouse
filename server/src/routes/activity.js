import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

// GET /api/activity?limit=5 — recent actions across the mess (social proof feed).
router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const { rows } = await pool.query(
    `SELECT * FROM (
       SELECT 'bazaar' AS kind, b.id AS entity_id, b.date AS happened_at,
              u.name AS who, b.amount::text AS detail,
              b.status = 'Approved' AS is_resolved,
              a.name AS resolved_by
         FROM bazaar b JOIN users u ON u.id = b.buyer_id
         LEFT JOIN users a ON a.id = b.approved_by
        WHERE b.status IN ('Approved','Rejected')
       UNION ALL
       SELECT 'payment', p.id, COALESCE(p.approved_at, p.submitted_at),
              u2.name, p.amount::text,
              p.status = 'Paid',
              a2.name
         FROM payments p JOIN users u2 ON u2.id = p.user_id
         LEFT JOIN users a2 ON a2.id = p.approved_by
        WHERE p.status IN ('Paid')
       UNION ALL
       SELECT 'meal-entry', NULL, m.date,
              'Daily sheet', 'meals logged',
              TRUE, NULL
         FROM meals m
        GROUP BY m.date
       ) feed
     ORDER BY happened_at DESC LIMIT $1`,
    [limit]
  );
  res.json(rows);
});

export default router;
