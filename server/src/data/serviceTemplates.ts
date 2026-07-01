// Service templates (TDD §5.2): the bridge from "messy CV output" to a
// structured scope of work. A template declares the standard tasks for a
// service type; detected surfaces/damage parameterize quantities and select
// which tasks apply. The arithmetic stays deterministic (TDD §5.1).

import type {
  DamageType, DetectedDamage, DetectedSurface, Grade, ServiceType,
  Severity, SurfaceType, Trade,
} from '../types.ts';

// Read-only view of the analyzed scene that tasks query to decide
// applicability and quantities.
export interface SceneContext {
  surfaces: DetectedSurface[];
  damage: DetectedDamage[];
  area(surface: SurfaceType): number;     // sqft
  linearFt(surface: SurfaceType): number;
  count(surface: SurfaceType): number;
  grade(surface: SurfaceType): Grade;
  hasDamage(type: DamageType, minSeverity?: Severity): boolean;
}

export type QuantityRule =
  | { kind: 'area'; surface: SurfaceType }
  | { kind: 'linear_ft'; surface: SurfaceType }
  | { kind: 'count'; surface: SurfaceType }
  | { kind: 'fixed'; value: number }
  | { kind: 'area_scaled'; surface: SurfaceType; factor: number };

export interface MaterialRule {
  ref: string;            // key into MATERIALS
  perUnit: number;        // material qty per 1 unit of task quantity
  gradeFrom?: SurfaceType; // inherit grade from this detected surface
  fixedGrade?: Grade;
}

export interface TemplateTask {
  id: string;
  name: string;
  trade: Trade;
  hoursPerUnit: number;
  displayUnit: string;
  quantity: QuantityRule;
  materials: MaterialRule[];
  appliesWhen?: (ctx: SceneContext) => boolean;
}

export interface ServiceTemplate {
  serviceType: ServiceType;
  version: string;
  tasks: TemplateTask[];
}

const sevRank: Record<Severity, number> = { low: 1, med: 2, high: 3 };
export function severityAtLeast(s: Severity, min: Severity): boolean {
  return sevRank[s] >= sevRank[min];
}

// ── Templates ───────────────────────────────────────────────────────────────

const KITCHEN: ServiceTemplate = {
  serviceType: 'kitchen_remodel',
  version: 'v1',
  tasks: [
    {
      id: 'kit.demo', name: 'Demolition & Removal', trade: 'demolition',
      hoursPerUnit: 0.06, displayUnit: 'sqft floor',
      quantity: { kind: 'area', surface: 'floor' }, materials: [],
    },
    {
      id: 'kit.cabinet_install', name: 'Cabinet Installation', trade: 'carpentry',
      hoursPerUnit: 2.0, displayUnit: 'cabinet',
      quantity: { kind: 'count', surface: 'cabinet' },
      materials: [{ ref: 'cabinet_unit', perUnit: 1, gradeFrom: 'cabinet' }],
      appliesWhen: (c) => c.count('cabinet') > 0,
    },
    {
      id: 'kit.countertop_install', name: 'Countertop Installation', trade: 'carpentry',
      hoursPerUnit: 0.28, displayUnit: 'sqft countertop',
      quantity: { kind: 'area', surface: 'countertop' },
      materials: [{ ref: 'countertop_quartz', perUnit: 1, gradeFrom: 'countertop' }],
      appliesWhen: (c) => c.area('countertop') > 0,
    },
    {
      id: 'kit.backsplash', name: 'Backsplash Tiling', trade: 'tiling',
      hoursPerUnit: 0.18, displayUnit: 'sqft backsplash',
      quantity: { kind: 'area', surface: 'backsplash' },
      materials: [{ ref: 'backsplash_tile', perUnit: 1.1, gradeFrom: 'backsplash' }],
      appliesWhen: (c) => c.area('backsplash') > 0,
    },
    {
      id: 'kit.appliance_hookup', name: 'Appliance Hook-up', trade: 'plumbing',
      hoursPerUnit: 4, displayUnit: 'kitchen',
      quantity: { kind: 'fixed', value: 1 }, materials: [],
    },
    {
      id: 'kit.fixtures', name: 'Fixtures & Hardware', trade: 'general',
      hoursPerUnit: 0, displayUnit: 'kitchen',
      quantity: { kind: 'fixed', value: 1 },
      materials: [{ ref: 'fixtures_hardware', perUnit: 1, fixedGrade: 'mid' }],
    },
    {
      id: 'kit.water_remediation', name: 'Water Damage Remediation', trade: 'general',
      hoursPerUnit: 0.2, displayUnit: 'sqft floor',
      quantity: { kind: 'area_scaled', surface: 'floor', factor: 0.25 },
      materials: [{ ref: 'mold_remediation', perUnit: 1, fixedGrade: 'mid' }],
      appliesWhen: (c) => c.hasDamage('water_damage') || c.hasDamage('mold'),
    },
  ],
};

