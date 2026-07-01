// Marketplace projects API (Supabase). Client lifecycle (describe → estimate →
// post), provider discovery feed, and bids. RBAC + zod throughout.

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.ts';
import { config } from '../config.ts';
import { gateImage } from '../pipeline/imagePipeline.ts';
import { runProjectScope } from '../pipeline/projectScope.ts';
import { estimationQueue } from '../queue.ts';
import { quoteEvents } from '../sse.ts';
import { emitToUser } from '../realtime.ts';
import { getModelAdapter } from '../ai/index.ts';
import { requireAuth, requireRole, type AuthedRequest } from '../auth/middleware.ts';
import { createImageUploadTarget } from '../storage/supabaseStorage.ts';

const err = (res: Response, code: number, message: string, details?: unknown) =>
  res.status(code).json({ error: { code: String(code), message, details } });
const baseUrl = (req: Request) => `${req.protocol}://${req.get('host')}`;

const createSchema = z.object({
  description: z.string().max(4000).default(''),
  categoryKey: z.string().optional(),
  imageCount: z.number().int().min(0).max(config.maxImagesPerQuote).default(0),
  location: z.object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
    zip: z.string().max(12).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    region: z.string().max(160).nullable().optional(),
  }).nullable().optional(),
  // Measurement aids (raise accuracy past the photo-only guess).
  measuredAreaSqft: z.number().positive().max(100000).nullable().optional(),
  referenceObject: z.boolean().optional(),
});

const confirmSchema = z.object({
  images: z.array(z.object({
    s3Key: z.string(), byteSize: z.number().optional(), width: z.number().optional(),
    height: z.number().optional(), blurScore: z.number().optional(), brightness: z.number().optional(),
  })).min(1).max(config.maxImagesPerQuote),
});

const bidSchema = z.object({
  amountCents: z.number().int().positive(),
  message: z.string().max(2000).optional(),
  estimatedDurationDays: z.number().int().positive().max(3650).optional(),
  siteVisitRequested: z.boolean().default(false),
});

const budgetSchema = z.object({
  selectedBudgetCents: z.number().int().nonnegative().nullable(),
});

// Serialize a stored ScopeEstimate (cents) to the client/dollar shape.
function serializeScope(s: any) {
  if (!s) return null;
  return {
    categoryKey: s.categoryKey, categoryLabel: s.categoryLabel, matchedItems: s.matchedItems,
    scopeOfWork: s.scopeOfWork, materialQuality: s.materialQuality,
    priceLow: (s.priceLowCents ?? 0) / 100, priceMed: (s.priceMedCents ?? 0) / 100, priceHigh: (s.priceHighCents ?? 0) / 100,
    estimatedDuration: s.estimatedDuration, permitsRequired: s.permitsRequired,
    materialEstimates: s.materialEstimates, urgency: s.urgency, urgencyScore: s.urgencyScore,
    suggestedTrades: s.suggestedTrades, confidence: s.confidence,
    assumptions: s.assumptions ?? [], needsReview: s.needsReview ?? false,
    rationale: s.rationale, framing: s.framing, pricingBasis: s.pricingBasis, modelId: s.modelId,
  };
}

function firstName(name?: string | null) {
  const first = (name || '').trim().split(/\s+/)[0];
  return first || 'Homeowner';
}

