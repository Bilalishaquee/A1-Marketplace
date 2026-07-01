// AI scope analysis for a marketplace Project (Postgres-backed). Mirrors the
// in-memory orchestrator but reads/writes Prisma and emits SSE + ProjectEvents.

import { prisma } from '../db.ts';
import { getModelAdapter } from '../ai/index.ts';
import { computeScopeEstimate } from '../engines/scopeEngine.ts';
import { quoteEvents, type StageEvent } from '../sse.ts';
import { blobStore } from '../store/blobStore.ts';
import type { ImageRef } from '../ai/adapter.ts';

export async function runProjectScope(projectId: string): Promise<void> {
  const emit = (ev: StageEvent) => {
    quoteEvents.publish(projectId, ev);
    void prisma.projectEvent.create({
      data: { projectId, actor: 'system', type: `stage:${ev.stage}`, payload: ev as any },
    }).catch(() => {});
  };

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId }, include: { images: true } });
    if (!project) throw new Error('project not found');

    const usable = project.images.filter(i => i.status === 'usable');
    if (usable.length === 0 && !project.description.trim()) {
      emit({ stage: 'failed', pct: 0, message: 'Add a description or a photo', error: 'no_input' });
      await prisma.project.update({ where: { id: projectId }, data: { status: 'FAILED' } });
      return;
    }

    await prisma.project.update({ where: { id: projectId }, data: { status: 'ANALYZING' } });
    emit({ stage: 'analyzing_surfaces', pct: 30, message: 'Reviewing your project…' });

    const imageRefs: ImageRef[] = usable.map(i => {
      const blob = blobStore.get(i.key);
      return blob ? { base64: blob.buf.toString('base64'), mediaType: blob.mediaType } : { url: i.key };
    });

    const adapter = getModelAdapter();
    const raw = await adapter.analyzeProject({
      description: project.description,
      images: imageRefs,
      categoryHint: project.categoryKey,
      zip: project.zip,
      measuredAreaSqft: project.measuredAreaSqft,
      referenceObject: project.hasReferenceObject,
    });

    emit({ stage: 'measuring', pct: 65, message: 'Building your scope of work…', partial: { categoryKey: raw.categoryKey } });

    // Homeowner measurement aids → high-confidence override (Tier-4/Tier-2).
    const measurement = project.measuredAreaSqft
      ? { areaSqft: project.measuredAreaSqft, method: 'manual' as const }
      : project.hasReferenceObject
        ? { method: 'reference_object' as const }
        : null;

    const scope = computeScopeEstimate(raw, {
      lat: project.lat, lng: project.lng, zip: project.zip, city: project.city, region: project.region,
    }, measurement);

    emit({ stage: 'costing', pct: 85, message: 'Estimating the price range…' });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ESTIMATED',
        categoryKey: scope.categoryKey,
        scopeEstimate: scope as any,
        urgency: scope.urgency,
        priceLowCents: scope.priceLowCents,
        priceMedCents: scope.priceMedCents,
        priceHighCents: scope.priceHighCents,
      },
    });

    emit({ stage: 'done', pct: 100, message: 'Your estimate is ready!', partial: { priceMedCents: scope.priceMedCents } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'analysis failed';
    emit({ stage: 'failed', pct: 0, message: 'Analysis failed', error: message });
    await prisma.project.update({ where: { id: projectId }, data: { status: 'FAILED' } }).catch(() => {});
  }
}
