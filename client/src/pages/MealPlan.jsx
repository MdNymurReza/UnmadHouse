import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useMonth } from '../context/MonthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageHeader, Stat, Card, Loading } from '../components/ui.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealPlan() {
  const { month: billingMonth } = useMonth();
  const toast = useToast();
  const [plans, setPlans] = useState(null);
  const [savingDay, setSavingDay] = useState(null);

  async function load() {
    try { setPlans(await api.get(`/meal-plan/${billingMonth}`)); }
    catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, [billingMonth]);

  // Index plan data by day.
  const byDay = {};
  (plans || []).forEach((p) => {
    const d = new Date(p.date).getDate();
    byDay[d] = { lunch: p.lunch, dinner: p.dinner, note: p.note };
  });

  async function toggle(day, field, currentVal) {
    const date = `${billingMonth}-${String(day).padStart(2, '0')}`;
    setSavingDay(day);
    // Optimistic:
    const prev = byDay[day] || { lunch: true, dinner: true, note: '' };
    const next = { ...prev, [field]: !currentVal };
    byDay[day] = next;
    setPlans([...plans]); // force re-render
    try {
      await api.put('/meal-plan', { date, lunch: next.lunch, dinner: next.dinner });
    } catch (e) { toast.error(e.message); await load(); }
    finally { setSavingDay(null); }
  }

  const [year, month] = billingMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const outLunches = (plans || []).filter((p) => !p.lunch).length;
  const outDinners = (plans || []).filter((p) => !p.dinner).length;

  return (
    <div>
      <PageHeader title="Meal Planning" subtitle={`Mark days you'll be out for ${billingMonth}. The daily sheet shows who's gone.`} />

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <Stat label="Skipped Lunches" value={outLunches} icon="☀" tone="amber" />
        <Stat label="Skipped Dinners" value={outDinners} icon="☾" />
        <Stat label="Month" value={billingMonth} icon="📅" />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: '.8rem', flexWrap: 'wrap' }}>
          <span className="muted">Tap to mark yourself OUT:</span>
          <span><span className="cal-dot" style={{ background: 'var(--amber-600)' }} /> = skipping lunch</span>
          <span><span className="cal-dot" style={{ background: 'var(--accent)' }} /> = skipping dinner</span>
          <span className="muted">Default: you're eating (no dots)</span>
        </div>

        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} className="cal-cell blank" />;
            const plan = byDay[d] || { lunch: true, dinner: true };
            const changed = plan.lunch === false || plan.dinner === false;
            return (
              <div className={`cal-cell ${changed ? 'has-meal' : ''}`} key={d} style={{ cursor: 'pointer' }}>
                <div className="day">{d}{savingDay === d ? ' …' : ''}</div>
                <div className="cal-meals">
                  <span className="cal-dot" title={plan.lunch ? 'Lunch: eating' : 'Lunch: SKIPPED'}
                    style={{ background: plan.lunch ? '#d1d5db' : 'var(--amber-600)', width: 14, height: 14 }}
                    onClick={() => toggle(d, 'lunch', plan.lunch)} />
                  <span className="cal-dot" title={plan.dinner ? 'Dinner: eating' : 'Dinner: SKIPPED'}
                    style={{ background: plan.dinner ? '#d1d5db' : 'var(--accent)', width: 14, height: 14 }}
                    onClick={() => toggle(d, 'dinner', plan.dinner)} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
