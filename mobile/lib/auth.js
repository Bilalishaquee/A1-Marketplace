import * as SecureStore from 'expo-secure-store';

const configuredBase = (process.env.EXPO_PUBLIC_AI_API || 'http://localhost:4000').trim();
export const API_BASE = configuredBase.replace(/\/+$/, '');

const ACCESS = 'a1_access';
const REFRESH = 'a1_refresh';
const DEFAULT_TIMEOUT_MS = 20000;

let accessToken = null;
let refreshToken = null;
let refreshPromise = null;
let authFailureHandler = null;

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
  return () => { if (authFailureHandler === handler) authFailureHandler = null; };
}

export async function loadTokens() {
  accessToken = await SecureStore.getItemAsync(ACCESS);
  refreshToken = await SecureStore.getItemAsync(REFRESH);
  return { accessToken, refreshToken };
}

async function setTokens({ accessToken: nextAccess, refreshToken: nextRefresh }) {
  if (nextAccess) {
    accessToken = nextAccess;
    await SecureStore.setItemAsync(ACCESS, nextAccess);
  }
  if (nextRefresh) {
    refreshToken = nextRefresh;
    await SecureStore.setItemAsync(REFRESH, nextRefresh);
  }
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH).catch(() => {}),
  ]);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, timeoutMs: undefined, signal: options.signal || controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new ApiError('The request timed out. Check your connection and try again.');
    throw new ApiError(`Could not reach the A-1 server at ${API_BASE}. Check the API URL and your connection.`);
  } finally {
    clearTimeout(timer);
  }
}

async function jsonOrThrow(res) {
  let body = {};
  try { body = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) throw new ApiError(body?.error?.message || `Request failed (${res.status})`, res.status, body?.error?.details);
  return body;
}

export async function apiLogin(email, password) {
  const body = await jsonOrThrow(await fetchWithTimeout(`${API_BASE}/v1/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }),
  }));
  await setTokens(body);
  return body.user;
}

export async function apiRegister(payload) {
  const body = await jsonOrThrow(await fetchWithTimeout(`${API_BASE}/v1/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  }));
  await setTokens(body);
  return body.user;
}

export async function apiLogout() {
  const currentRefresh = refreshToken;
  await clearTokens();
  if (currentRefresh) {
    fetchWithTimeout(`${API_BASE}/v1/auth/logout`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: currentRefresh }),
      timeoutMs: 8000,
    }).catch(() => {});
  }
}

async function refreshAccessToken() {
  if (!refreshToken) throw new ApiError('Your session has expired. Please sign in again.', 401);
  const res = await fetchWithTimeout(`${API_BASE}/v1/auth/refresh`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken }),
  });
  if (res.status === 401) {
    await clearTokens();
    authFailureHandler?.();
  }
  const body = await jsonOrThrow(res);
  await setTokens(body);
  return body.accessToken;
}

async function doRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function authFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const call = (token) => fetchWithTimeout(url, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  let res = await call(accessToken);
  if (res.status === 401 && refreshToken) {
    try { res = await call(await doRefresh()); } catch (error) { throw error; }
  }
  return res;
}

export async function authGet(path, options) { return jsonOrThrow(await authFetch(path, options)); }
export async function authPost(path, body, options = {}) {
  return jsonOrThrow(await authFetch(path, {
    ...options,
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(body ?? {}),
  }));
}

export async function getAccessToken() {
  if (!accessToken && refreshToken) return doRefresh();
  return accessToken;
}

export async function apiMe() {
  const res = await authFetch('/v1/auth/me');
  return (await jsonOrThrow(res)).user;
}
