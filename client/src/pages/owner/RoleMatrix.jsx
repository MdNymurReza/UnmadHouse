import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Card, TableWrap, Loading } from '../../components/ui.jsx';

// Admin-only: manage members — create new members, grant/revoke Manager,
// set per-room rent & room number.
export default function RoleMatrix() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // New-member form state.
  const [form, setForm] = useState({
    name: '', email: '', password: 'member123',
    room_no: '', room_rent: '0', joining_date: new Date().toISOString().slice(0, 10),
    advance_paid: '0', fridge_fund: '0', service_charge: '0',
    role: 'MEMBER',
  });
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const data = await api.get('/users');
      setUsers(data);
      setEdits(Object.fromEntries(data.map((u) => [u.id, {
        room_no: u.room_no ?? '',
        room_rent: String(u.room_rent ?? 0),
      }])));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  function setField(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function setFormField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function toggle(u) {
    const next = u.role === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    try {
      await api.patch(`/users/${u.id}/role`, { role: next });
      toast.success(`${u.name} is now ${next === 'MANAGER' ? 'a Manager' : 'a Member'}`);
      await load();
    } catch (e) { toast.error(e.message); }
  }

  async function saveProfile(u) {
    setSavingId(u.id);
    try {
      const e = edits[u.id];
      await api.patch(`/users/${u.id}/profile`, { room_no: e.room_no, room_rent: Number(e.room_rent) });
      toast.success(`${u.name}'s room saved`);
      await load();
    } catch (err) { toast.error(err.message); }
    finally { setSavingId(null); }
  }

  async function createMember(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const created = await api.post('/users', {
        ...form,
        room_rent: Number(form.room_rent),
        advance_paid: Number(form.advance_paid),
        fridge_fund: Number(form.fridge_fund),
        service_charge: Number(form.service_charge),
      });
      toast.success(`${created.name} added as ${created.role}`);
      setShowAdd(false);
      setForm({
        name: '', email: '', password: 'member123',
        room_no: '', room_rent: '0', joining_date: new Date().toISOString().slice(0, 10),
        advance_paid: '0', fridge_fund: '0', service_charge: '0',
        role: 'MEMBER',
      });
      await load();
    } catch (err) { setError(err.message); }
    finally { setCreating(false); }
  }

  function isDirty(u) {
    const e = edits[u.id];
    return e && (e.room_no !== (u.room_no ?? '') || Number(e.room_rent) !== Number(u.room_rent ?? 0));
  }

  return (
    <div>
      <PageHeader
        title="Member Management"
        subtitle="Create new members, set room details, and delegate the Manager role."
        actions={<button className="small" onClick={() => setShowAdd((v) => !v)}>{showAdd ? 'Cancel' : '+ Add Member'}</button>}
      />
      {error && <p className="error-text">{error}</p>}

      {showAdd && (
        <Card title="Create New Member" style={{ marginBottom: 18 }}>
          <form onSubmit={createMember}>
            <div className="grid grid-3">
              <label>Name<input value={form.name} onChange={(e) => setFormField('name', e.target.value)} placeholder="Full name" required /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => setFormField('email', e.target.value)} placeholder="member@example.com" required /></label>
              <label>Password<input value={form.password} onChange={(e) => setFormField('password', e.target.value)} required /></label>
              <label>Role
                <select value={form.role} onChange={(e) => setFormField('role', e.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </label>
              <label>Room No.<input value={form.room_no} onChange={(e) => setFormField('room_no', e.target.value)} placeholder="A3" /></label>
              <label>Joining Date<input type="date" value={form.joining_date} onChange={(e) => setFormField('joining_date', e.target.value)} /></label>
              <label>Room Rent (৳)<input type="number" min="0" step="0.01" value={form.room_rent} onChange={(e) => setFormField('room_rent', e.target.value)} /></label>
              <label>Advance Security Deposit<input type="number" min="0" step="0.01" value={form.advance_paid} onChange={(e) => setFormField('advance_paid', e.target.value)} /></label>
              <label>Fridge / Appliance Fund<input type="number" min="0" step="0.01" value={form.fridge_fund} onChange={(e) => setFormField('fridge_fund', e.target.value)} /></label>
              <label>One-time Service Charge<input type="number" min="0" step="0.01" value={form.service_charge} onChange={(e) => setFormField('service_charge', e.target.value)} /></label>
            </div>
            <button type="submit" disabled={creating} style={{ marginTop: 8 }}>{creating ? 'Creating…' : 'Create Member'}</button>
          </form>
        </Card>
      )}

      {users === null && <Loading />}
      {users && (
        <TableWrap>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Room No.</th><th>Room Rent</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td className="muted">{u.email}</td>
                <td><input style={{ width: 80 }} value={edits[u.id]?.room_no ?? ''} onChange={(e) => setField(u.id, 'room_no', e.target.value)} /></td>
                <td><input type="number" min="0" step="0.01" style={{ width: 110 }} value={edits[u.id]?.room_rent ?? ''} onChange={(e) => setField(u.id, 'room_rent', e.target.value)} /></td>
                <td><Badge status={u.role} /></td>
                <td className="row-actions">
                  <button className="small" disabled={!isDirty(u) || savingId === u.id} onClick={() => saveProfile(u)}>
                    {savingId === u.id ? 'Saving…' : 'Save'}
                  </button>
                  {u.role !== 'ADMIN' && (
                    <button className="small ghost" onClick={() => toggle(u)}>
                      {u.role === 'MANAGER' ? 'Revoke Mgr' : 'Make Mgr'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
