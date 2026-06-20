/**
 * One-time migration: web/.data/*.json → Supabase
 *
 * Usage:
 *   cd web && node --env-file=.env.local --import tsx scripts/migrate-json-to-supabase.ts
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { ensureExtensionInstall } from '../src/lib/db/extensionInstalls';
import { upsertPostbackSupabase } from '../src/lib/ledger-supabase';
import { saveProfileSupabase } from '../src/lib/userProfile-supabase';
import { isSupabaseConfigured } from '../src/lib/storage';
import { getCpxConfig } from '../src/lib/env';

const DATA_DIR = path.join(process.cwd(), '.data');

async function main(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  }

  const { userShare } = getCpxConfig();
  let profiles = 0;
  let ledger = 0;

  const profilePath = path.join(DATA_DIR, 'user-profiles.json');
  if (existsSync(profilePath)) {
    const store = JSON.parse(readFileSync(profilePath, 'utf8')) as {
      profiles: Record<
        string,
        {
          userId: string;
          email: string;
          birthdayYear: number;
          birthdayMonth: number;
          birthdayDay: number;
          gender?: 'm' | 'f';
          countryCode?: string;
          zipCode?: string;
        }
      >;
    };

    for (const profile of Object.values(store.profiles)) {
      await saveProfileSupabase(profile.userId, {
        email: profile.email,
        birthdayYear: profile.birthdayYear,
        birthdayMonth: profile.birthdayMonth,
        birthdayDay: profile.birthdayDay,
        gender: profile.gender,
        countryCode: profile.countryCode,
        zipCode: profile.zipCode,
      });
      profiles += 1;
    }
  }

  const ledgerPath = path.join(DATA_DIR, 'ledger.json');
  if (existsSync(ledgerPath)) {
    const store = JSON.parse(readFileSync(ledgerPath, 'utf8')) as {
      entries: Record<
        string,
        {
          transId: string;
          userId: string;
          status: 'pending' | 'confirmed' | 'canceled';
          cpxStatus: string;
          type: string;
          amountUsd: number;
          amountLocal: number;
          tokens: number;
          offerId: string;
          subId1: string;
          subId2: string;
          ipClick: string;
        }
      >;
    };

    for (const entry of Object.values(store.entries)) {
      await ensureExtensionInstall(entry.userId);
      await upsertPostbackSupabase(
        {
          transId: entry.transId,
          userId: entry.userId,
          status: entry.status,
          cpxStatus: entry.cpxStatus,
          type: entry.type,
          amountUsd: entry.amountUsd,
          amountLocal: entry.amountLocal,
          tokens: entry.tokens,
          offerId: entry.offerId,
          subId1: entry.subId1,
          subId2: entry.subId2,
          ipClick: entry.ipClick,
        },
        userShare
      );
      ledger += 1;
    }
  }

  console.log(`Migrated ${profiles} profile(s) and ${ledger} ledger entry(ies) to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
