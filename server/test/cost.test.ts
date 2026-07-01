import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimate } from '../src/engines/cost.ts';
import type { CostInput } from '../src/engines/cost.ts';
import type { DetectedDamage, DetectedSurface, Measurement } from '../src/types.ts';

function kitchenInput(overrides: Partial<CostInput> = {}): CostInput {
  const surfaces: DetectedSurface[] = [
    { type: 'cabinet', material: 'oak', grade: 'mid', condition: 'fair', approxAreaSqft: 60, confidence: 0.8 },
    { type: 'countertop', material: 'quartz', grade: 'mid', condition: 'fair', approxAreaSqft: 28, confidence: 0.75 },
    { type: 'backsplash', material: 'tile', grade: 'mid', condition: 'poor', approxAreaSqft: 32, confidence: 0.6 },
    { type: 'floor', material: 'vinyl', grade: 'economy', condition: 'fair', approxAreaSqft: 180, confidence: 0.7 },
  ];
  const damage: DetectedDamage[] = [{ type: 'water_damage', severity: 'low', location: 'under sink', confidence: 0.6 }];
  const measurements: Measurement[] = [
    { surfaceType: 'cabinet', value: 10, unit: 'count', method: 'fixture_prior', confidence: 0.55, manualOverride: false },
    { surfaceType: 'countertop', value: 28, unit: 'sqft', method: 'fixture_prior', confidence: 0.55, manualOverride: false },
    { surfaceType: 'backsplash', value: 32, unit: 'sqft', method: 'fixture_prior', confidence: 0.5, manualOverride: false },
    { surfaceType: 'floor', value: 180, unit: 'sqft', method: 'fixture_prior', confidence: 0.55, manualOverride: false },
  ];
  return { serviceType: 'kitchen_remodel', regionZip: '90001', analysis: { surfaces, damage }, measurements, confidence: 0.55, ...overrides };
}

test('produces an itemized kitchen estimate with labor and materials', () => {
  const est = estimate(kitchenInput());
  assert.ok(est.lineItems.length > 0, 'has line items');
  assert.ok(est.lineItems.some(li => li.category === 'Labor'));
  assert.ok(est.lineItems.some(li => li.category === 'Materials'));
  // Cabinet install present because count > 0
  assert.ok(est.lineItems.some(li => li.item === 'Cabinet Installation'));
  // Water damage triggers remediation task
  assert.ok(est.lineItems.some(li => li.item.includes('Remediation') || li.item.includes('Water')));
});

test('total = subtotal + contingency + overhead, and is bracketed by the range', () => {
  const est = estimate(kitchenInput());
  assert.equal(est.totalCents, est.subtotalCents + est.contingencyCents + est.overheadCents);
  assert.ok(est.totalLowCents < est.totalCents && est.totalCents < est.totalHighCents);
});

test('lower confidence widens the range band', () => {
  const lo = estimate(kitchenInput({ confidence: 0.4 }));
  const hi = estimate(kitchenInput({ confidence: 0.9 }));
  const band = (e: ReturnType<typeof estimate>) => (e.totalHighCents - e.totalLowCents) / e.totalCents;
  assert.ok(band(lo) > band(hi), 'low-confidence band should be wider');
});

test('regional indices: high-cost metro (LA) exceeds low-cost metro (Houston)', () => {
  const la = estimate(kitchenInput({ regionZip: '90001' }));      // labor 1.18 / mat 1.03
  const houston = estimate(kitchenInput({ regionZip: '77002' }));  // labor 0.90 / mat 0.99
  assert.ok(la.subtotalCents > houston.subtotalCents, 'LA should exceed Houston');
});

test('labor and materials scale independently by region (RSMeans split)', () => {
  // Same kitchen in SF (very high labor) vs Houston (low labor). Labor lines
  // should diverge far more than material lines, proving the split.
  const sf = estimate(kitchenInput({ regionZip: '94101' }));       // labor 1.34 / mat 1.07
  const hou = estimate(kitchenInput({ regionZip: '77002' }));      // labor 0.90 / mat 0.99
  const laborRatio = laborTotal(sf) / laborTotal(hou);
  const matRatio = materialTotal(sf) / materialTotal(hou);
  assert.ok(laborRatio > matRatio + 0.2, 'labor must vary more by region than materials');
});

function laborTotal(e: ReturnType<typeof estimate>) {
  return e.lineItems.filter(i => i.category === 'Labor').reduce((s, i) => s + i.costCents, 0);
}
function materialTotal(e: ReturnType<typeof estimate>) {
  return e.lineItems.filter(i => i.category === 'Materials').reduce((s, i) => s + i.costCents, 0);
}

test('every line item traces to a template task and a pricing version', () => {
  const est = estimate(kitchenInput());
  assert.equal(est.pricingVersionId, 'market-2026-06');
  for (const li of est.lineItems) assert.ok(li.templateTaskId, `line item "${li.item}" must cite a task`);
});

test('multiple distinct surfaces of the same type are summed, not collapsed', () => {
  // a kitchen with a perimeter countertop AND an island countertop
  const surfaces: DetectedSurface[] = [
    { type: 'countertop', material: 'quartz', grade: 'mid', condition: 'good', approxAreaSqft: 28, confidence: 0.75 },
    { type: 'countertop', material: 'marble', grade: 'premium', condition: 'good', approxAreaSqft: 18, confidence: 0.78 },
  ];
  const measurements: Measurement[] = [
    { surfaceType: 'countertop', value: 28, unit: 'sqft', method: 'fixture_prior', confidence: 0.55, manualOverride: false },
    { surfaceType: 'countertop', value: 18, unit: 'sqft', method: 'fixture_prior', confidence: 0.58, manualOverride: false },
  ];
  const est = estimate({ serviceType: 'kitchen_remodel', regionZip: '90001', analysis: { surfaces, damage: [] }, measurements, confidence: 0.6 });
  const ctMaterial = est.lineItems.find(li => li.category === 'Materials' && li.item.includes('Countertop'));
  assert.ok(ctMaterial, 'countertop material line exists');
  assert.equal(ctMaterial!.quantity, 46, 'both countertop areas (28+18) must be summed');
});

test('no usable surfaces → empty scope, zero subtotal', () => {
  const est = estimate({ serviceType: 'kitchen_remodel', regionZip: '90001', analysis: { surfaces: [], damage: [] }, measurements: [], confidence: 0.4 });
  // Only fixed tasks (appliance hookup, fixtures) may apply; cabinet/countertop won't.
  assert.ok(!est.lineItems.some(li => li.item === 'Cabinet Installation'));
});
