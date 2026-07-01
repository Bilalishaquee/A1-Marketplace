// Market-heuristic price baselines per service category (US national medians,
// 2025–26 ballpark). Money in integer cents. These are NOT A-1's books — they
// are defensible starting ranges for a marketplace PRE-estimate (the provider
// supplies the binding quote when they bid). Two jobs here:
//   1. seed the mock engine with coherent ranges, and
//   2. clamp the AI's proposed range to a sane band per category (guardrail).
//
// `low/med/high` describe a typical project in that category; the scope engine
// scales by material quality, size, severity, accessibility, region & urgency.

import type { ServiceCategoryKey } from './taxonomy.ts';

export interface CategoryBaseline {
  low: number; med: number; high: number; // cents — typical project
  durMin: number; durMax: number;          // days
  permits: string[];
}

const k = (dollars: number) => Math.round(dollars * 100);

export const CATEGORY_BASELINES: Record<ServiceCategoryKey, CategoryBaseline> = {
  bathroom_remodeling: { low: k(6000), med: k(15000), high: k(35000), durMin: 7, durMax: 21, permits: ['Plumbing permit', 'Building permit (if layout changes)'] },
  kitchen_remodeling:  { low: k(15000), med: k(35000), high: k(80000), durMin: 14, durMax: 42, permits: ['Building permit', 'Electrical permit', 'Plumbing permit'] },
  flooring:            { low: k(2000), med: k(6000), high: k(18000), durMin: 2, durMax: 7, permits: [] },
  basement_finishing:  { low: k(20000), med: k(40000), high: k(90000), durMin: 21, durMax: 60, permits: ['Building permit', 'Electrical permit', 'Egress window permit'] },
  roofing:             { low: k(6000), med: k(14000), high: k(35000), durMin: 2, durMax: 7, permits: ['Roofing permit'] },
  siding_exterior:     { low: k(8000), med: k(18000), high: k(45000), durMin: 5, durMax: 21, permits: ['Building permit (siding/exterior)'] },
  decks_patios_outdoor:{ low: k(5000), med: k(15000), high: k(45000), durMin: 5, durMax: 21, permits: ['Building permit', 'Zoning/HOA approval'] },
  painting_drywall:    { low: k(1500), med: k(5000), high: k(15000), durMin: 2, durMax: 10, permits: [] },
  electrical:          { low: k(1000), med: k(4000), high: k(15000), durMin: 1, durMax: 7, permits: ['Electrical permit'] },
  plumbing:            { low: k(800), med: k(3000), high: k(12000), durMin: 1, durMax: 5, permits: ['Plumbing permit'] },
  hvac:                { low: k(4000), med: k(9000), high: k(20000), durMin: 1, durMax: 5, permits: ['Mechanical permit'] },
  windows_doors:       { low: k(2000), med: k(8000), high: k(25000), durMin: 1, durMax: 7, permits: ['Building permit (egress/structural openings)'] },
  framing_structural:  { low: k(3000), med: k(12000), high: k(40000), durMin: 3, durMax: 21, permits: ['Building permit', 'Structural engineer sign-off'] },
  masonry_concrete:    { low: k(3000), med: k(10000), high: k(30000), durMin: 3, durMax: 14, permits: ['Building permit (driveway/retaining wall)'] },
  custom_carpentry:    { low: k(2000), med: k(8000), high: k(25000), durMin: 3, durMax: 14, permits: [] },
  home_additions:      { low: k(40000), med: k(100000), high: k(300000), durMin: 60, durMax: 180, permits: ['Building permit', 'Zoning/HOA approval', 'Structural engineer sign-off', 'Electrical permit', 'Plumbing permit'] },
  smart_home_security: { low: k(500), med: k(2500), high: k(10000), durMin: 1, durMax: 5, permits: [] },
  landscaping_drainage:{ low: k(2000), med: k(9000), high: k(30000), durMin: 2, durMax: 14, permits: ['Grading/drainage permit (varies by municipality)'] },
  cleaning_restoration:{ low: k(800), med: k(4000), high: k(20000), durMin: 1, durMax: 10, permits: ['Varies; insurance documentation for restoration'] },
  handyman:            { low: k(150), med: k(600), high: k(2500), durMin: 1, durMax: 2, permits: [] },
};

export const MATERIAL_QUALITY_FACTOR = { builder: 0.8, mid: 1.0, luxury: 1.55 } as const;
