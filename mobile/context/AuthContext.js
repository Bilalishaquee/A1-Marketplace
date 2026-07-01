import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiLogout, apiMe, loadTokens, setAuthFailureHandler } from '../lib/auth';

const Ctx = createContext(null);
const ROLE_UI = { CLIENT: 'user', PROVIDER: 'provider', ADMIN: 'admin' };

function shape(u) {
  if (!u) return null;
  const role = ROLE_UI[u.role] || 'user';
  const initials = (u.name || '?').trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return { ...u, role, rawRole: u.role, initials };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const removeFailureHandler = setAuthFailureHandler(() => setUser(null));
    (async () => {
      const { accessToken, refreshToken } = await loadTokens();
      if (accessToken || refreshToken) {
        try { setUser(shape(await apiMe())); } catch { /* invalid session */ }
      }
      setLoading(false);
    })();
    return removeFailureHandler;
  }, []);

  const login = async (email, password) => { const u = shape(await apiLogin(email, password)); setUser(u); return u; };
  const register = async (payload) => { const u = shape(await apiRegister(payload)); setUser(u); return u; };
  const logout = async () => { await apiLogout(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
