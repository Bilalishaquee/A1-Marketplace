// Quote lifecycle API (TDD §7.1, §7.2). REST + SSE. Async estimate contract:
// POST /estimate returns 202 + job handle; the client subscribes to /events for
// staged progress and GETs the full quote on `done`.

import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { Quote, ServiceCategoryKey, ServiceType } from '../types.ts';
import { config } from '../config.ts';
import { toQuoteImage } from '../pipeline/imagePipeline.ts';
import { runScopeAnalysis } from '../pipeline/orchestrator.ts';
import { generateRendering } from '../pipeline/render.ts';
import { estimationQueue } from '../queue.ts';
import { quoteEvents } from '../sse.ts';
import { getModelAdapter } from '../ai/index.ts';
import type { EventRepo, OutcomeRepo, QuoteRepo } from '../store/repo.ts';
import { createImageUploadTarget } from '../storage/supabaseStorage.ts';

const SERVICE_TYPES = [
  'kitchen_remodel', 'bathroom_renovation', 'flooring_installation',
  'basement_finishing', 'painting_drywall', 'roof_replacement', 'general_renovation',
] as const;

const createSchema = z.object({
  // Legacy itemized flow used serviceType; the marketplace flow uses categoryKey
  // (optional — the AI classifies when omitted) + device location (no ZIP question).
  serviceType: z.enum(SERVICE_TYPES).optional(),
  categoryKey: z.string().optional(),
  regionZip: z.string().regex(/^\d{5}$/).optional(),
  description: z.string().max(4000).default(''),
  budgetCents: z.number().int().positive().nullable().default(null),
  imageCount: z.number().int().min(0).max(config.maxImagesPerQuote).default(0),
  // Lenient: the browser/device geocoder may return null or non-US postal
  // formats. Pricing (regionIndex) handles any ZIP safely, so accept them all.
  location: z.object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
    zip: z.string().max(12).nullable().optional(),
    city: z.string().max(120).nullable().optional(),
    region: z.string().max(160).nullable().optional(),
  }).nullable().optional(),
});

const confirmSchema = z.object({
  images: z.array(z.object({
    s3Key: z.string(),
    byteSize: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    blurScore: z.number().optional(),
    brightness: z.number().optional(),
  })).min(1).max(config.maxImagesPerQuote),
});

const qaSchema = z.object({ message: z.string().min(1).max(2000) });
const decisionSchema = z.object({
  decision: z.enum(['approve', 'decline', 'request_edit']),
  reason: z.string().max(1000).optional(),
});
const editSchema = z.object({
  costCents: z.number().int().nonnegative().optional(),
  hrs: z.number().nonnegative().nullable().optional(),
  quantity: z.number().nonnegative().optional(),
});
const outcomeSchema = z.object({
  finalTotalCents: z.number().int().nonnegative(),
  notes: z.string().max(1000).optional(),
});
const renderSchema = z.object({
  style: z.enum(['modern', 'classic', 'minimalist', 'luxury']).default('modern'),
  sourceImageId: z.string().optional(),
});

export interface QuoteRouterDeps {
  quotes: QuoteRepo;
  events: EventRepo;
  outcomes: OutcomeRepo;
}

// Convert internal (cents) quote to a client-friendly shape, including the
// dollar-denominated lineItems the existing web-app QuoteResult.jsx expects.
function toClient(q: Quote) {
  const est = q.estimate;
  return {
    id: q.id,
    serviceType: q.serviceType,
    regionZip: q.regionZip,
    status: q.status,
    description: q.description,
    images: q.images.map(i => ({ id: i.id, status: i.status, quality: i.quality })),
    createdAt: q.createdAt,
    estimate: est && {
      lineItems: est.lineItems.map(li => ({
        category: li.category, item: li.item, cost: li.costCents / 100,
        hrs: li.hrs, quantity: li.quantity, unit: li.unit,
        source: li.source, templateTaskId: li.templateTaskId,
      })),
      subtotal: est.subtotalCents / 100,
      contingency: est.contingencyCents / 100,
      overhead: est.overheadCents / 100,
      total: est.totalCents / 100,
      totalLow: est.totalLowCents / 100,
      totalHigh: est.totalHighCents / 100,
      confidence: est.confidence,
      rationale: est.rationale,
      framing: est.framing,
      validityDays: est.validityDays,
      pricingVersionId: est.pricingVersionId,
      modelVersion: est.modelVersion,
      measurements: est.measurements,
    },
    analyses: q.analyses.map(a => ({
      roomType: a.roomType, notes: a.notes, surfaces: a.surfaces,
      damage: a.damage, followUpQuestions: a.followUpQuestions, modelId: a.modelId,
    })),
    renderings: (q.renderings ?? []).map(toClientRendering),

    // ─── Marketplace flow ───────────────────────────────────────────────────
    categoryKey: q.categoryKey,
    location: q.location,
    postedAt: q.postedAt ?? null,
    scopeEstimate: q.scopeEstimate && toClientScope(q.scopeEstimate),
  };
}

