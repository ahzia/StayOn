import { NextResponse } from 'next/server';
import {
  parsePostbackSearchParams,
  usdToTokens,
  validatePostbackHash,
} from '@/lib/cpx';
import { getCpxConfig } from '@/lib/env';
import { upsertPostback } from '@/lib/ledger';
import { getClientIp, isAllowedPostbackIp } from '@/lib/request';

export const dynamic = 'force-dynamic';

/**
 * CPX Main Postback URL — paste in publisher dashboard:
 * https://YOUR_DOMAIN/api/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}
 */
export async function GET(request: Request) {
  const { secret, userShare, skipIpCheck } = getCpxConfig();

  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CPX_SECURE_HASH not configured' }, { status: 503 });
  }

  const clientIp = getClientIp(request);
  if (!isAllowedPostbackIp(clientIp, skipIpCheck)) {
    return NextResponse.json({ ok: false, error: 'Forbidden IP' }, { status: 403 });
  }

  const url = new URL(request.url);
  const params = parsePostbackSearchParams(url.searchParams);

  if (!params.transId || !params.userId) {
    return NextResponse.json({ ok: false, error: 'Missing trans_id or user_id' }, { status: 400 });
  }

  if (!validatePostbackHash(params.transId, params.hash, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid hash' }, { status: 401 });
  }

  const isCanceled = params.status === '2';
  const isComplete = params.status === '1' || params.type === 'complete' || params.type === 'bonus';
  const isScreenOut = params.type === 'out';

  let ledgerStatus: 'pending' | 'confirmed' | 'canceled' = 'pending';
  let tokens = 0;

  if (isCanceled) {
    ledgerStatus = 'canceled';
    tokens = 0;
  } else if (isComplete || isScreenOut) {
    ledgerStatus = 'confirmed';
    tokens = usdToTokens(params.amountUsd, userShare);
    if (isScreenOut && tokens === 0 && params.amountUsd === 0) {
      tokens = Math.max(1, Math.round(5 * userShare));
    }
  }

  const entry = await upsertPostback(
    {
      transId: params.transId,
      userId: params.userId,
      status: ledgerStatus,
      cpxStatus: params.status,
      type: params.type,
      amountUsd: params.amountUsd,
      amountLocal: params.amountLocal,
      tokens,
      offerId: params.offerId,
      subId1: params.subId1,
      subId2: params.subId2,
      ipClick: params.ipClick,
    },
    userShare
  );

  return NextResponse.json({
    ok: true,
    transId: entry.transId,
    userId: entry.userId,
    status: entry.status,
    tokens: entry.tokens,
  });
}
