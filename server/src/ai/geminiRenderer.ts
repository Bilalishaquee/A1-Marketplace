// Gemini 2.5 Flash Image ("Nano Banana") renderer (TDD §2.4 — provider behind
// the adapter). Calls the Generative Language REST API directly via fetch, so
// it needs NO new npm dependency and still runs when no key is set (the factory
// only selects this provider when RENDER_PROVIDER=gemini / GEMINI_API_KEY).
//
// Nano Banana is purpose-built for image EDITING: given the user's photo + a
// prompt, it preserves room geometry while changing finishes — ideal for an
// honest "same room, renovated" preview.

import { config } from '../config.ts';
import type { ImageRenderer, RenderInput, RenderResult } from './renderAdapter.ts';
import { buildRenderPrompt } from './renderPrompt.ts';

export class GeminiRenderer implements ImageRenderer {
  readonly id = config.geminiImageModel;

  async render(input: RenderInput): Promise<RenderResult> {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set — use RENDER_PROVIDER=mock for local dev.');
    }
    const prompt = buildRenderPrompt(input);

    const parts: any[] = [{ text: prompt }];
    if (input.baseImage?.base64) {
      parts.push({
        inlineData: {
          mimeType: input.baseImage.mediaType || 'image/jpeg',
          data: input.baseImage.base64,
        },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiImageModel}:generateContent`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': config.geminiApiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        // Nano Banana returns image parts; request both so a stray text part
        // (e.g. a refusal) doesn't fail the call silently.
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      throw new Error(`Gemini image API ${resp.status}: ${detail.slice(0, 300)}`);
    }

    const data: any = await resp.json();
    const candParts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = candParts.find((p) => p.inlineData ?? p.inline_data);
    const inline = imgPart?.inlineData ?? imgPart?.inline_data;
    if (!inline?.data) {
      // Surface any text the model returned (often a content/safety explanation).
      const text = candParts.map((p) => p.text).filter(Boolean).join(' ').slice(0, 200);
      throw new Error(`Gemini returned no image${text ? ` — ${text}` : ''}`);
    }

    const mime = inline.mimeType ?? inline.mime_type ?? 'image/png';
    return {
      imageDataUrl: `data:${mime};base64,${inline.data}`,
      provider: this.id,
      prompt,
    };
  }
}
