// Dev image-bytes store (TDD §7.1). In production, uploaded photos live in S3
// and the model fetches them via presigned URLs. Anthropic's API can't reach a
// localhost URL, so in dev we keep the bytes in memory and pass them to the
// model as base64. Same orchestrator code path either way (TDD §1.2).

interface Blob { buf: Buffer; mediaType: string; }

class BlobStore {
  #blobs = new Map<string, Blob>();
  put(key: string, buf: Buffer, mediaType: string): void { this.#blobs.set(key, { buf, mediaType }); }
  get(key: string): Blob | undefined { return this.#blobs.get(key); }
  has(key: string): boolean { return this.#blobs.has(key); }
  size(key: string): number { return this.#blobs.get(key)?.buf.length ?? 0; }
}

export const blobStore = new BlobStore();
