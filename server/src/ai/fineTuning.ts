// Fine-tuning pipeline. Exports approved TrainingExamples to OpenAI JSONL format,
// uploads the file, submits a fine-tuning job, and polls job status.
// Admin triggers this via POST /v1/admin/training/jobs.

import { config } from '../config.ts';
import { prisma } from '../db.ts';
import { DEFAULT_SCOPE_PROMPT } from './openAIAdapter.ts';
import { invalidateModelCache } from './openAIAdapter.ts';
import { buildScopeTrainingJsonl, trainingExampleQualificationWhere } from './trainingData.ts';

let openaiClient: any = null;

async function getOpenAI(): Promise<any> {
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import('openai');
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  return openaiClient;
}

// Build and upload training JSONL, return the OpenAI file ID.
export async function buildAndUploadTrainingFile(
  jobId: string,
  categoryKeys: string[],
  minQuality: number,
): Promise<{ fileId: string; count: number; promptVersion: string }> {
  const openai = await getOpenAI();

  // Fetch approved examples for the selected categories
  const where: any = trainingExampleQualificationWhere(categoryKeys, minQuality);

  const examples = await prisma.trainingExample.findMany({
    where,
    orderBy: [{ qualityScore: 'desc' }, { createdAt: 'desc' }],
  });
  if (examples.length === 0) throw new Error('No approved examples match the filters');

  // Load the active scope prompt (snapshot at job creation time)
  let promptVersion = 'openai-scope-v1';
  let systemPrompt = DEFAULT_SCOPE_PROMPT;
  try {
    const activePrompt = await prisma.promptTemplate.findFirst({
      where: { key: 'scope', active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (activePrompt) {
      systemPrompt = activePrompt.body;
      promptVersion = `${activePrompt.key}-${activePrompt.version}`;
    }
  } catch { /* use default */ }

  const jsonlContent = buildScopeTrainingJsonl(examples, systemPrompt);

  // Upload to OpenAI Files API
  const { toFile } = await import('openai');
  const file = await openai.files.create({
    file: await toFile(Buffer.from(jsonlContent), `training-${jobId}.jsonl`, { type: 'application/json' }),
    purpose: 'fine-tune',
  });

  return { fileId: file.id, count: examples.length, promptVersion };
}

// Submit a fine-tuning job to OpenAI and return the job ID.
export async function submitFineTuningJob(fileId: string): Promise<string> {
  const openai = await getOpenAI();
  const job = await openai.fineTuning.jobs.create({
    training_file: fileId,
    model: config.finetuneBaseModel,
    suffix: 'a1-reno',
  });
  return job.id;
}

// Poll a running job and return current status + metrics.
export async function pollJobStatus(openaiJobId: string): Promise<{
  status: string;
  fineTunedModelId: string | null;
  metrics: Record<string, number> | null;
  errorMessage: string | null;
}> {
  const openai = await getOpenAI();
  const job = await openai.fineTuning.jobs.retrieve(openaiJobId);

  const statusMap: Record<string, string> = {
    validating_files: 'UPLOADING',
    queued: 'QUEUED',
    running: 'RUNNING',
    succeeded: 'SUCCEEDED',
    failed: 'FAILED',
    cancelled: 'CANCELLED',
  };

  return {
    status: statusMap[job.status] ?? 'RUNNING',
    fineTunedModelId: job.fine_tuned_model ?? null,
    metrics: job.trained_tokens ? { trained_tokens: job.trained_tokens } : null,
    errorMessage: job.error?.message ?? null,
  };
}

// Background poller: called every 10 min from server startup to update RUNNING jobs.
export async function pollRunningJobs(): Promise<void> {
  try {
    const running = await prisma.fineTuningJob.findMany({
      where: { status: { in: ['QUEUED', 'UPLOADING', 'RUNNING'] } },
    });
    for (const job of running) {
      if (!job.openaiJobId) continue;
      try {
        const result = await pollJobStatus(job.openaiJobId);
        const update: any = {
          status: result.status,
          updatedAt: new Date(),
        };
        if (result.metrics) update.metrics = result.metrics;
        if (result.errorMessage) update.errorMessage = result.errorMessage;
        if (result.fineTunedModelId) {
          update.fineTunedModelId = result.fineTunedModelId;
          // Auto-create a ModelConfig record for admin to review and activate
          const existing = await prisma.modelConfig.findFirst({
            where: { fineTunedModelId: result.fineTunedModelId },
          });
          if (!existing) {
            await prisma.modelConfig.create({
              data: {
                name: `Fine-tuned model (${new Date().toLocaleDateString()})`,
                provider: 'openai',
                baseModelId: job.baseModel,
                fineTunedModelId: result.fineTunedModelId,
                categoryKeys: job.categoryKeys,
                active: false,
              },
            });
          }
          // Invalidate the model cache so the new config is picked up on next request
          invalidateModelCache();
        }
        await prisma.fineTuningJob.update({ where: { id: job.id }, data: update });
      } catch (err) {
        console.warn(`[FineTuning] Poll failed for job ${job.id}:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    console.warn('[FineTuning] Background poll error:', err instanceof Error ? err.message : err);
  }
}
