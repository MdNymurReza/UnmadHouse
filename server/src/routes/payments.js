import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/payments?monthYear=YYYY-MM — members see their own; staff see all.
router.get('/', async (req, res) => {
  const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  const params = [];
  const clauses = [];
  if (!isStaff) {
    params.push(req.user.id);
    clauses.push(`p.user_id = $${params.length}`);
  }
  if (req.query.monthYear) {
    params.push(req.query.monthYear);
    clauses.push(`p.month_year = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS user_name, u.room_no,
            a.name AS approved_by_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN users a ON a.id = p.approved_by
       ${where}
      ORDER BY p.submitted_at DESC`,
    params
  );
  res.json(rows);
});

// POST /api/payments — a member submits a payment for review (upsert per month).
router.post('/', async (req, res) => {
  const { month_year, amount, method, tx_id, sender_no } = req.body || {};
  if (!month_year || amount == null || !['Cash', 'MFS'].includes(method)) {
    return res.status(400).json({ error: 'month_year, amount, and method (Cash|MFS) required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO payments (user_id, month_year, amount, method, tx_id, sender_no, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Unpaid')
     ON CONFLICT (user_id, month_year)
     DO UPDATE SET amount = EXCLUDED.amount, method = EXCLUDED.method,
                   tx_id = EXCLUDED.tx_id, sender_no = EXCLUDED.sender_no,
                   status = 'Unpaid', submitted_at = NOW(), approved_at = NULL
     RETURNING *`,
    [req.user.id, month_year, amount, method, tx_id || null, sender_no || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/payments/:id/approve — admin flips Unpaid -> Paid, recording who & when.
router.patch('/:id/approve', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE payments SET status = 'Paid', approved_at = NOW(), approved_by = $2
      WHERE id = $1 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
  res.json(rows[0]);
});

export default router;