// Scope estimate → client shape (dollars instead of cents).
function toClientScope(s: NonNullable<Quote['scopeEstimate']>) {
  return {
    categoryKey: s.categoryKey,
    categoryLabel: s.categoryLabel,
    matchedItems: s.matchedItems,
    scopeOfWork: s.scopeOfWork,
    materialQuality: s.materialQuality,
    priceLow: s.priceLowCents / 100,
    priceMed: s.priceMedCents / 100,
    priceHigh: s.priceHighCents / 100,
    estimatedDuration: s.estimatedDuration,
    permitsRequired: s.permitsRequired,
    materialEstimates: s.materialEstimates,
    urgency: s.urgency,
    urgencyScore: s.urgencyScore,
    suggestedTrades: s.suggestedTrades,
    confidence: s.confidence,
    rationale: s.rationale,
    framing: s.framing,
    pricingBasis: s.pricingBasis,
    modelId: s.modelId,
  };
}

// Strip server-only fields (prompt) from the client view; keep what the UI shows.
function toClientRendering(r: Quote['renderings'][number]) {
  return {
    id: r.id, style: r.style, imageDataUrl: r.imageDataUrl,
    status: r.status, error: r.error ?? null, createdAt: r.createdAt,
  };
}

const err = (res: Response, code: number, message: string, details?: unknown) =>
  res.status(code).json({ error: { code: String(code), message, details } });

