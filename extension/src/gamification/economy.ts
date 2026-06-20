export const ECONOMY = {
  /** 1 point ≈ €0.0001 — wallet field is still `tokens` in persisted state */
  POINT_TO_EUR: 0.0001,
  TOKEN_TO_EUR: 0.0001,
  FLOW_BONUS: 5,
  REDEEM_MIN_POINTS: 5000,
  REDEEM_MIN_TOKENS: 5000,
  QUIZ_REWARD: { min: 8, max: 15 },
  SPONSORED_VIEW: 5,
  SPONSORED_CLICK: 50,
  FOCUS_REWARD: 12,
  LEARN_REWARD: 10,
} as const;

export function cashEstimate(tokens: number): string {
  const eur = tokens * ECONOMY.TOKEN_TO_EUR;
  return `≈ €${eur.toFixed(2)}`;
}

export function streakMultiplier(dailyStreak: number): number {
  if (dailyStreak >= 14) {
    return 1.5;
  }
  if (dailyStreak >= 7) {
    return 1.25;
  }
  if (dailyStreak >= 3) {
    return 1.1;
  }
  return 1;
}
