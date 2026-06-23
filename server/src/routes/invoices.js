import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { requireStaff } from '../middleware/rbac.js';
import { getUserInvoice, getAllInvoices } from '../services/billing.js';

const router = Router();
router.use(verifyJWT);

// GET /api/invoices/export/:monthYear — CSV download (staff only).
router.get('/export/:monthYear', requireStaff, async (req, res) => {
  const invs = await getAllInvoices(req.params.monthYear);
  const list = invs.filter(Boolean);
  const rows = list.map((i) => [
    i.user.name,
    i.user.room_no,
    i.roomRent,
    i.utilities.bua,
    i.utilities.gas,
    i.utilities.current,
    i.userMeals,
    i.mealRate,
    i.userMealCost,
    i.userApprovedBazaar,
    i.bazaarBalance,
    i.invoiceTotal,
    i.payment.status,
    i.payment.amount,
  ].join(','));
  const header = 'Name,Room,Room Rent,Bua Share,Gas Share,Electricity Share,Meals,Meal Rate,Meal Cost,Bazaar Spent,Bazaar Balance,Invoice Total,Payment Status,Paid Amount';
  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="unmadhouse-${req.params.monthYear}.csv"`);
  res.send(csv);
});

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