export function quoteRouter(deps: QuoteRouterDeps): Router {
  const r = Router();
  const orchDeps = { quotes: deps.quotes, events: deps.events };

  // Create draft + issue signed upload URLs (TDD §7.1). Images go direct to
  // Supabase Storage when configured, with a local mock endpoint as fallback.
  r.post('/', async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const body = parsed.data;
    const now = new Date().toISOString();
    const id = randomUUID();
    const location = body.location ? {
      lat: body.location.lat ?? null, lng: body.location.lng ?? null,
      zip: body.location.zip ?? null, city: body.location.city ?? null, region: body.location.region ?? null,
    } : null;
    const quote: Quote = {
      id, clientId: null,
      serviceType: (body.serviceType ?? 'general_renovation') as ServiceType,
      regionZip: body.regionZip ?? location?.zip ?? config.defaultRegion,
      description: body.description,
      budgetCents: body.budgetCents, status: 'draft', images: [], analyses: [],
      estimate: null, renderings: [],
      categoryKey: (body.categoryKey as ServiceCategoryKey) ?? null,
      location, scopeEstimate: null, postedAt: null,
      createdAt: now, updatedAt: now,
    };
    await deps.quotes.create(quote);
    await deps.events.append({ quoteId: id, actor: 'client', eventType: 'quote_created', payload: { categoryKey: quote.categoryKey } });

    const uploads = await Promise.all(Array.from({ length: body.imageCount }, () => {
      const key = `quotes/${id}/${randomUUID()}.jpg`;
      return createImageUploadTarget(key, `${baseUrl(req)}/v1/mock-upload/${encodeURIComponent(key)}`);
    }));
    res.status(201).json({ quoteId: id, uploads });
  });

  // Register uploaded objects + run the quality gate (TDD §3.1.2).
  r.post('/:id/images/confirm', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const images = parsed.data.images.map(toQuoteImage);
    const updated = await deps.quotes.update(quote.id, { images });
    const rejected = images.filter(i => i.status === 'rejected');
    res.json({
      images: updated.images.map(i => ({ id: i.id, status: i.status, quality: i.quality })),
      rejectedCount: rejected.length,
    });
  });

  // Enqueue AI scope analysis — async (TDD §1.3, §7.3). Returns 202 + job handle.
  // Marketplace flow: needs a description OR at least one usable photo.
  r.post('/:id/estimate', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    const hasImage = quote.images.some(i => i.status === 'usable');
    if (!hasImage && !quote.description.trim())
      return err(res, 422, 'add a description or at least one usable photo first');
    quoteEvents.publish(quote.id, { stage: 'queued', pct: 5, message: 'Queued for analysis…' });
    estimationQueue.enqueue(() => runScopeAnalysis(quote.id, orchDeps));
    res.status(202).json({ quoteId: quote.id, jobId: quote.id, statusUrl: `/v1/quotes/${quote.id}/events` });
  });

  // Post the project to the marketplace (foundation for Phase B: provider bids).
  r.post('/:id/post', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    if (!quote.scopeEstimate) return err(res, 422, 'estimate not ready — analyze the project first');
    const updated = await deps.quotes.update(quote.id, { status: 'posted', postedAt: new Date().toISOString() });
    await deps.events.append({ quoteId: quote.id, actor: 'client', eventType: 'project_posted', payload: { categoryKey: quote.categoryKey } });
    res.status(201).json({ status: updated.status, postedAt: updated.postedAt });
  });

  // SSE progress stream (TDD §7.3). Replays buffered events for late joiners.
  r.get('/:id/events', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const send = (ev: unknown) => res.write(`data: ${JSON.stringify(ev)}\n\n`);
    const unsub = quoteEvents.subscribe(quote.id, (ev) => {
      send(ev);
      if (ev.stage === 'done' || ev.stage === 'failed') { unsub(); res.end(); }
    });
    req.on('close', unsub);
  });

  r.get('/:id', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    res.json(toClient(quote));
  });

  // Grounded LLM follow-up Q&A (TDD §7.2). Cannot change pricing.
  r.post('/:id/qa', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    const parsed = qaSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const client = toClient(quote);
    const answer = await getModelAdapter().chat(
      [{ role: 'user', content: parsed.data.message }],
      JSON.stringify(client.scopeEstimate ?? client.estimate ?? { note: 'no estimate yet' }),
    );
    await deps.events.append({ quoteId: quote.id, actor: 'client', eventType: 'qa', payload: { q: parsed.data.message } });
    res.json({ answer });
  });

  // "After renovation" visualization (Nano Banana / Gemini 2.5 Flash Image).
  // POST again to regenerate or switch style; every rendering is appended so the
  // client can flip between variants. Returns the new rendering + full list.
  r.post('/:id/renderings', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    if (quote.images.filter(i => i.status === 'usable').length === 0)
      return err(res, 422, 'no usable images to render from');
    const parsed = renderSchema.safeParse(req.body ?? {});
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());

    const rendering = await generateRendering(quote, parsed.data);
    const renderings = [...(quote.renderings ?? []), rendering];
    const updated = await deps.quotes.update(quote.id, { renderings });
    await deps.events.append({
      quoteId: quote.id, actor: 'client', eventType: 'rendering_generated',
      payload: { style: rendering.style, status: rendering.status },
    });
    // A failed render is still a 201 (the record exists) — the client inspects
    // `rendering.status` and offers a retry rather than crashing.
    res.status(201).json({
      rendering: toClientRendering(rendering),
      renderings: updated.renderings.map(toClientRendering),
    });
  });

  // PM line-item edit — captured as training signal (TDD §5.5, §9.2).
  r.patch('/:id/line-items/:index', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote?.estimate) return err(res, 404, 'quote or estimate not found');
    const idx = Number(req.params.index);
    const item = quote.estimate.lineItems[idx];
    if (!item) return err(res, 404, 'line item not found');
    const parsed = editSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const before = { ...item };
    const items = [...quote.estimate.lineItems];
    items[idx] = {
      ...item,
      costCents: parsed.data.costCents ?? item.costCents,
      hrs: parsed.data.hrs ?? item.hrs,
      quantity: parsed.data.quantity ?? item.quantity,
      source: 'edited',
    };
    const subtotal = items.reduce((a, li) => a + li.costCents, 0);
    const updated = await deps.quotes.update(quote.id, {
      estimate: { ...quote.estimate, lineItems: items, subtotalCents: subtotal },
    });
    await deps.events.append({ quoteId: quote.id, actor: 'pm', eventType: 'line_item_edit', payload: { idx, before, after: items[idx] } });
    res.json(toClient(updated).estimate);
  });

  // Approve / decline / request edit (Phase 3 workflow hook, TDD §7.2).
  r.post('/:id/decision', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    const status = parsed.data.decision === 'approve' ? 'approved'
      : parsed.data.decision === 'decline' ? 'declined' : 'in_review';
    const updated = await deps.quotes.update(quote.id, { status });
    await deps.events.append({ quoteId: quote.id, actor: 'client', eventType: 'decision', payload: parsed.data });
    res.json({ status: updated.status });
  });

  // Record real job actuals → self-learning ground truth (TDD §9.4).
  r.post('/:id/outcome', async (req, res) => {
    const quote = await deps.quotes.get(req.params.id);
    if (!quote) return err(res, 404, 'quote not found');
    const parsed = outcomeSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 400, 'invalid request', parsed.error.flatten());
    await deps.outcomes.recordOutcome({ quoteId: quote.id, finalTotalCents: parsed.data.finalTotalCents, notes: parsed.data.notes });
    await deps.events.append({ quoteId: quote.id, actor: 'pm', eventType: 'outcome_recorded', payload: parsed.data });
    res.status(201).json({ ok: true });
  });

  return r;
}

function baseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}
