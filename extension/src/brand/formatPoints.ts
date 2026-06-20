/** User-facing point formatting — see docs/11_branding.md */

/** Star icon shown beside point amounts in the UI */
export const POINT_STAR = '⭐';

export function formatPoints(amount: number, compact = false): string {
  const n = Math.round(amount);
  const abs = Math.abs(n).toLocaleString();
  if (compact) {
    return `${abs} ${POINT_STAR}`;
  }
  const label = n === 1 ? 'point' : 'points';
  return `${abs} ${label} ${POINT_STAR}`;
}

export function formatPointsDelta(amount: number, compact = false): string {
  const prefix = amount >= 0 ? '+' : '';
  if (compact) {
    return `${prefix}${Math.abs(Math.round(amount)).toLocaleString()} ${POINT_STAR}`;
  }
  const n = Math.round(amount);
  const abs = Math.abs(n).toLocaleString();
  const label = Math.abs(n) === 1 ? 'point' : 'points';
  return `${prefix}${abs} ${label} ${POINT_STAR}`;
}

export function formatRewardTag(amount: number): string {
  return `+${Math.round(amount)} ${POINT_STAR}`;
}

/** HTML snippet with codicon star for rich displays */
export function formatPointsHtml(amount: number, compact = false): string {
  const text = formatPoints(amount, compact);
  return `<span class="points-display">${text}</span>`;
}
