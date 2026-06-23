import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();
router.use(verifyJWT);

// POST /api/rollback/:entity/:id — admin undoes an approval/rejection.
// Entity: payments | bazaar | requests.
// Does NOT revert the data mutation (meal count / bazaar amount changes from
// correction-request approvals are irreversible via this endpoint — too risky).
router.post('/:entity/:id', requireAdmin, async (req, res) => {
  const { entity, id } = req.params;

  if (entity === 'payments') {
    const { rows } = await pool.query(
      `UPDATE payments SET status = 'Unpaid', approved_at = NULL, approved_by = NULL
        WHERE id = $1 AND status = 'Paid' RETURNING *`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found or not paid' });
    return res.json({ rolledBack: true, entity: 'payments', id: rows[0].id });
  }

  if (entity === 'bazaar') {
    const { rows } = await pool.query(
      `UPDATE bazaar SET status = 'Pending', approved_by = NULL
        WHERE id = $1 AND status IN ('Approved','Rejected') RETURNING *`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bazaar entry not found or still pending' });
    return res.json({ rolledBack: true, entity: 'bazaar', id: rows[0].id });
  }

  if (entity === 'requests') {
    const { rows } = await pool.query(
      `UPDATE requests SET status = 'Pending', resolved_at = NULL, approved_by = NULL
        WHERE id = $1 AND status IN ('Approved','Rejected') RETURNING *`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found or still pending' });
    return res.json({ rolledBack: true, entity: 'requests', id: rows[0].id });
  }

  res.status(400).json({ error: 'Unknown entity. Use payments, bazaar, or requests.' });
});

export default router;
