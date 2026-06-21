import express from 'express';
import { getStatus } from '../models/status.js';
import { getInvoiceSummary } from '../models/invoices.js';
import { createCorrectionRequest, getPendingRequests, handleRequestDecision } from '../models/requests.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  res.json(await getStatus());
});

router.get('/invoice-summary/:monthYear', async (req, res) => {
  const { monthYear } = req.params;
  const summary = await getInvoiceSummary(monthYear);
  res.json(summary);
});

router.get('/requests/pending', async (req, res) => {
  res.json(await getPendingRequests());
});

router.post('/requests', async (req, res) => {
  const payload = req.body;
  const created = await createCorrectionRequest(payload);
  res.status(201).json(created);
});

router.post('/requests/:id/decision', async (req, res) => {
  const { id } = req.params;
  const { decision, reviewerId } = req.body;
  const result = await handleRequestDecision(id, decision, reviewerId);
  res.json(result);
});

export default router;
