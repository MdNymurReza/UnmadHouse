import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '🍽', title: 'Daily Meal Tracking', body: 'Tick lunch and dinner per member on a clean daily sheet. Totals roll up automatically — no spreadsheets, no arguments.' },
  { icon: '🧮', title: 'Automated Meal Rate', body: 'The system computes the mess meal rate from approved bazaar and total meals, then splits every cost fairly to the paisa.' },
  { icon: '🛒', title: 'Bazaar & Approvals', body: 'Members log grocery spend with receipts; managers approve in one tap. Every entry is auditable and attributed.' },
  { icon: '📊', title: 'Personal Analytics', body: 'Each member sees their own cost split, meal trends, and balance — transparent, private, and always up to date.' },
  { icon: '💳', title: 'Invoices & Payments', body: 'Auto-generated monthly invoices, cash or mobile (bKash/Nagad) submissions, and one-click admin clearance.' },
  { icon: '🔔', title: 'Smart Reminders', body: 'Scheduled reminders chase unpaid invoices on the 25th and 30th so the manager never has to.' },
];

const STEPS = [
  { n: '01', title: 'Set up the mess', body: 'Add members, assign rooms and rent, and enter the month’s fixed bills once.' },
  { n: '02', title: 'Log meals & bazaar daily', body: 'Managers tick meals; members log groceries. The engine keeps the running totals.' },
  { n: '03', title: 'Settle transparently', body: 'Invoices generate automatically. Everyone pays their fair share — disputes disappear.' },
];

const STATS = [
  { value: '6', label: 'Roles & permissions tiers' },
  { value: '100%', label: 'Automated cost splitting' },
  { value: '0', label: 'Spreadsheets required' },
  { value: '24/7', label: 'Transparent for every member' },
];

const TESTIMONIALS = [
  { quote: 'We used to fight over the meal sheet every single month. Now it just… works. The numbers are never wrong.', name: 'Rafiq H.', role: 'Mess Manager, Dhaka' },
  { quote: 'I can finally see exactly what I owe and why. The bazaar balance turning green when I shop is oddly satisfying.', name: 'Tania K.', role: 'Member' },
  { quote: 'Onboarding new boarders and tracking their deposits used to be chaos. UnmadHouse made it a two-minute job.', name: 'Imran S.', role: 'Flat Owner' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Logged-in users shouldn't see marketing — send them to the app.
  useEffect(() => { if (user) navigate('/app', { replace: true }); }, [user, navigate]);

  return (
    <div className="mkt">
      {/* Top nav */}
      <header className="mkt-nav">
        <div className="mkt-container mkt-nav-inner">
          <Link to="/" className="mkt-brand">
            <span className="logo">U</span> UnmadHouse
          </Link>
          <nav className="mkt-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#proof">Reviews</a>
            <Link to="/login" className="mkt-btn ghost">Sign in</Link>
            <Link to="/login" className="mkt-btn">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mkt-hero">
        <div className="mkt-container mkt-hero-inner">
          <span className="mkt-badge">Automated mess management</span>
          <h1 className="mkt-h1">Run your shared mess like a&nbsp;business — not a group chat.</h1>
          <p className="mkt-lead">
            UnmadHouse turns messy meal counts, grocery runs, and split bills into one transparent,
            automated ledger. Fair invoices, zero arguments, every taka accounted for.
          </p>
          <div className="mkt-cta-row">
            <Link to="/login" className="mkt-btn lg">Get started free</Link>
            <a href="#how" className="mkt-btn lg ghost">See how it works</a>
          </div>
          <div className="mkt-trust">No credit card · Works on any phone · Built for 6-member messes</div>

          {/* Product preview mock */}
          <div className="mkt-preview">
            <div className="mkt-preview-bar">
              <span /><span /><span />
            </div>
            <div className="mkt-preview-body">
              <div className="mkt-kpis">
                <div className="mkt-kpi"><div className="k-label">Total Due</div><div className="k-value">৳9,240</div></div>
                <div className="mkt-kpi"><div className="k-label">My Meals</div><div className="k-value">38</div></div>
                <div className="mkt-kpi"><div className="k-label">Meal Rate</div><div className="k-value">৳72.5</div></div>
                <div className="mkt-kpi"><div className="k-label">Status</div><div className="k-value k-paid">Paid</div></div>
              </div>
              <div className="mkt-bars">
                {[60, 80, 45, 95, 70, 88].map((h, i) => <div key={i} style={{ height: `${h}%` }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mkt-stats">
        <div className="mkt-container mkt-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="mkt-stat">
              <div className="mkt-stat-value">{s.value}</div>
              <div className="mkt-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Everything in one place</span>
            <h2 className="mkt-h2">Built for transparent shared living</h2>
            <p className="mkt-sub">Every feature exists to remove a recurring source of friction between roommates.</p>
          </div>
          <div className="mkt-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="mkt-card">
                <div className="mkt-card-ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mkt-section alt">
        <div className="mkt-container">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">How it works</span>
            <h2 className="mkt-h2">Live in three steps</h2>
          </div>
          <div className="mkt-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="mkt-step">
                <div className="mkt-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="proof" className="mkt-section">
        <div className="mkt-container">
          <div className="mkt-section-head">
            <span className="mkt-eyebrow">Loved by messes</span>
            <h2 className="mkt-h2">Less arguing. More living.</h2>
          </div>
          <div className="mkt-grid mkt-grid-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="mkt-quote">
                <div className="mkt-stars">★★★★★</div>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption><strong>{t.name}</strong><span>{t.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-final">
        <div className="mkt-container mkt-final-inner">
          <h2 className="mkt-h2">Ready to make your mess effortless?</h2>
          <p className="mkt-sub">Set it up once. Let UnmadHouse handle the math forever.</p>
          <Link to="/login" className="mkt-btn lg light">Get started free →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mkt-footer">
        <div className="mkt-container mkt-footer-inner">
          <div className="mkt-brand"><span className="logo">U</span> UnmadHouse</div>
          <div className="mkt-foot-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <Link to="/login">Sign in</Link>
          </div>
          <div className="mkt-copy">© {2026} UnmadHouse · Automated mess management</div>
        </div>
      </footer>
    </div>
  );
}
