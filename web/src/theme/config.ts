/**
 * StayOn theme configuration — TypeScript mirror of CSS tokens.
 * Use for programmatic styling (charts, emails, meta theme-color).
 * @see docs/11_branding.md
 */

export const themeStorageKey = 'stayon-theme' as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export const brand = {
  name: 'StayOn',
  tagline: 'Earn points while your AI agent works',
  currency: {
    singular: 'point',
    plural: 'points',
    compact: 'pts',
  },
} as const;

export const colors = {
  light: {
    brand: '#00A896',
    brandHover: '#008F7F',
    brandForeground: '#FFFFFF',
    brandMuted: '#E6F7F4',
    points: '#D97706',
    pointsForeground: '#451A03',
    pointsMuted: '#FEF3C7',
    accent: '#6366F1',
    accentMuted: '#EEF2FF',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    bg: '#F8FAFC',
    bgSubtle: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    codeBg: '#0F172A',
    codeText: '#E2E8F0',
  },
  dark: {
    brand: '#2DD4BF',
    brandHover: '#5EEAD4',
    brandForeground: '#042F2E',
    brandMuted: '#0D3D38',
    points: '#FBBF24',
    pointsForeground: '#422006',
    pointsMuted: '#422006',
    accent: '#818CF8',
    accentMuted: '#1E1B4B',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    bg: '#0B0F14',
    bgSubtle: '#0F1419',
    surface: '#141B24',
    surfaceRaised: '#1A2332',
    border: '#2A3544',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    codeBg: '#0F1419',
    codeText: '#CBD5E1',
  },
} as const;

export const typography = {
  fontSans: 'var(--font-geist-sans), system-ui, sans-serif',
  fontMono: 'var(--font-geist-mono), ui-monospace, monospace',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  full: '9999px',
} as const;

export const spacing = {
  unit: 4,
  pageX: '1.5rem',
  pageY: '4rem',
  section: '2.5rem',
} as const;

/** Format a point balance for display (always "point"/"points"). */
export function formatPoints(amount: number, compact = false): string {
  const n = Math.round(amount);
  const abs = Math.abs(n).toLocaleString();
  if (compact) {
    return `${abs} ${brand.currency.compact}`;
  }
  const label = n === 1 ? brand.currency.singular : brand.currency.plural;
  return `${abs} ${label}`;
}

/** Meta theme-color for mobile browser chrome */
export function getMetaThemeColor(mode: 'light' | 'dark'): string {
  return mode === 'dark' ? colors.dark.bg : colors.light.bg;
}

export const themeConfig = {
  brand,
  colors,
  typography,
  radii,
  spacing,
  themeStorageKey,
} as const;

export default themeConfig;
