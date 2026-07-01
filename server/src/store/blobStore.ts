// Dev image-bytes store (TDD §7.1). Production uploads live in Supabase Storage
// and the model fetches them via signed URLs. The local mock upload endpoint
// keeps bytes in memory and passes them to the model as base64.

interface Blob { buf: Buffer; mediaType: string; }

class BlobStore {
  #blobs = new Map<string, Blob>();
  put(key: string, buf: Buffer, mediaType: string): void { this.#blobs.set(key, { buf, mediaType }); }
  get(key: string): Blob | undefined { return this.#blobs.get(key); }
  has(key: string): boolean { return this.#blobs.has(key); }
  size(key: string): number { return this.#blobs.get(key)?.buf.length ?? 0; }
}

export const blobStore = new BlobStore();
