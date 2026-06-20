import { NextResponse } from 'next/server';
import { markSynced } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

/** Extension acknowledges synced CPX rewards after crediting local wallet. */
export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  let body: { transIds?: string[] };
  try {
    body = (await request.json()) as { transIds?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const transIds = body.transIds ?? [];
  const synced = markSynced(userId, transIds);

  return NextResponse.json({ ok: true, synced });
}
