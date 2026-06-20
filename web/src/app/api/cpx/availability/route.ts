import { NextResponse } from 'next/server';
import { cpxSecureHash } from '@/lib/cpx';
import { getCpxConfig, isCpxConfigured } from '@/lib/env';
import { getProfile } from '@/lib/userProfile';

export const dynamic = 'force-dynamic';

/** Dev/diagnostic: how many CPX surveys match this userId + profile + caller IP. */
export async function GET(request: Request) {
  if (!isCpxConfigured()) {
    return NextResponse.json({ ok: false, error: 'CPX not configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') ?? '';
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const { appId, secret } = getCpxConfig();
  const profile = await getProfile(userId);
  const secureHash = cpxSecureHash(userId, secret);

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = encodeURIComponent(request.headers.get('user-agent') ?? 'StayOn');

  const qs = new URLSearchParams({
    app_id: appId,
    ext_user_id: userId,
    output_method: 'api',
    ip_user: ip,
    user_agent: userAgent,
    limit: '12',
    secure_hash: secureHash,
  });

  if (profile?.email) {
    qs.set('email', profile.email);
    qs.set('username', profile.email.split('@')[0]);
  }
  if (profile?.birthdayYear && profile?.birthdayMonth && profile?.birthdayDay) {
    qs.set('main_info', 'true');
    qs.set('birthday_year', String(profile.birthdayYear));
    qs.set('birthday_month', String(profile.birthdayMonth));
    qs.set('birthday_day', String(profile.birthdayDay));
  }
  if (profile?.gender) {
    qs.set('gender', profile.gender);
  }
  if (profile?.countryCode) {
    qs.set('user_country_code', profile.countryCode);
  }

  try {
    const res = await fetch(
      `https://live-api.cpx-research.com/api/get-surveys.php?${qs.toString()}`,
      { next: { revalidate: 0 } }
    );
    const data = (await res.json()) as {
      status?: string;
      count_returned_surveys?: number;
      count_available_surveys?: number;
    };

    const count = data.count_returned_surveys ?? 0;
    return NextResponse.json({
      ok: true,
      surveyCount: count,
      available: count > 0,
      profileEmailValid: profile?.email
        ? /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(profile.email)
        : null,
      countryCode: profile?.countryCode ?? null,
      hint:
        count === 0
          ? 'CPX returned 0 surveys for this ext_user_id. Try Reset Survey Identity in the extension, fix profile email, or check CPX publisher dashboard.'
          : undefined,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
