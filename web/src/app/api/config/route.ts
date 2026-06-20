import { NextResponse } from 'next/server';
import { isCpxConfigured } from '@/lib/env';
import { useSupabaseStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Public config for StayOn extension — no secrets. */
export async function GET() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
      : '');

  return NextResponse.json({
    ok: true,
    apiBaseUrl,
    cpxSurveys: isCpxConfigured(),
    learnEnabled: true,
    storageBackend: useSupabaseStorage() ? 'supabase' : 'json',
  });
}
