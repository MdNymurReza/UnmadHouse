// MonthContext — the active billing month, shared across all pages.
// Replaces the hardcoded DEFAULT_MONTH. Admin can switch via the topbar.
import { createContext, useContext, useState, useCallback } from 'react';

export function currentMonthYear() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// import.meta.env.MODE === 'development' is true during dev.
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

const MonthContext = createContext(null);

export function MonthProvider({ children }) {
  // In dev, default to the hardcoded sample month so seed data shows.
  // In prod, default to the real current month.
  const [month, setMonth] = useState(isDev ? '2026-06' : currentMonthYear());

  const goPrev = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split('-').map(Number);
      return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
    });
  }, []);
  const goNext = useCallback(() => {
    setMonth((m) => {
      const [y, mo] = m.split('-').map(Number);
      return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
    });
  }, []);
  const goTo = useCallback((m) => setMonth(m), []);

  return (
    <MonthContext.Provider value={{ month, setMonth: goTo, goPrev, goNext }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
