import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { DEFAULT_MONTH } from '../../lib/month.js';
import { PageHeader, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

// ADMIN + MANAGER: tick Lunch / Dinner per member for a given day. Auto-saves.
export default function MealEntry() {
  const toast = useToast();
  const [date, setDate] = useState(`${DEFAULT_MONTH}-01`);
  const [rows, setRows] = useState(null);            // null = loading
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.get(`/meals/day/${date}`));
    } catch (e) { setError(e.message); }
  }, [date]);

  useEffect(() => { setRows(null); load(); }, [load]);

  async function toggle(row, field) {
    setError(null);
    setSavingKey(String(row.user_id));
    const next = { lunch: row.lunch, dinner: row.dinner, [field]: !row[field] };
    setRows((prev) => prev.map((r) => r.user_id === row.user_id ? { ...r, ...next } : r));
    try {
      await api.put('/meals', { user_id: row.user_id, date, lunch: next.lunch, dinner: next.dinner });
      toast.success(`${row.name}: ${field === 'lunch' ? 'Lunch' : 'Dinner'} ${next[field] ? 'added' : 'removed'}`);
    } catch (e) {
      toast.error(e.message);
      await load();
    } finally {
      setSavingKey(null);
    }
  }

  const list = rows || [];
  const totalMeals = list.reduce((s, r) => s + (r.lunch ? 1 : 0) + (r.dinner ? 1 : 0), 0);

  return (
    <div>
      <PageHeader title="Daily Meal Sheet" subtitle="Tick Lunch / Dinner for each member — saves automatically." />

      <div className="toolbar">
        <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="spacer" />
        <div className="month-pill">🍽 {totalMeals} meals logged this day</div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {rows === null && <Loading label="Loading meal sheet…" />}

      {rows && (
        <TableWrap>
          <thead>
            <tr><th>Member</th><th>Room</th><th>Lunch</th><th>Dinner</th><th className="num">Day total</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.user_id}>
                <td>{r.name}{savingKey === String(r.user_id) ? ' …' : ''}</td>
                <td>{r.room_no}</td>
                <td><input type="checkbox" checked={r.lunch} onChange={() => toggle(r, 'lunch')} /></td>
                <td><input type="checkbox" checked={r.dinner} onChange={() => toggle(r, 'dinner')} /></td>
                <td className="num"><strong>{(r.lunch ? 1 : 0) + (r.dinner ? 1 : 0)}</strong></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="5"><EmptyState title="No members" /></td></tr>}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
