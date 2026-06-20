import { getApiBaseUrl } from './config';

const FETCH_TIMEOUT_MS = 8_000;

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

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
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
    return await fetchJson<CpxWallResponse>(
      `${base.replace(/\/$/, '')}/api/cpx/wall?${qs.toString()}`
    );
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'CPX wall request timed out'
      : String(err);
    return { ok: false, error: message };
  }
}

export async function fetchPendingRewards(userId: string): Promise<PendingResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  try {
    return await fetchJson<PendingResponse>(
      `${base.replace(/\/$/, '')}/api/wallet/${encodeURIComponent(userId)}/pending`
    );
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Reward sync timed out'
      : String(err);
    return { ok: false, error: message };
  }
}

export async function ackRewards(userId: string, transIds: string[]): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base || transIds.length === 0) {
    return false;
  }

  try {
    const data = await fetchJson<{ ok?: boolean }>(
      `${base.replace(/\/$/, '')}/api/wallet/${encodeURIComponent(userId)}/ack`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transIds }),
      }
    );
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
