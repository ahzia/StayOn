import { NextResponse } from 'next/server';
import { buildSurveyWallUrl } from '@/lib/cpx';
import { getCpxConfig, isCpxConfigured } from '@/lib/env';
import { getProfile, isProfileComplete } from '@/lib/userProfile';

export const dynamic = 'force-dynamic';

/** Extension calls this to get a CPX SurveyWall iframe URL (secrets stay server-side). */
export async function GET(request: Request) {
  if (!isCpxConfigured()) {
    return NextResponse.json({ ok: false, error: 'CPX not configured on server' }, { status: 503 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ?? '';
  const subId1 = url.searchParams.get('subId1') ?? '';
  const subId2 = url.searchParams.get('subId2') ?? '';

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const { appId, secret } = getCpxConfig();
  const stored = await getProfile(userId);
  const profileComplete = await isProfileComplete(userId);

  const iframeUrl = buildSurveyWallUrl({
    appId,
    extUserId: userId,
    secret,
    subId1,
    subId2,
    profile: stored
      ? {
          email: stored.email,
          username: stored.email.split('@')[0],
          birthdayYear: stored.birthdayYear,
          birthdayMonth: stored.birthdayMonth,
          birthdayDay: stored.birthdayDay,
          gender: stored.gender,
          countryCode: stored.countryCode,
          zipCode: stored.zipCode,
        }
      : undefined,
  });

  return NextResponse.json({
    ok: true,
    iframeUrl,
    refreshSeconds: 120,
    profileComplete,
  });
}
