// "After renovation" rendering step. Grounds the image generation in the
// quote's own photo + the estimate scope (room type, the materials being
// quoted), then runs the configured renderer. Failures are captured as a
// `failed` Rendering record rather than thrown, so the API/UI can show an
// inline retry instead of a hard error.

import { randomUUID } from 'node:crypto';
import type { Quote, Rendering, RenderStyle } from '../types.ts';
import { getImageRenderer } from '../ai/index.ts';
import type { RenderInput } from '../ai/renderAdapter.ts';
import { blobStore } from '../store/blobStore.ts';

export interface RenderOptions {
  style: RenderStyle;
  sourceImageId?: string;
}

// Pull the base photo (preferring real bytes from the dev blob store) and the
// upgrade list from the priced materials, so the render matches the quote.
export function buildRenderInput(quote: Quote, opts: RenderOptions): RenderInput {
  const usable = quote.images.filter(i => i.status === 'usable');
  const chosen = (opts.sourceImageId && usable.find(i => i.id === opts.sourceImageId)) || usable[0] || null;

  let baseImage: RenderInput['baseImage'] = null;
  if (chosen) {
    const key = chosen.s3KeyNormalized ?? chosen.s3KeyOriginal;
    const blob = blobStore.get(key);
    baseImage = blob
      ? { base64: blob.buf.toString('base64'), mediaType: blob.mediaType }
      : { url: key };
  }

  const analysis = quote.analyses[0];
  const materials = (quote.estimate?.lineItems ?? [])
    .filter(li => li.category === 'Materials')
    // strip the "(grade)" suffix the cost engine appends → cleaner prompt
    .map(li => li.item.replace(/\s*\([^)]*\)\s*$/, '').trim());

  return {
    baseImage,
    roomType: analysis?.roomType || quote.serviceType,
    serviceType: quote.serviceType,
    style: opts.style,
    materials: [...new Set(materials)],
    notes: analysis?.notes,
  };
}

export async function generateRendering(quote: Quote, opts: RenderOptions): Promise<Rendering> {
  const renderer = getImageRenderer();
  const createdAt = new Date().toISOString();
  const base: Omit<Rendering, 'imageDataUrl' | 'prompt' | 'provider' | 'status' | 'error'> = {
    id: randomUUID(),
    style: opts.style,
    sourceImageId: opts.sourceImageId ?? null,
    createdAt,
  };
  try {
    const res = await renderer.render(buildRenderInput(quote, opts));
    return { ...base, imageDataUrl: res.imageDataUrl, prompt: res.prompt, provider: res.provider, status: 'ready' };
  } catch (err) {
    return {
      ...base, imageDataUrl: null, prompt: '', provider: renderer.id, status: 'failed',
      error: err instanceof Error ? err.message : 'rendering failed',
    };
  }
}