function stateFromRegion(region?: string | null) {
  const parts = (region || '').split(',').map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

function serializeProject(p: any, opts: { includeClient?: boolean; includeFullClient?: boolean } = {}) {
  const clientFirstName = p.client ? firstName(p.client.name) : undefined;
  return {
    id: p.id, status: p.status, description: p.description, categoryKey: p.categoryKey,
    location: { lat: p.lat, lng: p.lng, zip: p.zip, city: p.city, region: p.region, state: stateFromRegion(p.region) },
    images: (p.images ?? []).map((i: any) => ({ id: i.id, status: i.status, quality: i.quality })),
    scopeEstimate: serializeScope(p.scopeEstimate),
    selectedBudgetCents: p.selectedBudgetCents ?? null,
    selectedBudget: p.selectedBudgetCents != null ? p.selectedBudgetCents / 100 : null,
    urgency: p.urgency, postedAt: p.postedAt, createdAt: p.createdAt,
    bidCount: p._count?.bids,
    client: opts.includeClient && p.client ? {
      id: p.client.id,
      firstName: clientFirstName,
      name: opts.includeFullClient ? p.client.name : clientFirstName,
    } : undefined,
  };
}

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function projectsRouter(): Router {
  const r = Router();

  // ── Client: create draft + presigned uploads ──────────────────────────────
  r.post('/', requireAuth, requireRole('CLIENT', 'ADMIN'), async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const b = parsed.data;
    const project = await prisma.project.create({
      data: {
        clientId: req.user!.id, description: b.description, categoryKey: b.categoryKey ?? null,
        lat: b.location?.lat ?? null, lng: b.location?.lng ?? null, zip: b.location?.zip ?? null,
        city: b.location?.city ?? null, region: b.location?.region ?? null, status: 'DRAFT',
        measuredAreaSqft: b.measuredAreaSqft ?? null, hasReferenceObject: !!b.referenceObject,
      },
    });
    const uploads = await Promise.all(Array.from({ length: b.imageCount }, () => {
      const key = `projects/${project.id}/${crypto.randomUUID()}.jpg`;
      return createImageUploadTarget(key, `${baseUrl(req)}/v1/mock-upload/${encodeURIComponent(key)}`);
    }));
    res.status(201).json({ projectId: project.id, uploads });
  });

  // ── Client: my projects ────────────────────────────────────────────────────
  r.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
    const projects = await prisma.project.findMany({
      where: { clientId: req.user!.id },
      orderBy: { createdAt: 'desc' }, take: 100,
      include: { images: true, _count: { select: { bids: true } } },
    });
    res.json({ projects: projects.map(p => serializeProject(p)) });
  });

  // ── Provider: discovery feed (posted projects near me / in my trades) ───────
  r.get('/feed', requireAuth, requireRole('PROVIDER', 'ADMIN'), async (req: AuthedRequest, res) => {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user!.id } });
    const trades = profile?.trades ?? [];
    const radius = profile?.serviceRadiusMiles ?? 25;
    const posted = await prisma.project.findMany({
      where: { status: 'POSTED', ...(trades.length ? { categoryKey: { in: trades } } : {}) },
      orderBy: { postedAt: 'desc' }, take: 100,
      include: { images: true, client: true, _count: { select: { bids: true } } },
    });
    const out = posted.map(p => {
      const view: any = serializeProject(p, { includeClient: true });
      if (profile?.lat != null && profile?.lng != null && p.lat != null && p.lng != null) {
        view.distanceMiles = Math.round(haversineMiles(profile.lat, profile.lng, p.lat, p.lng));
      }
      return view;
    }).filter((v: any) => v.distanceMiles == null || v.distanceMiles <= radius);
    res.json({ projects: out });
  });

  // ── Provider's own bids ─────────────────────────────────────────────────────
  r.get('/my-bids', requireAuth, requireRole('PROVIDER', 'ADMIN'), async (req: AuthedRequest, res) => {
    const bids = await prisma.bid.findMany({
      where: { providerId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 100,
      include: { project: { include: { images: true } } },
    });
    res.json({ bids: bids.map(bd => ({ ...serializeBid(bd), project: serializeProject(bd.project) })) });
  });

  // ── Get one project (owner, admin, or any provider if posted) ──────────────
  r.get('/:id', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { images: true, client: true, _count: { select: { bids: true } } },
    });
    if (!p) return err(res, 404, 'project not found');
    const isOwner = p.clientId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    const isProviderViewable = req.user!.role === 'PROVIDER' && ['POSTED', 'MATCHED', 'SCHEDULED', 'IN_PROGRESS'].includes(p.status);
    if (!isOwner && !isAdmin && !isProviderViewable) return err(res, 403, 'forbidden');
    res.json({ project: serializeProject(p, { includeClient: !isOwner, includeFullClient: isAdmin }) });
  });

  // ── Client/admin: adjust the budget they want providers to work from ──────
  r.patch('/:id/budget', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const updated = await prisma.project.update({
      where: { id: p.id },
      data: { selectedBudgetCents: parsed.data.selectedBudgetCents },
      include: { images: true, _count: { select: { bids: true } } },
    });
    await prisma.projectEvent.create({
      data: { projectId: p.id, actor: 'client', type: 'budget_adjusted', payload: { selectedBudgetCents: parsed.data.selectedBudgetCents } },
    });
    res.json({ project: serializeProject(updated) });
  });

  // ── Client: register uploaded images + quality gate ────────────────────────
  r.post('/:id/images/confirm', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const rows = await Promise.all(parsed.data.images.map(u => {
      const quality = gateImage(u);
      return prisma.projectImage.create({
        data: { projectId: p.id, key: u.s3Key, status: quality.usable ? 'usable' : 'rejected', quality: quality as any },
      });
    }));
    res.json({
      images: rows.map(i => ({ id: i.id, status: i.status, quality: i.quality })),
      rejectedCount: rows.filter(i => i.status === 'rejected').length,
    });
  });

  // ── Client: enqueue AI scope analysis (202 + SSE) ──────────────────────────
  r.post('/:id/estimate', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id }, include: { images: true } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const hasImage = p.images.some(i => i.status === 'usable');
    if (!hasImage && !p.description.trim()) return err(res, 422, 'add a description or at least one usable photo first');
    quoteEvents.publish(p.id, { stage: 'queued', pct: 5, message: 'Queued for analysis…' });
    estimationQueue.enqueue(() => runProjectScope(p.id));
    res.status(202).json({ projectId: p.id, statusUrl: `/v1/projects/${p.id}/events` });
  });

  // ── SSE progress (cuid-gated; EventSource can't send auth headers) ─────────
  r.get('/:id/events', async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (ev: unknown) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
    const unsub = quoteEvents.subscribe(req.params.id, (ev) => {
      send(ev);
      if (ev.stage === 'done' || ev.stage === 'failed') { unsub(); res.end(); }
    });
    req.on('close', unsub);
  });

  // ── Grounded Q&A about the estimate (owner/admin) ──────────────────────────
  r.post('/:id/qa', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const parsed = z.object({ message: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const answer = await getModelAdapter().chat(
      [{ role: 'user', content: parsed.data.message }],
      JSON.stringify(serializeScope(p.scopeEstimate) ?? { note: 'no estimate yet' }),
    );
    res.json({ answer });
  });

  // ── Client: post project to the marketplace ────────────────────────────────
  r.post('/:id/post', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    if (!p.scopeEstimate) return err(res, 422, 'estimate not ready — analyze the project first');
    const updated = await prisma.project.update({ where: { id: p.id }, data: { status: 'POSTED', postedAt: new Date() } });
    await prisma.projectEvent.create({ data: { projectId: p.id, actor: 'client', type: 'project_posted', payload: { categoryKey: p.categoryKey } } });
    res.status(201).json({ status: updated.status, postedAt: updated.postedAt });
  });

  // ── Provider: place / update a bid ─────────────────────────────────────────
  r.post('/:id/bids', requireAuth, requireRole('PROVIDER'), async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.status !== 'POSTED') return err(res, 422, 'this project is not accepting bids');
    const parsed = bidSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const bid = await prisma.bid.upsert({
      where: { projectId_providerId: { projectId: p.id, providerId: req.user!.id } },
      create: { projectId: p.id, providerId: req.user!.id, ...parsed.data, status: 'PENDING' },
      update: { ...parsed.data, status: 'PENDING' },
      include: { provider: { include: { providerProfile: true } } },
    });
    await prisma.projectEvent.create({ data: { projectId: p.id, actor: 'provider', type: 'bid_placed', payload: { bidId: bid.id, amountCents: bid.amountCents, siteVisitRequested: bid.siteVisitRequested } } });
    emitToUser(p.clientId, 'bid:new', { projectId: p.id, bid: serializeBid(bid) }); // real-time to client
    res.status(201).json({ bid: serializeBid(bid) });
  });

  // ── Client/admin: list bids on a project ───────────────────────────────────
  r.get('/:id/bids', requireAuth, async (req: AuthedRequest, res) => {
    const p = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!p) return err(res, 404, 'project not found');
    if (p.clientId !== req.user!.id && req.user!.role !== 'ADMIN') return err(res, 403, 'forbidden');
    const bids = await prisma.bid.findMany({
      where: { projectId: p.id }, orderBy: { amountCents: 'asc' },
      include: { provider: { include: { providerProfile: true } } },
    });
    res.json({ bids: bids.map(serializeBid) });
  });

  return r;
}

export function serializeBid(b: any) {
  return {
    id: b.id, projectId: b.projectId, amountCents: b.amountCents, amount: b.amountCents / 100,
    message: b.message ?? null, estimatedDurationDays: b.estimatedDurationDays ?? null,
    siteVisitRequested: !!b.siteVisitRequested,
    status: b.status, createdAt: b.createdAt,
    provider: b.provider ? {
      id: b.provider.id, name: b.provider.name,
      businessName: b.provider.providerProfile?.businessName ?? null,
      ratingAvg: b.provider.providerProfile?.ratingAvg ?? 0,
      ratingCount: b.provider.providerProfile?.ratingCount ?? 0,
      verified: b.provider.providerProfile?.verified ?? false,
    } : undefined,
  };
}
