// Provider-agnostic image-rendering interface (mirrors ModelAdapter, §1.2/§2.4).
// Generates a photorealistic "after renovation" view of the user's OWN space.
// Anthropic Claude can't generate images, so this is a separate provider axis:
// `mock` (zero-setup placeholder) | `gemini` (Gemini 2.5 Flash Image, "Nano
// Banana") — selected by config, never referenced directly by business logic.

import type { RenderStyle } from '../types.ts';

export interface RenderBaseImage {
  base64?: string;    // inline bytes (dev / private storage) — preferred for editing
  mediaType?: string; // e.g. "image/jpeg"
  url?: string;       // remote/presigned URL (prod)
}

export interface RenderInput {
  baseImage: RenderBaseImage | null; // the photo to edit; null → generate fresh
  roomType: string;                  // grounds the scene ("kitchen", "bathroom")
  serviceType: string;
  style: RenderStyle;
  materials: string[];               // planned upgrades from the estimate scope
  notes?: string;
}

export interface RenderResult {
  imageDataUrl: string | null; // displayable data: URL (or remote URL)
  provider: string;
  prompt: string;              // the exact grounded prompt (kept for audit)
}

export interface ImageRenderer {
  readonly id: string;
  render(input: RenderInput): Promise<RenderResult>;
}
