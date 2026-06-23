import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { money, fmtDate } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Stat, Card, Loading } from '../../components/ui.jsx';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0ea5e9'];

export default function Dashboard() {
  const { user } = useAuth();
  const { month } = useMonth();
  const [invoice, setInvoice] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/invoices/${user.id}/${month}`),
      api.get(`/reports/breakdown/${month}`), // member → auto-scoped to self
      api.get('/activity?limit=4'),
    ])
      .then(([inv, bd, act]) => { setInvoice(inv); setBreakdown(bd.filter((x) => x.value > 0)); setActivity(act); })
      .catch((e) => setError(e.message));
  }, [user.id, month]);

  const isPaid = invoice?.payment?.status === 'Paid';

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        subtitle={`Your mess summary for ${month}`}
        actions={<Link to="/app/invoice"><button>View invoice</button></Link>}
      />

      {error && <p className="error-text">{error}</p>}
      {!invoice && !error && <Loading />}

      {invoice && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-4" style={{ marginBottom: 18 }}>
            <Stat label="Total Due" value={money(invoice.invoiceTotal)} icon="₹" />
            <Stat label="My Total Meals" value={invoice.userMeals} icon="◷" tone="amber" />
            <Stat label="My Meal Cost" value={money(invoice.userMealCost)} icon="🍽" />
            <Stat
              label="Payment"
              value={<Badge status={invoice.payment.status} />}
              icon="◉"
              tone={isPaid ? 'green' : 'red'}
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-4" style={{ marginBottom: 18 }}>
            <Stat label="How much I paid" value={money(isPaid ? invoice.payment.amount : 0)}
              icon="✓" tone={isPaid ? 'green' : 'default'}
              delta={isPaid && invoice.payment.approvedAt
                ? { dir: 'up', text: `Cleared ${fmtDate(invoice.payment.approvedAt)}` }
                : { dir: 'down', text: 'Not yet paid' }} />
            <Stat label="Mess Total Meal Count" value={invoice.totalMeals} icon="◫" tone="amber" />
            <Stat label="Mess Meal Rate" value={`${money(invoice.mealRate)}`} icon="◫" />
            <Stat label="My Bazaar Balance" value={money(invoice.bazaarBalance)}
              icon={invoice.bazaarBalance >= 0 ? '↑' : '↓'}
              tone={invoice.bazaarBalance >= 0 ? 'green' : 'red'}
              delta={{ dir: invoice.bazaarBalance >= 0 ? 'up' : 'down', text: invoice.bazaarBalance >= 0 ? 'Owed to you' : 'You owe' }} />
          </div>

          {/* Chart + breakdown */}
          <div className="grid grid-2">
            <Card title="My Cost Distribution">
              {breakdown && breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={95} label>
                      {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => money(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="muted">No cost data yet.</p>}
            </Card>

            <Card title="Cost Breakdown">
              <table>
                <tbody>
                  <tr><td>Room Rent</td><td className="num">{money(invoice.roomRent)}</td></tr>
                  <tr><td>Maid (Bua) share</td><td className="num">{money(invoice.utilities.bua)}</td></tr>
                  <tr><td>Gas share</td><td className="num">{money(invoice.utilities.gas)}</td></tr>
                  <tr><td>Electricity share</td><td className="num">{money(invoice.utilities.current)}</td></tr>
                  <tr><td>Meal Cost ({invoice.userMeals} × {money(invoice.mealRate)})</td><td className="num">{money(invoice.userMealCost)}</td></tr>
                  <tr><td>Bazaar Offset</td>
                    <td className={`num ${invoice.bazaarBalance >= 0 ? 'pos' : 'neg'}`}>
                      {invoice.bazaarBalance >= 0 ? '−' : '+'}{money(Math.abs(invoice.bazaarBalance))}
                    </td></tr>
                  <tr><td><strong>Total Due</strong></td><td className="num"><strong>{money(invoice.invoiceTotal)}</strong></td></tr>
                </tbody>
              </table>
              <p style={{ marginTop: 14 }}><Link to="/app/reports">See full analytics →</Link></p>
            </Card>
          </div>

          {/* Mini meal bar + recent activity */}
          {activity.length > 0 && (
            <Card title="Recent Activity" style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.88rem' }}>
                    <span>
                      <strong>{a.who}</strong>
                      <span className="muted"> {a.kind === 'bazaar' ? 'logged bazaar' : a.kind === 'payment' ? 'paid invoice' : 'updated'}</span>
                      {' · ৳'}{a.detail}
                    </span>
                    <span className="muted" style={{ fontSize: '.78rem' }}>{fmtDate(a.when)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
