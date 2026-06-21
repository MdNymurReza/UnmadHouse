import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { mealRate } from '../services/invoiceEngine.js';
import { getUserInvoice } from '../services/billing.js';

const router = Router();
router.use(verifyJWT);

const OCCUPANTS = 6;

// Members are always scoped to their own data; staff may pass ?userId= to scope,
// or omit it for the mess-wide view.
function scopedUserId(req) {
  if (req.user.role === 'MEMBER') return req.user.id;
  return req.query.userId ? Number(req.query.userId) : null;
}

// GET /api/reports/breakdown/:monthYear[?userId=] — pie data: where money went.
// With a user scope: that member's personal cost split (their invoice components).
// Without: the whole mess.
router.get('/breakdown/:monthYear', async (req, res) => {
  const my = req.params.monthYear;
  const userId = scopedUserId(req);

  if (userId) {
    const inv = await getUserInvoice(userId, my);
    if (!inv) return res.status(404).json({ error: 'User not found' });
    return res.json([
      { name: 'Room Rent', value: inv.roomRent },
      { name: 'Maid (Bua)', value: inv.utilities.bua },
      { name: 'Gas', value: inv.utilities.gas },
      { name: 'Electricity', value: inv.utilities.current },
      { name: 'Meal Cost', value: inv.userMealCost },
    ]);
  }

  const [{ rows: rent }, { rows: bill }, { rows: baz }] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(room_rent), 0) AS total FROM users`),
    pool.query(
      `SELECT COALESCE(bua_bill,0) AS bua, COALESCE(gas_bill,0) AS gas,
              COALESCE(electricity_bill,0) AS current
         FROM fixed_bills WHERE month_year = $1`,
      [my]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM bazaar
        WHERE status = 'Approved' AND to_char(date,'YYYY-MM') = $1`,
      [my]
    ),
  ]);
  const b = bill[0] || { bua: 0, gas: 0, current: 0 };
  res.json([
    { name: 'Rent', value: Number(rent[0].total) },
    { name: 'Maid (Bua)', value: Number(b.bua) },
    { name: 'Gas', value: Number(b.gas) },
    { name: 'Electricity', value: Number(b.current) },
    { name: 'Bazaar', value: Number(baz[0].total) },
  ]);
});

// GET /api/reports/trends?months=6[&userId=] — line/bar data per recent month.
// Scoped to a user: their own bazaar, meals, and meal cost (at the mess rate).
// Unscoped: mess-wide totals and the global meal rate.
router.get('/trends', async (req, res) => {
  const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
  const userId = scopedUserId(req);

  const { rows: monthRows } = await pool.query(
    `SELECT DISTINCT to_char(date, 'YYYY-MM') AS my FROM (
        SELECT date FROM bazaar UNION ALL SELECT date FROM meals
     ) d ORDER BY my DESC LIMIT $1`,
    [months]
  );

  const series = [];
  for (const { my } of monthRows.reverse()) {
    // Mess-wide totals are always needed to compute the meal rate.
    const [{ rows: bz }, { rows: ml }] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total FROM bazaar
          WHERE status='Approved' AND to_char(date,'YYYY-MM')=$1`, [my]
      ),
      pool.query(
        `SELECT COALESCE(SUM(meal_count),0) AS total FROM meals
          WHERE to_char(date,'YYYY-MM')=$1`, [my]
      ),
    ]);
    const messBazaar = Number(bz[0].total);
    const messMeals = Number(ml[0].total);
    const rate = Math.round(mealRate(messBazaar, messMeals) * 100) / 100;

    if (userId) {
      const [{ rows: ubz }, { rows: uml }] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(amount),0) AS total FROM bazaar
            WHERE buyer_id=$2 AND status='Approved' AND to_char(date,'YYYY-MM')=$1`, [my, userId]
        ),
        pool.query(
          `SELECT COALESCE(SUM(meal_count),0) AS total FROM meals
            WHERE user_id=$2 AND to_char(date,'YYYY-MM')=$1`, [my, userId]
        ),
      ]);
      const myBazaar = Number(ubz[0].total);
      const myMeals = Number(uml[0].total);
      series.push({
        month: my,
        bazaar: myBazaar,
        meals: myMeals,
        mealCost: Math.round(myMeals * rate * 100) / 100,
        mealRate: rate,
      });
    } else {
      series.push({ month: my, bazaar: messBazaar, meals: messMeals, mealRate: rate });
    }
  }
  res.json(series);
});

export default router;
