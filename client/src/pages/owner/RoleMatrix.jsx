import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/Badge.jsx';
import { PageHeader, TableWrap, Loading } from '../../components/ui.jsx';

// Admin-only: manage members — grant/revoke Manager, set per-room rent & room number.
export default function RoleMatrix() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

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

  function isDirty(u) {
    const e = edits[u.id];
    return e && (e.room_no !== (u.room_no ?? '') || Number(e.room_rent) !== Number(u.room_rent ?? 0));
  }

  return (
    <div>
      <PageHeader title="Member Management" subtitle="Set each room's rent & number, and delegate the Manager role." />
      {error && <p className="error-text">{error}</p>}
      {users === null && <Loading />}

      {users && (
        <TableWrap>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Room No.</th><th>Room Rent</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
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
