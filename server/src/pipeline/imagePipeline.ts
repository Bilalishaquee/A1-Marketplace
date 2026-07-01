// Image ingest + quality gate (TDD §3.1). Runs BEFORE any paid inference and
// returns actionable feedback to the UI ("too dark", "too blurry") rather than
// silently producing a bad quote.
//
// In dev (no real bytes), this is a metadata-level gate. In production it
// inspects the normalized image (blur via Laplacian variance, exposure
// histogram, min-resolution, perceptual-hash de-dup). Those checks live behind
// this same interface so the orchestrator is unchanged.

import type { ImageQuality, QuoteImage } from '../types.ts';

export interface RawUpload {
  s3Key: string;
  byteSize?: number;
  width?: number;
  height?: number;
  blurScore?: number;     // Laplacian variance, higher = sharper
  brightness?: number;    // 0..255 mean luma
}

const MIN_BYTES = 10 * 1024;          // 10KB — reject empty/corrupt
const MIN_DIMENSION = 480;            // px
const MIN_BLUR = 40;                  // below = too blurry
const DARK = 40, BRIGHT = 220;        // exposure bounds

export function gateImage(u: RawUpload): ImageQuality {
  const issues: string[] = [];
  if (u.byteSize != null && u.byteSize < MIN_BYTES) issues.push('File looks empty or corrupt — re-upload.');
  if (u.width != null && u.height != null && Math.min(u.width, u.height) < MIN_DIMENSION)
    issues.push('Photo resolution is too low — use a higher-quality image.');
  if (u.blurScore != null && u.blurScore < MIN_BLUR) issues.push('Photo is blurry — hold steady and retake.');
  if (u.brightness != null && u.brightness < DARK) issues.push('Photo is too dark — add more light and retake.');
  if (u.brightness != null && u.brightness > BRIGHT) issues.push('Photo is overexposed — reduce glare and retake.');
  return { usable: issues.length === 0, issues };
}

export function toQuoteImage(u: RawUpload): QuoteImage {
  const quality = gateImage(u);
  return {
    id: u.s3Key,
    s3KeyOriginal: u.s3Key,
    s3KeyNormalized: null,
    contentHash: null,
    quality,
    status: quality.usable ? 'usable' : 'rejected',
  };
}
