import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(verifyJWT);

// POST /api/users — admin creates a new member account with hashed password.
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, room_no, joining_date, room_rent,
          advance_paid, fridge_fund, service_charge, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'A member with that email already exists' });
  }
  const allowedRole = role === 'MANAGER' ? 'MANAGER' : 'MEMBER';
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, room_no, joining_date,
                        room_rent, advance_paid, fridge_fund, service_charge)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, name, email, role, room_no, joining_date,
               room_rent, advance_paid, fridge_fund, service_charge`,
    [
      name, email, hash, allowedRole,
      room_no || null,
      joining_date || new Date().toISOString().slice(0, 10),
      room_rent ?? 0, advance_paid ?? 0, fridge_fund ?? 0, service_charge ?? 0,
    ]
  );
  res.status(201).json(rows[0]);
});

// GET /api/users — roster (staff sees it for the role matrix / approvals).
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, room_no, joining_date,
            room_rent, advance_paid, fridge_fund, service_charge
       FROM users ORDER BY id`
  );
  res.json(rows);
});

// PATCH /api/users/:id/role — admin toggles MANAGER <-> MEMBER.
// Cannot change an ADMIN, and cannot promote to ADMIN here.
router.patch('/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!['MANAGER', 'MEMBER'].includes(role)) {
    return res.status(400).json({ error: 'role must be MANAGER or MEMBER' });
  }
  const { rows: target } = await pool.query(`SELECT role FROM users WHERE id = $1`, [req.params.id]);
  if (target.length === 0) return res.status(404).json({ error: 'User not found' });
  if (target[0].role === 'ADMIN') {
    return res.status(400).json({ error: 'Cannot change the admin role' });
  }
  const { rows } = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role`,
    [role, req.params.id]
  );
  res.json(rows[0]);
});

// PATCH /api/users/:id/profile — admin sets per-room rent and room number.
router.patch('/:id/profile', requireAdmin, async (req, res) => {
  const { room_no, room_rent } = req.body || {};
  if (room_rent != null && (isNaN(Number(room_rent)) || Number(room_rent) < 0)) {
    return res.status(400).json({ error: 'room_rent must be a non-negative number' });
  }
  const { rows } = await pool.query(
    `UPDATE users
        SET room_no   = COALESCE($1, room_no),
            room_rent = COALESCE($2, room_rent)
      WHERE id = $3
      RETURNING id, name, room_no, room_rent`,
    [room_no ?? null, room_rent ?? null, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

export default router;
