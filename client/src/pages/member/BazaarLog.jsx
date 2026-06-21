import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { DEFAULT_MONTH, money } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Card, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

export default function BazaarLog() {
  const toast = useToast();
  const [entries, setEntries] = useState(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${DEFAULT_MONTH}-01`);
  const [details, setDetails] = useState('');

  async function load() {
    try { setEntries(await api.get(`/bazaar?monthYear=${DEFAULT_MONTH}`)); }
    catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/bazaar', { amount: Number(amount), date, details });
      setAmount(''); setDetails('');
      toast.success('Bazaar entry submitted for approval');
      await load();
    } catch (err) { toast.error(err.message); }
  }

  const list = entries || [];
  const approved = list.filter((b) => b.status === 'Approved').reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div>
      <PageHeader title="Bazaar Log" subtitle="Log your grocery spending — entries await staff approval before counting." />

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <Card title="New Entry">
          <form onSubmit={submit}>
            <label>Amount<input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
            <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <label>Details<input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Rice, oil, vegetables…" /></label>
            <button type="submit">Submit entry</button>
          </form>
        </Card>
        <Card title="This Month">
          <div className="muted" style={{ fontSize: '.85rem' }}>Your approved bazaar total</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6 }}>{money(approved)}</div>
          <p className="muted" style={{ fontSize: '.85rem' }}>Only approved entries count toward the mess meal rate and your bazaar balance.</p>
        </Card>
      </div>

      {entries === null && <Loading />}
      {entries && (
        <TableWrap>
          <thead><tr><th>Date</th><th>Details</th><th className="num">Amount</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.date).toLocaleDateString()}</td>
                <td className="muted">{b.details || '—'}</td>
                <td className="num">{money(b.amount)}</td>
                <td><Badge status={b.status} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="4"><EmptyState title="No entries yet" hint="Submit your first bazaar entry above." /></td></tr>}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
