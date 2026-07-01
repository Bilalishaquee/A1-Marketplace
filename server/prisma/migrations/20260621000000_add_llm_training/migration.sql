-- Migration: Add LLM Training models (TrainingExample, FineTuningJob, PromptTemplate, ModelConfig)
-- and enable pgvector for RAG embeddings.

-- Enable pgvector extension (requires PostgreSQL 11+ with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE "TrainingExampleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "FineTuningStatus" AS ENUM ('QUEUED', 'UPLOADING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- TrainingExample: past real completed projects uploaded by admin
CREATE TABLE "TrainingExample" (
    "id"              TEXT NOT NULL,
    "uploadedById"    TEXT NOT NULL,
    "title"           TEXT,
    "categoryKey"     TEXT NOT NULL,
    "description"     TEXT NOT NULL,
    "zip"             TEXT NOT NULL,
    "actualLowCents"  INTEGER,
    "actualMedCents"  INTEGER,
    "actualHighCents" INTEGER,
    "durationDays"    INTEGER,
    "scopeOfWork"     JSONB,
    "permitsRequired" TEXT[] NOT NULL DEFAULT '{}',
    "materialQuality" TEXT,
    "notes"           TEXT,
    "imageKeys"       TEXT[] NOT NULL DEFAULT '{}',
    "embedding"       vector(1536),
    "status"          "TrainingExampleStatus" NOT NULL DEFAULT 'PENDING',
    "qualityScore"    DOUBLE PRECISION,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingExample_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrainingExample_categoryKey_idx" ON "TrainingExample"("categoryKey");
CREATE INDEX "TrainingExample_status_idx" ON "TrainingExample"("status");

-- FineTuningJob: tracks OpenAI fine-tuning jobs
CREATE TABLE "FineTuningJob" (
    "id"               TEXT NOT NULL,
    "openaiFileId"     TEXT,
    "openaiJobId"      TEXT,
    "baseModel"        TEXT NOT NULL DEFAULT 'gpt-4o-mini-2024-07-18',
    "fineTunedModelId" TEXT,
    "exampleCount"     INTEGER NOT NULL,
    "categoryKeys"     TEXT[] NOT NULL DEFAULT '{}',
    "promptVersion"    TEXT NOT NULL DEFAULT 'openai-scope-v1',
    "status"           "FineTuningStatus" NOT NULL DEFAULT 'QUEUED',
    "metrics"          JSONB,
    "errorMessage"     TEXT,
    "triggeredById"    TEXT NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FineTuningJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FineTuningJob_status_idx" ON "FineTuningJob"("status");

-- PromptTemplate: versioned system prompts editable by admin
CREATE TABLE "PromptTemplate" (
    "id"          TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "version"     TEXT NOT NULL,
    "body"        TEXT NOT NULL,
    "notes"       TEXT,
    "active"      BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromptTemplate_key_idx" ON "PromptTemplate"("key");

-- ModelConfig: tracks activated model versions
CREATE TABLE "ModelConfig" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "provider"         TEXT NOT NULL DEFAULT 'openai',
    "baseModelId"      TEXT NOT NULL,
    "fineTunedModelId" TEXT,
    "categoryKeys"     TEXT[] NOT NULL DEFAULT '{}',
    "active"           BOOLEAN NOT NULL DEFAULT false,
    "activatedAt"      TIMESTAMP(3),
    "activatedById"    TEXT,
    "performanceJson"  JSONB,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ModelConfig_active_idx" ON "ModelConfig"("active");

-- Foreign keys
ALTER TABLE "TrainingExample" ADD CONSTRAINT "TrainingExample_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FineTuningJob" ADD CONSTRAINT "FineTuningJob_triggeredById_fkey"
    FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
