import { createServiceClient } from '@/lib/supabase/server';
import { useSupabaseStorage } from '@/lib/storage';
import { readLedgerStore } from '@/lib/ledger-json';

export type PublicStats = {
  installs: number;
  confirmedSurveys: number;
  totalPointsEarned: number;
  totalUsdPublisher: number;
  recentEvents: {
    transId: string;
    points: number;
    status: string;
    createdAt: string;
    extensionUserId: string;
  }[];
};

export async function getPublicStats(): Promise<PublicStats> {
  if (useSupabaseStorage()) {
    return getPublicStatsSupabase();
  }
  return getPublicStatsJson();
}

async function getPublicStatsSupabase(): Promise<PublicStats> {
  const supabase = createServiceClient();

  const { count: installs } = await supabase
    .from('extension_installs')
    .select('*', { count: 'exact', head: true });

  const { data: allConfirmed, error: sumError } = await supabase
    .from('reward_events')
    .select('points, amount_usd_publisher')
    .eq('status', 'confirmed');

  if (sumError) {
    throw new Error(sumError.message);
  }

  const { data: recent, error: recentError } = await supabase
    .from('reward_events')
    .select('external_trans_id, points, status, amount_usd_publisher, created_at, extension_user_id')
    .order('created_at', { ascending: false })
    .limit(15);

  if (recentError) {
    throw new Error(recentError.message);
  }

  const confirmed = allConfirmed ?? [];
  let totalPointsEarned = 0;
  let totalUsdPublisher = 0;

  for (const row of confirmed) {
    totalPointsEarned += row.points ?? 0;
    totalUsdPublisher += Number(row.amount_usd_publisher ?? 0);
  }

  return {
    installs: installs ?? 0,
    confirmedSurveys: confirmed.length,
    totalPointsEarned,
    totalUsdPublisher,
    recentEvents: (recent ?? []).map((row) => ({
      transId: row.external_trans_id,
      points: row.points,
      status: row.status,
      createdAt: row.created_at,
      extensionUserId: row.extension_user_id,
    })),
  };
}

function getPublicStatsJson(): PublicStats {
  const store = readLedgerStore();
  const entries = Object.values(store.entries);
  const confirmed = entries.filter((e) => e.status === 'confirmed');

  return {
    installs: new Set(entries.map((e) => e.userId)).size,
    confirmedSurveys: confirmed.length,
    totalPointsEarned: confirmed.reduce((s, e) => s + e.tokens, 0),
    totalUsdPublisher: confirmed.reduce((s, e) => s + e.amountUsd, 0),
    recentEvents: entries
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 15)
      .map((e) => ({
        transId: e.transId,
        points: e.tokens,
        status: e.status,
        createdAt: e.updatedAt,
        extensionUserId: e.userId,
      })),
  };
}
