import {
  deleteProfileJson,
  getProfileJson,
  saveProfileJson,
} from '@/lib/userProfile-json';
import {
  deleteProfileSupabase,
  getProfileSupabase,
  saveProfileSupabase,
} from '@/lib/userProfile-supabase';
import { useSupabaseStorage } from '@/lib/storage';

/** Minimal survey targeting — matches Supabase `survey_profiles`. */
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

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  if (useSupabaseStorage()) {
    return getProfileSupabase(userId);
  }
  return getProfileJson(userId);
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return Boolean(profile?.email && profile?.birthdayYear && profile?.completedAt);
}

export async function saveProfile(
  userId: string,
  input: Omit<UserProfile, 'userId' | 'completedAt'>
): Promise<UserProfile> {
  if (useSupabaseStorage()) {
    return saveProfileSupabase(userId, input);
  }
  return saveProfileJson(userId, input);
}

export async function deleteProfile(userId: string): Promise<boolean> {
  if (useSupabaseStorage()) {
    return deleteProfileSupabase(userId);
  }
  return deleteProfileJson(userId);
}
