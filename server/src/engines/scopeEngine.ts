// Scope & range engine (marketplace flow). Takes the model's RawScopeAnalysis
// and produces the final, client-facing ScopeEstimate — applying deterministic,
// explainable adjustments the LLM should NOT be trusted to do alone:
//   • regional pricing multiplier (from geolocation ZIP, RSMeans-style)
//   • emergency uplift
//   • sanity clamps to the per-category market band (guardrail vs. absurd output)
//   • urgency level derivation, suggested trades, framing
//
// Aligned to the PDF "Recommended AI outputs". Money in integer cents.

import type {
  MaterialQuality, ProjectLocation, ScopeEstimate, UrgencyLevel,
} from '../types.ts';
import { SCHEMA_VERSION } from '../types.ts';
import type { RawScopeAnalysis } from '../ai/adapter.ts';
import { categoryByKey } from '../data/taxonomy.ts';
import {
  ACCESS_FACTOR, CATEGORY_BASELINES, CONDITION_FACTOR, MATERIAL_QUALITY_FACTOR,
} from '../data/categoryPricing.ts';
import { regionIndex } from '../data/pricing.ts';

// Homeowner-provided measurement (raises the area from a photo guess to a known
// tier). `manual` = entered dimensions (ground truth); `reference_object` = a
// known-size object in frame (CV/vision-scaled).
export interface MeasurementOverride {
  areaSqft?: number | null;
  method: 'manual' | 'reference_object';
}

// Confidence floor each measurement tier guarantees once size is pinned down.
const MEASUREMENT_CONFIDENCE: Record<MeasurementOverride['method'], number> = {
  manual: 0.88,
  reference_object: 0.74,
};

export function computeScopeEstimate(
  raw: RawScopeAnalysis,
  location: ProjectLocation | null,
  measurement?: MeasurementOverride | null,
): ScopeEstimate {
  const category = categoryByKey(raw.categoryKey) ?? categoryByKey('handyman')!;
  const baseline = CATEGORY_BASELINES[category.key];

  // Regional multiplier from geolocation ZIP (falls back to 1.0 when unknown).
  const idx = regionIndex(location?.zip ?? '');
  const regional = 0.6 * idx.labor + 0.4 * idx.material;

  const urgencyScore = clamp(Math.round(raw.urgencyScore), 0, 100);
  const isEmergency = raw.emergency || urgencyScore >= 80;
  const emergencyFactor = isEmergency ? 1.10 : 1.0;
  const quality: MaterialQuality = raw.materialQuality ?? 'mid';
  const conditionFactor = CONDITION_FACTOR[raw.conditionSeverity ?? 'med'] ?? 1;
  const accessFactor = ACCESS_FACTOR[raw.accessibility ?? 'moderate'] ?? 1;
  const qualityFactor = MATERIAL_QUALITY_FACTOR[quality] ?? 1;

  // Measurement override: if the homeowner gave a real area, scale the model's
  // price by (known area ÷ the area the model assumed) so the price tracks the
  // TRUE size, not a photo guess. Clamped so a wild ratio can't run away.
  const llmArea = raw.approxSizeSqft && raw.approxSizeSqft > 0 ? raw.approxSizeSqft : null;
  const knownArea = measurement?.areaSqft && measurement.areaSqft > 0 ? measurement.areaSqft : null;
  const areaScale = knownArea && llmArea ? Math.max(0.4, Math.min(2.5, knownArea / llmArea)) : 1;
  const factor = regional * emergencyFactor * areaScale;

  const sizeBasis = knownArea ?? llmArea;
  const sizeScale = sizeBasis && baseline.typicalSizeSqft
    ? clampFloat(Math.pow(sizeBasis / baseline.typicalSizeSqft, baseline.sizeExponent ?? 0.8), 0.45, 2.4)
    : 1;
  const marketFactor = regional * emergencyFactor * qualityFactor * conditionFactor * accessFactor * sizeScale;
  const market = {
    low: Math.round(baseline.low * marketFactor),
    med: Math.round(baseline.med * marketFactor),
    high: Math.round(baseline.high * marketFactor),
  };
  const rawAdjusted = {
    low: Math.round(raw.priceLowCents * factor),
    med: Math.round(raw.priceMedCents * factor),
    high: Math.round(raw.priceHighCents * factor),
  };

  // Use the LLM for scope/category judgment, but anchor pricing to public-market
  // data so raw model totals cannot produce inflated homeowner estimates.
  let low = Math.round(0.78 * market.low + 0.22 * rawAdjusted.low);
  let med = Math.round(0.78 * market.med + 0.22 * rawAdjusted.med);
  let high = Math.round(0.78 * market.high + 0.22 * rawAdjusted.high);
  const guardLow = Math.max(100, Math.round(market.low * 0.72));
  const guardHigh = Math.max(guardLow, Math.round(market.high * 1.28));
  low = clamp(low, guardLow, guardHigh);
  med = clamp(med, guardLow, guardHigh);
  high = clamp(high, guardLow, guardHigh);
  // Enforce ordering low ≤ med ≤ high.
  const sorted = [low, med, high].sort((a, b) => a - b);
  low = sorted[0]!; med = sorted[1]!; high = sorted[2]!;
  if (low === high) { low = Math.round(med * 0.8); high = Math.round(med * 1.25); }

  const minDays = Math.max(1, Math.round(raw.estimatedDuration?.minDays || baseline.durMin));
  const maxDays = Math.max(minDays, Math.round(raw.estimatedDuration?.maxDays || baseline.durMax));

  const permits = raw.permitsRequired?.length ? raw.permitsRequired : baseline.permits;

  // Confidence = model self-assessment (incl. ensemble agreement) blended with
  // hard signal — but a real measurement pins down the biggest unknown (size),
  // so it raises confidence to that tier's floor (manual = ground truth).
  let confidence = computeConfidence(raw);
  if (measurement) confidence = Math.max(confidence, MEASUREMENT_CONFIDENCE[measurement.method]);
  const needsReview = confidence < CONFIDENCE_REVIEW_THRESHOLD;
  if (needsReview) {
    // Honest uncertainty: widen the presented range so we don't imply false precision.
    low = Math.round(low * lerp(0.85, 1, confidence / CONFIDENCE_REVIEW_THRESHOLD));
    high = Math.round(high * lerp(1.25, 1, confidence / CONFIDENCE_REVIEW_THRESHOLD));
  }

  const assumptions = dedupe([
    ...(knownArea ? [`Area provided by homeowner: ~${Math.round(knownArea)} sq ft (measured)`]
      : measurement?.method === 'reference_object' ? ['Scaled from a reference object in your photo'] : []),
    ...(raw.assumptions ?? []),
  ]).slice(0, 8);

  return {
    categoryKey: category.key,
    categoryLabel: category.label,
    matchedItems: dedupe(raw.matchedItems ?? []).slice(0, 12),
    scopeOfWork: (raw.scopeOfWork ?? []).slice(0, 12).map(t => ({ title: t.title, detail: t.detail })),
    materialQuality: quality,
    priceLowCents: low,
    priceMedCents: med,
    priceHighCents: high,
    estimatedDuration: { minDays, maxDays },
    permitsRequired: dedupe(permits),
    materialEstimates: (raw.materialEstimates ?? []).slice(0, 12),
    urgency: urgencyLevel(urgencyScore, raw.emergency),
    urgencyScore,
    suggestedTrades: category.trades,
    confidence,
    assumptions,
    needsReview,
    rationale: buildRationale(raw, category.label, quality, regional, isEmergency, confidence, sizeScale),
    framing: needsReview
      ? 'Preliminary AI range — we couldn’t pin down every detail from your photos/description, ' +
        'so this band is wide. Add a few more photos or details (or have a pro confirm on-site) for a tighter number.'
      : 'Preliminary AI estimate from your description and photos. It is a market range to help you ' +
        'post your project — the final price comes from the provider you choose.',
    pricingBasis:
      'Market-heuristic range adjusted for your area' +
      (isEmergency ? ' and emergency timing' : '') +
      '. Not a binding quote.',
    modelId: raw.modelId,
    promptVersion: raw.promptVersion,
    schemaVersion: raw.schemaVersion || SCHEMA_VERSION,
  };
}

