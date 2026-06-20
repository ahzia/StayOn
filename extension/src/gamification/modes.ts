import type { SectionMeta, TaskMode } from '../types';

export const SECTION_META: SectionMeta[] = [
  {
    id: 'surveys',
    title: 'Surveys',
    subtitle: 'Real paid surveys via CPX Research',
    earnLabel: '50–500+ ⭐ per complete',
  },
  {
    id: 'learn',
    title: 'Learn',
    subtitle: 'Short dev tips matched to your stack',
    earnLabel: '1 ⭐ per card',
  },
  {
    id: 'perks',
    title: 'Perks',
    subtitle: 'Spend points on workflow boosts',
    earnLabel: '5–40 ⭐ each',
  },
];

export function normalizeMode(raw: string | undefined): TaskMode {
  if (raw === 'earn' || raw === 'surveys') {
    return 'surveys';
  }
  if (raw === 'focus' || raw === 'perks') {
    return 'perks';
  }
  if (raw === 'learn') {
    return 'learn';
  }
  return 'surveys';
}
