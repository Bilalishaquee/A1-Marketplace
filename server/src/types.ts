// Shared domain types for the AI Engine (TDD §2.3, §4.3, §5, §6).
// Money is stored as integer cents everywhere. No floats for currency.

import type { ServiceCategoryKey } from './data/taxonomy.ts';

export const SCHEMA_VERSION = '2025-06-09.1';
export type { ServiceCategoryKey } from './data/taxonomy.ts';

export type ServiceType =
  | 'kitchen_remodel'
  | 'bathroom_renovation'
  | 'flooring_installation'
  | 'basement_finishing'
  | 'painting_drywall'
  | 'roof_replacement'
  | 'general_renovation';

export type QuoteStatus =
  | 'draft'
  | 'analyzing'
  | 'estimated'
  | 'posted'       // marketplace: visible to nearby providers (Phase B)
  | 'in_review'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'failed';

// ─── Marketplace project model (client spec: describe + photos → scope + range
// → post for providers). Aligned to the PDF "Recommended AI outputs". ──────────

export type MaterialQuality = 'builder' | 'mid' | 'luxury';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
export type ConditionSeverity = 'low' | 'med' | 'high';
export type Accessibility = 'easy' | 'moderate' | 'difficult';

export interface ProjectLocation {
  lat: number | null;
  lng: number | null;
  zip?: string | null;     // reverse-geocoded; used for regional pricing
  city?: string | null;
  region?: string | null;  // human label e.g. "Los Angeles, CA"
}

export interface ScopeTask {
  title: string;
  detail?: string;
}

export interface MaterialEstimateLine {
  item: string;
  quantity: number;
  unit: string; // sqft | linear_ft | unit | each
}

export interface DurationRange { minDays: number; maxDays: number; }

// The professional "scope of work + price range" the AI produces in the
// background. This is the single client-facing estimate object (replaces the
// old itemized line-item Estimate in the new marketplace flow).
export interface ScopeEstimate {
  categoryKey: ServiceCategoryKey;
  categoryLabel: string;
  matchedItems: string[];            // item lines from the taxonomy
  scopeOfWork: ScopeTask[];          // concise professional scope summary
  materialQuality: MaterialQuality;
  // PDF: "Low / Medium / High pricing scenarios" + "Estimated project range"
  priceLowCents: number;
  priceMedCents: number;
  priceHighCents: number;
  estimatedDuration: DurationRange;  // PDF: "Estimated project duration"
  permitsRequired: string[];         // PDF: "Required permits and inspections"
  materialEstimates: MaterialEstimateLine[]; // PDF: "Material quantity approximation"
  urgency: UrgencyLevel;             // PDF: "Homeowner urgency score"
  urgencyScore: number;              // 0..100
  suggestedTrades: string[];         // PDF: "Suggested contractor categories"
  confidence: number;                // 0..1 (model self-assessment × ensemble agreement)
  assumptions: string[];             // sizing/scope assumptions the estimate depends on
  needsReview: boolean;              // true when confidence is low → gather more info / on-site
  rationale: string[];               // grounded explanation
  framing: string;                   // preliminary disclaimer
  pricingBasis: string;              // note: market-heuristic, not binding
  modelId: string;
  promptVersion: string;
  schemaVersion: string;
}

export type SurfaceType =
  | 'wall' | 'floor' | 'ceiling' | 'cabinet' | 'countertop' | 'backsplash'
  | 'fixture' | 'door' | 'window' | 'roof';

export type DamageType =
  | 'water_damage' | 'mold' | 'structural' | 'wear_tear' | 'cosmetic' | 'none';

export type Severity = 'low' | 'med' | 'high';
export type Grade = 'economy' | 'mid' | 'premium';
export type Trade = 'demolition' | 'carpentry' | 'plumbing' | 'electrical'
  | 'tiling' | 'painting' | 'flooring' | 'roofing' | 'general';

// Measurement tier — TDD §4.1, best → fallback.
export type MeasurementMethod =
  | 'arkit' | 'reference_object' | 'fixture_prior' | 'manual' | 'estimate';

export interface DetectedSurface {
  type: SurfaceType;
  material: string;
  grade: Grade;
  condition: 'good' | 'fair' | 'poor';
  approxAreaSqft: number | null;
  confidence: number; // 0..1
}

