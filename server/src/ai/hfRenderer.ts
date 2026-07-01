// Hugging Face renderer — genuinely FREE image generation with a free token
// (no credit card / no billing; free users get a monthly Inference credit
// allowance). Calls the HF Inference router via fetch (no new npm dependency).
//
// Free models like FLUX.1-schnell are TEXT-TO-IMAGE: they produce a realistic
// renovated room of the detected type + style grounded in the quoted materials,
// rather than editing the user's exact photo. (Editing the actual photo —
// img2img that preserves room geometry — needs Gemini/Nano Banana, §geminiRenderer.)

import { config } from '../config.ts';
import type { ImageRenderer, RenderInput, RenderResult } from './renderAdapter.ts';
import { buildRenderPrompt } from './renderPrompt.ts';

export class HuggingFaceRenderer implements ImageRenderer {
  readonly id = `hf:${config.hfImageModel}`;

  async render(input: RenderInput): Promise<RenderResult> {
    if (!config.hfToken) {
      throw new Error('HF_TOKEN not set — create a free token (no card) at https://huggingface.co/settings/tokens');
    }
    // Text-to-image: ignore the source bytes, generate from the grounded prompt.
    const prompt = buildRenderPrompt({ ...input, baseImage: null });
    const url = `https://router.huggingface.co/hf-inference/models/${config.hfImageModel}`;
    const body = JSON.stringify({ inputs: prompt });

    // Free serverless models cold-start: HF answers 503 with an ETA while the
    // model loads. Retry once after a short wait before giving up.
    let resp = await this.#post(url, body);
    if (resp.status === 503) {
      await delay(4000);
      resp = await this.#post(url, body);
    }

    const ct = resp.headers.get('content-type') || '';
    if (!resp.ok || !ct.startsWith('image/')) {
      const detail = await resp.text().catch(() => '');
      throw new Error(`HuggingFace ${resp.status} ${ct || 'no-content-type'}: ${detail.slice(0, 200)}`);
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    return { imageDataUrl: `data:${ct};base64,${buf.toString('base64')}`, provider: this.id, prompt };
  }

  #post(url: string, body: string): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.hfToken}`,
        accept: 'image/png',
      },
      body,
    });
  }
}

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
