import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';
import { getUserInvoice, getAllInvoices } from '../services/billing.js';

const router = Router();
router.use(verifyJWT);

// GET /api/invoices/all/:monthYear — staff view of every member's invoice.
router.get('/all/:monthYear', requireStaff, async (req, res) => {
  const invoices = await getAllInvoices(req.params.monthYear);
  res.json(invoices.filter(Boolean));
});

// GET /api/invoices/:userId/:monthYear — one member's computed invoice.
// Members may only view their own.
router.get('/:userId/:monthYear', async (req, res) => {
  const userId = Number(req.params.userId);
  if (req.user.role === 'MEMBER' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Cannot view another member\'s invoice' });
  }
  const invoice = await getUserInvoice(userId, req.params.monthYear);
  if (!invoice) return res.status(404).json({ error: 'User not found' });
  res.json(invoice);
});

export default router;
