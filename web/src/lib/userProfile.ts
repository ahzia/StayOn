import fs from 'fs';
import path from 'path';

/** Minimal survey targeting — DB-ready shape for a future users table. */
export type UserProfile = {
  userId: string;
  email: string;
  birthdayYear: number;
  birthdayMonth: number;
  birthdayDay: number;
  gender?: 'm' | 'f';
  countryCode?: string;
  zipCode?: string;
  completedAt: string;
};

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

export function getProfile(userId: string): UserProfile | undefined {
  const store = ensureStore();
  return store.profiles[userId];
}

export function isProfileComplete(userId: string): boolean {
  const profile = getProfile(userId);
  return Boolean(profile?.email && profile?.birthdayYear && profile?.completedAt);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function saveProfile(
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
