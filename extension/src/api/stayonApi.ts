import { getApiBaseUrl } from './config';

export interface CpxWallResponse {
  ok: boolean;
  iframeUrl?: string;
  error?: string;
}

export interface PendingReward {
  transId: string;
  tokens: number;
  amountUsd: number;
  type: string;
  label: string;
  ts: string;
}

export interface PendingResponse {
  ok: boolean;
  pending?: PendingReward[];
  error?: string;
}

export async function fetchCpxWallUrl(
  userId: string,
  subId1?: string
): Promise<CpxWallResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  const qs = new URLSearchParams({ userId });
  if (subId1) {
    qs.set('subId1', subId1);
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/cpx/wall?${qs.toString()}`);
    return (await res.json()) as CpxWallResponse;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function fetchPendingRewards(userId: string): Promise<PendingResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/wallet/${encodeURIComponent(userId)}/pending`);
    return (await res.json()) as PendingResponse;
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function ackRewards(userId: string, transIds: string[]): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base || transIds.length === 0) {
    return false;
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/wallet/${encodeURIComponent(userId)}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transIds }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
