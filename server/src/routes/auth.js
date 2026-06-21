import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { signToken, verifyJWT } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', verifyJWT, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, room_no, joining_date,
            room_rent, advance_paid, fridge_fund, service_charge
       FROM users WHERE id = $1`,
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// GET /api/auth/roommates — others sharing the caller's room number.
router.get('/roommates', verifyJWT, async (req, res) => {
  const { rows: me } = await pool.query(`SELECT room_no FROM users WHERE id = $1`, [req.user.id]);
  if (me.length === 0) return res.status(404).json({ error: 'User not found' });
  const { rows } = await pool.query(
    `SELECT id, name, role FROM users
      WHERE room_no = $1 AND id <> $2 ORDER BY name`,
    [me[0].room_no, req.user.id]
  );
  res.json(rows);
});

export default router;
