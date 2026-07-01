import { createContext, useContext, useState, useEffect } from 'react'
import { apiLogin, apiRegister, apiLogout, apiMe, tokens } from '../lib/authApi'

const AuthCtx = createContext(null)

// Backend role → UI role used across the existing components/layouts.
const ROLE_UI = { CLIENT: 'user', PROVIDER: 'provider', ADMIN: 'admin' }
export const ROLE_HOME = { user: '/dashboard', provider: '/provider', admin: '/admin' }

function shape(u) {
  if (!u) return null
  const role = ROLE_UI[u.role] || 'user'
  const initials = (u.name || '?').trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  return { ...u, role, rawRole: u.role, initials }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on load (validate the stored token against /me).
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (tokens.access || tokens.refresh) {
        try { const u = await apiMe(); if (alive) setUser(shape(u)) }
        catch { tokens.clear() }
      }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const login = async (email, password) => { const u = shape(await apiLogin(email, password)); setUser(u); return u }
  const register = async (payload) => { const u = shape(await apiRegister(payload)); setUser(u); return u }
  const logout = async () => { await apiLogout(); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
