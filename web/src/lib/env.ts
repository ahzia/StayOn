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
    userShare: Number(process.env.CPX_USER_SHARE ?? '0.5'),
    skipIpCheck: process.env.CPX_SKIP_IP_CHECK === 'true',
  };
}

export function isCpxConfigured(): boolean {
  const { appId, secret } = getCpxConfig();
  return Boolean(appId && secret);
}
