// Lightweight per-quote pub/sub for SSE progress streaming (TDD §1.3, §7.3).
// The estimation worker publishes stage events; HTTP SSE handlers subscribe.

import { EventEmitter } from 'node:events';

export interface StageEvent {
  stage: 'queued' | 'analyzing_surfaces' | 'detecting_damage' | 'measuring'
       | 'costing' | 'done' | 'failed';
  pct: number;
  message: string;
  partial?: unknown;
  error?: string;
}

class QuoteEventBus {
  #bus = new EventEmitter();
  #last = new Map<string, StageEvent[]>(); // replay buffer for late subscribers

  publish(quoteId: string, ev: StageEvent): void {
    const log = this.#last.get(quoteId) ?? [];
    log.push(ev);
    this.#last.set(quoteId, log);
    this.#bus.emit(quoteId, ev);
  }

  subscribe(quoteId: string, fn: (ev: StageEvent) => void): () => void {
    // Replay anything already emitted so a subscriber that joins mid-job
    // (the common case — UI subscribes right after enqueue) sees full progress.
    for (const ev of this.#last.get(quoteId) ?? []) fn(ev);
    this.#bus.on(quoteId, fn);
    return () => this.#bus.off(quoteId, fn);
  }

  clear(quoteId: string): void { this.#last.delete(quoteId); }
}

export const quoteEvents = new QuoteEventBus();