const BATHROOM: ServiceTemplate = {
  serviceType: 'bathroom_renovation',
  version: 'v1',
  tasks: [
    {
      id: 'bath.demo', name: 'Demolition & Removal', trade: 'demolition',
      hoursPerUnit: 0.08, displayUnit: 'sqft floor',
      quantity: { kind: 'area', surface: 'floor' }, materials: [],
    },
    {
      id: 'bath.floor_tile', name: 'Floor Tiling', trade: 'tiling',
      hoursPerUnit: 0.16, displayUnit: 'sqft floor',
      quantity: { kind: 'area', surface: 'floor' },
      materials: [{ ref: 'flooring_tile', perUnit: 1.1, gradeFrom: 'floor' }],
      appliesWhen: (c) => c.area('floor') > 0,
    },
    {
      id: 'bath.wall_tile', name: 'Wall Tiling', trade: 'tiling',
      hoursPerUnit: 0.16, displayUnit: 'sqft wall',
      quantity: { kind: 'area_scaled', surface: 'wall', factor: 0.5 },
      materials: [{ ref: 'backsplash_tile', perUnit: 1.1, gradeFrom: 'wall' }],
      appliesWhen: (c) => c.area('wall') > 0,
    },
    {
      id: 'bath.plumbing', name: 'Plumbing & Fixtures', trade: 'plumbing',
      hoursPerUnit: 10, displayUnit: 'bathroom',
      quantity: { kind: 'fixed', value: 1 },
      materials: [{ ref: 'bath_fixtures', perUnit: 1, fixedGrade: 'mid' }],
    },
    {
      id: 'bath.mold', name: 'Mold Remediation', trade: 'general',
      hoursPerUnit: 0.2, displayUnit: 'sqft',
      quantity: { kind: 'area_scaled', surface: 'wall', factor: 0.4 },
      materials: [{ ref: 'mold_remediation', perUnit: 1, fixedGrade: 'mid' }],
      appliesWhen: (c) => c.hasDamage('mold') || c.hasDamage('water_damage'),
    },
  ],
};

const FLOORING: ServiceTemplate = {
  serviceType: 'flooring_installation',
  version: 'v1',
  tasks: [
    {
      id: 'flr.removal', name: 'Existing Floor Removal', trade: 'demolition',
      hoursPerUnit: 0.03, displayUnit: 'sqft',
      quantity: { kind: 'area', surface: 'floor' }, materials: [],
    },
    {
      id: 'flr.install', name: 'Flooring Installation', trade: 'flooring',
      hoursPerUnit: 0.06, displayUnit: 'sqft',
      quantity: { kind: 'area', surface: 'floor' },
      materials: [{ ref: 'flooring_lvp', perUnit: 1.08, gradeFrom: 'floor' }],
      appliesWhen: (c) => c.area('floor') > 0,
    },
  ],
};

const PAINTING: ServiceTemplate = {
  serviceType: 'painting_drywall',
  version: 'v1',
  tasks: [
    {
      id: 'pnt.prep', name: 'Surface Prep & Drywall Repair', trade: 'general',
      hoursPerUnit: 0.02, displayUnit: 'sqft wall',
      quantity: { kind: 'area', surface: 'wall' },
      materials: [{ ref: 'drywall', perUnit: 0.1, fixedGrade: 'economy' }],
    },
    {
      id: 'pnt.paint', name: 'Painting', trade: 'painting',
      hoursPerUnit: 0.06, displayUnit: 'sqft wall',
      quantity: { kind: 'area', surface: 'wall' },
      materials: [{ ref: 'paint', perUnit: 1, gradeFrom: 'wall' }],
      appliesWhen: (c) => c.area('wall') > 0,
    },
  ],
};

const ROOF: ServiceTemplate = {
  serviceType: 'roof_replacement',
  version: 'v1',
  tasks: [
    {
      id: 'roof.tearoff', name: 'Tear-off & Disposal', trade: 'roofing',
      hoursPerUnit: 0.02, displayUnit: 'sqft',
      quantity: { kind: 'area', surface: 'roof' }, materials: [],
    },
    {
      id: 'roof.install', name: 'Roof Installation', trade: 'roofing',
      hoursPerUnit: 0.045, displayUnit: 'sqft',
      quantity: { kind: 'area', surface: 'roof' },
      materials: [{ ref: 'roof_shingle', perUnit: 1.1, gradeFrom: 'roof' }],
      appliesWhen: (c) => c.area('roof') > 0,
    },
  ],
};

// Fallback: derive a light scope from whatever surfaces were detected.
const GENERAL: ServiceTemplate = {
  serviceType: 'general_renovation',
  version: 'v1',
  tasks: [
    {
      id: 'gen.paint', name: 'Painting', trade: 'painting',
      hoursPerUnit: 0.06, displayUnit: 'sqft wall',
      quantity: { kind: 'area', surface: 'wall' },
      materials: [{ ref: 'paint', perUnit: 1, fixedGrade: 'mid' }],
      appliesWhen: (c) => c.area('wall') > 0,
    },
    {
      id: 'gen.floor', name: 'Flooring', trade: 'flooring',
      hoursPerUnit: 0.06, displayUnit: 'sqft floor',
      quantity: { kind: 'area', surface: 'floor' },
      materials: [{ ref: 'flooring_lvp', perUnit: 1.08, fixedGrade: 'mid' }],
      appliesWhen: (c) => c.area('floor') > 0,
    },
  ],
};

const BASEMENT: ServiceTemplate = {
  ...GENERAL, serviceType: 'basement_finishing', version: 'v1',
};

export const SERVICE_TEMPLATES: Record<ServiceType, ServiceTemplate> = {
  kitchen_remodel: KITCHEN,
  bathroom_renovation: BATHROOM,
  flooring_installation: FLOORING,
  painting_drywall: PAINTING,
  roof_replacement: ROOF,
  basement_finishing: BASEMENT,
  general_renovation: GENERAL,
};

export function templateFor(service: ServiceType): ServiceTemplate {
  return SERVICE_TEMPLATES[service] ?? GENERAL;
}
