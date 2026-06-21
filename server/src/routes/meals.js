import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// Lunch=1, Dinner=1. meal_count is always derived from the two flags.
function deriveCount(lunch, dinner) {
  return (lunch ? 1 : 0) + (dinner ? 1 : 0);
}

// GET /api/meals/day/:date — every member's lunch/dinner for one day (staff sheet).
router.get('/day/:date', requireStaff, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id AS user_id, u.name, u.room_no,
            COALESCE(m.lunch, FALSE)  AS lunch,
            COALESCE(m.dinner, FALSE) AS dinner
       FROM users u
       LEFT JOIN meals m ON m.user_id = u.id AND m.date = $1
      ORDER BY u.id`,
    [req.params.date]
  );
  res.json(rows);
});

// GET /api/meals/:userId/:monthYear — a member's daily log for a month.
// Members may only read their own; staff may read anyone's.
router.get('/:userId/:monthYear', async (req, res) => {
  const userId = Number(req.params.userId);
  if (req.user.role === 'MEMBER' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Cannot view another member\'s meals' });
  }
  const { rows } = await pool.query(
    `SELECT id, date, lunch, dinner, meal_count
       FROM meals
      WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = $2
      ORDER BY date`,
    [userId, req.params.monthYear]
  );
  res.json(rows);
});

// PUT /api/meals — staff sets a member's meals for a date.
// Accepts { user_id, date, lunch, dinner }. meal_count is derived server-side.
router.put('/', requireStaff, async (req, res) => {
  const { user_id, date, lunch, dinner } = req.body || {};
  if (!user_id || !date || lunch == null || dinner == null) {
    return res.status(400).json({ error: 'user_id, date, lunch, and dinner are required' });
  }
  const meal_count = deriveCount(lunch, dinner);
  const { rows } = await pool.query(
    `INSERT INTO meals (user_id, date, lunch, dinner, meal_count)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, date)
     DO UPDATE SET lunch = EXCLUDED.lunch,
                   dinner = EXCLUDED.dinner,
                   meal_count = EXCLUDED.meal_count
     RETURNING id, user_id, date, lunch, dinner, meal_count`,
    [user_id, date, !!lunch, !!dinner, meal_count]
  );
  res.json(rows[0]);
});

export default router;
