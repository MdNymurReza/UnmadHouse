import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { money, fmtDate } from '../lib/month.js';
import Badge from '../components/Badge.jsx';
import { PageHeader, Stat, TableWrap, Loading, EmptyState } from '../components/ui.jsx';

// Payment history: how much each member paid and on which date.
// Members see their own; staff (Admin/Manager) see everyone and can filter by member.
export default function PaymentHistory() {
  const { isStaff } = useAuth();
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);
  const [filterUser, setFilterUser] = useState('all');

  useEffect(() => {
    // No monthYear filter → full history across all cycles.
    api.get('/payments').then(setPayments).catch((e) => setError(e.message));
  }, []);

  // Distinct members present in the data (for the staff filter).
  const members = useMemo(() => {
    const seen = new Map();
    (payments || []).forEach((p) => { if (!seen.has(p.user_id)) seen.set(p.user_id, p.user_name); });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [payments]);

  const rows = useMemo(() => {
    const list = payments || [];
    return filterUser === 'all' ? list : list.filter((p) => String(p.user_id) === filterUser);
  }, [payments, filterUser]);

  const totalPaid = rows.filter((p) => p.status === 'Paid').reduce((s, p) => s + Number(p.amount), 0);
  const paidCount = rows.filter((p) => p.status === 'Paid').length;

  return (
    <div>
      <PageHeader
        title="Payment History"
        subtitle="How much was paid, by whom, and on which date."
      />
      {error && <p className="error-text">{error}</p>}
      {payments === null && <Loading />}

      {payments && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 18 }}>
            <Stat label="Total Paid (cleared)" value={money(totalPaid)} icon="₹" tone="green" />
            <Stat label="Cleared Payments" value={paidCount} icon="◉" />
            <Stat label="Records" value={rows.length} icon="▤" tone="amber" />
          </div>

          {isStaff && members.length > 1 && (
            <div className="toolbar">
              <label>
                Member
                <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                  <option value="all">All members</option>
                  {members.map((m) => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
                </select>
              </label>
            </div>
          )}

          <TableWrap>
            <thead>
              <tr>
                {isStaff && <th>Member</th>}
                <th>Billing Month</th>
                <th className="num">Amount</th>
                <th>Method</th>
                <th>Submitted</th>
                <th>Paid On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  {isStaff && <td>{p.user_name} <span className="muted">({p.room_no})</span></td>}
                  <td>{p.month_year}</td>
                  <td className="num">{money(p.amount)}</td>
                  <td>{p.method}{p.tx_id ? <span className="muted"> · {p.tx_id}</span> : ''}</td>
                  <td>{fmtDate(p.submitted_at)}</td>
                  <td>{p.status === 'Paid' ? fmtDate(p.approved_at) : <span className="muted">—</span>}</td>
                  <td><Badge status={p.status} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={isStaff ? 7 : 6}><EmptyState title="No payment records yet" hint="Payments appear here once submitted." /></td></tr>
              )}
            </tbody>
          </TableWrap>
        </>
      )}
    </div>
  );
}
