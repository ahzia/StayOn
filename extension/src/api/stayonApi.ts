import type { SurveyProfileSnapshot } from '../types';
import { getApiBaseUrl } from './config';

const FETCH_TIMEOUT_MS = 8_000;

export interface CpxWallResponse {
  ok: boolean;
  iframeUrl?: string;
  profileComplete?: boolean;
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

export interface ProfileResponse {
  ok: boolean;
  completed?: boolean;
  profile?: SurveyProfileSnapshot | null;
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

function apiBase(): string | undefined {
  return getApiBaseUrl()?.replace(/\/$/, '');
}

export async function fetchCpxWallUrl(
  userId: string,
  subId1?: string
): Promise<CpxWallResponse> {
  const base = apiBase();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  const qs = new URLSearchParams({ userId });
  if (subId1) {
    qs.set('subId1', subId1);
  }

  try {
    return await fetchJson<CpxWallResponse>(`${base}/api/cpx/wall?${qs.toString()}`);
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'CPX wall request timed out'
      : String(err);
    return { ok: false, error: message };
  }
}

export async function fetchSurveyProfile(userId: string): Promise<ProfileResponse> {
  const base = apiBase();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  try {
    const data = await fetchJson<{
      ok: boolean;
      completed?: boolean;
      profile?: SurveyProfileSnapshot | null;
      error?: string;
    }>(`${base}/api/user/${encodeURIComponent(userId)}/profile`);

    return {
      ok: Boolean(data.ok),
      completed: data.completed,
      profile: data.profile
        ? { ...data.profile, completed: Boolean(data.completed) }
        : { completed: Boolean(data.completed) },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function saveSurveyProfile(
  userId: string,
  body: {
    email: string;
    birthdayYear: number;
    birthdayMonth: number;
    birthdayDay: number;
    gender?: 'm' | 'f';
    countryCode?: string;
  }
): Promise<ProfileResponse> {
  const base = apiBase();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  try {
    const data = await fetchJson<{
      ok: boolean;
      completed?: boolean;
      profile?: SurveyProfileSnapshot;
      error?: string;
    }>(`${base}/api/user/${encodeURIComponent(userId)}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!data.ok) {
      return { ok: false, error: data.error ?? 'Profile save failed' };
    }

    return {
      ok: true,
      completed: true,
      profile: data.profile ? { ...data.profile, completed: true } : { completed: true },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function fetchPendingRewards(userId: string): Promise<PendingResponse> {
  const base = apiBase();
  if (!base) {
    return { ok: false, error: 'stayon.apiBaseUrl not set' };
  }

  try {
    return await fetchJson<PendingResponse>(
      `${base}/api/wallet/${encodeURIComponent(userId)}/pending`
    );
  } catch (err) {
    const message = err instanceof Error && err.name === 'AbortError'
      ? 'Reward sync timed out'
      : String(err);
    return { ok: false, error: message };
  }
}

export async function ackRewards(userId: string, transIds: string[]): Promise<boolean> {
  const base = apiBase();
  if (!base || transIds.length === 0) {
    return false;
  }

  try {
    const data = await fetchJson<{ ok?: boolean }>(
      `${base}/api/wallet/${encodeURIComponent(userId)}/ack`,
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
