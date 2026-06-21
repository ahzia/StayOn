import {
  getPendingForUserJson,
  getUserSummaryJson,
  markSyncedJson,
  readLedgerStore,
  upsertPostbackJson,
} from '@/lib/ledger-json';
import {
  getPendingForUserSupabase,
  getUserSummarySupabase,
  getWalletSummarySupabase,
  markSyncedSupabase,
  upsertPostbackSupabase,
} from '@/lib/ledger-supabase';
import type { LedgerEntry, LedgerStatus } from '@/lib/ledger-types';
import { useSupabaseStorage } from '@/lib/storage';

export type { LedgerEntry, LedgerStatus } from '@/lib/ledger-types';

export async function upsertPostback(
  entry: Omit<LedgerEntry, 'createdAt' | 'updatedAt' | 'synced'> & { synced?: boolean },
  userUsdShare = 0
): Promise<LedgerEntry> {
  if (useSupabaseStorage()) {
    return upsertPostbackSupabase(entry, userUsdShare);
  }
  return upsertPostbackJson(entry);
}

export async function getPendingForUser(userId: string): Promise<LedgerEntry[]> {
  if (useSupabaseStorage()) {
    return getPendingForUserSupabase(userId);
  }
  return getPendingForUserJson(userId);
}

export async function markSynced(userId: string, transIds: string[]): Promise<number> {
  if (useSupabaseStorage()) {
    return markSyncedSupabase(userId, transIds);
  }
  return markSyncedJson(userId, transIds);
}

export async function getUserSummary(userId: string): Promise<{
  confirmedTokens: number;
  pendingTokens: number;
  events: number;
  availablePoints?: number;
  lifetimeEarnedPoints?: number;
}> {
  if (useSupabaseStorage()) {
    return getUserSummarySupabase(userId);
  }
  return getUserSummaryJson(userId);
}

export async function getWalletSummary(userId: string) {
  if (!useSupabaseStorage()) {
    const summary = getUserSummaryJson(userId);
    const pending = getPendingForUserJson(userId);
    const available = summary.confirmedTokens + summary.pendingTokens;
    return {
      availablePoints: available,
      pendingPoints: summary.pendingTokens,
      lifetimeEarnedPoints: available,
      lifetimeRedeemedPoints: 0,
      cashEstimate: `≈ $${(available / 1000).toFixed(2)}`,
      recentEvents: pending.map((p) => ({
        id: p.transId,
        transId: p.transId,
        points: p.tokens,
        label: `CPX ${p.type || 'survey'}`,
        status: p.status,
        createdAt: p.updatedAt,
        synced: p.synced,
      })),
    };
  }
  return getWalletSummarySupabase(userId);
}

export { readLedgerStore };
