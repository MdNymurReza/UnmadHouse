import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { DEFAULT_MONTH, money } from '../../lib/month.js';
import { PageHeader, Card, Loading } from '../../components/ui.jsx';

const OCCUPANTS = 6;

export default function FixedBills() {
  const [bill, setBill] = useState(null);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/bills/${DEFAULT_MONTH}`), api.get('/auth/me')])
      .then(([b, m]) => { setBill(b); setMe(m); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!bill || !me) return <Loading />;

  const share = (n) => Number(n || 0) / OCCUPANTS;
  const totalFixed = Number(me.room_rent) + share(bill.bua_bill) + share(bill.gas_bill) + share(bill.electricity_bill);

  return (
    <div>
      <PageHeader title="Monthly Fixed Bills" subtitle={`Your split for ${DEFAULT_MONTH} — utilities divided equally by ${OCCUPANTS}.`} />

      <Card title="Fixed Cost Sheet">
        <table>
          <thead>
            <tr><th>Item</th><th className="num">Total</th><th className="num">Your Share</th></tr>
          </thead>
          <tbody>
            <tr><td>Room Rent <span className="muted">({me.room_no})</span></td><td className="num">—</td><td className="num">{money(me.room_rent)}</td></tr>
            <tr><td>Maid (Bua) Salary</td><td className="num">{money(bill.bua_bill)}</td><td className="num">{money(share(bill.bua_bill))}</td></tr>
            <tr><td>Gas Bill</td><td className="num">{money(bill.gas_bill)}</td><td className="num">{money(share(bill.gas_bill))}</td></tr>
            <tr><td>Electricity (Current)</td><td className="num">{money(bill.electricity_bill)}</td><td className="num">{money(share(bill.electricity_bill))}</td></tr>
            <tr><td><strong>Total Fixed</strong> <span className="muted">(before bazaar offset)</span></td><td></td><td className="num"><strong>{money(totalFixed)}</strong></td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
