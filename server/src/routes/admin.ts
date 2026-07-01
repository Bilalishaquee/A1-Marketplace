// Admin / pricing + self-learning surface (TDD §7.4, §8.4, §9). Read-only here;
// CRUD + version promotion is gated behind Phase 6 RBAC. The calibration
// endpoint is the SKELETON of the self-learning loop (TDD §9.4): it compares
// recorded job outcomes against the quoted estimate and reports the bias the
// offline calibration job would correct — it does NOT auto-apply anything.

import { Router } from 'express';
import {
  LABOR_RATES_CENTS, MATERIALS, PRICING_VERSION_ID, SOURCES, regionIndex,
} from '../data/pricing.ts';
import { SERVICE_TEMPLATES } from '../data/serviceTemplates.ts';
import type { OutcomeRepo, QuoteRepo } from '../store/repo.ts';

export interface AdminRouterDeps { quotes: QuoteRepo; outcomes: OutcomeRepo; }

export function adminRouter(deps: AdminRouterDeps): Router {
  const r = Router();

  r.get('/pricing', (_req, res) => {
    res.json({
      pricingVersionId: PRICING_VERSION_ID,
      laborRatesCents: LABOR_RATES_CENTS,
      materials: MATERIALS,
      sources: SOURCES,
      note: 'Market-calibrated from 2025–26 US cost data (see sources). Reconcile ' +
        'with A-1 supplier/labor invoices for binding quotes (TDD §0.1 A9).',
    });
  });

  r.get('/pricing/region/:zip', (req, res) => {
    const idx = regionIndex(req.params.zip);
    res.json({ zip: req.params.zip, laborIndex: idx.labor, materialIndex: idx.material,
      note: 'Labor and materials are adjusted separately (RSMeans methodology).' });
  });

  r.get('/service-templates', (_req, res) => {
    res.json(Object.values(SERVICE_TEMPLATES).map(t => ({
      serviceType: t.serviceType, version: t.version,
      tasks: t.tasks.map(task => ({ id: task.id, name: task.name, trade: task.trade })),
    })));
  });

  // Self-learning calibration PREVIEW (TDD §9.1–§9.3). Eval-gated, human-
  // approved, bounded — none of which auto-runs here. Surfaces estimate-vs-actual
  // bias so a human can see what calibration would propose.
  r.get('/calibration/preview', async (_req, res) => {
    const outcomes = await deps.outcomes.all();
    const rows = [];
    for (const o of outcomes) {
      const q = await deps.quotes.get(o.quoteId);
      const estimated = q?.estimate?.totalCents;
      if (estimated == null || estimated === 0) continue;
      const errorPct = (o.finalTotalCents - estimated) / estimated;
      rows.push({
        quoteId: o.quoteId, serviceType: q!.serviceType,
        estimatedCents: estimated, actualCents: o.finalTotalCents,
        errorPct: Number(errorPct.toFixed(4)),
      });
    }
    const n = rows.length;
    const meanError = n ? rows.reduce((a, x) => a + x.errorPct, 0) / n : 0;
    const mape = n ? rows.reduce((a, x) => a + Math.abs(x.errorPct), 0) / n : 0;
    // Bounded correction (±25%) per TDD §9.3 — proposed only, never applied here.
    const proposedMultiplier = clamp(1 + meanError, 0.75, 1.25);
    res.json({
      sampleSize: n,
      costMAPE: Number(mape.toFixed(4)),
      meanSignedErrorPct: Number(meanError.toFixed(4)),
      proposedGlobalMultiplier: Number(proposedMultiplier.toFixed(4)),
      status: n < 30 ? 'insufficient_data' : 'ready_for_human_review',
      note: 'Preview only. Calibration is eval-gated, bounded, and human-approved (TDD §9.3).',
      rows,
    });
  });

  return r;
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
