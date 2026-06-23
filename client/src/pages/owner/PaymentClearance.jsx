import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { money } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

// Admin-only: review submitted payments and flip Unpaid -> Paid.
export default function PaymentClearance() {
  const toast = useToast();
  const { month } = useMonth();
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try { setPayments(await api.get(`/payments?monthYear=${month}`)); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function approve(id, name) {
    try { await api.patch(`/payments/${id}/approve`); toast.success(`${name}'s payment marked Paid`); await load(); }
    catch (e) { toast.error(e.message); }
  }

  const list = payments || [];

  return (
    <div>
      <PageHeader title="Payment Clearance" subtitle={`Submitted payments for ${month}`} />
      {error && <p className="error-text">{error}</p>}
      {payments === null && <Loading />}

      {payments && (
        <TableWrap>
          <thead>
            <tr><th>Member</th><th>Room</th><th className="num">Amount</th><th>Method</th><th>TxID</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.user_name}</td>
                <td>{p.room_no}</td>
                <td className="num">{money(p.amount)}</td>
                <td>{p.method}</td>
                <td className="muted">{p.tx_id || '—'}</td>
                <td><Badge status={p.status} /></td>
                <td>
                  {p.status === 'Unpaid'
                    ? <button className="small success" onClick={() => approve(p.id, p.user_name)}>Mark Paid</button>
                    : <span className="muted">{p.approved_at ? new Date(p.approved_at).toLocaleDateString() : '✓'}</span>}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="7"><EmptyState title="No payments submitted yet" /></td></tr>}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
