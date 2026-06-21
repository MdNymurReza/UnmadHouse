import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DEFAULT_MONTH, money } from '../../lib/month.js';
import { PageHeader, Card, Loading } from '../../components/ui.jsx';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0ea5e9'];

// Personal analytics — scoped to the logged-in member's own data only.
export default function Reports() {
  const { user } = useAuth();
  const [breakdown, setBreakdown] = useState(null);
  const [trends, setTrends] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/reports/breakdown/${DEFAULT_MONTH}?userId=${user.id}`),
      api.get(`/reports/trends?months=6&userId=${user.id}`),
    ])
      .then(([b, t]) => { setBreakdown(b.filter((x) => x.value > 0)); setTrends(t); })
      .catch((e) => setError(e.message));
  }, [user.id]);

  return (
    <div>
      <PageHeader title="My Reports & Analytics" subtitle="Your personal spending and meal trends — your data only." />
      {error && <p className="error-text">{error}</p>}
      {breakdown === null && <Loading />}

      {breakdown && (
        <>
          <div className="grid grid-2" style={{ marginBottom: 18 }}>
            <Card title={`My Cost Split (${DEFAULT_MONTH})`}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                    {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="My Bazaar vs Meals">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                  <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
                  <Tooltip /><Legend />
                  <Bar dataKey="bazaar" fill="#4f46e5" name="My Bazaar (৳)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meals" fill="#059669" name="My Meals" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="My Meal Cost vs Mess Meal Rate">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
                <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="mealCost" stroke="#4f46e5" name="My Meal Cost (৳)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="mealRate" stroke="#d97706" name="Mess ৳/meal" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
