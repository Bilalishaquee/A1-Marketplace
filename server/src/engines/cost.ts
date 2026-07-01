// Cost Estimation Engine (TDD §5). Deterministic, explainable, versioned.
// Every dollar traces to: a template task → a quantity → a unit cost → a
// pricing version. NOT a black-box model (TDD §0.1 A4). ML only CALIBRATES
// this engine later (TDD §9), it never replaces it.

import type {
  DamageType, Estimate, Grade, LineItem, Measurement, ServiceType, Severity,
  SurfaceType, VisionAnalysis,
} from '../types.ts';
import {
  BUSINESS, MATERIALS, PRICING_VERSION_ID, laborRateCents, materialUnitCostCents,
} from '../data/pricing.ts';
import {
  type SceneContext, type TemplateTask, severityAtLeast, templateFor,
} from '../data/serviceTemplates.ts';
import { SCHEMA_VERSION } from '../types.ts';

const MATERIAL_LABELS: Record<string, string> = {
  cabinet_unit: 'Cabinetry', countertop_quartz: 'Quartz Countertops',
  countertop_granite: 'Granite Countertops', backsplash_tile: 'Backsplash Tile',
  flooring_lvp: 'Luxury Vinyl Plank', flooring_tile: 'Floor Tile',
  flooring_hardwood: 'Hardwood Flooring', paint: 'Paint & Primer',
  drywall: 'Drywall', fixtures_hardware: 'Fixtures & Hardware',
  bath_fixtures: 'Bathroom Fixtures (toilet, vanity, shower)',
  roof_shingle: 'Roofing Shingles', mold_remediation: 'Remediation Materials',
};

export interface CostInput {
  serviceType: ServiceType;
  regionZip: string;
  analysis: Pick<VisionAnalysis, 'surfaces' | 'damage'>;
  measurements: Measurement[];
  confidence: number; // aggregate measurement/detection confidence (0..1)
}

function buildContext(input: CostInput): SceneContext {
  const { surfaces, damage } = input.analysis;
  const byUnit = (surface: SurfaceType, unit: Measurement['unit']) =>
    input.measurements.filter(m => m.surfaceType === surface && m.unit === unit)
      .reduce((a, m) => a + m.value, 0);
  const gradeOf = (surface: SurfaceType): Grade =>
    surfaces.find(s => s.type === surface)?.grade ?? 'mid';
  return {
    surfaces, damage,
    area: (s) => byUnit(s, 'sqft'),
    linearFt: (s) => byUnit(s, 'linear_ft'),
    count: (s) => byUnit(s, 'count'),
    grade: gradeOf,
    hasDamage: (type: DamageType, min: Severity = 'low') =>
      damage.some(d => d.type === type && severityAtLeast(d.severity, min)),
  };
}

function resolveQuantity(task: TemplateTask, ctx: SceneContext): number {
  const q = task.quantity;
  switch (q.kind) {
    case 'area': return ctx.area(q.surface);
    case 'linear_ft': return ctx.linearFt(q.surface);
    case 'count': return ctx.count(q.surface);
    case 'fixed': return q.value;
    case 'area_scaled': return ctx.area(q.surface) * q.factor;
  }
}

