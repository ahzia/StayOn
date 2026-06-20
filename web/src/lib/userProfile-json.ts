import fs from 'fs';
import path from 'path';
import type { UserProfile } from '@/lib/userProfile';

type ProfileStore = {
  profiles: Record<string, UserProfile>;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const PROFILE_PATH = path.join(DATA_DIR, 'user-profiles.json');

function ensureStore(): ProfileStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROFILE_PATH)) {
    const empty: ProfileStore = { profiles: {} };
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8')) as ProfileStore;
}

function saveStore(store: ProfileStore): void {
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(store, null, 2));
}

export function getProfileJson(userId: string): UserProfile | undefined {
  const store = ensureStore();
  return store.profiles[userId];
}

export function saveProfileJson(
  userId: string,
  input: Omit<UserProfile, 'userId' | 'completedAt'>
): UserProfile {
  const store = ensureStore();
  const record: UserProfile = {
    userId,
    ...input,
    completedAt: new Date().toISOString(),
  };
  store.profiles[userId] = record;
  saveStore(store);
  return record;
}

export function deleteProfileJson(userId: string): boolean {
  const store = ensureStore();
  if (!store.profiles[userId]) {
    return false;
  }
  delete store.profiles[userId];
  saveStore(store);
  return true;
}

export function readProfileStore(): ProfileStore {
  return ensureStore();
}
