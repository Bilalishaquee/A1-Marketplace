import { DEFAULT_SCOPE_PROMPT } from './openAIAdapter.ts';

export interface ScopeTrainingExample {
  id?: string;
  categoryKey: string;
  description: string;
  zip: string;
  actualLowCents: number | null;
  actualMedCents: number | null;
  actualHighCents: number | null;
  durationDays: number | null;
  scopeOfWork: unknown;
  permitsRequired: string[];
  materialQuality: string | null;
  notes: string | null;
  qualityScore?: number | null;
}

export function trainingExampleQualificationWhere(categoryKeys: string[], minQuality: number): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: 'APPROVED',
    actualLowCents: { not: null },
    actualMedCents: { not: null },
    actualHighCents: { not: null },
  };
  if (categoryKeys.length > 0) where.categoryKey = { in: categoryKeys };
  if (minQuality > 0) where.qualityScore = { gte: minQuality };
  return where;
}

export function buildScopeTrainingRecord(
  example: ScopeTrainingExample,
  systemPrompt = DEFAULT_SCOPE_PROMPT,
): { messages: { role: 'system' | 'user' | 'assistant'; content: string }[] } {
  validateExample(example);

  const userMsg =
    `Homeowner description: """${example.description.trim()}"""\n` +
    `Category hint: ${example.categoryKey}\n` +
    `Location ZIP: ${example.zip}` +
    (example.materialQuality ? `\nMaterial quality: ${example.materialQuality}` : '');

  const durationDays = example.durationDays && example.durationDays > 0 ? example.durationDays : null;
  const qualityScore = typeof example.qualityScore === 'number' ? example.qualityScore : 0.9;
  const confidence = Math.max(0.65, Math.min(0.98, qualityScore));

  const assistantOutput = {
    categoryKey: example.categoryKey,
    priceLowUsd: centsToUsd(example.actualLowCents),
    priceMedUsd: centsToUsd(example.actualMedCents),
    priceHighUsd: centsToUsd(example.actualHighCents),
    materialQuality: normalizeMaterialQuality(example.materialQuality),
    durationMinDays: durationDays ? Math.max(1, Math.round(durationDays * 0.8)) : 7,
    durationMaxDays: durationDays ?? 14,
    permitsRequired: Array.isArray(example.permitsRequired) ? example.permitsRequired : [],
    confidence,
    notes: example.notes ?? '',
    assumptions: [
      'Training example is based on a human-approved completed project or verified estimate.',
      'Final pricing reflects the recorded project scope, location, material grade, and observed conditions.',
    ],
    scopeOfWork: normalizeScopeOfWork(example.scopeOfWork),
    matchedItems: [],
    conditionSeverity: 'med',
    accessibility: 'moderate',
    emergency: false,
    urgencyScore: 30,
    materialEstimates: [],
    approxSizeSqft: null,
  };

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg },
      { role: 'assistant', content: JSON.stringify(assistantOutput) },
    ],
  };
}

export function buildScopeTrainingJsonl(
  examples: ScopeTrainingExample[],
  systemPrompt = DEFAULT_SCOPE_PROMPT,
): string {
  if (examples.length === 0) throw new Error('No approved examples match the filters');
  return examples.map(example => JSON.stringify(buildScopeTrainingRecord(example, systemPrompt))).join('\n');
}

function validateExample(example: ScopeTrainingExample): void {
  const label = example.id ? `Training example ${example.id}` : 'Training example';
  if (!example.categoryKey?.trim()) throw new Error(`${label} is missing categoryKey`);
  if (!example.description?.trim()) throw new Error(`${label} is missing description`);
  if (!example.zip?.trim()) throw new Error(`${label} is missing zip`);

  const low = example.actualLowCents;
  const med = example.actualMedCents;
  const high = example.actualHighCents;
  if (!positiveNumber(low) || !positiveNumber(med) || !positiveNumber(high)) {
    throw new Error(`${label} needs low, medium, and high actual price values before fine-tuning`);
  }
  if (low > med || med > high) {
    throw new Error(`${label} price range must satisfy low <= medium <= high`);
  }
}

function normalizeScopeOfWork(scopeOfWork: unknown): { title: string; detail?: string }[] {
  if (!Array.isArray(scopeOfWork)) return [];
  return scopeOfWork
    .map((item) => {
      if (typeof item === 'string') return { title: item.trim() };
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const title = String(record.title ?? '').trim();
        const detail = record.detail ? String(record.detail).trim() : '';
        return { title, ...(detail ? { detail } : {}) };
      }
      return { title: '' };
    })
    .filter(item => item.title);
}

function normalizeMaterialQuality(value: string | null): 'builder' | 'mid' | 'luxury' {
  if (value === 'builder' || value === 'economy') return 'builder';
  if (value === 'luxury' || value === 'premium') return 'luxury';
  return 'mid';
}

function centsToUsd(value: number | null): number {
  return Math.round((value ?? 0) / 100);
}

function positiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
