// Server-side speech-to-text for the mobile mic button. Expo Go has no on-device
// STT, so the app records audio and uploads it here. Provider-agnostic (mirrors
// the renderer pattern): mock | hf (Whisper) | gemini — selected by config.

import { config } from '../config.ts';

export async function transcribeAudio(audio: Buffer, mimeType: string): Promise<string> {
  switch (config.transcribeProvider) {
    case 'hf': return hfTranscribe(audio, mimeType);
    case 'gemini': return geminiTranscribe(audio, mimeType);
    default: return mockTranscribe();
  }
}

async function mockTranscribe(): Promise<string> {
  return 'Voice transcription is in mock mode — set HF_TOKEN (or GEMINI_API_KEY) on the server to enable real dictation.';
}

// Hugging Face Whisper via the inference router (accepts m4a/mp3/wav/etc.).
async function hfTranscribe(audio: Buffer, mimeType: string): Promise<string> {
  if (!config.hfToken) throw new Error('HF_TOKEN not set');
  const url = `https://router.huggingface.co/hf-inference/models/${config.hfSttModel}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.hfToken}`, 'content-type': mimeType || 'audio/m4a' },
    body: audio,
  });
  if (!resp.ok) {
    const d = await resp.text().catch(() => '');
    throw new Error(`Speech service ${resp.status}: ${d.slice(0, 200)}`);
  }
  const data: any = await resp.json().catch(() => ({}));
  const text = typeof data?.text === 'string'
    ? data.text
    : Array.isArray(data) ? data.map((x: any) => x?.text).filter(Boolean).join(' ') : '';
  if (!text.trim()) throw new Error('No speech detected — please try again.');
  return text.trim();
}

// Gemini audio transcription via generateContent (inline base64 audio).
async function geminiTranscribe(audio: Buffer, mimeType: string): Promise<string> {
  if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiTextModel}:generateContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': config.geminiApiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Transcribe this audio verbatim. Return ONLY the transcription text, no commentary.' },
          { inlineData: { mimeType: mimeType || 'audio/mp4', data: audio.toString('base64') } },
        ],
      }],
    }),
  });
  if (!resp.ok) {
    const d = await resp.text().catch(() => '');
    throw new Error(`Speech service ${resp.status}: ${d.slice(0, 200)}`);
  }
  const data: any = await resp.json().catch(() => ({}));
  const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p?.text).filter(Boolean).join(' ').trim();
  if (!text) throw new Error('No speech detected — please try again.');
  return text;
}
