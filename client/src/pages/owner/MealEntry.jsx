import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { PageHeader, TableWrap, Loading, EmptyState } from '../../components/ui.jsx';

export default function MealEntry() {
  const toast = useToast();
  const { month } = useMonth();
  const [date, setDate] = useState(`${month}-01`);
  const [rows, setRows] = useState(null);
  const [plans, setPlans] = useState({}); // userId -> { lunch, dinner }
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [busyAll, setBusyAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        api.get(`/meals/day/${date}`),
        api.get(`/meal-plan/day/${date}`).catch(() => []),
      ]);
      setRows(r);
      // Index plans by user_id.
      const planMap = {};
      (p || []).forEach((mp) => { planMap[mp.user_id] = { lunch: mp.lunch, dinner: mp.dinner, note: mp.note }; });
      setPlans(planMap);
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
    } catch (e) {
      toast.error(e.message);
      await load();
    } finally {
      setSavingKey(null);
    }
  }

  async function fillAll(lunch, dinner) {
    setBusyAll(true);
    setError(null);
    const members = rows.map((r) => ({ user_id: r.user_id, lunch, dinner }));
    // Optimistic.
    setRows((prev) => prev.map((r) => ({ ...r, lunch, dinner })));
    try {
      await api.put('/meals/bulk', { date, members });
      toast.success(`All set: Lunch ${lunch ? 'on' : 'off'}, Dinner ${dinner ? 'on' : 'off'}`);
    } catch (e) {
      toast.error(e.message);
      await load();
    } finally {
      setBusyAll(false);
    }
  }

  const list = rows || [];
  const totalMeals = list.reduce((s, r) => s + (r.lunch ? 1 : 0) + (r.dinner ? 1 : 0), 0);
  const anyOut = Object.keys(plans).length > 0;

  return (
    <div>
      <PageHeader title="Daily Meal Sheet" subtitle="Tick Lunch / Dinner for each member — saves automatically." />

      <div className="toolbar">
        <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="row-actions">
          <button className="small" disabled={busyAll} onClick={() => fillAll(true, true)}>Fill All (L+D)</button>
          <button className="small ghost" disabled={busyAll} onClick={() => fillAll(true, false)}>Lunch only</button>
          <button className="small ghost" disabled={busyAll} onClick={() => fillAll(false, true)}>Dinner only</button>
          <button className="small danger" disabled={busyAll} onClick={() => fillAll(false, false)}>Clear all</button>
        </div>
        <div className="spacer" />
        <div className="month-pill">🍽 {totalMeals} meals</div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {rows === null && <Loading label="Loading meal sheet…" />}

      {rows && (
        <TableWrap>
          <thead>
            <tr><th>Member</th><th>Room</th><th>Lunch</th><th>Dinner</th>
              {anyOut && <th className="muted">Planning</th>}
              <th className="num">Total</th></tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const plan = plans[r.user_id];
              const outMsgs = [];
              if (plan && plan.lunch === false) outMsgs.push('No lunch');
              if (plan && plan.dinner === false) outMsgs.push('No dinner');
              return (
                <tr key={r.user_id}>
                  <td>{r.name}{savingKey === String(r.user_id) ? ' …' : ''}</td>
                  <td>{r.room_no}</td>
                  <td><input type="checkbox" checked={r.lunch} onChange={() => toggle(r, 'lunch')} /></td>
                  <td><input type="checkbox" checked={r.dinner} onChange={() => toggle(r, 'dinner')} /></td>
                  {anyOut && <td className="muted" style={{ fontSize: '.78rem' }}>{outMsgs.join(' · ') || '—'}</td>}
                  <td className="num"><strong>{(r.lunch ? 1 : 0) + (r.dinner ? 1 : 0)}</strong></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={anyOut ? 6 : 5}><EmptyState title="No members" /></td></tr>}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
