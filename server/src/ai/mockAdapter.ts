// Deterministic mock adapter (TDD §0.1 A3, §8.1). Lets the WHOLE pipeline run
// end-to-end with zero cost, no API key, and reproducible output — essential
// for local dev, CI, and the eval harness's golden-set fixtures.
//
// Output is keyed off serviceHint so each service yields a coherent scene that
// resembles the existing web-app QuoteResult mock (oak cabinets, ~28 sq ft
// quartz, minor water staining, etc.).

import type {
  AnalyzeOptions, ChatTurn, ImageRef, ModelAdapter, ProjectAnalyzeInput, RawScopeAnalysis,
} from './adapter.ts';
import type { DetectedDamage, DetectedSurface, MaterialQuality, ServiceType, VisionAnalysis } from '../types.ts';
import { SCHEMA_VERSION } from '../types.ts';
import { SERVICE_CATEGORIES, categoryByKey, type ServiceCategory } from '../data/taxonomy.ts';
import { CATEGORY_BASELINES, MATERIAL_QUALITY_FACTOR } from '../data/categoryPricing.ts';

type Scene = { roomType: string; surfaces: DetectedSurface[]; damage: DetectedDamage[]; notes: string };

const SCENES: Record<ServiceType, Scene> = {
  kitchen_remodel: {
    roomType: 'kitchen',
    surfaces: [
      { type: 'cabinet', material: 'oak', grade: 'mid', condition: 'fair', approxAreaSqft: 60, confidence: 0.78 },
      { type: 'countertop', material: 'laminate', grade: 'mid', condition: 'fair', approxAreaSqft: 28, confidence: 0.72 },
      { type: 'backsplash', material: 'tile', grade: 'mid', condition: 'poor', approxAreaSqft: 32, confidence: 0.6 },
      { type: 'floor', material: 'vinyl', grade: 'economy', condition: 'fair', approxAreaSqft: 180, confidence: 0.7 },
    ],
    damage: [{ type: 'water_damage', severity: 'low', location: 'under sink', confidence: 0.61 }],
    notes: 'Oak cabinets, dated; replacement recommended over refinishing for best ROI.',
  },
  bathroom_renovation: {
    roomType: 'bathroom',
    surfaces: [
      { type: 'floor', material: 'tile', grade: 'mid', condition: 'poor', approxAreaSqft: 45, confidence: 0.74 },
      { type: 'wall', material: 'tile', grade: 'mid', condition: 'fair', approxAreaSqft: 160, confidence: 0.68 },
    ],
    damage: [{ type: 'mold', severity: 'med', location: 'shower corner', confidence: 0.66 }],
    notes: 'Visible mold in shower corner; remediation required before re-tiling.',
  },
  flooring_installation: {
    roomType: 'living_room',
    surfaces: [{ type: 'floor', material: 'carpet', grade: 'economy', condition: 'poor', approxAreaSqft: 320, confidence: 0.8 }],
    damage: [{ type: 'wear_tear', severity: 'high', location: 'high-traffic areas', confidence: 0.7 }],
    notes: 'Worn carpet throughout; LVP recommended for durability.',
  },
  painting_drywall: {
    roomType: 'living_room',
    surfaces: [{ type: 'wall', material: 'drywall', grade: 'mid', condition: 'fair', approxAreaSqft: 540, confidence: 0.76 }],
    damage: [{ type: 'cosmetic', severity: 'low', location: 'scuffs', confidence: 0.55 }],
    notes: 'Minor wall scuffing; standard prep and repaint.',
  },
  roof_replacement: {
    roomType: 'exterior',
    surfaces: [{ type: 'roof', material: 'asphalt_shingle', grade: 'mid', condition: 'poor', approxAreaSqft: 1800, confidence: 0.65 }],
    damage: [{ type: 'wear_tear', severity: 'high', location: 'south slope', confidence: 0.62 }],
    notes: 'Aging shingles with granule loss; full replacement advised.',
  },
  basement_finishing: {
    roomType: 'basement',
    surfaces: [
      { type: 'wall', material: 'concrete', grade: 'economy', condition: 'fair', approxAreaSqft: 600, confidence: 0.6 },
      { type: 'floor', material: 'concrete', grade: 'economy', condition: 'fair', approxAreaSqft: 700, confidence: 0.66 },
    ],
    damage: [{ type: 'water_damage', severity: 'med', location: 'north wall base', confidence: 0.58 }],
    notes: 'Moisture at north wall base; seal before finishing.',
  },
  general_renovation: {
    roomType: 'mixed',
    surfaces: [
      { type: 'wall', material: 'drywall', grade: 'mid', condition: 'fair', approxAreaSqft: 400, confidence: 0.62 },
      { type: 'floor', material: 'laminate', grade: 'economy', condition: 'fair', approxAreaSqft: 250, confidence: 0.64 },
    ],
    damage: [{ type: 'none', severity: 'low', location: '', confidence: 0.5 }],
    notes: 'General refresh across walls and flooring.',
  },
};

export class MockAdapter implements ModelAdapter {
  readonly id = 'mock-v1';

