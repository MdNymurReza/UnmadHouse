import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/bazaar?monthYear=YYYY-MM&status=Pending
// Members see their own entries; staff see everyone's.
router.get('/', async (req, res) => {
  const { monthYear, status } = req.query;
  const clauses = [];
  const params = [];

  if (req.user.role === 'MEMBER') {
    params.push(req.user.id);
    clauses.push(`b.buyer_id = $${params.length}`);
  }
  if (monthYear) {
    params.push(monthYear);
    clauses.push(`to_char(b.date, 'YYYY-MM') = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`b.status = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT b.id, b.buyer_id, u.name AS buyer_name, b.amount, b.date, b.details, b.status,
            a.name AS approved_by_name
       FROM bazaar b
       JOIN users u ON u.id = b.buyer_id
       LEFT JOIN users a ON a.id = b.approved_by
       ${where}
      ORDER BY b.date DESC, b.id DESC`,
    params
  );
  res.json(rows);
});

// POST /api/bazaar — a member logs their own grocery spend (lands as Pending).
router.post('/', async (req, res) => {
  const { amount, date, details } = req.body || {};
  if (amount == null || !date) {
    return res.status(400).json({ error: 'amount and date are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO bazaar (buyer_id, amount, date, details, status)
     VALUES ($1, $2, $3, $4, 'Pending')
     RETURNING id, buyer_id, amount, date, details, status`,
    [req.user.id, amount, date, details || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/bazaar/:id/status — staff approve/reject an entry.
router.patch('/:id/status', requireStaff, async (req, res) => {
  const { status } = req.body || {};
  if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  // Record the approver when resolving; clear it if re-set to Pending.
  const approvedBy = status === 'Pending' ? null : req.user.id;
  const { rows } = await pool.query(
    `UPDATE bazaar SET status = $1, approved_by = $3 WHERE id = $2
     RETURNING id, buyer_id, amount, date, details, status`,
    [status, req.params.id, approvedBy]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json(rows[0]);
});

export default router;
