import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { PageHeader, Stat, Card, Loading } from '../../components/ui.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealCalendar() {
  const { user } = useAuth();
  const { month: billingMonth } = useMonth();
  const [meals, setMeals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/meals/${user.id}/${billingMonth}`).then(setMeals).catch((e) => setError(e.message));
  }, [user.id, billingMonth]);

  if (error) return <p className="error-text">{error}</p>;
  if (!meals) return <Loading />;

  // Index meals by day number -> { lunch, dinner, count }.
  const byDay = {};
  meals.forEach((m) => {
    const d = new Date(m.date).getDate();
    byDay[d] = { lunch: m.lunch, dinner: m.dinner, count: Number(m.meal_count) };
  });

  const [year, month] = billingMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const totalMeals = meals.reduce((s, m) => s + Number(m.meal_count), 0);
  const daysLogged = meals.filter((m) => Number(m.meal_count) > 0).length;
  const lunches = meals.filter((m) => m.lunch).length;
  const dinners = meals.filter((m) => m.dinner).length;

  // Build leading blanks + day cells.
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <PageHeader title="Meal Calendar" subtitle={`Your daily meals for ${billingMonth}`} />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <Stat label="Total Meals" value={totalMeals} icon="◷" tone="amber" />
        <Stat label="Days with Meals" value={daysLogged} icon="◔" />
        <Stat label="Lunches" value={lunches} icon="☀" />
        <Stat label="Dinners" value={dinners} icon="☾" />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', fontSize: '.82rem' }}>
          <span className="muted">Legend:</span>
          <span><span className="cal-dot lunch" /> Lunch</span>
          <span><span className="cal-dot dinner" /> Dinner</span>
          <span className="muted">Number = meals counted that day</span>
        </div>

        <div className="cal-grid" style={{ marginBottom: 6 }}>
          {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} className="cal-cell blank" />;
            const info = byDay[d];
            const has = info && info.count > 0;
            return (
              <div className={`cal-cell ${has ? 'has-meal' : ''}`} key={d}>
                <div className="day">{d}</div>
                <div className="cal-meals">
                  {info?.lunch && <span className="cal-dot lunch" title="Lunch" />}
                  {info?.dinner && <span className="cal-dot dinner" title="Dinner" />}
                </div>
                <div className="meal">{info ? info.count : '–'}</div>
              </div>
            );
          })}
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: '.85rem' }}>
          Meals are logged by staff on the daily meal sheet. Spotted a wrong count? Open a ticket on the Corrections page.
        </p>
      </Card>
    </div>
  );
}
