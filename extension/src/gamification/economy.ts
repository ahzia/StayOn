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
  /** Learn mode — engagement only; paid CPX tasks are 50–500+ ⭐ */
  LEARN_REWARD: 1,
  PERKS: {
    CONTEXT_PIN: 10,
    FLOW_BOOST: 25,
    LEARN_REFRESH: 5,
    STREAK_SHIELD: 40,
  },
  FLOW_BOOST_BONUS: 15,
} as const;

/** CPX survey points: 1000 points = $1 (matches CPX publisher Reward Settings). */
export const CPX_POINTS_PER_USD = 1000;

export function cpxCashEstimate(earnedPoints: number): string {
  const usd = earnedPoints / CPX_POINTS_PER_USD;
  return `≈ $${usd.toFixed(2)}`;
}

export function cashEstimate(tokens: number): string {
  return cpxCashEstimate(tokens);
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
