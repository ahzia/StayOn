import { ensureExtensionInstall } from '@/lib/db/extensionInstalls';
import { createServiceClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/userProfile';

function mapRow(row: {
  extension_user_id: string;
  email: string;
  birthday_year: number;
  birthday_month: number;
  birthday_day: number;
  gender: string | null;
  country_code: string | null;
  zip_code: string | null;
  completed_at: string;
}): UserProfile {
  return {
    userId: row.extension_user_id,
    email: row.email,
    birthdayYear: row.birthday_year,
    birthdayMonth: row.birthday_month,
    birthdayDay: row.birthday_day,
    gender: row.gender === 'm' || row.gender === 'f' ? row.gender : undefined,
    countryCode: row.country_code ?? undefined,
    zipCode: row.zip_code ?? undefined,
    completedAt: row.completed_at,
  };
}

export async function getProfileSupabase(userId: string): Promise<UserProfile | undefined> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('survey_profiles')
    .select('*')
    .eq('extension_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`survey_profiles read failed: ${error.message}`);
  }

  return data ? mapRow(data) : undefined;
}

export async function saveProfileSupabase(
  userId: string,
  input: Omit<UserProfile, 'userId' | 'completedAt'>
): Promise<UserProfile> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('survey_profiles')
    .upsert(
      {
        extension_user_id: userId,
        email: input.email,
        birthday_year: input.birthdayYear,
        birthday_month: input.birthdayMonth,
        birthday_day: input.birthdayDay,
        gender: input.gender ?? null,
        country_code: input.countryCode ?? null,
        zip_code: input.zipCode ?? null,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: 'extension_user_id' }
    )
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`survey_profiles upsert failed: ${error?.message ?? 'no row'}`);
  }

  return mapRow(data);
}

export async function deleteProfileSupabase(userId: string): Promise<boolean> {
  await ensureExtensionInstall(userId);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('survey_profiles')
    .delete()
    .eq('extension_user_id', userId)
    .select('extension_user_id');

  if (error) {
    throw new Error(`survey_profiles delete failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}
