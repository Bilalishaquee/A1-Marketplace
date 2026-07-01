// Estimation Orchestrator (TDD §1.2, §1.3). The pipeline that turns a quote's
// images into an itemized, ranged, confidence-scored estimate — publishing SSE
// stage events as it goes so the UI shows progress (matches the existing
// QuoteUpload staged messages).

import type { Quote } from '../types.ts';
import { getModelAdapter } from '../ai/index.ts';
import { aggregateConfidence, deriveMeasurements } from '../engines/measurement.ts';
import { estimate } from '../engines/cost.ts';
import { computeScopeEstimate } from '../engines/scopeEngine.ts';
import { quoteEvents, type StageEvent } from '../sse.ts';
import { blobStore } from '../store/blobStore.ts';
import type { ImageRef } from '../ai/adapter.ts';
import type { EventRepo, QuoteRepo } from '../store/repo.ts';
import { findSimilarProjects, formatRagContext } from '../ai/rag.ts';

function imageRefsFor(quote: Quote): ImageRef[] {
  return quote.images
    .filter(i => i.status === 'usable')
    .map(i => {
      const key = i.s3KeyNormalized ?? i.s3KeyOriginal;
      const blob = blobStore.get(key);
      return blob
        ? { base64: blob.buf.toString('base64'), mediaType: blob.mediaType, contentHash: i.contentHash ?? undefined }
        : { url: key, contentHash: i.contentHash ?? undefined };
    });
}

export interface OrchestratorDeps {
  quotes: QuoteRepo;
  events: EventRepo;
}

// New marketplace flow: description + photos → category, scope of work, and a
// Low/Med/High range + duration/permits/urgency (PDF outputs). Emits SSE stages
// for the web client; the mobile app polls the quote until status=estimated.
export async function runScopeAnalysis(quoteId: string, deps: OrchestratorDeps): Promise<void> {
  const emit = (ev: StageEvent) => {
    quoteEvents.publish(quoteId, ev);
    void deps.events.append({ quoteId, actor: 'system', eventType: `stage:${ev.stage}`, payload: ev });
  };

  try {
    const quote = await deps.quotes.get(quoteId);
    if (!quote) throw new Error('quote not found');

    const usable = quote.images.filter(i => i.status === 'usable');
    if (usable.length === 0 && !quote.description.trim()) {
      emit({ stage: 'failed', pct: 0, message: 'Add a description or a photo', error: 'no_input' });
      await deps.quotes.update(quoteId, { status: 'failed' });
      return;
    }

    await deps.quotes.update(quoteId, { status: 'analyzing' });
    emit({ stage: 'analyzing_surfaces', pct: 30, message: 'Reviewing your project…' });

    const adapter = getModelAdapter();

    // RAG: retrieve similar past A-1 projects to ground the estimate in real outcomes.
    const similarProjects = await findSimilarProjects(
      quote.description,
      quote.categoryKey ?? '',
      5,
    ).catch(() => []);
    const ragContext = similarProjects.length > 0 ? formatRagContext(similarProjects) : null;

    const raw = await adapter.analyzeProject({
      description: quote.description,
      images: imageRefsFor(quote),
      categoryHint: quote.categoryKey,
      zip: quote.location?.zip ?? null,
      ragContext,
    });

    emit({ stage: 'measuring', pct: 65, message: 'Building your scope of work…', partial: { categoryKey: raw.categoryKey } });

    const scopeEstimate = computeScopeEstimate(raw, quote.location);

    emit({ stage: 'costing', pct: 85, message: 'Estimating the price range…' });

    await deps.quotes.update(quoteId, { status: 'estimated', scopeEstimate, categoryKey: scopeEstimate.categoryKey });

    emit({ stage: 'done', pct: 100, message: 'Your estimate is ready!', partial: { priceMedCents: scopeEstimate.priceMedCents } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'analysis failed';
    emit({ stage: 'failed', pct: 0, message: 'Analysis failed', error: message });
    await deps.quotes.update(quoteId, { status: 'failed' }).catch(() => {});
  }
}

export async function runEstimation(quoteId: string, deps: OrchestratorDeps): Promise<void> {
  const emit = (ev: StageEvent) => {
    quoteEvents.publish(quoteId, ev);
    void deps.events.append({ quoteId, actor: 'system', eventType: `stage:${ev.stage}`, payload: ev });
  };

  try {
    const quote = await deps.quotes.get(quoteId);
    if (!quote) throw new Error('quote not found');

    const usable = quote.images.filter(i => i.status === 'usable');
    if (usable.length === 0) {
      emit({ stage: 'failed', pct: 0, message: 'No usable photos', error: 'all_images_rejected' });
      await deps.quotes.update(quoteId, { status: 'failed' });
      return;
    }

    await deps.quotes.update(quoteId, { status: 'analyzing' });
    emit({ stage: 'analyzing_surfaces', pct: 20, message: 'Analyzing surfaces & materials…' });

    // 1. Vision analysis (TDD §2, §3). Prefer real bytes (base64) when we have
    // them in the dev blob store; fall back to the (presigned) URL in prod.
    const adapter = getModelAdapter();
    const imageRefs: ImageRef[] = usable.map(i => {
      const key = i.s3KeyNormalized ?? i.s3KeyOriginal;
      const blob = blobStore.get(key);
      return blob
        ? { base64: blob.buf.toString('base64'), mediaType: blob.mediaType, contentHash: i.contentHash ?? undefined }
        : { url: key, contentHash: i.contentHash ?? undefined };
    });
    const analysis = await adapter.analyzeImages(imageRefs,
      { serviceHint: quote.serviceType, regionZip: quote.regionZip });

    emit({
      stage: 'detecting_damage', pct: 45, message: 'Detecting damage & wear…',
      partial: { surfaces: analysis.surfaces, damage: analysis.damage },
    });

    // 2. Measurement (TDD §4)
    emit({ stage: 'measuring', pct: 65, message: 'Measuring dimensions…' });
    const measurements = deriveMeasurements({
      surfaces: analysis.surfaces,
      scaleCues: analysis.scaleCues,
    });
    const confidence = aggregateConfidence(measurements);

    // 3. Cost estimation (TDD §5)
    emit({ stage: 'costing', pct: 85, message: 'Calculating labor & materials…' });
    const est = estimate({
      serviceType: quote.serviceType,
      regionZip: quote.regionZip,
      analysis: { surfaces: analysis.surfaces, damage: analysis.damage },
      measurements,
      confidence,
    });

    await deps.quotes.update(quoteId, {
      status: 'estimated',
      analyses: [...quote.analyses, analysis],
      estimate: est,
    });

    emit({ stage: 'done', pct: 100, message: 'Quote ready!', partial: { totalCents: est.totalCents } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'estimation failed';
    emit({ stage: 'failed', pct: 0, message: 'Estimation failed', error: message });
    await deps.quotes.update(quoteId, { status: 'failed' }).catch(() => {});
  }
}
