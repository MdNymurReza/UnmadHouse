import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// POST /api/rollover — admin copies fixed bills to a new month.
router.post('/rollover', requireAdmin, async (req, res) => {
  const { fromMonth, toMonth } = req.body || {};
  if (!fromMonth || !toMonth) {
    return res.status(400).json({ error: 'fromMonth and toMonth are required' });
  }
  // Upsert: copy the fromMonth row, inserting into toMonth.
  const { rows } = await pool.query(
    `INSERT INTO fixed_bills (month_year, bua_bill, gas_bill, electricity_bill)
     SELECT $2, bua_bill, gas_bill, electricity_bill
       FROM fixed_bills WHERE month_year = $1
     ON CONFLICT (month_year)
     DO UPDATE SET bua_bill = EXCLUDED.bua_bill,
                   gas_bill = EXCLUDED.gas_bill,
                   electricity_bill = EXCLUDED.electricity_bill
     RETURNING *`,
    [fromMonth, toMonth]
  );
  if (rows.length === 0) {
    // No fromMonth row exists — create a blank one for toMonth.
    const { rows: blank } = await pool.query(
      `INSERT INTO fixed_bills (month_year, bua_bill, gas_bill, electricity_bill)
       VALUES ($1, 0, 0, 0)
       ON CONFLICT (month_year) DO NOTHING
       RETURNING *`,
      [toMonth]
    );
    return res.json(blank[0] || { month_year: toMonth, bua_bill: '0', gas_bill: '0', electricity_bill: '0' });
  }
  res.json(rows[0]);
});

export default router;
