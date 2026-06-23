import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { money } from '../../lib/month.js';
import { PageHeader, Card } from '../../components/ui.jsx';

// Admin-only: set the shared monthly utilities (split equally by 6).
export default function BillsConfig() {
  const toast = useToast();
  const { month: billingMonth } = useMonth();
  const [monthYear, setMonthYear] = useState(billingMonth);
  const [bua, setBua] = useState('');
  const [gas, setGas] = useState('');
  const [current, setCurrent] = useState('');

  async function load(my) {
    try {
      const b = await api.get(`/bills/${my}`);
      setBua(String(b.bua_bill ?? 0));
      setGas(String(b.gas_bill ?? 0));
      setCurrent(String(b.electricity_bill ?? 0));
    } catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(monthYear); }, [monthYear]);

  async function save(e) {
    e.preventDefault();
    try {
      await api.put(`/bills/${monthYear}`, {
        bua_bill: Number(bua), gas_bill: Number(gas), electricity_bill: Number(current),
      });
      toast.success('Fixed bills saved');
    } catch (err) { toast.error(err.message); }
  }

  const perHead = (Number(bua) + Number(gas) + Number(current)) / 6;

  return (
    <div>
      <PageHeader title="Configure Fixed Bills" subtitle="Shared utilities for the billing month (split equally by 6)." />

      <div className="grid grid-2">
        <Card title="Monthly Utilities">
          <form onSubmit={save}>
            <label>Billing Month<input value={monthYear} onChange={(e) => setMonthYear(e.target.value)} placeholder="YYYY-MM" /></label>
            <label>Maid (Bua) Salary<input type="number" min="0" step="0.01" value={bua} onChange={(e) => setBua(e.target.value)} /></label>
            <label>Gas Bill<input type="number" min="0" step="0.01" value={gas} onChange={(e) => setGas(e.target.value)} /></label>
            <label>Electricity (Current) Bill<input type="number" min="0" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
            <button type="submit">Save bills</button>
          </form>
        </Card>

        <Card title="Per-Member Share">
          <p className="muted" style={{ fontSize: '.9rem', marginTop: 0 }}>Each member pays an equal share of the shared utilities:</p>
          <table>
            <tbody>
              <tr><td>Maid (Bua)</td><td className="num">{money(Number(bua) / 6)}</td></tr>
              <tr><td>Gas</td><td className="num">{money(Number(gas) / 6)}</td></tr>
              <tr><td>Electricity</td><td className="num">{money(Number(current) / 6)}</td></tr>
              <tr><td><strong>Total / member</strong></td><td className="num"><strong>{money(perHead)}</strong></td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 14 }}>
            Room rent is per-room and set on each member's profile in Member Management.
          </p>
        </Card>
      </div>
    </div>
  );
}
