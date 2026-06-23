import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useMonth } from '../../context/MonthContext.jsx';
import { money } from '../../lib/month.js';
import Badge from '../../components/Badge.jsx';
import { PageHeader, Card, Loading } from '../../components/ui.jsx';

export default function Invoice() {
  const { user } = useAuth();
  const { month } = useMonth();
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [method, setMethod] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [senderNo, setSenderNo] = useState('');

  async function load() {
    try {
      const data = await api.get(`/invoices/${user.id}/${month}`);
      setInv(data);
      if (!amount) setAmount(String(data.invoiceTotal));
    } catch (e) { toast.error(e.message); }
  }
  useEffect(() => { load(); }, [user.id]);

  async function submitPayment(e) {
    e.preventDefault();
    try {
      await api.post('/payments', {
        month_year: month, amount: Number(amount), method,
        tx_id: method === 'MFS' ? txId : null,
        sender_no: method === 'MFS' ? senderNo : null,
      });
      toast.success('Payment submitted — awaiting admin approval');
      await load();
    } catch (err) { toast.error(err.message); }
  }

  if (!inv) return <Loading />;

  return (
    <div>
      <PageHeader
        title={`Monthly Invoice — ${month}`}
        subtitle="Your detailed cost breakdown and payment options"
        actions={<Badge status={inv.payment.status} />}
      />

      <div className="grid grid-2">
        <Card title="Cost Breakdown">
          <table>
            <tbody>
              <tr><td>Room Rent</td><td className="num">{money(inv.roomRent)}</td></tr>
              <tr><td>Maid (Bua) share</td><td className="num">{money(inv.utilities.bua)}</td></tr>
              <tr><td>Gas share</td><td className="num">{money(inv.utilities.gas)}</td></tr>
              <tr><td>Electricity share</td><td className="num">{money(inv.utilities.current)}</td></tr>
              <tr><td>Meal cost ({inv.userMeals} × {money(inv.mealRate)})</td><td className="num">{money(inv.userMealCost)}</td></tr>
              <tr><td>Bazaar balance offset</td>
                <td className={`num ${inv.bazaarBalance >= 0 ? 'pos' : 'neg'}`}>
                  {inv.bazaarBalance >= 0 ? '−' : '+'}{money(Math.abs(inv.bazaarBalance))}
                </td></tr>
              <tr><td><strong>Invoice Total</strong></td><td className="num"><strong style={{ fontSize: '1.1rem' }}>{money(inv.invoiceTotal)}</strong></td></tr>
            </tbody>
          </table>
          {inv.payment.approvedAt && (
            <p className="muted" style={{ fontSize: '.82rem', marginTop: 12 }}>
              Paid on {new Date(inv.payment.approvedAt).toLocaleDateString()}
            </p>
          )}
        </Card>

        <Card title="Submit a Payment">
          <form onSubmit={submitPayment}>
            <label>Method
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="MFS">Mobile (bKash / Nagad / Bank)</option>
              </select>
            </label>
            <label>Amount<input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
            {method === 'MFS' && (
              <>
                <label>Transaction ID<input value={txId} onChange={(e) => setTxId(e.target.value)} /></label>
                <label>Sender Number<input value={senderNo} onChange={(e) => setSenderNo(e.target.value)} /></label>
              </>
            )}
            <button type="submit">Submit payment for review</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
