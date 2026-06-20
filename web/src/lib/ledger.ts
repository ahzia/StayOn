import fs from 'fs';
import path from 'path';

export type LedgerStatus = 'pending' | 'confirmed' | 'canceled';

export type LedgerEntry = {
  transId: string;
  userId: string;
  status: LedgerStatus;
  cpxStatus: string;
  type: string;
  amountUsd: number;
  amountLocal: number;
  tokens: number;
  offerId: string;
  subId1: string;
  subId2: string;
  ipClick: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
};

type LedgerStore = {
  entries: Record<string, LedgerEntry>;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const LEDGER_PATH = path.join(DATA_DIR, 'ledger.json');

function ensureStore(): LedgerStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEDGER_PATH)) {
    const empty: LedgerStore = { entries: {} };
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')) as LedgerStore;
}

function saveStore(store: LedgerStore): void {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(store, null, 2));
}

export function upsertPostback(entry: Omit<LedgerEntry, 'createdAt' | 'updatedAt' | 'synced'> & { synced?: boolean }): LedgerEntry {
  const store = ensureStore();
  const now = new Date().toISOString();
  const existing = store.entries[entry.transId];

  const record: LedgerEntry = {
    ...entry,
    synced: entry.synced ?? existing?.synced ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  store.entries[entry.transId] = record;
  saveStore(store);
  return record;
}

export function getPendingForUser(userId: string): LedgerEntry[] {
  const store = ensureStore();
  return Object.values(store.entries).filter(
    (e) => e.userId === userId && !e.synced && e.status === 'confirmed' && e.tokens > 0
  );
}

export function markSynced(userId: string, transIds: string[]): number {
  const store = ensureStore();
  let count = 0;
  for (const transId of transIds) {
    const entry = store.entries[transId];
    if (entry && entry.userId === userId && !entry.synced) {
      entry.synced = true;
      entry.updatedAt = new Date().toISOString();
      count += 1;
    }
  }
  saveStore(store);
  return count;
}

export function getUserSummary(userId: string): { confirmedTokens: number; pendingTokens: number; events: number } {
  const store = ensureStore();
  const rows = Object.values(store.entries).filter((e) => e.userId === userId);
  let confirmedTokens = 0;
  let pendingTokens = 0;

  for (const row of rows) {
    if (row.status === 'confirmed') {
      if (row.synced) {
        confirmedTokens += row.tokens;
      } else {
        pendingTokens += row.tokens;
      }
    }
  }

  return { confirmedTokens, pendingTokens, events: rows.length };
}
