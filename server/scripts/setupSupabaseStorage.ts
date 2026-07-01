import { createClient } from '@supabase/supabase-js';
import { setDefaultResultOrder } from 'node:dns';
import { Agent, setGlobalDispatcher } from 'undici';
import { config } from '../src/config.ts';

setDefaultResultOrder('ipv4first');
setGlobalDispatcher(new Agent({ connect: { timeout: 60_000 } }));

if (!config.supabaseUrl || !config.supabaseServiceRoleKey || !config.supabaseStorageBucket) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET first');
}

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) throw new Error(`Unable to list Supabase buckets: ${listError.message}`);

const exists = buckets?.some(bucket => bucket.name === config.supabaseStorageBucket);
if (!exists) {
  const { error } = await supabase.storage.createBucket(config.supabaseStorageBucket, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  });
  if (error) throw new Error(`Unable to create Supabase bucket: ${error.message}`);
  console.log(`Created private Supabase Storage bucket: ${config.supabaseStorageBucket}`);
} else {
  console.log(`Supabase Storage bucket exists: ${config.supabaseStorageBucket}`);
}
