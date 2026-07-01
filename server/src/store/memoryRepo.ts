// In-memory implementations (TDD §6.4). Default store for the legacy quote
// engine when running without Supabase.

import { randomUUID } from 'node:crypto';
import type { Quote } from '../types.ts';
import type { EventRepo, OutcomeRepo, QuoteEvent, QuoteRepo } from './repo.ts';

export class MemoryQuoteRepo implements QuoteRepo {
  #quotes = new Map<string, Quote>();

  async create(quote: Quote): Promise<Quote> {
    this.#quotes.set(quote.id, quote);
    return quote;
  }
  async get(id: string): Promise<Quote | null> {
    return this.#quotes.get(id) ?? null;
  }
  async update(id: string, patch: Partial<Quote>): Promise<Quote> {
    const cur = this.#quotes.get(id);
    if (!cur) throw new Error(`quote ${id} not found`);
    const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.#quotes.set(id, next);
    return next;
  }
  async list(limit = 50): Promise<Quote[]> {
    return [...this.#quotes.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

export class MemoryEventRepo implements EventRepo {
  #events: QuoteEvent[] = [];
  async append(e: Omit<QuoteEvent, 'id' | 'createdAt'>): Promise<void> {
    this.#events.push({ ...e, id: randomUUID(), createdAt: new Date().toISOString() });
  }
  async byQuote(quoteId: string): Promise<QuoteEvent[]> {
    return this.#events.filter(e => e.quoteId === quoteId);
  }
}

export class MemoryOutcomeRepo implements OutcomeRepo {
  #outcomes: Array<{ quoteId: string; finalTotalCents: number; createdAt: string }> = [];
  async recordOutcome(o: { quoteId: string; finalTotalCents: number }): Promise<void> {
    this.#outcomes.push({ ...o, createdAt: new Date().toISOString() });
  }
  async all() { return this.#outcomes; }
}
