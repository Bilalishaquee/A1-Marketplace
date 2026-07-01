import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { setDefaultResultOrder } from 'node:dns';
import { Agent, setGlobalDispatcher } from 'undici';
import { config } from '../config.ts';
import { blobStore } from '../store/blobStore.ts';
import type { ImageRef } from '../ai/adapter.ts';

setDefaultResultOrder('ipv4first');
setGlobalDispatcher(new Agent({ connect: { timeout: 60_000 } }));

let client: SupabaseClient | null = null;

export function hasSupabaseStorage(): boolean {
  return !!(config.supabaseUrl && config.supabaseServiceRoleKey && config.supabaseStorageBucket);
}

function supabase(): SupabaseClient {
  if (!hasSupabaseStorage()) {
    throw new Error('Supabase Storage is not configured');
  }
  client ??= createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export async function createImageUploadTarget(
  key: string,
  fallbackUploadUrl: string,
): Promise<{ s3Key: string; uploadUrl: string; storage: 'supabase' | 'mock' }> {
  if (!hasSupabaseStorage()) {
    return { s3Key: key, uploadUrl: fallbackUploadUrl, storage: 'mock' };
  }

  const { data, error } = await supabase()
    .storage
    .from(config.supabaseStorageBucket)
    .createSignedUploadUrl(key);

  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed upload URL failed: ${error?.message ?? 'missing signedUrl'}`);
  }

  return { s3Key: key, uploadUrl: data.signedUrl, storage: 'supabase' };
}

export async function imageRefForKey(key: string, contentHash?: string | null): Promise<ImageRef> {
  const blob = blobStore.get(key);
  if (blob) {
    return {
      base64: blob.buf.toString('base64'),
      mediaType: blob.mediaType,
      contentHash: contentHash ?? undefined,
    };
  }

  if (!hasSupabaseStorage()) {
    return { url: key, contentHash: contentHash ?? undefined };
  }

  const { data, error } = await supabase()
    .storage
    .from(config.supabaseStorageBucket)
    .createSignedUrl(key, config.supabaseSignedReadTtlSec);

  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed read URL failed for ${key}: ${error?.message ?? 'missing signedUrl'}`);
  }

  return { url: data.signedUrl, contentHash: contentHash ?? undefined };
}
