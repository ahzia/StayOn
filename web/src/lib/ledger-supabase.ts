import { CPX_POINTS_PER_USD } from '@/lib/cpx';
import type { LedgerEntry } from '@/lib/ledger-types';
import { createServiceClient } from '@/lib/supabase/server';

type RewardRow = {
  id: string;
  external_trans_id: string;
  extension_user_id: string;
  provider_status: string;
  event_type: string;
  status: string;
  amount_usd_publisher: number;
  amount_local?: number;
  points: number;
  offer_id: string;
  session_id: string;
  ip_click: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function creditedPoints(status: string, points: number): number {
  return status === 'confirmed' ? points : 0;
}

function mapRow(row: RewardRow, synced: boolean): LedgerEntry {
  const metadata = row.metadata ?? {};
  return {
    transId: row.external_trans_id,
    userId: row.extension_user_id,
    status: row.status as LedgerEntry['status'],
    cpxStatus: row.provider_status,
    type: row.event_type,
    amountUsd: Number(row.amount_usd_publisher),
    amountLocal: Number(metadata.amount_local ?? 0),
    tokens: row.points,
    offerId: row.offer_id,
    subId1: row.session_id,
    subId2: String(metadata.sub_id_2 ?? ''),
    ipClick: row.ip_click,
    synced,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getAckedEventIds(extensionUserId: string): Promise<Set<string>> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('reward_sync_acks')
    .select('reward_event_id')
    .eq('extension_user_id', extensionUserId);

  if (error) {
    throw new Error(`reward_sync_acks read failed: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.reward_event_id));
}

async function isEventSynced(extensionUserId: string, eventId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('reward_sync_acks')
    .select('reward_event_id')
    .eq('extension_user_id', extensionUserId)
    .eq('reward_event_id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`reward_sync_acks lookup failed: ${error.message}`);
  }

  return Boolean(data);
}

export async function upsertPostbackSupabase(
  entry: Omit<LedgerEntry, 'createdAt' | 'updatedAt' | 'synced'> & { synced?: boolean },
  userUsdShare: number
): Promise<LedgerEntry> {
  await ensureExtensionInstall(entry.userId);
  const supabase = createServiceClient();

  const { data: existing, error: existingError } = await supabase
    .from('reward_events')
    .select('*')
    .eq('external_trans_id', entry.transId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`reward_events lookup failed: ${existingError.message}`);
  }

  const oldCredit = existing ? creditedPoints(existing.status, existing.points) : 0;
  const newCredit = creditedPoints(entry.status, entry.tokens);
  const delta = newCredit - oldCredit;

  const now = new Date().toISOString();
  const { data: upserted, error: upsertError } = await supabase
    .from('reward_events')
    .upsert(
      {
        external_trans_id: entry.transId,
        extension_user_id: entry.userId,
        provider: 'cpx',
        provider_status: entry.cpxStatus,
        event_type: entry.type,
        status: entry.status,
        amount_usd_publisher: entry.amountUsd,
        amount_usd_user_share: userUsdShare,
        points: entry.tokens,
        offer_id: entry.offerId,
        session_id: entry.subId1,
        ip_click: entry.ipClick,
        metadata: {
          sub_id_2: entry.subId2,
          amount_local: entry.amountLocal,
        },
        updated_at: now,
        ...(existing ? {} : { created_at: now }),
      },
      { onConflict: 'external_trans_id' }
    )
    .select('*')
    .single();

  if (upsertError || !upserted) {
    throw new Error(`reward_events upsert failed: ${upsertError?.message ?? 'no row'}`);
  }

  if (delta !== 0) {
    const { error: balanceError } = await supabase.rpc('apply_reward_to_balance', {
      p_extension_user_id: entry.userId,
      p_points_delta: delta,
      p_to_pending: false,
    });
    if (balanceError) {
      throw new Error(`apply_reward_to_balance failed: ${balanceError.message}`);
    }
  }

  const synced = await isEventSynced(entry.userId, upserted.id);
  return mapRow(upserted as RewardRow, synced);
}

export async function getPendingForUserSupabase(userId: string): Promise<LedgerEntry[]> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();
  const ackedIds = await getAckedEventIds(userId);

  const { data, error } = await supabase
    .from('reward_events')
    .select('*')
    .eq('extension_user_id', userId)
    .eq('status', 'confirmed')
    .gt('points', 0)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`reward_events pending read failed: ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => !ackedIds.has(row.id))
    .map((row) => mapRow(row as RewardRow, false));
}

export async function markSyncedSupabase(userId: string, transIds: string[]): Promise<number> {
  if (transIds.length === 0) {
    return 0;
  }

  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();

  const { data: events, error } = await supabase
    .from('reward_events')
    .select('id, external_trans_id')
    .eq('extension_user_id', userId)
    .in('external_trans_id', transIds);

  if (error) {
    throw new Error(`reward_events ack lookup failed: ${error.message}`);
  }

  if (!events?.length) {
    return 0;
  }

  const ackRows = events.map((event) => ({
    extension_user_id: userId,
    reward_event_id: event.id,
  }));

  const { error: ackError } = await supabase
    .from('reward_sync_acks')
    .upsert(ackRows, { onConflict: 'extension_user_id,reward_event_id', ignoreDuplicates: true });

  if (ackError) {
    throw new Error(`reward_sync_acks insert failed: ${ackError.message}`);
  }

  return events.length;
}

export async function getUserSummarySupabase(userId: string): Promise<{
  confirmedTokens: number;
  pendingTokens: number;
  events: number;
  availablePoints: number;
  lifetimeEarnedPoints: number;
}> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();
  const ackedIds = await getAckedEventIds(userId);

  const { data: events, error: eventsError } = await supabase
    .from('reward_events')
    .select('id, status, points')
    .eq('extension_user_id', userId);

  if (eventsError) {
    throw new Error(`reward_events summary read failed: ${eventsError.message}`);
  }

  let confirmedTokens = 0;
  let pendingTokens = 0;

  for (const row of events ?? []) {
    if (row.status !== 'confirmed' || row.points <= 0) {
      continue;
    }
    if (ackedIds.has(row.id)) {
      confirmedTokens += row.points;
    } else {
      pendingTokens += row.points;
    }
  }

  const { data: balance, error: balanceError } = await supabase
    .from('user_balances')
    .select('available_points, lifetime_earned_points')
    .eq('extension_user_id', userId)
    .maybeSingle();

  if (balanceError) {
    throw new Error(`user_balances read failed: ${balanceError.message}`);
  }

  return {
    confirmedTokens,
    pendingTokens,
    events: events?.length ?? 0,
    availablePoints: balance?.available_points ?? 0,
    lifetimeEarnedPoints: balance?.lifetime_earned_points ?? 0,
  };
}

export async function getWalletSummarySupabase(userId: string): Promise<{
  availablePoints: number;
  pendingPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  cashEstimate: string;
  recentEvents: {
    id: string;
    transId: string;
    points: number;
    label: string;
    status: string;
    createdAt: string;
    synced: boolean;
  }[];
}> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();
  const ackedIds = await getAckedEventIds(userId);

  const { data: balance, error: balanceError } = await supabase
    .from('user_balances')
    .select('available_points, pending_points, lifetime_earned_points, lifetime_redeemed_points')
    .eq('extension_user_id', userId)
    .maybeSingle();

  if (balanceError) {
    throw new Error(`user_balances read failed: ${balanceError.message}`);
  }

  const { data: events, error: eventsError } = await supabase
    .from('reward_events')
    .select('*')
    .eq('extension_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (eventsError) {
    throw new Error(`reward_events recent read failed: ${eventsError.message}`);
  }

  const unackedPoints = (events ?? [])
    .filter((row) => row.status === 'confirmed' && row.points > 0 && !ackedIds.has(row.id))
    .reduce((sum, row) => sum + row.points, 0);

  const available = balance?.available_points ?? 0;
  const cashUsd = available / CPX_POINTS_PER_USD;

  return {
    availablePoints: available,
    pendingPoints: unackedPoints,
    lifetimeEarnedPoints: balance?.lifetime_earned_points ?? 0,
    lifetimeRedeemedPoints: balance?.lifetime_redeemed_points ?? 0,
    cashEstimate: `≈ $${cashUsd.toFixed(2)}`,
    recentEvents: (events ?? []).map((row) => ({
      id: row.id,
      transId: row.external_trans_id,
      points: row.points,
      label: `CPX ${row.event_type || 'survey'}`,
      status: row.status,
      createdAt: row.created_at,
      synced: ackedIds.has(row.id),
    })),
  };
}