export interface DetectedDamage {
  type: DamageType;
  severity: Severity;
  location: string;
  confidence: number; // 0..1
}

export interface ScaleCues {
  detectedFixtures: string[];
  referenceObject: string | null;
}

export interface ImageQuality {
  usable: boolean;
  issues: string[]; // actionable feedback for the UI (TDD §3.1.2)
}

// Structured output contract from the vision model (TDD §2.3).
export interface VisionAnalysis {
  roomType: string;
  imageQuality: ImageQuality;
  surfaces: DetectedSurface[];
  damage: DetectedDamage[];
  scaleCues: ScaleCues;
  notes: string;
  followUpQuestions: string[];
  modelId: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs: number;
}

export interface Measurement {
  surfaceType: SurfaceType;
  value: number;
  unit: 'sqft' | 'linear_ft' | 'count';
  method: MeasurementMethod;
  confidence: number; // 0..1
  manualOverride: boolean;
}

export type LineItemCategory = 'Labor' | 'Materials';

// Matches the existing web-app QuoteResult.jsx shape ({category,item,cost,hrs})
// plus the richer fields needed for an auditable estimate (TDD §5.4).
export interface LineItem {
  category: LineItemCategory;
  item: string;
  costCents: number;
  hrs: number | null;
  quantity: number;
  unit: string;
  unitCostCents: number;
  laborRateCents: number | null;
  source: 'auto' | 'manual' | 'edited';
  templateTaskId: string | null;
}

export interface Estimate {
  serviceType: ServiceType;
  regionZip: string;
  lineItems: LineItem[];
  subtotalCents: number;
  contingencyCents: number;
  overheadCents: number;
  totalCents: number;       // point estimate (subtotal+contingency+overhead)
  totalLowCents: number;    // range — TDD §5.4
  totalHighCents: number;
  confidence: number;       // 0..1 aggregate
  rationale: string[];      // human-readable "AI insights" (grounded)
  framing: string;          // "preliminary, on-site confirmation" disclaimer
  pricingVersionId: string;
  modelVersion: string;
  schemaVersion: string;
  validityDays: number;
  measurements: Measurement[];
}

// AI "after renovation" visualization (Nano Banana / Gemini 2.5 Flash Image).
// A rendering edits the user's own photo into a finished, renovated version of
// the SAME space, grounded in the estimate's scope. Multiple are kept so the
// client can flip between styles / regenerations.
export type RenderStyle = 'modern' | 'classic' | 'minimalist' | 'luxury';

export interface Rendering {
  id: string;
  style: RenderStyle;
  // Directly displayable by the front-end: a data: URL (dev / mock + inline
  // model output) or a remote URL (prod, once renders are offloaded to storage).
  imageDataUrl: string | null;
  sourceImageId: string | null; // which uploaded photo it was based on
  prompt: string;               // the grounded prompt used (auditable)
  provider: string;             // e.g. "mock-render-v1" | "gemini-2.5-flash-image"
  status: 'ready' | 'failed';
  error?: string;
  createdAt: string;
}

export interface QuoteImage {
  id: string;
  s3KeyOriginal: string;
  s3KeyNormalized: string | null;
  contentHash: string | null;
  quality: ImageQuality | null;
  status: 'pending' | 'usable' | 'rejected';
}

export interface Quote {
  id: string;
  clientId: string | null;
  serviceType: ServiceType;
  regionZip: string;
  description: string;
  budgetCents: number | null;
  status: QuoteStatus;
  images: QuoteImage[];
  analyses: VisionAnalysis[];
  estimate: Estimate | null;        // legacy itemized engine (retained)
  renderings: Rendering[];          // AI image previews (dormant in new flow)
  createdAt: string;
  updatedAt: string;

  // ─── New marketplace flow ───────────────────────────────────────────────
  categoryKey: ServiceCategoryKey | null; // optional client hint; AI confirms
  location: ProjectLocation | null;        // device geolocation (replaces ZIP)
  scopeEstimate: ScopeEstimate | null;     // the professional scope + range
  postedAt: string | null;                 // set when client posts the project
}
