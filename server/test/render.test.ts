import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRenderInput, generateRendering } from '../src/pipeline/render.ts';
import type { Quote } from '../src/types.ts';

function estimatedQuote(): Quote {
  const now = new Date().toISOString();
  return {
    id: 'q-render-1', clientId: null, serviceType: 'kitchen_remodel', regionZip: '90001',
    description: '', budgetCents: null, status: 'estimated',
    images: [{ id: 'img1', s3KeyOriginal: 'k1.jpg', s3KeyNormalized: null, contentHash: null,
      quality: { usable: true, issues: [] }, status: 'usable' }],
    analyses: [{
      roomType: 'kitchen', imageQuality: { usable: true, issues: [] }, surfaces: [], damage: [],
      scaleCues: { detectedFixtures: [], referenceObject: null }, notes: 'oak cabinets, dated',
      followUpQuestions: [], modelId: 'mock-v1', promptVersion: 'mock-v1',
      schemaVersion: 'x', latencyMs: 1,
    }],
    estimate: {
      serviceType: 'kitchen_remodel', regionZip: '90001',
      lineItems: [
        { category: 'Materials', item: 'Quartz Countertops (mid)', costCents: 100, hrs: null,
          quantity: 28, unit: 'sqft', unitCostCents: 1, laborRateCents: null, source: 'auto', templateTaskId: null },
        { category: 'Labor', item: 'Cabinet Installation', costCents: 200, hrs: 16,
          quantity: 16, unit: 'hr', unitCostCents: 1, laborRateCents: 1, source: 'auto', templateTaskId: null },
      ],
      subtotalCents: 300, contingencyCents: 0, overheadCents: 0, totalCents: 300,
      totalLowCents: 280, totalHighCents: 320, confidence: 0.7, rationale: [], framing: '',
      pricingVersionId: 'x', modelVersion: 'rules-engine-v1', schemaVersion: 'x',
      validityDays: 14, measurements: [],
    },
    renderings: [],
    categoryKey: null, location: null, scopeEstimate: null, postedAt: null,
    createdAt: now, updatedAt: now,
  };
}

test('buildRenderInput grounds the prompt in room type + quoted materials', async () => {
  const input = await buildRenderInput(estimatedQuote(), { style: 'modern' });
  assert.equal(input.roomType, 'kitchen');
  assert.equal(input.style, 'modern');
  // only Materials line items, with the "(grade)" suffix stripped
  assert.deepEqual(input.materials, ['Quartz Countertops']);
});

test('generateRendering (mock provider) returns a ready, displayable image', async () => {
  const r = await generateRendering(estimatedQuote(), { style: 'luxury' });
  assert.equal(r.status, 'ready');
  assert.equal(r.style, 'luxury');
  assert.ok(r.imageDataUrl?.startsWith('data:image/'), 'displayable data URL');
  assert.ok(r.prompt.length > 0, 'audit prompt recorded');
});

test('different styles produce different mock renderings', async () => {
  const a = await generateRendering(estimatedQuote(), { style: 'modern' });
  const b = await generateRendering(estimatedQuote(), { style: 'classic' });
  assert.notEqual(a.imageDataUrl, b.imageDataUrl);
});
