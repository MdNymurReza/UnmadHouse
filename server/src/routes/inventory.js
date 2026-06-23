import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// GET /api/inventory — all roles see the shared inventory.
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, u.name AS updated_by_name
       FROM inventory i LEFT JOIN users u ON u.id = i.updated_by
      ORDER BY i.category, i.status = 'out', i.status = 'low' DESC, i.name`
  );
  res.json(rows);
});

// POST /api/inventory — staff adds an item.
router.post('/', requireStaff, async (req, res) => {
  const { name, quantity, category } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const { rows } = await pool.query(
    `INSERT INTO inventory (name, quantity, status, category, updated_by)
     VALUES ($1, $2, 'in-stock', $3, $4) RETURNING *`,
    [name, quantity || null, category || 'General', req.user.id]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/inventory/:id — staff updates an item.
router.put('/:id', requireStaff, async (req, res) => {
  const { name, quantity, status, category } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE inventory
        SET name = COALESCE($1, name),
            quantity = COALESCE($2, quantity),
            status = COALESCE($3, status),
            category = COALESCE($4, category),
            updated_at = NOW(),
            updated_by = $5
      WHERE id = $6 RETURNING *`,
    [name || null, quantity || null, status || null, category || null, req.user.id, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/inventory/:id — staff removes an item.
router.delete('/:id', requireStaff, async (req, res) => {
  const { rows } = await pool.query(
    `DELETE FROM inventory WHERE id = $1 RETURNING id`, [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true, id: rows[0].id });
});

export default router;
