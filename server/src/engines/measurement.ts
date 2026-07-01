// Measurement Engine (TDD §4). Turns detected surfaces + scale cues into
// billable quantities, choosing the highest available measurement TIER and
// always reporting the method + a confidence that reflects scale certainty.
//
// Honest engineering position (TDD §0.1 A2): a single uncalibrated photo is
// scale-ambiguous. We never silently upgrade a low-confidence guess to a hard
// number — the tier and confidence travel with every value into the cost band.

import type {
  DetectedSurface, Measurement, MeasurementMethod, SurfaceType,
} from '../types.ts';

// Baseline confidence per tier (best → fallback), TDD §4.1.
const TIER_CONFIDENCE: Record<MeasurementMethod, number> = {
  arkit: 0.95,
  reference_object: 0.80,
  fixture_prior: 0.55,
  manual: 1.0,
  estimate: 0.40,
};

export interface MeasurementInputs {
  surfaces: DetectedSurface[];
  scaleCues: { detectedFixtures: string[]; referenceObject: string | null };
  // Higher tiers supplied by clients when available (iOS ARKit / user input).
  arkitAreasSqft?: Partial<Record<SurfaceType, number>>;
  manualAreasSqft?: Partial<Record<SurfaceType, number>>;
  manualCounts?: Partial<Record<SurfaceType, number>>;
}

function pickMethod(
  surface: SurfaceType,
  inputs: MeasurementInputs,
): MeasurementMethod {
  if (inputs.manualAreasSqft?.[surface] != null || inputs.manualCounts?.[surface] != null) return 'manual';
  if (inputs.arkitAreasSqft?.[surface] != null) return 'arkit';
  if (inputs.scaleCues.referenceObject) return 'reference_object';
  if (inputs.scaleCues.detectedFixtures.length > 0) return 'fixture_prior';
  return 'estimate';
}

// Surfaces that are counted (units), not measured by area.
const COUNTED: ReadonlySet<SurfaceType> = new Set<SurfaceType>(['cabinet']);

export function deriveMeasurements(inputs: MeasurementInputs): Measurement[] {
  const out: Measurement[] = [];

  for (const s of inputs.surfaces) {
    const method = pickMethod(s.type, inputs);
    // Measurement confidence blends scale certainty (tier) with how confident
    // the vision model was that this surface exists/was sized.
    const confidence = clamp01(TIER_CONFIDENCE[method] * lerp(0.7, 1, s.confidence));

    if (COUNTED.has(s.type)) {
      const value = inputs.manualCounts?.[s.type]
        ?? Math.max(1, Math.round((s.approxAreaSqft ?? 0) / 6) || estimateCabinetCount(s));
      out.push({
        surfaceType: s.type, value, unit: 'count', method,
        confidence, manualOverride: inputs.manualCounts?.[s.type] != null,
      });
      continue;
    }

    const area = inputs.manualAreasSqft?.[s.type]
      ?? inputs.arkitAreasSqft?.[s.type]
      ?? s.approxAreaSqft;
    if (area == null || area <= 0) continue;

    out.push({
      surfaceType: s.type, value: round1(area), unit: 'sqft', method,
      confidence, manualOverride: inputs.manualAreasSqft?.[s.type] != null,
    });
  }

  // NOTE: we deliberately keep ALL reported surfaces, including multiple
  // distinct instances of the same type (e.g. a perimeter countertop AND an
  // island countertop). The vision model already reconciles across the photos
  // in a single consolidated call (TDD §3.2), so areas of the same type are
  // SUMMED downstream by the cost engine (ctx.area), not collapsed here —
  // collapsing would silently under-count multi-run kitchens.
  return out;
}

function estimateCabinetCount(s: DetectedSurface): number {
  return s.condition === 'good' ? 8 : 10;
}

// Aggregate measurement confidence for the whole quote — the weakest links
// dominate, so we use the mean weighted toward the minimum.
export function aggregateConfidence(measurements: Measurement[]): number {
  if (measurements.length === 0) return 0.4;
  const min = Math.min(...measurements.map(m => m.confidence));
  const mean = measurements.reduce((a, m) => a + m.confidence, 0) / measurements.length;
  return clamp01(0.5 * min + 0.5 * mean);
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * clamp01(t); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
