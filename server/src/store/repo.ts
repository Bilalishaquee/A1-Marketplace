// Storage abstraction (TDD §0.1 A8, §6). Business logic depends on this
// interface, not on Postgres. Default impl is in-memory (runs with no DB);
// the Prisma impl (prisma/schema.prisma) is the production target.

import type { Quote } from '../types.ts';

export interface QuoteRepo {
  create(quote: Quote): Promise<Quote>;
  get(id: string): Promise<Quote | null>;
  update(id: string, patch: Partial<Quote>): Promise<Quote>;
  list(limit?: number): Promise<Quote[]>;
}

// Append-only event log (TDD §6.3 quote_events → Phase 6 audit, Phase 7 analytics).
export interface QuoteEvent {
  id: string;
  quoteId: string;
  actor: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

export interface EventRepo {
  append(e: Omit<QuoteEvent, 'id' | 'createdAt'>): Promise<void>;
  byQuote(quoteId: string): Promise<QuoteEvent[]>;
}

// Self-learning ground-truth capture (TDD §9.4). Skeleton — calibration runs
// offline once outcomes accumulate.
export interface OutcomeRepo {
  recordOutcome(o: { quoteId: string; finalTotalCents: number; notes?: string }): Promise<void>;
  all(): Promise<Array<{ quoteId: string; finalTotalCents: number; createdAt: string }>>;
}
