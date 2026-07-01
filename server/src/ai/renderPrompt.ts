// Builds the grounded image-edit prompt. The render must reflect the SAME room
// (layout, angle, openings) renovated in the chosen style, incorporating the
// upgrades the customer is actually being quoted — not a generic stock photo.
// Image-derived/user text is never treated as instructions here.

import type { RenderInput } from './renderAdapter.ts';
import type { RenderStyle } from '../types.ts';

const STYLE_DESC: Record<RenderStyle, string> = {
  modern: 'a modern style — clean lines, a neutral palette, matte finishes, minimal hardware, and plenty of natural light',
  classic: 'a classic, timeless style — warm wood tones, traditional cabinetry and trim, and elegant fixtures',
  minimalist: 'a minimalist style — bright and uncluttered, a monochrome palette, seamless cabinetry, and hidden storage',
  luxury: 'a high-end luxury style — premium materials such as marble and quartz, designer fixtures, and statement lighting',
};

export function buildRenderPrompt(input: RenderInput): string {
  const room = input.roomType && input.roomType !== 'unknown'
    ? input.roomType.replace(/_/g, ' ') : 'space';
  const hasImage = !!(input.baseImage?.base64 || input.baseImage?.url);

  const base = hasImage
    ? `Edit the provided photo of this ${room}. Keep the exact same room layout, ` +
      `camera angle, window and door positions, and overall proportions, but show ` +
      `it fully renovated and finished in ${STYLE_DESC[input.style]}.`
    : `Generate a photorealistic image of a freshly renovated ${room} in ${STYLE_DESC[input.style]}.`;

  const mats = input.materials.length
    ? ` Reflect these planned upgrades where they fit naturally: ${input.materials.slice(0, 8).join(', ')}.`
    : '';

  return `${base}${mats} Photorealistic, professional real-estate photography, ` +
    `realistic lighting and materials, high detail. Do not include any text, ` +
    `labels, people, or watermarks.`;
}
