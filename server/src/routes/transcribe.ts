// POST /v1/transcribe — voice-to-text for the mobile mic button. Accepts raw
// audio bytes (any audio/* content-type), so it bypasses the global 1MB JSON
// limit and avoids base64 inflation. Authenticated like the rest of the API.

import express, { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../auth/middleware.ts';
import { transcribeAudio } from '../ai/transcribe.ts';

export function transcribeRouter(): Router {
  const r = Router();
  r.post('/', requireAuth, express.raw({ type: '*/*', limit: '15mb' }), async (req: AuthedRequest, res) => {
    const audio = req.body as Buffer;
    if (!audio || !audio.length) {
      return res.status(400).json({ error: { code: '400', message: 'no audio received' } });
    }
    try {
      const text = await transcribeAudio(audio, req.get('content-type') || 'audio/m4a');
      res.json({ text });
    } catch (e) {
      res.status(502).json({ error: { code: '502', message: e instanceof Error ? e.message : 'transcription failed' } });
    }
  });
  return r;
}
