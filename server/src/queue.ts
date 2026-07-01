// Async job runner (TDD §1.2, §1.3). In production this is BullMQ on Redis with
// horizontally-scaled workers. For dev it's an in-process async runner exposing
// the SAME enqueue() contract, so the API layer is identical in both modes.

type Job = () => Promise<void>;

class InProcessQueue {
  #running = 0;
  #max = 4; // concurrency cap; BullMQ enforces this across workers in prod
  #pending: Job[] = [];

  enqueue(job: Job): void {
    this.#pending.push(job);
    this.#drain();
  }

  #drain(): void {
    while (this.#running < this.#max && this.#pending.length > 0) {
      const job = this.#pending.shift()!;
      this.#running++;
      // Fire-and-forget: the request thread already returned 202 (TDD §7.3).
      job().catch(err => console.error('[queue] job error', err))
        .finally(() => { this.#running--; this.#drain(); });
    }
  }
}

export const estimationQueue = new InProcessQueue();
