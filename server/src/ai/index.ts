// Adapter factory. Selects the provider from config so business logic never
// references a concrete vendor. OpenAI is the sole real provider; mock is the
// zero-cost dev/CI fallback.

import { config } from '../config.ts';
import type { AnalyzeOptions, ImageRef, ModelAdapter, ProjectAnalyzeInput, RawScopeAnalysis } from './adapter.ts';
import type { VisionAnalysis } from '../types.ts';
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

function fallbackReason(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function canFallback(adapter: ModelAdapter): boolean {
  return adapter.id !== 'mock-v1';
}

export async function analyzeProject(input: ProjectAnalyzeInput): Promise<RawScopeAnalysis> {
  const adapter = getModelAdapter();
  try {
    return await adapter.analyzeProject(input);
  } catch (err) {
    if (!canFallback(adapter)) throw err;
    console.warn(`[AI] ${adapter.id} project analysis failed; using market-calibrated fallback: ${fallbackReason(err)}`);
    return new MockAdapter().analyzeProject(input);
  }
}

export async function analyzeImages(images: ImageRef[], opts: AnalyzeOptions): Promise<VisionAnalysis> {
  const adapter = getModelAdapter();
  try {
    return await adapter.analyzeImages(images, opts);
  } catch (err) {
    if (!canFallback(adapter)) throw err;
    console.warn(`[AI] ${adapter.id} image analysis failed; using deterministic fallback: ${fallbackReason(err)}`);
    return new MockAdapter().analyzeImages(images, opts);
  }
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
