// Deterministic mock renderer (mirrors MockAdapter). Produces a styled SVG
// placeholder data URL so the WHOLE "see it renovated" flow — auto-generate,
// switch style, regenerate, flip between variants — works end-to-end with zero
// cost and no API key. Swap in Gemini via RENDER_PROVIDER=gemini + GEMINI_API_KEY.

import type { ImageRenderer, RenderInput, RenderResult } from './renderAdapter.ts';
import type { RenderStyle } from '../types.ts';
import { buildRenderPrompt } from './renderPrompt.ts';

const PALETTE: Record<RenderStyle, [string, string]> = {
  modern: ['#0ea5a4', '#0f766e'],
  classic: ['#b45309', '#78350f'],
  minimalist: ['#64748b', '#1e293b'],
  luxury: ['#7c3aed', '#4c1d95'],
};

export class MockRenderer implements ImageRenderer {
  readonly id = 'mock-render-v1';

  async render(input: RenderInput): Promise<RenderResult> {
    await delay(450); // simulate latency so the UI spinner is visible in dev
    const [c1, c2] = PALETTE[input.style];
    const room = cap((input.roomType || 'space').replace(/_/g, ' '));
    // Vary the composition deterministically by style/room so regenerate and
    // style switches visibly differ (no Math.random — reproducible for CI).
    const seed = Math.abs(hash(input.style + room + input.materials.join(','))) % 60;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
      `<rect width="800" height="600" fill="url(#g)"/>` +
      `<rect x="${60 + seed}" y="${360 + seed}" width="680" height="200" fill="rgba(255,255,255,0.10)"/>` +
      `<rect x="${100 + seed}" y="170" width="230" height="170" rx="10" fill="rgba(255,255,255,0.16)"/>` +
      `<rect x="${470 - seed}" y="170" width="230" height="170" rx="10" fill="rgba(255,255,255,0.12)"/>` +
      `<text x="400" y="95" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle">Renovated ${room}</text>` +
      `<text x="400" y="135" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="rgba(255,255,255,0.88)" text-anchor="middle">${cap(input.style)} concept · AI preview (demo)</text>` +
      `</svg>`;
    return {
      imageDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      provider: this.id,
      prompt: buildRenderPrompt(input),
    };
  }
}

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}
