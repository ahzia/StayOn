import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/db/stats';

export const dynamic = 'force-dynamic';

/** Aggregate usage for hackathon demo — no secrets. */
export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
