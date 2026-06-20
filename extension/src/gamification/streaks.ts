import type { Wallet } from '../types';
import { addLedgerEntry, resetDailyCountersIfNeeded, todayStr } from './wallet';
import { ECONOMY, streakMultiplier } from './economy';
import { levelFromXp } from './levels';

export const BADGES = [
  { id: 'first_flow', name: 'First Flow', test: (w: Wallet) => w.totalTasks >= 1 },
  { id: 'streak_3', name: 'Streak Starter', test: (w: Wallet) => w.dailyStreak >= 3 },
  { id: 'streak_7', name: 'On Fire', test: (w: Wallet) => w.dailyStreak >= 7 },
  { id: 'multitasker', name: 'Multitasker', test: (w: Wallet) => w.subagentTasks >= 1 },
  { id: 'focused_10', name: 'Focused', test: (w: Wallet) => w.focusSessions >= 10 },
  { id: 'century', name: 'Century', test: (w: Wallet) => w.totalTasks >= 100 },
] as const;

export interface AwardResult {
  tokens: number;
  xp: number;
  newBadges: { id: string; name: string }[];
  challengeBonus?: number;
}

export function awardTokens(
  wallet: Wallet,
  baseTokens: number,
  xp: number,
  label: string,
  type: 'task' | 'bonus' = 'task'
): AwardResult {
  resetDailyCountersIfNeeded(wallet);
  const mult = streakMultiplier(wallet.dailyStreak);
  const tokens = Math.round(baseTokens * mult);
  wallet.tokens += tokens;
  wallet.totalXp += xp;
  wallet.level = levelFromXp(wallet.totalXp);
  addLedgerEntry(wallet, type, tokens, label);

  if (type === 'task') {
    wallet.totalTasks += 1;
    wallet.tasksToday += 1;
    updateDailyStreak(wallet);
    updateChallenge(wallet);
  }

  const newBadges = unlockBadges(wallet);
  const challengeBonus = completeChallengeIfDone(wallet);

  return { tokens, xp, newBadges, challengeBonus };
}

function updateDailyStreak(wallet: Wallet): void {
  const today = todayStr();
  if (wallet.lastActiveDate === today) {
    return;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.toISOString().slice(0, 10);
  if (wallet.lastActiveDate === y) {
    wallet.dailyStreak += 1;
  } else if (wallet.lastActiveDate === '') {
    wallet.dailyStreak = 1;
  } else {
    wallet.dailyStreak = 1;
  }
  wallet.lastActiveDate = today;
}

function updateChallenge(wallet: Wallet): void {
  if (wallet.dailyChallenge.completed) {
    return;
  }
  wallet.dailyChallenge.progress = Math.min(
    wallet.dailyChallenge.target,
    wallet.tasksToday
  );
}

function completeChallengeIfDone(wallet: Wallet): number | undefined {
  const c = wallet.dailyChallenge;
  if (c.completed || c.progress < c.target) {
    return undefined;
  }
  c.completed = true;
  wallet.tokens += c.reward;
  addLedgerEntry(wallet, 'challenge', c.reward, c.label);
  return c.reward;
}

function unlockBadges(wallet: Wallet): { id: string; name: string }[] {
  const unlocked: { id: string; name: string }[] = [];
  for (const badge of BADGES) {
    if (!wallet.badges.includes(badge.id) && badge.test(wallet)) {
      wallet.badges.push(badge.id);
      unlocked.push({ id: badge.id, name: badge.name });
    }
  }
  return unlocked;
}

export function applyFlowBonus(wallet: Wallet): number {
  const bonus = ECONOMY.FLOW_BONUS;
  wallet.tokens += bonus;
  wallet.waitStreak += 1;
  addLedgerEntry(wallet, 'bonus', bonus, 'Flow bonus');
  return bonus;
}

export function onWaitEndWithoutTask(wallet: Wallet): void {
  wallet.waitStreak = 0;
  wallet.waitsCompleted += 1;
}

export function onWaitEndWithTask(wallet: Wallet): void {
  wallet.waitsCompleted += 1;
}
