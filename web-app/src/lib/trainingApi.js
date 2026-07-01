// Training API client — LLM Training admin portal endpoints.
// All calls require an ADMIN JWT (carried by authFetch automatically).

import { authFetch, authGet, authPost } from './authApi'

const BASE = '/v1/admin/training'

// ── Training Examples ─────────────────────────────────────────────────────────

export const listExamples = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString()
  return authGet(`${BASE}/examples${qs ? `?${qs}` : ''}`)
}

export const getExample = (id) => authGet(`${BASE}/examples/${id}`)

export const createExample = (body) =>
  authFetch(`${BASE}/examples`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to create example')
    return data
  })

export const updateExample = (id, patch) =>
  authFetch(`${BASE}/examples/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to update example')
    return data
  })

export const approveExample = (id) => updateExample(id, { status: 'APPROVED' })
export const rejectExample = (id) => updateExample(id, { status: 'REJECTED' })

export const deleteExample = (id) =>
  authFetch(`${BASE}/examples/${id}`, { method: 'DELETE' }).then(async (res) => {
    if (!res.ok) throw new Error('Failed to delete')
    return res.json()
  })

export const importExamples = (rows) =>
  authFetch(`${BASE}/examples/import`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Import failed')
    return data
  })

// ── Fine-tuning Jobs ──────────────────────────────────────────────────────────

export const listJobs = () => authGet(`${BASE}/jobs`)

export const getJob = (id) => authGet(`${BASE}/jobs/${id}`)

export const triggerJob = (opts = {}) =>
  authFetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(opts),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to start job')
    return data
  })

export const cancelJob = (id) =>
  authPost(`${BASE}/jobs/${id}/cancel`)

// ── Model Registry ────────────────────────────────────────────────────────────

export const listModels = () => authGet(`${BASE}/models`)

export const activateModel = (id) =>
  authPost(`${BASE}/models/${id}/activate`)

export const deactivateModel = (id) =>
  authPost(`${BASE}/models/${id}/deactivate`)

// ── Prompts ───────────────────────────────────────────────────────────────────

export const listPrompts = () => authGet(`${BASE}/prompts`)

export const getActivePrompt = (key) => authGet(`${BASE}/prompts/${key}/active`)

export const savePrompt = (body) =>
  authFetch(`${BASE}/prompts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || 'Failed to save prompt')
    return data
  })

export const activatePrompt = (id) =>
  authPost(`${BASE}/prompts/${id}/activate`)

// ── Metrics ───────────────────────────────────────────────────────────────────

export const getMetrics = () => authGet(`${BASE}/metrics`)

// ── CSV Template ──────────────────────────────────────────────────────────────

export const downloadCsvTemplate = () => {
  const headers = [
    'title', 'categoryKey', 'description', 'zip',
    'actualLowUsd', 'actualMedUsd', 'actualHighUsd',
    'durationDays', 'materialQuality', 'notes',
  ]
  const example = [
    'Kitchen Remodel - 180sqft', 'kitchen_remodeling',
    'Full kitchen remodel with shaker cabinets, quartz countertops, tile backsplash, LVP flooring. Keeping existing layout.',
    '90012', '28000', '42000', '65000', '35', 'mid', 'Mid-range LA project - 2024',
  ]
  const csv = [headers.join(','), example.map(v => `"${v}"`).join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'training-examples-template.csv'
  a.click(); URL.revokeObjectURL(url)
}
