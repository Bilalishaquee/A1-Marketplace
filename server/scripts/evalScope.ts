// Estimation accuracy eval harness. This is how the ">90% accurate" target is
// actually MEASURED — by comparing the engine's estimate against real final
// costs in a golden set. Without real `actualTotalUsd` values this number is
// meaningless, so fill eval/golden.json with A-1's real completed-job invoices.
//
//   npm run eval                       # uses eval/golden.json (or the example)
//   EVAL_TOLERANCE=0.1 npm run eval    # "accurate" = within ±10%
//   MODEL_PROVIDER=claude npm run eval # evaluate the real AI pipeline
//
// Reports: accuracy (% of cases within tolerance), cost MAPE, category accuracy.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getModelAdapter } from '../src/ai/index.ts';
import { computeScopeEstimate } from '../src/engines/scopeEngine.ts';
import { config } from '../src/config.ts';

const TOLERANCE = Number(process.env.EVAL_TOLERANCE ?? 0.15); // ±15% = "accurate"
const dir = dirname(fileURLToPath(import.meta.url));
const evalDir = join(dir, '..', 'eval');
const goldenPath = process.env.GOLDEN
  ?? (existsSync(join(evalDir, 'golden.json')) ? join(evalDir, 'golden.json') : join(evalDir, 'golden.example.json'));

interface GoldenCase {
  id?: string; description: string; categoryKey?: string;
  location?: { zip?: string; city?: string }; actualTotalUsd: number;
}

let cases: GoldenCase[];
try { cases = JSON.parse(readFileSync(goldenPath, 'utf8')); }
catch { console.error(`Could not read golden set at ${goldenPath}`); process.exit(1); }

console.log(`Eval: ${cases.length} cases · provider=${config.modelProvider} · samples=${config.scopeSamples} · tolerance=±${(TOLERANCE * 100).toFixed(0)}%`);
if (goldenPath.endsWith('golden.example.json')) {
  console.log('⚠️  Using the EXAMPLE golden set (synthetic actuals). Replace with real A-1 invoices for a meaningful number.\n');
}

const adapter = getModelAdapter();
const errs: number[] = [];
let within = 0, catOk = 0;

for (const c of cases) {
  const raw = await adapter.analyzeProject({
    description: c.description, images: [], categoryHint: c.categoryKey ?? null, zip: c.location?.zip ?? null,
  });
  const est = computeScopeEstimate(raw, c.location ? { lat: null, lng: null, zip: c.location.zip ?? null, city: c.location.city ?? null, region: null } : null);
  const predUsd = est.priceMedCents / 100;
  const err = Math.abs(predUsd - c.actualTotalUsd) / c.actualTotalUsd;
  errs.push(err);
  if (err <= TOLERANCE) within++;
  const categoryHit = !c.categoryKey || est.categoryKey === c.categoryKey;
  if (categoryHit) catOk++;
  console.log(
    `${(c.id ?? c.description.slice(0, 32)).padEnd(28)} pred $${String(Math.round(predUsd)).padStart(7)} | actual $${String(c.actualTotalUsd).padStart(7)} | err ${(err * 100).toFixed(0).padStart(3)}% ${err <= TOLERANCE ? '✓' : '✗'} | conf ${(est.confidence * 100).toFixed(0)}%${est.needsReview ? ' (review)' : ''}${categoryHit ? '' : ' | CATEGORY MISS'}`,
  );
}

const n = cases.length;
const mape = errs.reduce((a, b) => a + b, 0) / n;
const acc = within / n;
console.log('\n── Summary ──────────────────────────────');
console.log(`Accuracy (within ±${(TOLERANCE * 100).toFixed(0)}%): ${(acc * 100).toFixed(1)}%  ${acc >= 0.9 ? '✅ meets ≥90%' : '❌ below 90%'}`);
console.log(`Cost MAPE:                  ${(mape * 100).toFixed(1)}%`);
console.log(`Category accuracy:          ${(catOk / n * 100).toFixed(1)}%`);
process.exit(0);
