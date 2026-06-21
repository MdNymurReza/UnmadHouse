import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { money, fmtDate } from '../../lib/month.js';
import { PageHeader, Stat, Card, Loading, EmptyState } from '../../components/ui.jsx';
import Badge from '../../components/Badge.jsx';

export default function Onboarding() {
  const [me, setMe] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/auth/me'), api.get('/auth/roommates')])
      .then(([m, r]) => { setMe(m); setRoommates(r); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!me) return <Loading />;

  const total = Number(me.advance_paid) + Number(me.fridge_fund) + Number(me.service_charge);
  const daysWithUs = Math.max(0, Math.floor((Date.now() - new Date(me.joining_date)) / 86400000));
  const months = Math.floor(daysWithUs / 30);

  return (
    <div>
      <PageHeader title="Onboarding & Capital Ledger" subtitle="Your immutable record from the day you boarded the flat." />

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <Stat label="Room Number" value={me.room_no} icon="⌂" />
        <Stat label="Joining Date" value={fmtDate(me.joining_date)} icon="◔" tone="amber" />
        <Stat label="Time in Mess" value={`${months} mo`} icon="◷" delta={{ dir: 'up', text: `${daysWithUs} days` }} />
        <Stat label="Onboarding Capital" value={money(total)} icon="₹" tone="green" />
      </div>

      <div className="grid grid-2">
        <Card title="Starting Deposits">
          <table>
            <tbody>
              <tr><td>Advance Security Deposit <span className="muted">(refundable)</span></td><td className="num">{money(me.advance_paid)}</td></tr>
              <tr><td>Fridge / Appliance Investment Fund</td><td className="num">{money(me.fridge_fund)}</td></tr>
              <tr><td>One-time Flat Service Charge</td><td className="num">{money(me.service_charge)}</td></tr>
              <tr><td><strong>Total Onboarding Capital</strong></td><td className="num"><strong>{money(total)}</strong></td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 12 }}>
            The security deposit is refundable when you leave the mess. The fridge fund and service charge are one-time contributions.
          </p>
        </Card>

        <Card title="Room & Tenancy">
          <table>
            <tbody>
              <tr><td>Assigned Room</td><td className="num">{me.room_no}</td></tr>
              <tr><td>Monthly Room Rent</td><td className="num">{money(me.room_rent)}</td></tr>
              <tr><td>Account Email</td><td className="num">{me.email}</td></tr>
              <tr><td>Role</td><td className="num"><Badge status={me.role} /></td></tr>
            </tbody>
          </table>

          <div className="card-title" style={{ marginTop: 18 }}>Roommates</div>
          {roommates.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {roommates.map((r) => <li key={r.id} style={{ marginBottom: 4 }}>{r.name} <Badge status={r.role} /></li>)}
            </ul>
          ) : (
            <p className="muted" style={{ fontSize: '.85rem', margin: 0 }}>You currently have this room to yourself.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
