import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useMonth } from '../../context/MonthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { money, fmtDate } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Stat, Card, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

// Staff overview: invoices + a unified approvals log (who approved what).
export default function AdminHome() {
  const { month } = useMonth();
  const toast = useToast();
  const [invoices, setInvoices] = useState(null);
  const [log, setLog] = useState(null);
  const [error, setError] = useState(null);

  async function loadAll() {
    try {
      const [inv, pays, baz, reqs] = await Promise.all([
        api.get(`/invoices/all/${month}`),
        api.get(`/payments?monthYear=${month}`),
        api.get(`/bazaar?monthYear=${month}`),
        api.get('/requests'),
      ]);
      setInvoices(inv);
      // Normalize the three sources into one approvals feed.
      const feed = [
        ...pays.map((p) => ({
          kind: 'Payment', who: p.user_name, detail: `${money(p.amount)} · ${p.method}`,
          status: p.status === 'Paid' ? 'Approved' : 'Pending',
          approver: p.approved_by_name, when: p.approved_at, entityId: p.id,
        })),
        ...baz.map((b) => ({
          kind: 'Bazaar', who: b.buyer_name, detail: `${money(b.amount)}${b.details ? ` · ${b.details}` : ''}`,
          status: b.status, approver: b.approved_by_name, when: b.date, entityId: b.id,
        })),
        ...reqs.map((r) => ({
          kind: `Correction (${r.type})`, who: r.user_name,
          detail: `${r.original_value ?? '—'} → ${r.proposed_value ?? '—'}`,
          status: r.status, approver: r.approved_by_name, when: r.resolved_at, entityId: r.id,
        })),
      ];
      feed.sort((a, b) => (a.status === 'Pending' ? -1 : 1) - (b.status === 'Pending' ? -1 : 1));
      setLog(feed);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { loadAll(); }, [month]);

  const list = invoices || [];
  const totalBilled = list.reduce((s, i) => s + i.invoiceTotal, 0);
  const paidCount = list.filter((i) => i.payment.status === 'Paid').length;
  const totalMeals = list.reduce((s, i) => s + Number(i.userMeals), 0);
  const pendingCount = (log || []).filter((x) => x.status === 'Pending').length;

  async function rollback(e, entity, id) {
    e.stopPropagation();
    try { await api.post(`/rollback/${entity}/${id}`); toast.success('Rolled back'); loadAll(); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div>
      <PageHeader
        title="Owner Panel"
        subtitle={`Mess-wide summary for ${month}`}
        actions={
          <div className="row-actions">
            <button className="small ghost" onClick={() => { window.open(`/api/invoices/export/${month}`, '_blank'); }}>Export CSV</button>
          </div>
        }
      />
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
                  <tr><th>Type</th><th>Member</th><th>Detail</th><th>Status</th><th>Approved By</th><th>When</th><th></th></tr>
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
                      <td>
                        {x.status !== 'Pending' && x.entityId && (
                          <button className="small ghost" onClick={(e) => {
                            const entity = x.kind.startsWith('Correction') ? 'requests' : x.kind.toLowerCase();
                            rollback(e, entity, x.entityId);
                          }}>↩ Undo</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {log.length === 0 && <tr><td colSpan="7"><EmptyState title="Nothing logged yet" /></td></tr>}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
