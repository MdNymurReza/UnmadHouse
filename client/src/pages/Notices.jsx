import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fmtDate } from '../lib/month.js';
import { PageHeader, Card, Loading, EmptyState } from '../components/ui.jsx';

export default function Notices() {
  const { isStaff } = useAuth();
  const toast = useToast();
  const [notices, setNotices] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);

  async function load() {
    try { setNotices(await api.get('/notices')); }
    catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function post(e) {
    e.preventDefault();
    try {
      await api.post('/notices', { title, body, pinned });
      toast.success('Notice posted');
      setShowForm(false); setTitle(''); setBody(''); setPinned(false);
      await load();
    } catch (err) { toast.error(err.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this notice?')) return;
    try { await api.delete(`/notices/${id}`); toast.success('Deleted'); await load(); }
    catch (err) { toast.error(err.message); }
  }

  const list = notices || [];

  return (
    <div>
      <PageHeader
        title="Notice Board"
        subtitle="Announcements and updates from the mess."
        actions={isStaff && (
          <button className="small" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Post Notice'}</button>
        )}
      />

      {showForm && (
        <Card title="Post a Notice" style={{ marginBottom: 18 }}>
          <form onSubmit={post}>
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Kitchen closed Sunday" /></label>
            <label>Details<textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Optional details..." /></label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, fontSize: '.88rem' }}>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ width: 'auto' }} />
              Pin to top
            </label>
            <button type="submit">Post notice</button>
          </form>
        </Card>
      )}

      {notices === null && <Loading />}
      {notices && list.length === 0 && <EmptyState title="No notices yet" icon="📋" hint="Announcements will appear here." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {list.map((n) => (
          <Card key={n.id} style={n.pinned ? { borderColor: 'var(--accent)' } : {}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{n.title}</strong>
                {n.pinned && <span className="badge badge-indigo" style={{ marginLeft: 10 }}>Pinned</span>}
              </div>
              <div className="row-actions">
                <span className="muted" style={{ fontSize: '.78rem' }}>{n.author_name} · {fmtDate(n.created_at)}</span>
                {isStaff && <button className="small danger" onClick={() => remove(n.id)}>✕</button>}
              </div>
            </div>
            {n.body && <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>{n.body}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
