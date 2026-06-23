import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_MONTH } from '../lib/month.js';

// Paths are relative to the /app parent route (see App.jsx).
const MEMBER_LINKS = [
  { to: '/app', label: 'Dashboard', ico: '▦', end: true },
  { to: '/app/onboarding', label: 'Onboarding', ico: '◔' },
  { to: '/app/bills', label: 'Fixed Bills', ico: '▤' },
  { to: '/app/meals', label: 'Meal Calendar', ico: '◷' },
  { to: '/app/bazaar', label: 'Bazaar Log', ico: '▣' },
  { to: '/app/invoice', label: 'My Invoice', ico: '₹' },
  { to: '/app/payments', label: 'Payment History', ico: '⊞' },
  { to: '/app/corrections', label: 'Corrections', ico: '✎' },
  { to: '/app/reports', label: 'Reports', ico: '◫' },
];

// `admin` marks links only the ADMIN role should see; MANAGER sees the rest.
const STAFF_LINKS = [
  { to: '/app/admin', label: 'Owner Home', ico: '◆' },
  { to: '/app/admin/meals', label: 'Daily Meal Sheet', ico: '☑' },
  { to: '/app/admin/queue', label: 'Approval Queue', ico: '⧉' },
  { to: '/app/admin/members', label: 'Member Management', ico: '⚇', admin: true },
  { to: '/app/admin/payments', label: 'Payments', ico: '◉', admin: true },
  { to: '/app/admin/bills', label: 'Configure Bills', ico: '⚙', admin: true },
];

// Human label for the active route (topbar breadcrumb).
function activeLabel(pathname) {
  const all = [...MEMBER_LINKS, ...STAFF_LINKS];
  const match = all.find((l) => pathname === l.to);
  return match?.label || 'Dashboard';
}

export default function Layout() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="logo">U</span> UnmadHouse
        </Link>
        <nav className="side-nav">
          <div className="nav-group-label">Member</div>
          {MEMBER_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="side-link">
              <span className="ico">{l.ico}</span> {l.label}
            </NavLink>
          ))}
          {isStaff && (
            <>
              <div className="nav-group-label">Owner Panel</div>
              {STAFF_LINKS
                .filter((l) => !l.admin || user?.role === 'ADMIN')
                .map((l) => (
                  <NavLink key={l.to} to={l.to} className="side-link">
                    <span className="ico">{l.ico}</span> {l.label}
                  </NavLink>
                ))}
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="who">
            <div className="avatar">{initials}</div>
            <div className="meta">
              <strong>{user?.name}</strong>
              <span className="role-tag">{user?.role}</span>
            </div>
          </div>
          <button className="ghost" style={{ width: '100%' }} onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="crumb">UnmadHouse <span style={{ margin: '0 6px' }}>/</span> <b>{activeLabel(location.pathname)}</b></div>
          <div className="month-pill">📅 Billing month: {DEFAULT_MONTH}</div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
