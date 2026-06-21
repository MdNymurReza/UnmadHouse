import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On boot, if a token exists, resolve the current user.
  useEffect(() => {
    let active = true;
    async function boot() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get('/auth/me');
        if (active) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.post('/auth/login', { email, password });
    setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const isStaff = user && (user.role === 'ADMIN' || user.role === 'MANAGER');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
