import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import billRoutes from './routes/bills.js';
import mealRoutes from './routes/meals.js';
import bazaarRoutes from './routes/bazaar.js';
import requestRoutes from './routes/requests.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import reportRoutes from './routes/reports.js';
import { startScheduler } from './cron/scheduler.js';

const app = express();

// Restrict CORS to the deployed frontend when CLIENT_ORIGIN is set; allow all in dev.
const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(clientOrigin ? { origin: clientOrigin.split(',').map((s) => s.trim()) } : undefined));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/bazaar', bazaarRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);

// Centralized error handler — async route rejections forwarded here land as 500s.
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[server] UnmadHouse API listening on :${PORT}`);
  startScheduler();
});
