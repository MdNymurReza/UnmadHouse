// Shared month helpers. Sample data is for 2026-06, so default there in dev.
export const DEFAULT_MONTH = '2026-06';

export function currentMonthYear() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function money(n) {
  const v = Number(n || 0);
  return `৳${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Short date, e.g. "21 Jun 2026". Returns '—' for null/invalid.
export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
