import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runEstimation } from '../src/pipeline/orchestrator.ts';
import { MemoryEventRepo, MemoryQuoteRepo } from '../src/store/memoryRepo.ts';
import type { Quote } from '../src/types.ts';

function draftQuote(): Quote {
  const now = new Date().toISOString();
  return {
    id: 'q-test-1', clientId: null, serviceType: 'kitchen_remodel', regionZip: '90001',
    description: '', budgetCents: null, status: 'draft',
    images: [{ id: 'img1', s3KeyOriginal: 'k1.jpg', s3KeyNormalized: null, contentHash: null,
      quality: { usable: true, issues: [] }, status: 'usable' }],
    analyses: [], estimate: null, renderings: [],
    categoryKey: null, location: null, scopeEstimate: null, postedAt: null,
    createdAt: now, updatedAt: now,
  };
}

test('end-to-end: draft → vision → measurement → cost yields an estimate', async () => {
  const quotes = new MemoryQuoteRepo();
  const events = new MemoryEventRepo();
  await quotes.create(draftQuote());

  await runEstimation('q-test-1', { quotes, events });

  const q = await quotes.get('q-test-1');
  assert.equal(q?.status, 'estimated');
  assert.ok(q?.estimate, 'estimate produced');
  assert.ok(q!.estimate!.totalCents > 0);
  assert.ok(q!.analyses.length === 1, 'analysis persisted');
  const stages = (await events.byQuote('q-test-1')).map(e => e.eventType);
  assert.ok(stages.includes('stage:done'), `expected done stage, got ${stages.join(',')}`);
});

test('all images rejected → failed status, no estimate', async () => {
  const quotes = new MemoryQuoteRepo();
  const events = new MemoryEventRepo();
  const q = draftQuote();
  q.images[0]!.status = 'rejected';
  q.id = 'q-test-2';
  await quotes.create(q);

  await runEstimation('q-test-2', { quotes, events });

  const after = await quotes.get('q-test-2');
  assert.equal(after?.status, 'failed');
  assert.equal(after?.estimate, null);
});