  async analyzeImages(images: ImageRef[], opts: AnalyzeOptions): Promise<VisionAnalysis> {
    const start = performance.now();
    const service = (opts.serviceHint as ServiceType);
    const scene = SCENES[service] ?? SCENES.general_renovation;
    // Simulate per-image latency so SSE staging is visible in dev.
    await delay(150);
    return {
      roomType: scene.roomType,
      imageQuality: { usable: true, issues: images.length === 0 ? ['No images provided'] : [] },
      surfaces: scene.surfaces,
      damage: scene.damage.filter(d => d.type !== 'none'),
      scaleCues: { detectedFixtures: ['standard_door', 'electrical_outlet'], referenceObject: null },
      notes: scene.notes,
      followUpQuestions: [
        'Do you want to keep the existing layout?',
        'What is your preferred material grade (economy, mid, premium)?',
      ],
      modelId: this.id,
      promptVersion: 'mock-v1',
      schemaVersion: SCHEMA_VERSION,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  async analyzeProject(input: ProjectAnalyzeInput): Promise<RawScopeAnalysis> {
    const start = performance.now();
    await delay(200);
    const desc = (input.description || '').toLowerCase();
    const category = pickCategory(desc, input.categoryHint);
    const baseline = CATEGORY_BASELINES[category.key];

    const matchedItems = category.items.filter(i => desc.includes(i.toLowerCase()));
    const items = matchedItems.length ? matchedItems.slice(0, 4) : category.items.slice(0, 2);

    // Ignore "luxury vinyl plank" (a product name) when inferring material grade.
    const gradeText = desc.replace(/luxury vinyl( plank)?/g, '');
    const quality: MaterialQuality =
      /(luxury|high[- ]?end|premium|top[- ]?of)/.test(gradeText) ? 'luxury'
      : /(budget|cheap|economy|builder|basic|affordable)/.test(gradeText) ? 'builder'
      : 'mid';

    const emergency = /(emergency|urgent|asap|leak|flood|burst|no heat|no ac|sewage|sparking)/.test(desc);
    const severity: 'low' | 'med' | 'high' =
      emergency || /(water damage|mold|rot|structural|collapse|sagging)/.test(desc) ? 'high'
      : /(old|dated|worn|cracked|damaged|outdated)/.test(desc) ? 'med' : 'low';

    // Homeowner-provided area is ground truth; else parse a size from the text.
    const sizeMatch = desc.match(/(\d{2,5})\s*(?:sq\.?\s*ft|sqft|square\s*feet|square\s*foot)/);
    const approxSizeSqft = input.measuredAreaSqft && input.measuredAreaSqft > 0
      ? Math.round(input.measuredAreaSqft)
      : sizeMatch ? Number(sizeMatch[1]) : null;

    const qf = MATERIAL_QUALITY_FACTOR[quality];
    const scopeOfWork = buildScope(category, items);

    return {
      categoryKey: category.key,
      matchedItems: items,
      scopeOfWork,
      materialQuality: quality,
      approxSizeSqft,
      conditionSeverity: severity,
      accessibility: 'moderate',
      emergency,
      permitsRequired: baseline.permits,
      materialEstimates: approxSizeSqft
        ? [{ item: 'Primary materials', quantity: approxSizeSqft, unit: 'sqft' }]
        : [],
      urgencyScore: emergency ? 90 : severity === 'high' ? 60 : severity === 'med' ? 40 : 25,
      priceLowCents: Math.round(baseline.low * qf),
      priceMedCents: Math.round(baseline.med * qf),
      priceHighCents: Math.round(baseline.high * qf),
      estimatedDuration: { minDays: baseline.durMin, maxDays: baseline.durMax },
      // Mock confidence: higher with more signal (matched items, size, photos).
      confidence: clamp01(0.55 + (matchedItems.length ? 0.15 : 0) + (approxSizeSqft ? 0.1 : 0) + (input.images.length ? 0.1 : 0)),
      assumptions: [
        `${quality}-grade materials`,
        approxSizeSqft ? `~${approxSizeSqft} sq ft work area` : 'typical room size (no dimensions given)',
        `${severity} existing condition / demo complexity`,
        'standard accessibility, scheduled (non-emergency) work',
      ],
      notes: `${category.label} project assessed from your description${input.images.length ? ' and photos' : ''}.`,
      modelId: this.id,
      promptVersion: 'mock-scope-v1',
      schemaVersion: SCHEMA_VERSION,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  async chat(messages: ChatTurn[], _quoteContext: string): Promise<string> {
    const last = messages.at(-1)?.content ?? '';
    await delay(120);
    if (/time|long|week|schedule/i.test(last))
      return 'Based on this scope, allow roughly 2–3 weeks. Cabinetry installation is the longest step. Want me to break down the schedule?';
    if (/cheaper|budget|reduce|lower/i.test(last))
      return 'You could move to economy-grade materials or refinish rather than replace cabinets — that typically cuts 15–25% off the materials line. Shall I re-estimate at economy grade?';
    return 'Good question — this estimate is preliminary and based on your photos. An A-1 specialist confirms exact pricing on-site. What would you like to adjust?';
  }
}

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

// Infer the best category from a free-text description (or honor a valid hint).
function pickCategory(desc: string, hint?: string | null): ServiceCategory {
  if (hint) { const c = categoryByKey(hint); if (c) return c; }
  let best: ServiceCategory | null = null;
  let bestScore = 0;
  for (const c of SERVICE_CATEGORIES) {
    let score = 0;
    for (const item of c.items) {
      const words = item.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const w of words) if (desc.includes(w)) score += 1;
    }
    // Category label words are strong signals (e.g. "kitchen", "roof").
    for (const w of c.label.toLowerCase().split(/[\s&,]+/)) if (w.length > 3 && desc.includes(w)) score += 3;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best ?? categoryByKey('handyman')!;
}

// Synthesize a plausible professional scope of work from matched item lines.
function buildScope(category: ServiceCategory, items: string[]): { title: string; detail?: string }[] {
  const tasks: { title: string; detail?: string }[] = [
    { title: 'Site assessment & protection', detail: 'Confirm scope, protect adjacent areas, set up workspace.' },
  ];
  for (const it of items) tasks.push({ title: it });
  tasks.push({ title: 'Cleanup & final walkthrough', detail: 'Haul debris, clean the area, review the finished work.' });
  return tasks.slice(0, 8);
}
