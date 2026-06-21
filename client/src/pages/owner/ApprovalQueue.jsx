import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { money } from '../../lib/month.js';
import { PageHeader, Card, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

// Staff: resolve correction tickets and approve/reject pending bazaar entries.
export default function ApprovalQueue() {
  const toast = useToast();
  const [requests, setRequests] = useState(null);
  const [bazaar, setBazaar] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const [r, b] = await Promise.all([api.get('/requests'), api.get('/bazaar?status=Pending')]);
      setRequests(r); setBazaar(b);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function resolveRequest(id, status) {
    try { await api.patch(`/requests/${id}`, { status }); toast.success(`Request ${status.toLowerCase()}`); await load(); }
    catch (e) { toast.error(e.message); }
  }
  async function resolveBazaar(id, status) {
    try { await api.patch(`/bazaar/${id}/status`, { status }); toast.success(`Bazaar ${status.toLowerCase()}`); await load(); }
    catch (e) { toast.error(e.message); }
  }

  const pendingReqs = (requests || []).filter((r) => r.status === 'Pending');
  const loading = requests === null || bazaar === null;

  return (
    <div>
      <PageHeader title="Approval Queue" subtitle="Pending correction tickets and grocery entries awaiting review." />
      {error && <p className="error-text">{error}</p>}
      {loading && <Loading />}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card title={`Correction Requests (${pendingReqs.length})`} style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Member</th><th>Type</th><th>Was</th><th>Proposed</th><th>Reason</th><th>Action</th></tr></thead>
              <tbody>
                {pendingReqs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.user_name}</td><td>{r.type}</td>
                    <td>{r.original_value ?? '—'}</td><td>{r.proposed_value ?? '—'}</td>
                    <td className="muted">{r.reason}</td>
                    <td className="row-actions">
                      <button className="small success" onClick={() => resolveRequest(r.id, 'Approved')}>Approve</button>
                      <button className="small danger" onClick={() => resolveRequest(r.id, 'Rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
                {pendingReqs.length === 0 && <tr><td colSpan="6"><EmptyState icon="✓" title="Queue is clear" hint="No pending correction tickets." /></td></tr>}
              </tbody>
            </table>
          </Card>

          <Card title={`Pending Bazaar (${bazaar.length})`} style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead><tr><th>Member</th><th>Date</th><th>Details</th><th className="num">Amount</th><th>Action</th></tr></thead>
              <tbody>
                {bazaar.map((b) => (
                  <tr key={b.id}>
                    <td>{b.buyer_name}</td>
                    <td>{new Date(b.date).toLocaleDateString()}</td>
                    <td className="muted">{b.details || '—'}</td>
                    <td className="num">{money(b.amount)}</td>
                    <td className="row-actions">
                      <button className="small success" onClick={() => resolveBazaar(b.id, 'Approved')}>Approve</button>
                      <button className="small danger" onClick={() => resolveBazaar(b.id, 'Rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
                {bazaar.length === 0 && <tr><td colSpan="5"><EmptyState icon="✓" title="Nothing pending" hint="All bazaar entries are reviewed." /></td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
