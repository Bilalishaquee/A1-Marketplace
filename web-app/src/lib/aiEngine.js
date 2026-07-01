// Client for the A-1 AI Estimation Engine (marketplace flow).
// Shared by the web quote flow (QuoteUpload/QuoteResult) and the mobile web views.
// Flow: describe (+voice) + photos + auto-location → AI scope + price range → post.

import { authFetch, API_BASE } from './authApi'

export { API_BASE }

async function json(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = body?.error?.message || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return body
}

// ── Taxonomy (the 20 service categories, from the backend) ───────────────────
export async function getTaxonomy() {
  return json(await fetch(`${API_BASE}/v1/taxonomy`))
}

// ── Location (no ZIP question — use the device, reverse-geocode for pricing) ──
// Free, key-less reverse geocoding (BigDataCloud client endpoint).
export async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    )
    const d = await r.json()
    const city = d.city || d.locality || null
    return {
      zip: d.postcode || null,
      city,
      region: [city, d.principalSubdivision].filter(Boolean).join(', ') || null,
    }
  } catch {
    return {}
  }
}

// Resolves to { lat, lng, zip?, city?, region? } or null if denied/unavailable.
export function getDeviceLocation() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const geo = await reverseGeocode(lat, lng)
        resolve({ lat, lng, ...geo })
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 600000 },
    )
  })
}

// ── Project lifecycle (authenticated — projects belong to the signed-in user) ──
export async function createQuote({ description, categoryKey, location, imageCount, measuredAreaSqft, referenceObject }) {
  const d = await json(await authFetch('/v1/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description, categoryKey, location, imageCount, measuredAreaSqft, referenceObject }),
  }))
  return { quoteId: d.projectId, uploads: d.uploads }
}

export async function uploadImage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'image/jpeg' },
    body: file,
  })
  if (!res.ok) throw new Error('Image upload failed')
}

export async function confirmImages(quoteId, images) {
  return json(await authFetch(`/v1/projects/${quoteId}/images/confirm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ images }),
  }))
}

export async function startEstimate(quoteId) {
  return json(await authFetch(`/v1/projects/${quoteId}/estimate`, { method: 'POST' }))
}

// Returns the project object (with scopeEstimate) for the result screen.
export async function getQuote(quoteId) {
  const d = await json(await authFetch(`/v1/projects/${quoteId}`))
  return d.project
}

export async function askQuestion(quoteId, message) {
  return json(await authFetch(`/v1/projects/${quoteId}/qa`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  }))
}

// Post the project to the marketplace (providers can then bid).
export async function postProject(quoteId) {
  return json(await authFetch(`/v1/projects/${quoteId}/post`, { method: 'POST' }))
}

// Subscribe to the SSE progress stream. Returns an unsubscribe function.
export function subscribeEvents(quoteId, onEvent) {
  const es = new EventSource(`${API_BASE}/v1/projects/${quoteId}/events`)
  es.onmessage = (m) => { try { onEvent(JSON.parse(m.data)) } catch { /* ignore */ } }
  es.onerror = () => { /* server closes on done/failed */ }
  return () => es.close()
}

function imageDims(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src) }
    img.onerror = () => resolve({})
    img.src = URL.createObjectURL(file)
  })
}

// ── High-level orchestration ─────────────────────────────────────────────────
// Runs describe+photos → AI scope/range, streaming progress. Resolves with the
// completed quote. `files` is an array of File objects; `location` optional.
export async function runEstimation({ files = [], description = '', categoryKey, location, measuredAreaSqft, referenceObject }, { onStage } = {}) {
  const stage = (s) => onStage && onStage(s)

  stage({ stage: 'creating', pct: 4, message: 'Creating your project…' })
  const { quoteId, uploads } = await createQuote({
    description, categoryKey, location, imageCount: files.length, measuredAreaSqft, referenceObject,
  })

  if (files.length > 0) {
    stage({ stage: 'uploading', pct: 10, message: 'Uploading photos…' })
    const images = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const up = uploads[i]
      await uploadImage(up.uploadUrl, file)
      const d = await imageDims(file)
      images.push({ s3Key: up.s3Key, byteSize: file.size, ...d })
    }
    const conf = await confirmImages(quoteId, images)
    const rejected = conf.images.filter((im) => im.status === 'rejected')
    if (rejected.length === conf.images.length && !description.trim()) {
      const issues = rejected.flatMap((r) => r.quality?.issues || [])
      throw new Error('All photos were rejected: ' + (issues.join(' ') || 'unusable quality'))
    }
  }

  await startEstimate(quoteId)

  return new Promise((resolve, reject) => {
    const unsub = subscribeEvents(quoteId, async (ev) => {
      stage(ev)
      if (ev.stage === 'done') {
        unsub()
        try { resolve(await getQuote(quoteId)) } catch (e) { reject(e) }
      } else if (ev.stage === 'failed') {
        unsub()
        reject(new Error(ev.error || 'Analysis failed'))
      }
    })
  })
}
