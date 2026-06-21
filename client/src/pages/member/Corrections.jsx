import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Card, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

export default function Corrections() {
  const toast = useToast();
  const [requests, setRequests] = useState(null);
  const [type, setType] = useState('Meal');
  const [originalValue, setOriginalValue] = useState('');
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');

  async function load() {
    try { setRequests(await api.get('/requests')); }
    catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/requests', {
        type,
        original_value: originalValue === '' ? null : Number(originalValue),
        proposed_value: proposedValue === '' ? null : Number(proposedValue),
        reason,
      });
      setOriginalValue(''); setProposedValue(''); setReason('');
      toast.success('Correction ticket opened');
      await load();
    } catch (err) { toast.error(err.message); }
  }

  const list = requests || [];

  return (
    <div>
      <PageHeader title="Correction Requests" subtitle="Flag a wrong meal count or bazaar amount for staff review." />

      <Card title="Open a Ticket" style={{ marginBottom: 18 }}>
        <form onSubmit={submit}>
          <div className="grid grid-3">
            <label>Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Meal">Meal</option>
                <option value="Bazaar">Bazaar</option>
              </select>
            </label>
            <label>Current value<input type="number" step="0.01" value={originalValue} onChange={(e) => setOriginalValue(e.target.value)} /></label>
            <label>Proposed value<input type="number" step="0.01" value={proposedValue} onChange={(e) => setProposedValue(e.target.value)} /></label>
          </div>
          <label>Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} placeholder="Explain what's wrong…" /></label>
          <button type="submit">Open ticket</button>
        </form>
      </Card>

      {requests === null && <Loading />}
      {requests && (
        <TableWrap>
          <thead><tr><th>Type</th><th>Was</th><th>Proposed</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.type}</td>
                <td>{r.original_value ?? '—'}</td>
                <td>{r.proposed_value ?? '—'}</td>
                <td className="muted">{r.reason}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="5"><EmptyState title="No requests yet" /></td></tr>}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
