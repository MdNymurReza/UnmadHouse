import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/bills/:monthYear — shared utilities for a month (everyone can read).
router.get('/:monthYear', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT month_year, bua_bill, gas_bill, electricity_bill
       FROM fixed_bills WHERE month_year = $1`,
    [req.params.monthYear]
  );
  res.json(rows[0] || { month_year: req.params.monthYear, bua_bill: 0, gas_bill: 0, electricity_bill: 0 });
});

// PUT /api/bills/:monthYear — admin sets/updates shared utilities (upsert).
router.put('/:monthYear', requireAdmin, async (req, res) => {
  const { bua_bill = 0, gas_bill = 0, electricity_bill = 0 } = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO fixed_bills (month_year, bua_bill, gas_bill, electricity_bill)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (month_year)
     DO UPDATE SET bua_bill = EXCLUDED.bua_bill,
                   gas_bill = EXCLUDED.gas_bill,
                   electricity_bill = EXCLUDED.electricity_bill
     RETURNING month_year, bua_bill, gas_bill, electricity_bill`,
    [req.params.monthYear, bua_bill, gas_bill, electricity_bill]
  );
  res.json(rows[0]);
});

export default router;
