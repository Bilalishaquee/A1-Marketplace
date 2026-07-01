// Authenticated data client for all three panels (homeowner / provider / admin).
// Thin wrappers over authFetch — every call carries the JWT and auto-refreshes.

import { authFetch, authGet, authPost } from './authApi'

// ── Client (homeowner) ───────────────────────────────────────────────────────
export const myProjects = () => authGet('/v1/projects/mine').then(d => d.projects)
export const getProject = (id) => authGet(`/v1/projects/${id}`).then(d => d.project)
export const projectBids = (id) => authGet(`/v1/projects/${id}/bids`).then(d => d.bids)
export const postProject = (id) => authPost(`/v1/projects/${id}/post`)
export const updateProjectBudget = (id, selectedBudgetCents) =>
  authFetch(`/v1/projects/${id}/budget`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selectedBudgetCents }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Could not update budget')
    return data.project
  })
export const acceptBid = (bidId) => authPost(`/v1/bids/${bidId}/accept`)
export const declineBid = (bidId) => authPost(`/v1/bids/${bidId}/decline`)

// ── Provider ─────────────────────────────────────────────────────────────────
export const providerFeed = () => authGet('/v1/projects/feed').then(d => d.projects)
export const myBids = () => authGet('/v1/projects/my-bids').then(d => d.bids)
export const placeBid = (projectId, body) => authPost(`/v1/projects/${projectId}/bids`, body).then(d => d.bid)

// ── Messaging (both) ─────────────────────────────────────────────────────────
export const myThreads = () => authGet('/v1/threads').then(d => d.threads)
export const threadMessages = (id) => authGet(`/v1/threads/${id}/messages`).then(d => d.messages)
export const sendMessage = (id, body) => authPost(`/v1/threads/${id}/messages`, { body }).then(d => d.message)

// ── Scheduling (both) ────────────────────────────────────────────────────────
export const myAppointments = () => authGet('/v1/appointments/mine').then(d => d.appointments)
export const createAppointment = (body) => authPost('/v1/appointments', body).then(d => d.appointment)
export const confirmAppointment = (id) => authPost(`/v1/appointments/${id}/confirm`).then(d => d.appointment)

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminStats = () => authGet('/v1/admin/stats')
export const adminUsers = () => authGet('/v1/admin/users').then(d => d.users)
export const adminProjects = () => authGet('/v1/admin/projects').then(d => d.projects)
export const adminBids = () => authGet('/v1/admin/bids').then(d => d.bids)

export const money = (cents) => '$' + Math.round((Number(cents) || 0) / 100).toLocaleString()
export const dollars = (n) => '$' + Math.round(Number(n) || 0).toLocaleString()
