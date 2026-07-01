// Public-market price baselines per service category (US national medians,
// 2025–26 ballpark). Money in integer cents. These are NOT A-1's books — they
// are defensible starting ranges for a marketplace PRE-estimate (the provider
// supplies the binding quote when they bid). Two jobs here:
//   1. seed the mock engine with coherent ranges, and
//   2. clamp the AI's proposed range to a sane band per category (guardrail).
//
// `low/med/high` describe a common early-budgeting project in that category;
// the scope engine scales by material quality, size, severity, accessibility,
// region & urgency. These anchors intentionally avoid luxury/full-gut defaults
// so ordinary homeowner estimates do not come out inflated.

import type { ServiceCategoryKey } from './taxonomy.ts';

export interface CategoryBaseline {
  low: number; med: number; high: number; // cents — typical project
  durMin: number; durMax: number;          // days
  permits: string[];
  typicalSizeSqft?: number;
  sizeExponent?: number;
}

const k = (dollars: number) => Math.round(dollars * 100);

export const CATEGORY_BASELINES: Record<ServiceCategoryKey, CategoryBaseline> = {
  bathroom_remodeling: { low: k(5800), med: k(14000), high: k(30000), durMin: 7, durMax: 21, permits: ['Plumbing permit', 'Building permit (if layout changes)'], typicalSizeSqft: 60, sizeExponent: 0.72 },
  kitchen_remodeling:  { low: k(8200), med: k(22000), high: k(42000), durMin: 14, durMax: 42, permits: ['Building permit', 'Electrical permit', 'Plumbing permit'], typicalSizeSqft: 180, sizeExponent: 0.70 },
  flooring:            { low: k(1200), med: k(3500), high: k(10000), durMin: 2, durMax: 7, permits: [], typicalSizeSqft: 300, sizeExponent: 0.95 },
  basement_finishing:  { low: k(5200), med: k(18000), high: k(42000), durMin: 14, durMax: 50, permits: ['Building permit', 'Electrical permit', 'Egress window permit'], typicalSizeSqft: 500, sizeExponent: 0.88 },
  roofing:             { low: k(5164), med: k(9504), high: k(17477), durMin: 2, durMax: 7, permits: ['Roofing permit'], typicalSizeSqft: 1800, sizeExponent: 0.95 },
  siding_exterior:     { low: k(7000), med: k(15000), high: k(35000), durMin: 5, durMax: 21, permits: ['Building permit (siding/exterior)'], typicalSizeSqft: 1600, sizeExponent: 0.90 },
  decks_patios_outdoor:{ low: k(4500), med: k(12000), high: k(32000), durMin: 5, durMax: 21, permits: ['Building permit', 'Zoning/HOA approval'], typicalSizeSqft: 280, sizeExponent: 0.86 },
  painting_drywall:    { low: k(605), med: k(2464), high: k(8000), durMin: 1, durMax: 8, permits: [], typicalSizeSqft: 350, sizeExponent: 0.78 },
  electrical:          { low: k(500), med: k(2200), high: k(9000), durMin: 1, durMax: 5, permits: ['Electrical permit'] },
  plumbing:            { low: k(450), med: k(2000), high: k(8500), durMin: 1, durMax: 5, permits: ['Plumbing permit'] },
  hvac:                { low: k(3500), med: k(7500), high: k(16000), durMin: 1, durMax: 5, permits: ['Mechanical permit'] },
  windows_doors:       { low: k(1200), med: k(6000), high: k(18000), durMin: 1, durMax: 7, permits: ['Building permit (egress/structural openings)'] },
  framing_structural:  { low: k(2500), med: k(9000), high: k(30000), durMin: 3, durMax: 21, permits: ['Building permit', 'Structural engineer sign-off'] },
  masonry_concrete:    { low: k(1800), med: k(7000), high: k(24000), durMin: 3, durMax: 14, permits: ['Building permit (driveway/retaining wall)'] },
  custom_carpentry:    { low: k(900), med: k(4500), high: k(18000), durMin: 2, durMax: 14, permits: [] },
  home_additions:      { low: k(35000), med: k(85000), high: k(220000), durMin: 45, durMax: 150, permits: ['Building permit', 'Zoning/HOA approval', 'Structural engineer sign-off', 'Electrical permit', 'Plumbing permit'], typicalSizeSqft: 400, sizeExponent: 0.90 },
  smart_home_security: { low: k(250), med: k(1500), high: k(6500), durMin: 1, durMax: 4, permits: [] },
  landscaping_drainage:{ low: k(1000), med: k(6000), high: k(22000), durMin: 2, durMax: 14, permits: ['Grading/drainage permit (varies by municipality)'] },
  cleaning_restoration:{ low: k(500), med: k(2500), high: k(15000), durMin: 1, durMax: 10, permits: ['Varies; insurance documentation for restoration'] },
  handyman:            { low: k(150), med: k(600), high: k(2500), durMin: 1, durMax: 2, permits: [] },
};

export const MATERIAL_QUALITY_FACTOR = { builder: 0.82, mid: 1.0, luxury: 1.38 } as const;
export const CONDITION_FACTOR = { low: 0.92, med: 1.0, high: 1.22 } as const;
export const ACCESS_FACTOR = { easy: 0.96, moderate: 1.0, difficult: 1.14 } as const;
