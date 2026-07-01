import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScopeEstimate } from '../src/engines/scopeEngine.ts';
import type { RawScopeAnalysis } from '../src/ai/adapter.ts';

function raw(overrides: Partial<RawScopeAnalysis> = {}): RawScopeAnalysis {
  return {
    categoryKey: 'bathroom_remodeling',
    matchedItems: ['Full bathroom remodel'],
    scopeOfWork: [{ title: 'Replace vanity and tile' }],
    materialQuality: 'mid',
    approxSizeSqft: 60,
    conditionSeverity: 'med',
    accessibility: 'moderate',
    emergency: false,
    permitsRequired: ['Plumbing permit'],
    materialEstimates: [],
    urgencyScore: 25,
    priceLowCents: 40_000_00,
    priceMedCents: 75_000_00,
    priceHighCents: 130_000_00,
    estimatedDuration: { minDays: 10, maxDays: 20 },
    assumptions: ['same layout'],
    confidence: 0.76,
    notes: '',
    modelId: 'test',
    promptVersion: 'test',
    schemaVersion: 'test',
    latencyMs: 1,
    ...overrides,
  };
}

test('inflated model bathroom totals are anchored to public-market ranges', () => {
  const estimate = computeScopeEstimate(raw(), { zip: '77002', lat: null, lng: null, city: null, region: null });
  assert.ok(estimate.priceHighCents < 45_000_00, `expected high below inflated model output, got ${estimate.priceHighCents}`);
  assert.ok(estimate.priceMedCents < 30_000_00, `expected med market anchored, got ${estimate.priceMedCents}`);
  assert.ok(estimate.rationale.some(line => line.includes('Assumed mid-grade')));
});

test('measured area scales market estimate without runaway pricing', () => {
  const small = computeScopeEstimate(raw({ approxSizeSqft: 120 }), null, { areaSqft: 40, method: 'manual' });
  const large = computeScopeEstimate(raw({ approxSizeSqft: 120 }), null, { areaSqft: 100, method: 'manual' });
  assert.ok(large.priceMedCents > small.priceMedCents);
  assert.ok(large.confidence >= 0.88);
});
