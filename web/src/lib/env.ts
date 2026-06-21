export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getCpxConfig() {
  return {
    appId: process.env.CPX_APP_ID ?? '',
    secret: process.env.CPX_SECURE_HASH ?? '',
    /** Matches CPX Reward Settings currency factor (1 USD publisher → N Points). */
    currencyFactor: Number(process.env.CPX_CURRENCY_FACTOR ?? '700'),
    userShare: Number(process.env.CPX_USER_SHARE ?? '0.5'),
    skipIpCheck: process.env.CPX_SKIP_IP_CHECK === 'true',
  };
}

export function isCpxConfigured(): boolean {
  const { appId, secret } = getCpxConfig();
  return Boolean(appId && secret);
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
}

/** Supports StayOn env names and standard Supabase names. */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ''
  );
}

export function getSupabaseServiceKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ''
  );
}