const CONFIDENCE_REVIEW_THRESHOLD = 0.6;

function urgencyLevel(score: number, emergencyFlag: boolean): UrgencyLevel {
  if (emergencyFlag || score >= 80) return 'emergency';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

// Blend the model's self-confidence (incl. cross-sample agreement) with the
// amount of hard signal present. If the model gave no confidence, fall back to
// the signal heuristic alone.
function computeConfidence(raw: RawScopeAnalysis): number {
  let signal = 0.4;
  if (raw.matchedItems?.length) signal += 0.15;
  if (raw.scopeOfWork?.length >= 3) signal += 0.15;
  if (raw.approxSizeSqft != null) signal += 0.15;
  signal = clamp01(signal);
  const self = raw.confidence;
  const blended = self == null ? signal : 0.65 * self + 0.35 * signal;
  return clamp01(Number(blended.toFixed(2)));
}

function buildRationale(
  raw: RawScopeAnalysis, label: string, quality: MaterialQuality,
  regional: number, emergency: boolean, confidence: number, sizeScale: number,
): string[] {
  const out: string[] = [];
  out.push(`Classified as ${label}${raw.matchedItems?.length ? ` — ${raw.matchedItems.slice(0, 3).join(', ')}${raw.matchedItems.length > 3 ? '…' : ''}` : ''}.`);
  if (raw.approxSizeSqft) out.push(`Approximate size ~${Math.round(raw.approxSizeSqft)} sq ft (photo/description estimate).`);
  out.push(`Assumed ${quality}-grade materials and ${raw.conditionSeverity}-severity condition.`);
  if (Math.abs(sizeScale - 1) >= 0.08) out.push(`Scaled market pricing ${sizeScale >= 1 ? 'up' : 'down'} for project size.`);
  if (Math.abs(regional - 1) >= 0.03) out.push(`Adjusted ${regional >= 1 ? '+' : ''}${Math.round((regional - 1) * 100)}% for local labor/material costs.`);
  out.push(`Estimate confidence ${(confidence * 100).toFixed(0)}%${confidence < CONFIDENCE_REVIEW_THRESHOLD ? ' — add detail or confirm on-site to tighten it.' : '.'}`);
  if (emergency) out.push('Flagged as urgent/emergency — pricing reflects expedited work.');
  if (raw.notes) out.push(raw.notes);
  return out;
}

function dedupe(xs: string[]): string[] { return [...new Set(xs.filter(Boolean))]; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, Math.round(n))); }
function clampFloat(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * clamp01(t); }
