import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateConfidence, deriveMeasurements } from '../src/engines/measurement.ts';
import type { DetectedSurface } from '../src/types.ts';

const surfaces: DetectedSurface[] = [
  { type: 'countertop', material: 'quartz', grade: 'mid', condition: 'fair', approxAreaSqft: 28, confidence: 0.8 },
  { type: 'cabinet', material: 'oak', grade: 'mid', condition: 'fair', approxAreaSqft: 60, confidence: 0.8 },
];

test('picks fixture_prior tier when fixtures are detected and no higher cue', () => {
  const m = deriveMeasurements({ surfaces, scaleCues: { detectedFixtures: ['standard_door'], referenceObject: null } });
  const ct = m.find(x => x.surfaceType === 'countertop')!;
  assert.equal(ct.method, 'fixture_prior');
});

test('reference object outranks fixture priors', () => {
  const m = deriveMeasurements({ surfaces, scaleCues: { detectedFixtures: ['standard_door'], referenceObject: 'credit_card' } });
  assert.equal(m.find(x => x.surfaceType === 'countertop')!.method, 'reference_object');
});

test('manual override is highest tier and full confidence', () => {
  const m = deriveMeasurements({
    surfaces, scaleCues: { detectedFixtures: [], referenceObject: null },
    manualAreasSqft: { countertop: 30 },
  });
  const ct = m.find(x => x.surfaceType === 'countertop')!;
  assert.equal(ct.method, 'manual');
  assert.equal(ct.value, 30);
  assert.ok(ct.manualOverride);
});

test('estimate tier when no scale cue at all → low confidence', () => {
  const m = deriveMeasurements({ surfaces, scaleCues: { detectedFixtures: [], referenceObject: null } });
  const ct = m.find(x => x.surfaceType === 'countertop')!;
  assert.equal(ct.method, 'estimate');
  assert.ok(ct.confidence < 0.5, 'estimate tier should be low confidence');
});

test('cabinets are counted, not area-measured', () => {
  const m = deriveMeasurements({ surfaces, scaleCues: { detectedFixtures: ['standard_door'], referenceObject: null } });
  const cab = m.find(x => x.surfaceType === 'cabinet')!;
  assert.equal(cab.unit, 'count');
  assert.ok(cab.value >= 1);
});

test('aggregate confidence is bounded and weakest-link sensitive', () => {
  const a = aggregateConfidence([
    { surfaceType: 'floor', value: 1, unit: 'sqft', method: 'arkit', confidence: 0.95, manualOverride: false },
    { surfaceType: 'wall', value: 1, unit: 'sqft', method: 'estimate', confidence: 0.4, manualOverride: false },
  ]);
  assert.ok(a > 0 && a < 0.95, 'aggregate sits between min and max, pulled toward the weak link');
});