export function estimate(input: CostInput): Estimate {
  const template = templateFor(input.serviceType);
  const ctx = buildContext(input);
  const lineItems: LineItem[] = [];

  for (const task of template.tasks) {
    if (task.appliesWhen && !task.appliesWhen(ctx)) continue;
    const qty = round1(resolveQuantity(task, ctx));
    if (qty <= 0 && task.quantity.kind !== 'fixed') continue;

    // Labor
    const hrs = round1(qty * task.hoursPerUnit);
    if (hrs > 0) {
      const rate = laborRateCents(task.trade, input.regionZip);
      lineItems.push({
        category: 'Labor', item: task.name, hrs,
        costCents: Math.round(hrs * rate), quantity: hrs, unit: 'hr',
        unitCostCents: rate, laborRateCents: rate,
        source: 'auto', templateTaskId: task.id,
      });
    }

    // Materials
    for (const mat of task.materials) {
      const grade: Grade = mat.fixedGrade ?? (mat.gradeFrom ? ctx.grade(mat.gradeFrom) : 'mid');
      const matUnit = MATERIALS[mat.ref]?.unit ?? 'unit';
      const matQty = matUnit === 'flat' ? 1 : round1(qty * mat.perUnit);
      if (matQty <= 0) continue;
      const unitCost = materialUnitCostCents(mat.ref, grade, input.regionZip);
      lineItems.push({
        category: 'Materials',
        item: `${MATERIAL_LABELS[mat.ref] ?? mat.ref} (${grade})`,
        hrs: null, costCents: Math.round(matQty * unitCost),
        quantity: matQty, unit: matUnit, unitCostCents: unitCost,
        laborRateCents: null, source: 'auto', templateTaskId: task.id,
      });
    }
  }

  const subtotal = sum(lineItems.map(li => li.costCents));
  const confidence = clamp01(input.confidence);

  // Contingency widens as confidence drops (TDD §5.4).
  const contingencyPct = lerp(BUSINESS.contingencyMinPct, BUSINESS.contingencyMaxPct, 1 - confidence);
  const contingency = Math.round(subtotal * contingencyPct);
  const overhead = Math.round(subtotal * BUSINESS.overheadPct);
  const total = subtotal + contingency + overhead;

  // Range band — half-width scales with uncertainty (TDD §0.1 A5).
  const halfWidth = lerp(0.08, 0.30, 1 - confidence);
  const totalLow = Math.round(total * (1 - halfWidth));
  const totalHigh = Math.round(total * (1 + halfWidth));

  return {
    serviceType: input.serviceType,
    regionZip: input.regionZip,
    lineItems,
    subtotalCents: subtotal,
    contingencyCents: contingency,
    overheadCents: overhead,
    totalCents: total,
    totalLowCents: totalLow,
    totalHighCents: totalHigh,
    confidence,
    rationale: buildRationale(input, lineItems, confidence),
    framing: 'Preliminary AI estimate based on your photos. Final pricing is ' +
      'confirmed after an on-site review by an A-1 specialist.',
    pricingVersionId: PRICING_VERSION_ID,
    modelVersion: 'rules-engine-v1',
    schemaVersion: SCHEMA_VERSION,
    validityDays: 14,
    measurements: input.measurements,
  };
}

function buildRationale(input: CostInput, items: LineItem[], confidence: number): string[] {
  const out: string[] = [];
  const ct = input.measurements.find(m => m.surfaceType === 'countertop');
  if (ct) out.push(`Countertop area estimated at ${ct.value} sq ft via ${methodLabel(ct.method)}.`);
  const dmg = input.analysis.damage.filter(d => d.type !== 'none');
  if (dmg.length) {
    out.push(`Detected ${dmg.map(d => `${d.type.replace('_', ' ')} (${d.severity})`).join(', ')}; ` +
      'remediation included in scope.');
  }
  const labor = sum(items.filter(i => i.category === 'Labor').map(i => i.costCents));
  const materials = sum(items.filter(i => i.category === 'Materials').map(i => i.costCents));
  out.push(`Breakdown: $${cents(labor)} labor, $${cents(materials)} materials before contingency.`);
  out.push(`Estimate confidence ${(confidence * 100).toFixed(0)}% — range reflects photo-based ` +
    'measurement uncertainty until on-site confirmation.');
  return out;
}

function methodLabel(m: Measurement['method']): string {
  return ({ arkit: 'AR room scan', reference_object: 'reference-object scaling',
    fixture_prior: 'fixture-based estimation', manual: 'provided dimensions',
    estimate: 'AI photo estimation' } as const)[m];
}

function sum(ns: number[]): number { return ns.reduce((a, b) => a + b, 0); }
function cents(c: number): string { return (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
