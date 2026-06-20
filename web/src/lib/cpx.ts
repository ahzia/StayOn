import { createHash } from 'crypto';

/** CPX postback server whitelist (publisher docs). */
export const CPX_POSTBACK_IPS = new Set([
  '188.40.3.73',
  '2a01:4f8:d0a:30ff::2',
  '157.90.97.92',
]);

export type CpxPostbackParams = {
  status: string;
  transId: string;
  userId: string;
  subId1: string;
  subId2: string;
  amountLocal: number;
  amountUsd: number;
  offerId: string;
  hash: string;
  ipClick: string;
  type: string;
};

export function cpxSecureHash(extUserId: string, secret: string): string {
  return createHash('md5').update(`${extUserId}-${secret}`).digest('hex');
}

export function validatePostbackHash(transId: string, hash: string, secret: string): boolean {
  if (!transId || !hash || !secret) {
    return false;
  }
  const expected = createHash('md5').update(`${transId}-${secret}`).digest('hex');
  return timingSafeEqual(expected, hash.toLowerCase());
}

export function buildSurveyWallUrl(params: {
  appId: string;
  extUserId: string;
  secret: string;
  subId1?: string;
  subId2?: string;
}): string {
  const secureHash = cpxSecureHash(params.extUserId, params.secret);
  const qs = new URLSearchParams({
    app_id: params.appId,
    ext_user_id: params.extUserId,
    secure_hash: secureHash,
  });
  if (params.subId1) {
    qs.set('subid_1', params.subId1);
  }
  if (params.subId2) {
    qs.set('subid_2', params.subId2);
  }
  return `https://offers.cpx-research.com/index.php?${qs.toString()}`;
}

export function parsePostbackSearchParams(searchParams: URLSearchParams): CpxPostbackParams {
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const value = searchParams.get(key);
      if (value !== null && value !== '') {
        return value;
      }
    }
    return '';
  };

  const amountLocal = Number(pick('amount_local'));
  const amountUsd = Number(pick('amount_usd'));

  return {
    status: pick('status'),
    transId: pick('trans_id', 'trans_id'),
    userId: pick('user_id', 'ext_user_id'),
    subId1: pick('sub_id', 'subid_1', 'subid'),
    subId2: pick('sub_id_2', 'subid_2'),
    amountLocal: Number.isFinite(amountLocal) ? amountLocal : 0,
    amountUsd: Number.isFinite(amountUsd) ? amountUsd : 0,
    offerId: pick('offer_id', 'offer_ID'),
    hash: pick('hash', 'secure_hash'),
    ipClick: pick('ip_click'),
    type: pick('type'),
  };
}

export function usdToTokens(amountUsd: number, userShare = 0.5): number {
  // 10,000 tokens ≈ €1.00 (see extension economy.ts)
  return Math.max(0, Math.round(amountUsd * 10_000 * userShare));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
