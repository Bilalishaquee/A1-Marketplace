// RAG (Retrieval-Augmented Generation) pipeline. Uses OpenAI text-embedding-3-small
// to embed past project descriptions, stores vectors in pgvector, and retrieves
// the most similar real A-1 completed projects at inference time to inject as
// pricing anchors into the scope analysis prompt.

import { config } from '../config.ts';
import { prisma } from '../db.ts';

let openaiClient: any = null;

async function getOpenAI(): Promise<any> {
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import('openai');
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  return openaiClient;
}

// Embed a text string using text-embedding-3-small (1536 dimensions).
export async function embed(text: string): Promise<number[]> {
  const openai = await getOpenAI();
  const response = await openai.embeddings.create({
    model: config.openaiEmbeddingModel,
    input: text.slice(0, 8000), // max safe chars
  });
  return response.data[0].embedding as number[];
}

// Embed an approved TrainingExample and persist the vector to the DB.
// Called asynchronously when admin approves an example — non-blocking.
export async function embedAndStore(exampleId: string): Promise<void> {
  const example = await prisma.trainingExample.findUnique({ where: { id: exampleId } });
  if (!example) return;
  try {
    const vector = await embed(example.description);
    // Store as a raw Postgres array string — pgvector accepts this format.
    await prisma.$executeRaw`
      UPDATE "TrainingExample"
      SET embedding = ${`[${vector.join(',')}]`}::vector
      WHERE id = ${exampleId}
    `;
  } catch (err) {
    // Swallow: embedding is best-effort; RAG just won't find this example until retry.
    console.warn(`[RAG] Failed to embed example ${exampleId}:`, err instanceof Error ? err.message : err);
  }
}

export interface SimilarProject {
  id: string;
  title: string | null;
  categoryKey: string;
  description: string;
  zip: string;
  actualLowCents: number | null;
  actualMedCents: number | null;
  actualHighCents: number | null;
  durationDays: number | null;
  materialQuality: string | null;
  scopeOfWork: any;
}

// Find top-K approved TrainingExamples similar to the query description.
// Returns an empty array gracefully when pgvector is not enabled or no examples exist.
export async function findSimilarProjects(
  description: string,
  categoryKey: string,
  topK = 5,
): Promise<SimilarProject[]> {
  if (!config.openaiApiKey) return [];
  try {
    const vector = await embed(description);
    const vectorStr = `[${vector.join(',')}]`;

    // Cosine similarity search with category preference — same category first,
    // then fall back to cross-category if fewer than topK same-category results.
    const results = await prisma.$queryRaw<SimilarProject[]>`
      SELECT
        id, title, "categoryKey", description, zip,
        "actualLowCents", "actualMedCents", "actualHighCents",
        "durationDays", "materialQuality", "scopeOfWork"
      FROM "TrainingExample"
      WHERE status = 'APPROVED'
        AND embedding IS NOT NULL
      ORDER BY
        CASE WHEN "categoryKey" = ${categoryKey} THEN 0 ELSE 1 END,
        embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
    return results;
  } catch {
    // pgvector not installed, table missing, or embeddings not yet computed.
    return [];
  }
}

// Format retrieved examples into a context block for injection into the scope prompt.
export function formatRagContext(examples: SimilarProject[]): string {
  if (examples.length === 0) return '';

  const lines = examples.map((ex, i) => {
    const low = ex.actualLowCents ? `$${Math.round(ex.actualLowCents / 100).toLocaleString()}` : null;
    const med = ex.actualMedCents ? `$${Math.round(ex.actualMedCents / 100).toLocaleString()}` : null;
    const high = ex.actualHighCents ? `$${Math.round(ex.actualHighCents / 100).toLocaleString()}` : null;
    const costStr = [low, med, high].filter(Boolean).join(' – ');
    const dur = ex.durationDays ? `${ex.durationDays} days` : null;
    const quality = ex.materialQuality ? `${ex.materialQuality}-range` : null;
    const meta = [ex.zip ? `ZIP ${ex.zip}` : null, quality, dur].filter(Boolean).join(' | ');
    return [
      `${i + 1}. ${ex.title || ex.categoryKey} — ${ex.description.slice(0, 200)}${ex.description.length > 200 ? '…' : ''}`,
      `   Actual cost: ${costStr || 'not recorded'}${meta ? `  |  ${meta}` : ''}`,
    ].join('\n');
  });

  return [
    'REAL A-1 COMPLETED PROJECTS (use these as pricing anchors — weight your estimate toward similar outcomes):',
    ...lines,
    '',
  ].join('\n');
}
