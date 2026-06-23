import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/notices — all roles see the notice board.
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, u.name AS author_name
       FROM notices n JOIN users u ON u.id = n.author_id
      ORDER BY n.pinned DESC, n.created_at DESC`
  );
  res.json(rows);
});

// POST /api/notices — staff posts a notice.
router.post('/', requireStaff, async (req, res) => {
  const { title, body, pinned } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const { rows } = await pool.query(
    `INSERT INTO notices (author_id, title, body, pinned)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, title, body || null, !!pinned]
  );
  // Include author name for immediate UI update.
  rows[0].author_name = req.user.name;
  res.status(201).json(rows[0]);
});

// DELETE /api/notices/:id — staff deletes a notice.
router.delete('/:id', requireStaff, async (req, res) => {
  const { rowCount } = await pool.query(`DELETE FROM notices WHERE id = $1`, [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

export default router;
