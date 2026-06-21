import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/requests — members see their own; staff see the whole pending queue.
router.get('/', async (req, res) => {
  const isStaff = req.user.role === 'ADMIN' || req.user.role === 'MANAGER';
  const params = [];
  let where = '';
  if (!isStaff) {
    params.push(req.user.id);
    where = `WHERE r.user_id = $1`;
  }
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS user_name, a.name AS approved_by_name
       FROM requests r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN users a ON a.id = r.approved_by
       ${where}
      ORDER BY (r.status = 'Pending') DESC, r.created_at DESC`,
    params
  );
  res.json(rows);
});

// POST /api/requests — a member opens a correction ticket.
router.post('/', async (req, res) => {
  const { type, target_id, original_value, proposed_value, reason } = req.body || {};
  if (!['Meal', 'Bazaar'].includes(type) || !reason) {
    return res.status(400).json({ error: 'type (Meal|Bazaar) and reason are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO requests (user_id, type, target_id, original_value, proposed_value, reason)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, type, target_id || null, original_value ?? null, proposed_value ?? null, reason]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/requests/:id — staff approve/reject. Approval applies the proposed value.
router.patch('/:id', requireStaff, async (req, res) => {
  const { status } = req.body || {};
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be Approved or Rejected' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: reqRows } = await client.query(
      `SELECT * FROM requests WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    if (reqRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }
    const ticket = reqRows[0];
    if (ticket.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Request already resolved' });
    }

    // On approval, mutate the referenced source row to the proposed value.
    if (status === 'Approved' && ticket.target_id && ticket.proposed_value != null) {
      if (ticket.type === 'Meal') {
        await client.query(`UPDATE meals SET meal_count = $1 WHERE id = $2`, [
          ticket.proposed_value, ticket.target_id,
        ]);
      } else if (ticket.type === 'Bazaar') {
        await client.query(`UPDATE bazaar SET amount = $1 WHERE id = $2`, [
          ticket.proposed_value, ticket.target_id,
        ]);
      }
    }

    const { rows } = await client.query(
      `UPDATE requests SET status = $1, resolved_at = NOW(), approved_by = $3 WHERE id = $2 RETURNING *`,
      [status, req.params.id, req.user.id]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
