import { NextResponse } from 'next/server';
import { getPendingForUser, getUserSummary } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

/** Extension polls for CPX rewards confirmed by postback but not yet synced locally. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const pending = await getPendingForUser(userId);
  const summary = await getUserSummary(userId);

  return NextResponse.json({
    ok: true,
    pending: pending.map((p) => ({
      transId: p.transId,
      tokens: p.tokens,
      amountUsd: p.amountUsd,
      type: p.type,
      label: `CPX ${p.type || 'survey'}`,
      ts: p.updatedAt,
    })),
    summary,
  });
}
