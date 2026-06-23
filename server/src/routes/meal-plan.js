import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

// GET /api/meal-plan/:monthYear — logged-in member sees their own plan.
router.get('/:monthYear', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, date, lunch, dinner, note
       FROM meal_plan
      WHERE user_id = $1 AND to_char(date, 'YYYY-MM') = $2
      ORDER BY date`,
    [req.user.id, req.params.monthYear]
  );
  res.json(rows);
});

// GET /api/meal-plan/day/:date — staff sees every member's plan for a day.
router.get('/day/:date', async (req, res) => {
  const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  if (!isStaff) {
    // Members can only see their own — redirect to the monthly route.
    const { rows } = await pool.query(
      `SELECT date, lunch, dinner, note FROM meal_plan WHERE user_id = $1 AND date = $2`,
      [req.user.id, req.params.date]
    );
    return res.json(rows);
  }
  const { rows } = await pool.query(
    `SELECT mp.user_id, u.name, mp.date, mp.lunch, mp.dinner, mp.note
       FROM meal_plan mp JOIN users u ON u.id = mp.user_id
      WHERE mp.date = $1 ORDER BY u.name`,
    [req.params.date]
  );
  res.json(rows);
});

// PUT /api/meal-plan — member upserts their plan (lunch/dinner) for a date.
router.put('/', async (req, res) => {
  const { date, lunch, dinner, note } = req.body || {};
  if (!date || lunch == null || dinner == null) {
    return res.status(400).json({ error: 'date, lunch, and dinner are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO meal_plan (user_id, date, lunch, dinner, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, date)
     DO UPDATE SET lunch = EXCLUDED.lunch, dinner = EXCLUDED.dinner, note = EXCLUDED.note
     RETURNING *`,
    [req.user.id, date, !!lunch, !!dinner, note || null]
  );
  res.json(rows[0]);
});

export default router;
