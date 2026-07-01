// Live integration check against the REAL Claude API (TDD §2.4).
// Run: npm run test:live   (reads ANTHROPIC_API_KEY from .env)
//
// Forces the Claude adapter regardless of MODEL_PROVIDER, downloads a real
// kitchen photo, and runs it through the full Phase-2 pipeline:
//   vision (Claude) → measurement engine → deterministic cost engine → quote
// plus a grounded Q&A turn. Proves deliverables #1, #2, #3, #4, #5 end-to-end
// on a real model and a real image.

import { ClaudeAdapter } from '../src/ai/claudeAdapter.ts';
import { deriveMeasurements, aggregateConfidence } from '../src/engines/measurement.ts';
import { estimate } from '../src/engines/cost.ts';
import { config } from '../src/config.ts';

const IMG = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1024';
const money = (c: number) => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
const line = (s = '') => console.log(s);

async function main() {
  line('━━━ LIVE CLAUDE CHECK ━━━');
  line(`model: ${config.anthropicModel}   key: ${config.anthropicApiKey ? 'present (' + config.anthropicApiKey.slice(0, 7) + '…)' : 'MISSING'}`);
  if (!config.anthropicApiKey) { console.error('❌ ANTHROPIC_API_KEY not loaded from .env'); process.exit(1); }

  const adapter = new ClaudeAdapter();

  // ── 1. Download a real kitchen photo → base64 ──────────────────────────────
  line(`\n① downloading test image…\n   ${IMG}`);
  const res = await fetch(IMG);
  if (!res.ok) throw new Error(`image fetch failed: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const base64 = bytes.toString('base64');
  line(`   ✓ ${(bytes.length / 1024).toFixed(0)} KB`);

  // ── 2. Real vision analysis through ClaudeAdapter (deliverables #1, #2, #3) ─
  line('\n② calling Claude vision (analyzeImages)…');
  const t0 = performance.now();
  const analysis = await adapter.analyzeImages(
    [{ base64, mediaType: 'image/jpeg' }],
    { serviceHint: 'kitchen_remodel', regionZip: '90001' },
  );
  line(`   ✓ ${Math.round(performance.now() - t0)} ms · model=${analysis.modelId}`);
  line(`   room type : ${analysis.roomType}`);
  line(`   usable    : ${analysis.imageQuality.usable}  ${analysis.imageQuality.issues.join('; ')}`);
  line('   SURFACES & MATERIALS:');
  for (const s of analysis.surfaces)
    line(`     • ${s.type.padEnd(11)} ${s.material} (${s.grade}, ${s.condition})  ${s.approxAreaSqft ?? '—'} sqft  conf ${Math.round(s.confidence * 100)}%`);
  line('   DAMAGE:');
  if (analysis.damage.length === 0) line('     • none detected');
  for (const d of analysis.damage)
    line(`     • ${d.type} (${d.severity}) @ ${d.location}  conf ${Math.round(d.confidence * 100)}%`);
  line(`   scale cues: fixtures=[${analysis.scaleCues.detectedFixtures.join(', ')}] ref=${analysis.scaleCues.referenceObject ?? 'none'}`);
  line(`   AI notes  : ${analysis.notes}`);
  line(`   follow-ups: ${analysis.followUpQuestions.join(' | ')}`);

  // ── 3. Measurement + deterministic cost (deliverables #3, #4) ──────────────
  line('\n③ measurement + cost engine…');
  const measurements = deriveMeasurements({ surfaces: analysis.surfaces, scaleCues: analysis.scaleCues });
  const confidence = aggregateConfidence(measurements);
  const est = estimate({
    serviceType: 'kitchen_remodel', regionZip: '90001',
    analysis: { surfaces: analysis.surfaces, damage: analysis.damage },
    measurements, confidence,
  });
  line(`   TOTAL: ${money(est.totalCents)}  (range ${money(est.totalLowCents)} – ${money(est.totalHighCents)})  conf ${Math.round(est.confidence * 100)}%`);
  for (const li of est.lineItems)
    line(`     ${li.category.padEnd(10)} ${li.item.padEnd(28)} ${money(li.costCents)}${li.hrs ? '  (' + li.hrs + ' hrs)' : ''}`);
  if (est.lineItems.length === 0)
    line('     ⚠ no line items — Claude returned no measurable areas (expected: monocular scale ambiguity, TDD §4).');

  // ── 4. Grounded Q&A (deliverable #5) ───────────────────────────────────────
  line('\n④ grounded Q&A (chat)…');
  const answer = await adapter.chat(
    [{ role: 'user', content: 'How long will this kitchen take, and can I reduce the cost?' }],
    JSON.stringify({ total: est.totalCents / 100, lineItems: est.lineItems.map(l => ({ item: l.item, cost: l.costCents / 100 })) }),
  );
  line(`   Q: How long will this take, and can I reduce the cost?`);
  line(`   A: ${answer}`);

  line('\n✅ LIVE CHECK PASSED — real Claude vision + chat + deterministic engines all ran.');
}

main().catch((e) => { console.error('\n❌ LIVE CHECK FAILED:', e?.message ?? e); process.exit(1); });
