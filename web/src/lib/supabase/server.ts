import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServiceKey, getSupabaseUrl } from '@/lib/env';

let serviceClient: SupabaseClient | undefined;

export function createServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  if (!url || !key) {
    throw new Error('Supabase not configured (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY)');
  }

  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
