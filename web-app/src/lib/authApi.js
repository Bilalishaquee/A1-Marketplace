// Real auth client for the A-1 platform API. Stores JWT access + refresh tokens
// in localStorage, auto-refreshes a 401, and exposes an authed fetch helper that
// every panel uses for protected calls.

export const API_BASE =
  (import.meta.env && import.meta.env.VITE_AI_API) || 'http://localhost:4000'

const ACCESS = 'a1_access'
const REFRESH = 'a1_refresh'

export const tokens = {
  get access() { return localStorage.getItem(ACCESS) },
  get refresh() { return localStorage.getItem(REFRESH) },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH, refreshToken)
  },
  clear() { localStorage.removeItem(ACCESS); localStorage.removeItem(REFRESH) },
}

async function jsonOrThrow(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`)
  return body
}

export async function apiRegister(payload) {
  const body = await jsonOrThrow(await fetch(`${API_BASE}/v1/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  }))
  tokens.set(body)
  return body.user
}

export async function apiLogin(email, password) {
  const body = await jsonOrThrow(await fetch(`${API_BASE}/v1/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  }))
  tokens.set(body)
  return body.user
}

export async function apiLogout() {
  const refreshToken = tokens.refresh
  tokens.clear()
  if (refreshToken) {
    fetch(`${API_BASE}/v1/auth/logout`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken }),
    }).catch(() => {})
  }
}

async function doRefresh() {
  const refreshToken = tokens.refresh
  if (!refreshToken) throw new Error('no session')
  const body = await jsonOrThrow(await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken }),
  }))
  tokens.set(body)
  return body.accessToken
}

// Authed fetch: attaches the access token, transparently refreshes once on 401.
export async function authFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const call = (token) => fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
  })
  let res = await call(tokens.access)
  if (res.status === 401 && tokens.refresh) {
    try { res = await call(await doRefresh()) } catch { /* fall through to 401 */ }
  }
  return res
}

// Convenience JSON helpers over authFetch.
export async function authGet(path) { return jsonOrThrow(await authFetch(path)) }
export async function authPost(path, body) {
  return jsonOrThrow(await authFetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) }))
}

export async function apiMe() {
  const res = await authFetch('/v1/auth/me')
  if (!res.ok) throw new Error('unauthorized')
  return (await res.json()).user
}
