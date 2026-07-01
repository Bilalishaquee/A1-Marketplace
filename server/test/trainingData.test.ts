import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScopeTrainingJsonl,
  buildScopeTrainingRecord,
  trainingExampleQualificationWhere,
  type ScopeTrainingExample,
} from '../src/ai/trainingData.ts';

function example(overrides: Partial<ScopeTrainingExample> = {}): ScopeTrainingExample {
  return {
    id: 'train-1',
    categoryKey: 'kitchen_remodeling',
    description: 'Full 180 sq ft kitchen remodel with quartz counters and mid-grade cabinets.',
    zip: '90001',
    actualLowCents: 3200000,
    actualMedCents: 4100000,
    actualHighCents: 5400000,
    durationDays: 21,
    materialQuality: 'mid',
    notes: 'Verified completed project.',
    permitsRequired: ['electrical'],
    scopeOfWork: [
      { title: 'Demolish existing finishes', detail: 'Remove cabinets, counters, flooring, and backsplash.' },
      'Install mid-grade cabinets',
    ],
    qualityScore: 0.92,
    ...overrides,
  };
}

test('training JSONL uses complete approved pricing fields and assistant schema shape', () => {
  const jsonl = buildScopeTrainingJsonl([example()], 'scope prompt');
  const record = JSON.parse(jsonl);
  assert.equal(record.messages[0].role, 'system');
  assert.equal(record.messages[1].role, 'user');
  assert.equal(record.messages[2].role, 'assistant');

  const assistant = JSON.parse(record.messages[2].content);
  assert.equal(assistant.priceLowUsd, 32000);
  assert.equal(assistant.priceMedUsd, 41000);
  assert.equal(assistant.priceHighUsd, 54000);
  assert.equal(assistant.materialQuality, 'mid');
  assert.equal(assistant.durationMinDays, 17);
  assert.equal(assistant.durationMaxDays, 21);
  assert.deepEqual(assistant.permitsRequired, ['electrical']);
  assert.equal(assistant.scopeOfWork.length, 2);
  assert.ok(assistant.confidence >= 0.65 && assistant.confidence <= 0.98);
});

test('training JSONL rejects incomplete or inverted price ranges', () => {
  assert.throws(
    () => buildScopeTrainingRecord(example({ actualMedCents: null })),
    /low, medium, and high actual price/,
  );
  assert.throws(
    () => buildScopeTrainingRecord(example({ actualLowCents: 5000000, actualMedCents: 4100000 })),
    /low <= medium <= high/,
  );
});

test('fine-tuning qualification filter excludes incomplete approved examples', () => {
  assert.deepEqual(trainingExampleQualificationWhere(['kitchen_remodeling'], 0.8), {
    status: 'APPROVED',
    actualLowCents: { not: null },
    actualMedCents: { not: null },
    actualHighCents: { not: null },
    categoryKey: { in: ['kitchen_remodeling'] },
    qualityScore: { gte: 0.8 },
  });
});
