// Platform data client (mobile). All calls are authenticated via auth.js.
// Project flow runs against the real /v1/projects domain (Postgres), with binary
// photo upload (expo-file-system) and progress via polling (no SSE in RN).

import { File, UploadType } from 'expo-file-system';
import * as Location from 'expo-location';
import { authFetch, authGet, authPost, getAccessToken, API_BASE } from './auth';
export { money, dollars } from './format';

export { API_BASE };
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Taxonomy + location ──────────────────────────────────────────────────────
export const getTaxonomy = () => authGet('/v1/taxonomy');

export async function getDeviceLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude: lat, longitude: lng } = pos.coords;
    let zip = null, city = null, region = null;
    try {
      const p = (await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }))?.[0];
      if (p) { zip = p.postalCode || null; city = p.city || p.subregion || null; region = [city, p.region].filter(Boolean).join(', ') || null; }
    } catch { /* optional */ }
    return { lat, lng, zip, city, region };
  } catch { return null; }
}

// ── Project lifecycle (client) ───────────────────────────────────────────────
export const createProject = (payload) => authPost('/v1/projects', payload); // → { projectId, uploads }
export const confirmImages = (id, images) => authPost(`/v1/projects/${id}/images/confirm`, { images });
export const startEstimate = (id) => authPost(`/v1/projects/${id}/estimate`);
export const getProject = (id) => authGet(`/v1/projects/${id}`).then((d) => d.project);
export const postProject = (id) => authPost(`/v1/projects/${id}/post`);
export const updateProjectBudget = (id, selectedBudgetCents) =>
  authFetch(`/v1/projects/${id}/budget`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selectedBudgetCents }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || 'Could not update budget');
    return data.project;
  });
export const myProjects = () => authGet('/v1/projects/mine').then((d) => d.projects);
export const projectBids = (id) => authGet(`/v1/projects/${id}/bids`).then((d) => d.bids);
export const acceptBid = (bidId) => authPost(`/v1/bids/${bidId}/accept`);
export const declineBid = (bidId) => authPost(`/v1/bids/${bidId}/decline`);
export const askProjectQuestion = (id, message) => authPost(`/v1/projects/${id}/qa`, { message });

// ── Provider ─────────────────────────────────────────────────────────────────
export const providerFeed = () => authGet('/v1/projects/feed').then((d) => d.projects);
export const myBids = () => authGet('/v1/projects/my-bids').then((d) => d.bids);
export const placeBid = (id, body) => authPost(`/v1/projects/${id}/bids`, body).then((d) => d.bid);

// ── Messaging + scheduling (both) ────────────────────────────────────────────
export const myThreads = () => authGet('/v1/threads').then((d) => d.threads);
export const threadMessages = (id) => authGet(`/v1/threads/${id}/messages`).then((d) => d.messages);
export const sendMessage = (id, body) => authPost(`/v1/threads/${id}/messages`, { body }).then((d) => d.message);
export const myAppointments = () => authGet('/v1/appointments/mine').then((d) => d.appointments);
export const createAppointment = (body) => authPost('/v1/appointments', body).then((d) => d.appointment);
export const confirmAppointment = (id) => authPost(`/v1/appointments/${id}/confirm`).then((d) => d.appointment);

// Voice-to-text: upload a recorded audio file to the server, get back the text.
// Binary upload (no base64 inflation) with the auth token attached manually.
export async function transcribeAudio(fileUri, mimeType = 'audio/m4a') {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await new File(fileUri).upload(`${API_BASE}/v1/transcribe`, {
      httpMethod: 'POST', uploadType: UploadType.BINARY_CONTENT, mimeType,
      headers: token ? { authorization: `Bearer ${token}` } : {}, signal: controller.signal,
    });
  } finally { clearTimeout(timer); }
  let body = {};
  try { body = JSON.parse(res.body); } catch { /* */ }
  if (res.status < 200 || res.status >= 300) throw new Error(body?.error?.message || `Transcription failed (${res.status})`);
  return body.text || '';
}

export async function uploadImage(uploadUrl, fileUri, mime = 'image/jpeg') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await new File(fileUri).upload(uploadUrl, {
      httpMethod: 'PUT', uploadType: UploadType.BINARY_CONTENT, mimeType: mime, signal: controller.signal,
    });
  } finally { clearTimeout(timer); }
  if (res.status < 200 || res.status >= 300) throw new Error(`Image upload failed (${res.status})`);
}

// Create → upload → confirm → estimate → poll until ESTIMATED.
export async function runEstimation({ files = [], description = '', categoryKey, location, measuredAreaSqft, referenceObject }, { onStage } = {}) {
  onStage?.('Creating your project…');
  const { projectId, uploads } = await createProject({ description, categoryKey, location, imageCount: files.length, measuredAreaSqft, referenceObject });

  if (files.length > 0) {
    onStage?.('Uploading photos…');
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      await uploadImage(uploads[i].uploadUrl, f.uri, f.mimeType || 'image/jpeg');
      images.push({ s3Key: uploads[i].s3Key, byteSize: f.fileSize, width: f.width, height: f.height });
    }
    const conf = await confirmImages(projectId, images);
    const rejected = conf.images.filter((im) => im.status === 'rejected');
    if (rejected.length === conf.images.length && !description.trim()) {
      throw new Error('All photos were rejected: ' + (rejected.flatMap((r) => r.quality?.issues || []).join(' ') || 'unusable quality'));
    }
  }

  onStage?.('Analyzing your project & local pricing…');
  await startEstimate(projectId);

  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    await delay(1600);
    const p = await getProject(projectId);
    if (p.status === 'ESTIMATED' && p.scopeEstimate) return p;
    if (p.status === 'FAILED') throw new Error('Analysis failed — please try a clearer description or photo.');
  }
  throw new Error('Timed out waiting for the estimate. Please try again.');
}
