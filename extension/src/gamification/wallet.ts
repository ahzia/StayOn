import { levelFromXp, xpForNextLevel } from './levels';
import { cashEstimate } from './economy';
import type { Wallet, WalletSnapshot } from '../types';

export const WALLET_KEY = 'stayon.wallet';

export function defaultWallet(): Wallet {
  const today = todayStr();
  return {
    tokens: 0,
    totalXp: 0,
    level: 1,
    dailyStreak: 0,
    waitStreak: 0,
    lastActiveDate: '',
    badges: [],
    history: [],
    dailyChallenge: {
      id: 'tasks_3',
      progress: 0,
      target: 3,
      completed: false,
      label: 'Complete 3 wait-tasks today',
      reward: 30,
    },
    totalTasks: 0,
    focusSessions: 0,
    subagentTasks: 0,
    waitsCompleted: 0,
    tasksToday: 0,
    tasksTodayDate: today,
    flowBoostPending: false,
    streakShieldPending: false,
    contextPinned: false,
  };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toSnapshot(wallet: Wallet): WalletSnapshot {
  const level = levelFromXp(wallet.totalXp);
  const xpNext = xpForNextLevel(level);
  const xpPrev = level > 1 ? xpForNextLevel(level - 1) : 0;
  const xpInLevel = wallet.totalXp - xpPrev;
  const xpSpan = xpNext - xpPrev;

  return {
    tokens: wallet.tokens,
    cashEstimate: cashEstimate(wallet.tokens),
    level,
    xp: wallet.totalXp,
    xpForNext: xpNext,
    xpProgress: xpSpan > 0 ? Math.min(100, Math.round((xpInLevel / xpSpan) * 100)) : 100,
    dailyStreak: wallet.dailyStreak,
    waitStreak: wallet.waitStreak,
    badges: wallet.badges,
    history: wallet.history.slice(0, 20),
    dailyChallenge: wallet.dailyChallenge,
    activePerks: activePerkLabels(wallet),
    stats: {
      totalTasks: wallet.totalTasks,
      waitsCompleted: wallet.waitsCompleted,
      tasksToday: wallet.tasksToday,
    },
  };
}

export function addLedgerEntry(
  wallet: Wallet,
  type: Wallet['history'][0]['type'],
  tokens: number,
  label: string
): void {
  wallet.history.unshift({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    type,
    tokens,
    label,
  });
  if (wallet.history.length > 50) {
    wallet.history.length = 50;
  }
}

export function resetDailyCountersIfNeeded(wallet: Wallet): void {
  const today = todayStr();
  if (wallet.tasksTodayDate !== today) {
    wallet.tasksToday = 0;
    wallet.tasksTodayDate = today;
    wallet.dailyChallenge = {
      ...defaultWallet().dailyChallenge,
      progress: 0,
      completed: false,
    };
  }
}

function activePerkLabels(wallet: Wallet): string[] {
  const labels: string[] = [];
  if (wallet.contextPinned) {
    labels.push('Context pinned');
  }
  if (wallet.flowBoostPending) {
    labels.push('Flow boost');
  }
  if (wallet.streakShieldPending) {
    labels.push('Streak shield');
  }
  return labels;
}
