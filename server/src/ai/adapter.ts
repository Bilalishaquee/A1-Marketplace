// Provider-agnostic model adapter interface (TDD §1.2, §2.4). Business logic
// depends ONLY on this interface, never on a concrete vendor — so we can swap
// providers, shadow-test, and fall back across providers without rework.

import type { MaterialQuality, VisionAnalysis } from '../types.ts';

export interface ImageRef {
  // In production these are S3 keys / presigned URLs. In dev the mock ignores
  // pixels and is driven by `serviceHint` for deterministic output.
  url?: string;
  // Alternative to url: inline image bytes (used when the model API can't reach
  // the URL, e.g. private S3 without presign, or local testing).
  base64?: string;
  mediaType?: string; // e.g. "image/jpeg"
  contentHash?: string;
}

export interface AnalyzeOptions {
  serviceHint: string; // service_type, used to ground the analysis
  regionZip: string;
}

export interface ChatTurn { role: 'user' | 'assistant'; content: string; }

// ─── Marketplace project analysis (client spec + training-guide outputs) ──────
export interface ProjectAnalyzeInput {
  description: string;          // homeowner's typed/dictated description
  images: ImageRef[];
  categoryHint?: string | null; // optional client-selected category key
  zip?: string | null;          // for regional pricing context (from geolocation)
  // Measurement aids (raise accuracy past the photo-only guess):
  measuredAreaSqft?: number | null; // homeowner-entered area = Tier-4 ground truth
  referenceObject?: boolean;        // a known-size object is in a photo = Tier-2 scaling
  // RAG context: formatted block of similar completed A-1 projects injected as pricing anchors.
  ragContext?: string | null;
}

// Raw structured output from the model, BEFORE the deterministic scope engine
// applies regional/emergency adjustments + sanity clamps (engines/scopeEngine).
export interface RawScopeAnalysis {
  categoryKey: string;          // one of the taxonomy keys
  matchedItems: string[];       // item lines from that category
  scopeOfWork: { title: string; detail?: string }[];
  materialQuality: MaterialQuality;
  approxSizeSqft: number | null;
  conditionSeverity: 'low' | 'med' | 'high';
  accessibility: 'easy' | 'moderate' | 'difficult';
  emergency: boolean;
  permitsRequired: string[];
  materialEstimates: { item: string; quantity: number; unit: string }[];
  urgencyScore: number;         // 0..100
  priceLowCents: number;
  priceMedCents: number;
  priceHighCents: number;
  estimatedDuration: { minDays: number; maxDays: number };
  // Estimate confidence in [0,1]. From the model's self-assessment blended with
  // cross-sample agreement when self-consistency ensembling is on.
  confidence?: number;
  // Sizing/scope assumptions the estimate depends on (surfaced for transparency).
  assumptions?: string[];
  notes: string;
  modelId: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs: number;
}

export interface ModelAdapter {
  readonly id: string; // e.g. "mock-v1" or "claude-sonnet-4-6"
  // Vision: structured scene understanding (TDD §2.3, §3). [legacy itemized flow]
  analyzeImages(images: ImageRef[], opts: AnalyzeOptions): Promise<VisionAnalysis>;
  // Marketplace flow: classify description+photos into a category, scope of
  // work, and a Low/Med/High range + duration/permits/urgency (PDF outputs).
  analyzeProject(input: ProjectAnalyzeInput): Promise<RawScopeAnalysis>;
  // Grounded follow-up Q&A (TDD §7.2). `quoteContext` is the quote JSON; the
  // model explains/suggests but must not invent pricing.
  chat(messages: ChatTurn[], quoteContext: string): Promise<string>;
}
