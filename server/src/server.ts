// HTTP entrypoint (TDD §1.2). Thin: validation, routing, SSE. Heavy work runs
// in the estimation worker via the queue. Auth is a permissive stub here and is
// hardened in Phase 6.

import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.ts';
import { quoteRouter } from './routes/quotes.ts';
import { adminRouter } from './routes/admin.ts';
import { authRouter } from './routes/auth.ts';
import { projectsRouter } from './routes/projects.ts';
import { bidsRouter } from './routes/bids.ts';
import { messagesRouter } from './routes/messages.ts';
import { appointmentsRouter } from './routes/appointments.ts';
import { adminDataRouter } from './routes/adminData.ts';
import { transcribeRouter } from './routes/transcribe.ts';
import { trainingRouter } from './routes/training.ts';
import { pollRunningJobs } from './ai/fineTuning.ts';
import { initRealtime } from './realtime.ts';
import { SERVICE_CATEGORIES } from './data/taxonomy.ts';
import { MemoryEventRepo, MemoryOutcomeRepo, MemoryQuoteRepo } from './store/memoryRepo.ts';
import { blobStore } from './store/blobStore.ts';
import type { EventRepo, OutcomeRepo, QuoteRepo } from './store/repo.ts';

// ── Wire dependencies (TDD §6.4: swap memory → Prisma via STORE env) ──────────
let quotes: QuoteRepo;
let events: EventRepo;
let outcomes: OutcomeRepo;
// The marketplace domain (/v1/projects, bids, threads, appointments, admin) runs
// on real Postgres via Prisma. The legacy AI-quote routes (/v1/quotes) still use
// the in-memory repos below until the front-ends move to /v1/projects.
quotes = new MemoryQuoteRepo();
events = new MemoryEventRepo();
outcomes = new MemoryOutcomeRepo();

const app = express();
app.use(express.json({ limit: '1mb' }));

// Minimal CORS for the Vite dev front-end.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Live test console (browser UI for poking the API end-to-end).
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
app.use(express.static(publicDir));

app.get('/health', (_req, res) => res.json({
  ok: true, provider: config.modelProvider, renderProvider: config.renderProvider,
  store: config.store, schema: '2025-06-09.1',
}));

// Dev presigned-upload target: stores bytes in the blob store so the model can
// receive real pixels as base64 (TDD §7.1). Prod uses real S3 + presigned URLs.
app.put('/v1/mock-upload/:key', express.raw({ type: '*/*', limit: '15mb' }), (req, res) => {
  const key = decodeURIComponent(req.params.key);
  const mediaType = req.get('content-type') || 'image/jpeg';
  blobStore.put(key, req.body as Buffer, mediaType);
  res.json({ ok: true, bytes: (req.body as Buffer).length });
});

// Convenience: a same-origin sample renovation photo so the console can test
// the Claude path in one click (no CORS, no need to pick a local file).
app.get('/v1/dev/sample-image', async (_req, res) => {
  try {
    const r = await fetch('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1024');
    if (!r.ok) return res.status(502).json({ error: { code: '502', message: 'sample fetch failed' } });
    res.set('content-type', 'image/jpeg');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.status(502).json({ error: { code: '502', message: 'sample fetch failed' } });
  }
});

// Canonical service taxonomy (PDF) — consumed by web + mobile category pickers.
app.get('/v1/taxonomy', (_req, res) => res.json({
  categories: SERVICE_CATEGORIES.map(c => ({
    key: c.key, label: c.label, emoji: c.emoji, trades: c.trades, items: c.items,
  })),
}));

app.use('/v1/auth', authRouter());
// Marketplace domain (real Postgres + RBAC + real-time).
app.use('/v1/projects', projectsRouter());
app.use('/v1/bids', bidsRouter());
app.use('/v1/threads', messagesRouter());
app.use('/v1/appointments', appointmentsRouter());
app.use('/v1/transcribe', transcribeRouter());
app.use('/v1/admin', adminDataRouter());
app.use('/v1/admin/training', trainingRouter());
// Legacy in-memory AI-quote routes (kept until the front-ends move to /v1/projects).
app.use('/v1/quotes', quoteRouter({ quotes, events, outcomes }));
app.use('/v1/admin', adminRouter({ quotes, outcomes }));

app.use((req, res) => res.status(404).json({ error: { code: '404', message: `no route ${req.method} ${req.path}` } }));

// Global error handler — catches anything passed to next(err) or thrown in async routes.
app.use((err: any, _req: any, res: any, _next: any) => {
  const msg: string = err?.message ?? String(err)
  if (msg.includes("Can't reach") || msg.includes('ECONNREFUSED') || msg.includes('P1001')) {
    return res.status(503).json({ error: { code: '503', message: 'Database unavailable — please try again shortly' } })
  }
  console.error('[Express error]', err)
  res.status(500).json({ error: { code: '500', message: 'Internal server error' } })
})

// HTTP server + Socket.IO (real-time). Bind 0.0.0.0 so LAN devices can reach it.
const httpServer = createServer(app);
initRealtime(httpServer);
httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(`A-1 platform API on http://0.0.0.0:${config.port}  [provider=${config.modelProvider}, store=${config.store}, realtime=on]`);
});

// Background fine-tuning job poller — checks OpenAI every 10 minutes for RUNNING jobs.
setInterval(() => { void pollRunningJobs(); }, 10 * 60 * 1000);

// Safety net: log unhandled rejections instead of crashing the process.
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason)
})
