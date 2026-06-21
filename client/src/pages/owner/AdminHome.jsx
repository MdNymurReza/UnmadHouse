import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { DEFAULT_MONTH, money, fmtDate } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Stat, Card, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

// Staff overview: invoices + a unified approvals log (who approved what).
export default function AdminHome() {
  const [invoices, setInvoices] = useState(null);
  const [log, setLog] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/invoices/all/${DEFAULT_MONTH}`),
      api.get(`/payments?monthYear=${DEFAULT_MONTH}`),
      api.get(`/bazaar?monthYear=${DEFAULT_MONTH}`),
      api.get('/requests'),
    ])
      .then(([inv, pays, baz, reqs]) => {
        setInvoices(inv);
        // Normalize the three sources into one approvals feed.
        const feed = [
          ...pays.map((p) => ({
            kind: 'Payment', who: p.user_name, detail: `${money(p.amount)} · ${p.method}`,
            status: p.status === 'Paid' ? 'Approved' : 'Pending',
            approver: p.approved_by_name, when: p.approved_at,
          })),
          ...baz.map((b) => ({
            kind: 'Bazaar', who: b.buyer_name, detail: `${money(b.amount)}${b.details ? ` · ${b.details}` : ''}`,
            status: b.status, approver: b.approved_by_name, when: b.date,
          })),
          ...reqs.map((r) => ({
            kind: `Correction (${r.type})`, who: r.user_name,
            detail: `${r.original_value ?? '—'} → ${r.proposed_value ?? '—'}`,
            status: r.status, approver: r.approved_by_name, when: r.resolved_at,
          })),
        ];
        // Pending first, then most recently actioned.
        feed.sort((a, b) => (a.status === 'Pending' ? -1 : 1) - (b.status === 'Pending' ? -1 : 1));
        setLog(feed);
      })
      .catch((e) => setError(e.message));
  }, []);

  const list = invoices || [];
  const totalBilled = list.reduce((s, i) => s + i.invoiceTotal, 0);
  const paidCount = list.filter((i) => i.payment.status === 'Paid').length;
  const totalMeals = list.reduce((s, i) => s + Number(i.userMeals), 0);
  const pendingCount = (log || []).filter((x) => x.status === 'Pending').length;

  return (
    <div>
      <PageHeader title="Owner Panel" subtitle={`Mess-wide summary for ${DEFAULT_MONTH}`} />
      {error && <p className="error-text">{error}</p>}
      {invoices === null && <Loading />}

      {invoices && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 18 }}>
            <Stat label="Total Billed" value={money(totalBilled)} icon="₹" />
            <Stat label="Paid" value={`${paidCount} / ${list.length}`} icon="◉" tone={paidCount === list.length ? 'green' : 'amber'} />
            <Stat label="Total Meals" value={totalMeals} icon="◷" tone="amber" />
            <Stat label="Pending Approvals" value={pendingCount} icon="⧉" tone={pendingCount ? 'red' : 'green'} />
          </div>

          <Card title="Member Invoices" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <table>
              <thead>
                <tr><th>Member</th><th>Room</th><th className="num">Meals</th><th className="num">Bazaar Bal.</th><th className="num">Invoice</th><th>Status</th></tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.user.id}>
                    <td>{i.user.name}</td>
                    <td>{i.user.room_no}</td>
                    <td className="num">{i.userMeals}</td>
                    <td className={`num ${i.bazaarBalance >= 0 ? 'pos' : 'neg'}`}>{money(i.bazaarBalance)}</td>
                    <td className="num">{money(i.invoiceTotal)}</td>
                    <td><Badge status={i.payment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="Approvals Log — who approved what" style={{ padding: 0, overflow: 'hidden' }}>
            {log === null ? <Loading /> : (
              <table>
                <thead>
                  <tr><th>Type</th><th>Member</th><th>Detail</th><th>Status</th><th>Approved By</th><th>When</th></tr>
                </thead>
                <tbody>
                  {log.map((x, i) => (
                    <tr key={i}>
                      <td>{x.kind}</td>
                      <td>{x.who}</td>
                      <td className="muted">{x.detail}</td>
                      <td><Badge status={x.status} /></td>
                      <td>{x.approver || <span className="muted">—</span>}</td>
                      <td className="muted">{x.status === 'Pending' ? '—' : fmtDate(x.when)}</td>
                    </tr>
                  ))}
                  {log.length === 0 && <tr><td colSpan="6"><EmptyState title="Nothing logged yet" /></td></tr>}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
