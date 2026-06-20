import { getSupabaseServiceKey, getSupabaseUrl } from '@/lib/env';

/** Use Supabase when configured unless explicitly forced to JSON. */
export function useSupabaseStorage(): boolean {
  if (process.env.STORAGE_BACKEND === 'json') {
    return false;
  }
  if (process.env.STORAGE_BACKEND === 'supabase') {
    return true;
  }
  return isSupabaseConfigured();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceKey());
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidExtensionUserId(userId: string): boolean {
  return UUID_RE.test(userId);
}
