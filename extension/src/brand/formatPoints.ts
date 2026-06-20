/** User-facing point formatting — see docs/11_branding.md */

export function formatPoints(amount: number, compact = false): string {
  const n = Math.round(amount);
  const abs = Math.abs(n).toLocaleString();
  if (compact) {
    return `${abs} pts`;
  }
  const label = n === 1 ? 'point' : 'points';
  return `${abs} ${label}`;
}

export function formatPointsDelta(amount: number, compact = false): string {
  const prefix = amount >= 0 ? '+' : '';
  if (compact) {
    return `${prefix}${Math.abs(Math.round(amount)).toLocaleString()} pts`;
  }
  const n = Math.round(amount);
  const abs = Math.abs(n).toLocaleString();
  const label = Math.abs(n) === 1 ? 'point' : 'points';
  return `${prefix}${abs} ${label}`;
}

export function formatRewardTag(amount: number): string {
  return `+${formatPoints(amount, true)}`;
}
