import { NextResponse } from 'next/server';
import { getWalletSummary } from '@/lib/ledger';
import { isValidExtensionUserId } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** Server-authoritative wallet summary for extension / dashboard. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  if (!isValidExtensionUserId(userId)) {
    return NextResponse.json({ ok: false, error: 'userId must be a UUID' }, { status: 400 });
  }

  try {
    const summary = await getWalletSummary(userId);
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
