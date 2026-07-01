// LLM Training admin routes — admin can upload past projects, approve them for
// RAG + fine-tuning, trigger OpenAI fine-tuning jobs, manage model versions,
// and edit system prompts. All endpoints require ADMIN role.

import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { prisma } from '../db.ts';
import { embedAndStore } from '../ai/rag.ts';
import {
  buildAndUploadTrainingFile,
  submitFineTuningJob,
  pollJobStatus,
} from '../ai/fineTuning.ts';
import { invalidatePromptCache, invalidateModelCache, DEFAULT_VISION_PROMPT, DEFAULT_SCOPE_PROMPT } from '../ai/openAIAdapter.ts';
import { config } from '../config.ts';
import { trainingExampleQualificationWhere } from '../ai/trainingData.ts';

export function trainingRouter(): Router {
  const r = Router();
  r.use(requireAuth, requireRole('ADMIN'));

  // ── Training Examples ───────────────────────────────────────────────────────

  // List examples with optional filters
  r.get('/examples', async (req, res) => {
    try {
      const { status, categoryKey, search, page = '1', limit = '20' } = req.query as Record<string, string>;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where: any = {};
      if (status) where.status = status;
      if (categoryKey) where.categoryKey = categoryKey;
      if (search) where.description = { contains: search, mode: 'insensitive' };

      const [items, total] = await Promise.all([
        prisma.trainingExample.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: { uploadedBy: { select: { name: true } } },
        }),
        prisma.trainingExample.count({ where }),
      ]);

      const stats = await prisma.trainingExample.groupBy({
        by: ['status'],
        _count: { status: true },
      });
      const countByStatus = Object.fromEntries(stats.map(s => [s.status, s._count.status]));

      res.json({ items, total, page: parseInt(page), countByStatus });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Get one example
  r.get('/examples/:id', async (req, res) => {
    try {
      const ex = await prisma.trainingExample.findUnique({
        where: { id: req.params.id },
        include: { uploadedBy: { select: { name: true } } },
      });
      if (!ex) return res.status(404).json({ error: { message: 'Not found' } });
      res.json(ex);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Create a new training example
  r.post('/examples', async (req, res) => {
    try {
      const user = (req as any).user;
      const {
        title, categoryKey, description, zip,
        actualLowCents, actualMedCents, actualHighCents,
        durationDays, scopeOfWork, permitsRequired,
        materialQuality, notes, imageKeys, qualityScore,
      } = req.body;

      if (!categoryKey || !description || !zip) {
        return res.status(400).json({ error: { message: 'categoryKey, description and zip are required' } });
      }

      const example = await prisma.trainingExample.create({
        data: {
          uploadedById: user.id,
          title: title || null,
          categoryKey,
          description,
          zip,
          actualLowCents: actualLowCents ? parseInt(actualLowCents) : null,
          actualMedCents: actualMedCents ? parseInt(actualMedCents) : null,
          actualHighCents: actualHighCents ? parseInt(actualHighCents) : null,
          durationDays: durationDays ? parseInt(durationDays) : null,
          scopeOfWork: scopeOfWork || null,
          permitsRequired: permitsRequired || [],
          materialQuality: materialQuality || null,
          notes: notes || null,
          imageKeys: imageKeys || [],
          qualityScore: qualityScore ? parseFloat(qualityScore) : null,
          status: 'PENDING',
        },
      });
      res.status(201).json(example);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Update / approve / reject an example
  r.patch('/examples/:id', async (req, res) => {
    try {
      const { status, ...fields } = req.body;
      const update: any = {};

      const allowed = [
        'title', 'categoryKey', 'description', 'zip', 'actualLowCents',
        'actualMedCents', 'actualHighCents', 'durationDays', 'scopeOfWork',
        'permitsRequired', 'materialQuality', 'notes', 'imageKeys', 'qualityScore',
      ];
      for (const key of allowed) {
        if (fields[key] !== undefined) update[key] = fields[key];
      }
      if (status) update.status = status;

      const example = await prisma.trainingExample.update({
        where: { id: req.params.id },
        data: update,
      });

      // If newly approved, embed the description asynchronously
      if (status === 'APPROVED' && config.openaiApiKey) {
        void embedAndStore(example.id);
      }

      res.json(example);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Delete an example
  r.delete('/examples/:id', async (req, res) => {
    try {
      await prisma.trainingExample.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // Bulk import from CSV body (simple JSON array for now, CSV parsing is client-side)
  r.post('/examples/import', async (req, res) => {
    try {
      const user = (req as any).user;
      const rows: any[] = req.body.rows ?? [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: { message: 'Provide rows array' } });
      }
      const created = await prisma.trainingExample.createMany({
        data: rows.map((row: any) => ({
          uploadedById: user.id,
          title: row.title || null,
          categoryKey: row.categoryKey || 'handyman',
          description: row.description || '',
          zip: row.zip || config.defaultRegion,
          actualLowCents: row.actualLowUsd ? Math.round(parseFloat(row.actualLowUsd) * 100) : null,
          actualMedCents: row.actualMedUsd ? Math.round(parseFloat(row.actualMedUsd) * 100) : null,
          actualHighCents: row.actualHighUsd ? Math.round(parseFloat(row.actualHighUsd) * 100) : null,
          durationDays: row.durationDays ? parseInt(row.durationDays) : null,
          materialQuality: row.materialQuality || null,
          notes: row.notes || null,
          permitsRequired: [],
          imageKeys: [],
          status: 'PENDING',
        })),
      });
      res.status(201).json({ created: created.count });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // ── Fine-tuning Jobs ────────────────────────────────────────────────────────

  r.get('/jobs', async (_req, res) => {
    try {
      const jobs = await prisma.fineTuningJob.findMany({
        orderBy: { createdAt: 'desc' },
        include: { triggeredBy: { select: { name: true } } },
      });
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.get('/jobs/:id', async (req, res) => {
    try {
      const job = await prisma.fineTuningJob.findUnique({
        where: { id: req.params.id },
        include: { triggeredBy: { select: { name: true } } },
      });
      if (!job) return res.status(404).json({ error: { message: 'Not found' } });

      // Live-poll OpenAI if the job is still in progress
      if (job.openaiJobId && ['QUEUED', 'UPLOADING', 'RUNNING'].includes(job.status)) {
        try {
          const live = await pollJobStatus(job.openaiJobId);
          const update: any = { status: live.status, updatedAt: new Date() };
          if (live.metrics) update.metrics = live.metrics;
          if (live.fineTunedModelId) update.fineTunedModelId = live.fineTunedModelId;
          if (live.errorMessage) update.errorMessage = live.errorMessage;
          const updated = await prisma.fineTuningJob.update({ where: { id: job.id }, data: update });
          return res.json({ ...job, ...updated });
        } catch { /* return stale status */ }
      }
      res.json(job);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/jobs', async (req, res) => {
    try {
      if (!config.openaiApiKey) {
        return res.status(400).json({ error: { message: 'OPENAI_API_KEY not configured' } });
      }
      const user = (req as any).user;
      const { categoryKeys = [], minQuality = 0.8 } = req.body;

      // Count qualifying examples
      const where: any = trainingExampleQualificationWhere(categoryKeys, minQuality);
      const count = await prisma.trainingExample.count({ where });

      if (count < config.finetuneMinExamples) {
        return res.status(400).json({
          error: {
            message: `Only ${count} examples qualify — minimum is ${config.finetuneMinExamples}. Approve more examples first.`,
            count,
            required: config.finetuneMinExamples,
          },
        });
      }

      // Create job record
      const job = await prisma.fineTuningJob.create({
        data: {
          triggeredById: user.id,
          exampleCount: count,
          categoryKeys,
          baseModel: config.finetuneBaseModel,
          status: 'UPLOADING',
        },
      });

      // Run async: build JSONL → upload → submit
      void (async () => {
        try {
          const { fileId, count: finalCount, promptVersion } = await buildAndUploadTrainingFile(
            job.id, categoryKeys, minQuality,
          );
          await prisma.fineTuningJob.update({
            where: { id: job.id },
            data: { openaiFileId: fileId, exampleCount: finalCount, promptVersion, status: 'RUNNING' },
          });

          const openaiJobId = await submitFineTuningJob(fileId);
          await prisma.fineTuningJob.update({
            where: { id: job.id },
            data: { openaiJobId, status: 'RUNNING' },
          });
        } catch (err: any) {
          await prisma.fineTuningJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', errorMessage: err.message },
          }).catch(() => {});
        }
      })();

      res.status(202).json(job);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/jobs/:id/cancel', async (req, res) => {
    try {
      const job = await prisma.fineTuningJob.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: { message: 'Not found' } });
      if (job.openaiJobId && config.openaiApiKey) {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: config.openaiApiKey });
        await openai.fineTuning.jobs.cancel(job.openaiJobId).catch(() => {});
      }
      const updated = await prisma.fineTuningJob.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' },
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // ── Model Registry ──────────────────────────────────────────────────────────

  r.get('/models', async (_req, res) => {
    try {
      const models = await prisma.modelConfig.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(models);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/models/:id/activate', async (req, res) => {
    try {
      const user = (req as any).user;
      const target = await prisma.modelConfig.findUnique({ where: { id: req.params.id } });
      if (!target) return res.status(404).json({ error: { message: 'Model not found' } });

      // Deactivate all others
      await prisma.modelConfig.updateMany({ where: { active: true }, data: { active: false } });
      const updated = await prisma.modelConfig.update({
        where: { id: req.params.id },
        data: { active: true, activatedAt: new Date(), activatedById: user.id },
      });
      invalidateModelCache();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/models/:id/deactivate', async (req, res) => {
    try {
      const updated = await prisma.modelConfig.update({
        where: { id: req.params.id },
        data: { active: false },
      });
      invalidateModelCache();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // ── Prompt Management ───────────────────────────────────────────────────────

  r.get('/prompts', async (_req, res) => {
    try {
      const prompts = await prisma.promptTemplate.findMany({
        orderBy: [{ key: 'asc' }, { createdAt: 'desc' }],
        include: { createdBy: { select: { name: true } } },
      });
      res.json(prompts);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.get('/prompts/:key/active', async (req, res) => {
    try {
      const prompt = await prisma.promptTemplate.findFirst({
        where: { key: req.params.key, active: true },
        orderBy: { createdAt: 'desc' },
      });
      // Return default if none saved yet
      const defaults: Record<string, string> = {
        vision: DEFAULT_VISION_PROMPT,
        scope: DEFAULT_SCOPE_PROMPT,
        chat: '',
      };
      res.json({
        key: req.params.key,
        body: prompt?.body ?? defaults[req.params.key] ?? '',
        version: prompt?.version ?? 'default',
        active: true,
        isDefault: !prompt,
      });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/prompts', async (req, res) => {
    try {
      const user = (req as any).user;
      const { key, body, notes } = req.body;
      if (!key || !body) return res.status(400).json({ error: { message: 'key and body required' } });

      // Compute next version number
      const last = await prisma.promptTemplate.findFirst({
        where: { key },
        orderBy: { createdAt: 'desc' },
      });
      const lastVersion = last?.version ?? 'v0';
      const num = parseInt(lastVersion.replace('v', '')) || 0;
      const version = `v${num + 1}`;

      const prompt = await prisma.promptTemplate.create({
        data: { key, version, body, notes: notes || null, active: false, createdById: user.id },
      });
      res.status(201).json(prompt);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  r.post('/prompts/:id/activate', async (req, res) => {
    try {
      const target = await prisma.promptTemplate.findUnique({ where: { id: req.params.id } });
      if (!target) return res.status(404).json({ error: { message: 'Prompt not found' } });

      // Deactivate all prompts for the same key
      await prisma.promptTemplate.updateMany({
        where: { key: target.key, active: true },
        data: { active: false },
      });
      const updated = await prisma.promptTemplate.update({
        where: { id: req.params.id },
        data: { active: true },
      });
      invalidatePromptCache();
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  // ── Metrics ─────────────────────────────────────────────────────────────────

  r.get('/metrics', async (_req, res) => {
    try {
      const [examplesByCategory, totalApproved, totalPending, activeModel] = await Promise.all([
        prisma.trainingExample.groupBy({
          by: ['categoryKey'],
          where: { status: 'APPROVED' },
          _count: { categoryKey: true },
        }),
        prisma.trainingExample.count({ where: { status: 'APPROVED' } }),
        prisma.trainingExample.count({ where: { status: 'PENDING' } }),
        prisma.modelConfig.findFirst({ where: { active: true }, orderBy: { activatedAt: 'desc' } }),
      ]);

      res.json({
        totalApproved,
        totalPending,
        examplesByCategory: Object.fromEntries(
          examplesByCategory.map(r => [r.categoryKey, r._count.categoryKey]),
        ),
        activeModel: activeModel ? {
          name: activeModel.name,
          modelId: activeModel.fineTunedModelId ?? activeModel.baseModelId,
          isFineTuned: !!activeModel.fineTunedModelId,
          activatedAt: activeModel.activatedAt,
        } : null,
      });
    } catch (err: any) {
      res.status(500).json({ error: { message: err.message } });
    }
  });

  return r;
}
