// Adapter factory. Selects the provider from config so business logic never
// references a concrete vendor. OpenAI is the sole real provider; mock is the
// zero-cost dev/CI fallback.

import { config } from '../config.ts';
import type { ModelAdapter } from './adapter.ts';
import { MockAdapter } from './mockAdapter.ts';
import { OpenAIAdapter } from './openAIAdapter.ts';
import type { ImageRenderer } from './renderAdapter.ts';
import { MockRenderer } from './mockRenderer.ts';
import { GeminiRenderer } from './geminiRenderer.ts';
import { HuggingFaceRenderer } from './hfRenderer.ts';

let cached: ModelAdapter | null = null;

export function getModelAdapter(): ModelAdapter {
  if (cached) return cached;
  cached = config.modelProvider === 'openai' ? new OpenAIAdapter() : new MockAdapter();
  return cached;
}

let cachedRenderer: ImageRenderer | null = null;

// Image-rendering provider for the "after renovation" preview (Nano Banana).
export function getImageRenderer(): ImageRenderer {
  if (cachedRenderer) return cachedRenderer;
  cachedRenderer =
    config.renderProvider === 'gemini' ? new GeminiRenderer()
    : config.renderProvider === 'huggingface' ? new HuggingFaceRenderer()
    : new MockRenderer();
  return cachedRenderer;
}

export type { ModelAdapter } from './adapter.ts';
export type { ImageRenderer } from './renderAdapter.ts';
