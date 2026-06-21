import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_MONTH } from '../lib/month.js';

const MEMBER_LINKS = [
  { to: '/', label: 'Dashboard', ico: '▦', end: true },
  { to: '/onboarding', label: 'Onboarding', ico: '◔' },
  { to: '/bills', label: 'Fixed Bills', ico: '▤' },
  { to: '/meals', label: 'Meal Calendar', ico: '◷' },
  { to: '/bazaar', label: 'Bazaar Log', ico: '▣' },
  { to: '/invoice', label: 'My Invoice', ico: '₹' },
  { to: '/payments', label: 'Payment History', ico: '⊞' },
  { to: '/corrections', label: 'Corrections', ico: '✎' },
  { to: '/reports', label: 'Reports', ico: '◫' },
];

// `admin` marks links only the ADMIN role should see; MANAGER sees the rest.
const STAFF_LINKS = [
  { to: '/admin', label: 'Owner Home', ico: '◆' },
  { to: '/admin/meals', label: 'Daily Meal Sheet', ico: '☑' },
  { to: '/admin/queue', label: 'Approval Queue', ico: '⧉' },
  { to: '/admin/members', label: 'Member Management', ico: '⚇', admin: true },
  { to: '/admin/payments', label: 'Payments', ico: '◉', admin: true },
  { to: '/admin/bills', label: 'Configure Bills', ico: '⚙', admin: true },
];

// Human label for the active route (topbar breadcrumb).
function activeLabel(pathname) {
  const all = [...MEMBER_LINKS, ...STAFF_LINKS];
  const match = all.find((l) => (l.end ? pathname === l.to : pathname === l.to));
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
        <div className="brand">
          <span className="logo">U</span> UnmadHouse
        </div>
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
