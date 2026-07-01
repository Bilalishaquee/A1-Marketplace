// Centralized, env-driven config with safe dev defaults (TDD §2.4: provider &
// pricing config externalized + versioned; never hard-coded in business logic).

function num(v: string | undefined, dflt: number): number {
  const n = v === undefined ? NaN : Number(v);
  return Number.isFinite(n) ? n : dflt;
}

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  modelProvider: (process.env.MODEL_PROVIDER ?? 'mock') as 'mock' | 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiVisionModel: process.env.OPENAI_VISION_MODEL ?? 'gpt-4o',
  openaiScopeModel: process.env.OPENAI_SCOPE_MODEL ?? 'gpt-4o',
  openaiChatModel: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  finetuneMinExamples: num(process.env.FINETUNE_MIN_EXAMPLES, 10),
  finetuneBaseModel: process.env.FINETUNE_BASE_MODEL ?? 'gpt-4o-mini-2024-07-18',

  // "After renovation" image rendering (TDD-style provider abstraction). Mock
  // by default so it runs with zero setup. Auto-selects a real provider from
  // whichever credential is present (HF free token preferred, then Gemini);
  // override explicitly with RENDER_PROVIDER.
  renderProvider: (process.env.RENDER_PROVIDER
    ?? (process.env.HF_TOKEN ? 'huggingface'
      : process.env.GEMINI_API_KEY ? 'gemini' : 'mock')) as 'mock' | 'gemini' | 'huggingface',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image',
  // Hugging Face (free, token-only). FLUX.1-schnell is fast + free-tier friendly.
  hfToken: process.env.HF_TOKEN ?? '',
  hfImageModel: process.env.HF_IMAGE_MODEL ?? 'black-forest-labs/FLUX.1-schnell',

  // Voice-to-text (mobile mic button). Expo Go can't do on-device STT, so audio
  // is recorded on the device and transcribed server-side. Mock by default;
  // auto-selects HF Whisper (proven token, format-flexible) or Gemini if a
  // credential is present. Override with TRANSCRIBE_PROVIDER.
  transcribeProvider: (process.env.TRANSCRIBE_PROVIDER
    ?? (process.env.HF_TOKEN ? 'hf'
      : process.env.GEMINI_API_KEY ? 'gemini' : 'mock')) as 'mock' | 'hf' | 'gemini',
  hfSttModel: process.env.HF_STT_MODEL ?? 'openai/whisper-large-v3',
  geminiTextModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash',

  store: (process.env.STORE ?? 'memory') as 'memory' | 'prisma',
  databaseUrl: process.env.DATABASE_URL ?? '',

  // Auth — JWT access + rotating refresh tokens.
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  accessTtlMin: num(process.env.ACCESS_TTL_MIN, 15),
  refreshTtlDays: num(process.env.REFRESH_TTL_DAYS, 30),

  s3Bucket: process.env.S3_BUCKET ?? '',
  s3Region: process.env.S3_REGION ?? 'us-east-1',

  defaultRegion: process.env.DEFAULT_REGION ?? '90001',
  maxImagesPerQuote: num(process.env.MAX_IMAGES_PER_QUOTE, 8),
  quoteValidityDays: num(process.env.QUOTE_VALIDITY_DAYS, 14),
} as const;
