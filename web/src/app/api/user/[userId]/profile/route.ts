import { NextResponse } from 'next/server';
import {
  deleteProfile,
  getProfile,
  isProfileComplete,
  maskEmail,
  saveProfile,
} from '@/lib/userProfile';

export const dynamic = 'force-dynamic';

type ProfileBody = {
  email?: string;
  birthdayYear?: number;
  birthdayMonth?: number;
  birthdayDay?: number;
  gender?: 'm' | 'f';
  countryCode?: string;
  zipCode?: string;
};

function validateBody(body: ProfileBody): string | null {
  const email = body.email?.trim().toLowerCase() ?? '';
  if (!email || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return 'Valid email required (no commas or spaces)';
  }

  const year = Number(body.birthdayYear);
  const month = Number(body.birthdayMonth);
  const day = Number(body.birthdayDay);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > currentYear - 13) {
    return 'Valid birth year required (13+ years old)';
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return 'Valid birth month required';
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return 'Valid birth day required';
  }

  if (body.gender && body.gender !== 'm' && body.gender !== 'f') {
    return 'Gender must be m or f';
  }

  if (body.countryCode && !/^[A-Za-z]{2}$/.test(body.countryCode)) {
    return 'Country code must be 2 letters (e.g. US)';
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const profile = await getProfile(userId);
  const completed = await isProfileComplete(userId);

  return NextResponse.json({
    ok: true,
    completed,
    profile: profile
      ? {
          emailMasked: maskEmail(profile.email),
          birthdayYear: profile.birthdayYear,
          gender: profile.gender,
          countryCode: profile.countryCode,
          completedAt: profile.completedAt,
        }
      : null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  let body: ProfileBody;
  try {
    body = (await request.json()) as ProfileBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const error = validateBody(body);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const record = await saveProfile(userId, {
    email: body.email!.trim().toLowerCase(),
    birthdayYear: Number(body.birthdayYear),
    birthdayMonth: Number(body.birthdayMonth),
    birthdayDay: Number(body.birthdayDay),
    gender: body.gender,
    countryCode: body.countryCode?.toUpperCase(),
    zipCode: body.zipCode?.trim(),
  });

  return NextResponse.json({
    ok: true,
    completed: true,
    profile: {
      emailMasked: maskEmail(record.email),
      birthdayYear: record.birthdayYear,
      gender: record.gender,
      countryCode: record.countryCode,
      completedAt: record.completedAt,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const removed = await deleteProfile(userId);
  return NextResponse.json({ ok: true, removed });
}
