import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Card, Loading, EmptyState } from '../components/ui.jsx';
import Badge from '../components/Badge.jsx';

const STATUSES = ['in-stock', 'low', 'out'];
const STATUS_BADGE = { 'in-stock': 'badge-green', low: 'badge-amber', out: 'badge-red' };

export default function Inventory() {
  const { isStaff } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', category: 'General' });
  const [editId, setEditId] = useState(null);

  async function load() {
    try { setItems(await api.get('/inventory')); }
    catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try { await api.post('/inventory', form); toast.success('Item added'); setShowAdd(false); setForm({ name: '', quantity: '', category: 'General' }); await load(); }
    catch (err) { toast.error(err.message); }
  }

  async function updateStatus(id, status) {
    try { await api.put(`/inventory/${id}`, { status }); toast.success(status === 'out' ? 'Marked out of stock' : `Status: ${status}`); await load(); }
    catch (err) { toast.error(err.message); }
  }

  async function remove(id, name) {
    if (!confirm(`Remove "${name}"?`)) return;
    try { await api.delete(`/inventory/${id}`); toast.success('Item removed'); await load(); }
    catch (err) { toast.error(err.message); }
  }

  const byCategory = {};
  (items || []).forEach((i) => {
    (byCategory[i.category] = byCategory[i.category] || []).push(i);
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track shared supplies — rice, oil, spices, and more."
        actions={isStaff && <button className="small" onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Cancel' : '+ Add Item'}</button>}
      />

      {showAdd && (
        <Card title="Add New Item" style={{ marginBottom: 18 }}>
          <form onSubmit={create} className="grid grid-3">
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rice" required /></label>
            <label>Quantity<input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="5 kg" /></label>
            <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Grains" /></label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}><button type="submit">Add to inventory</button></div>
          </form>
        </Card>
      )}

      {items === null && <Loading />}
      {items && items.length === 0 && <EmptyState title="No items" hint="Add shared supplies to track collectively." />}

      {items && Object.entries(byCategory).map(([cat, catItems]) => (
        <Card key={cat} title={cat} style={{ marginBottom: 18, padding: 0, overflow: 'hidden' }}>
          <table>
            <thead><tr><th>Item</th><th>Quantity</th><th>Status</th><th>Updated by</th>{isStaff && <th>Actions</th>}</tr></thead>
            <tbody>
              {catItems.map((it) => (
                <tr key={it.id}>
                  <td><strong>{it.name}</strong></td>
                  <td>{it.quantity || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[it.status] || 'badge-gray'}`}>{it.status}</span></td>
                  <td className="muted">{it.updated_by_name || '—'}</td>
                  {isStaff && (
                    <td className="row-actions">
                      {STATUSES.filter((s) => s !== it.status).map((s) => (
                        <button key={s} className="small ghost" onClick={() => updateStatus(it.id, s)}>{s}</button>
                      ))}
                      <button className="small danger" onClick={() => remove(it.id, it.name)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
