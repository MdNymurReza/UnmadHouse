// Small presentational primitives shared across pages.

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub" style={{ marginBottom: 0 }}>{subtitle}</p>}
      </div>
      {actions && <div className="row-actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}

// A KPI stat tile. tone: default | green | red | amber
export function Stat({ label, value, icon, tone = 'default', delta }) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-head">
        <span className="label">{label}</span>
        {icon && <span className="stat-ico">{icon}</span>}
      </div>
      <div className="value">{value}</div>
      {delta && <span className={`delta ${delta.dir}`}>{delta.text}</span>}
    </div>
  );
}

export function EmptyState({ icon = '∅', title, hint }) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{title}</div>
      {hint && <div style={{ fontSize: '.85rem', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-row">
      <span className="spinner" /> {label}
    </div>
  );
}

export function TableWrap({ children }) {
  return <div className="table-wrap"><table>{children}</table></div>;
}
