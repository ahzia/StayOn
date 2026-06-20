import type { WalletSummaryEvent } from '../api/stayonApi';
import { ackRewards, fetchWalletSummary } from '../api/stayonApi';
import { getApiBaseUrl } from '../api/config';
import type { Wallet } from '../types';
import { awardTokens } from '../gamification/streaks';

export class RewardSync {
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly getUserId: () => string,
    private readonly getWallet: () => Wallet,
    private readonly saveWallet: () => Promise<void>,
    private readonly onReward: (tokens: number, label: string) => void,
    private readonly onWalletUpdated: () => void,
    private readonly log: (msg: string) => void
  ) {}

  start(intervalMs = 30_000): void {
    if (!getApiBaseUrl()) {
      return;
    }
    this.stop();
    void this.syncOnce();
    this.timer = setInterval(() => void this.syncOnce(), intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async syncOnce(): Promise<void> {
    if (!getApiBaseUrl()) {
      return;
    }

    try {
      const userId = this.getUserId();
      const summary = await fetchWalletSummary(userId);
      if (!summary.ok) {
        if (summary.error && summary.error !== 'stayon.apiBaseUrl not set') {
          this.log(`Wallet sync: ${summary.error}`);
        }
        return;
      }

      const wallet = this.getWallet();
      const serverEarned = summary.availablePoints ?? 0;
      const previous = wallet.lastServerEarnedPoints ?? 0;
      const newEvents = unsyncedConfirmedEvents(summary.recentEvents);
      const delta = serverEarned - previous;

      if (
        delta > 0 &&
        previous === 0 &&
        wallet.tokens >= serverEarned &&
        newEvents.length === 0
      ) {
        wallet.lastServerEarnedPoints = serverEarned;
        this.log('Wallet baseline aligned with server (legacy migration)');
      } else if (delta > 0) {
        const label = rewardLabel(newEvents, delta);
        const result = awardTokens(wallet, delta, 20, label, 'task');
        this.onReward(result.tokens, label);
        wallet.lastServerEarnedPoints = serverEarned;
        this.log(`Synced +${delta} CPX points from server`);
      } else if (delta < 0) {
        wallet.tokens = Math.max(0, wallet.tokens + delta);
        wallet.lastServerEarnedPoints = serverEarned;
        this.log(`Server balance adjusted by ${delta} points`);
      } else {
        wallet.lastServerEarnedPoints = serverEarned;
      }

      const transIds = newEvents.map((e) => e.transId);
      if (transIds.length > 0) {
        const acked = await ackRewards(userId, transIds);
        if (acked) {
          this.log(`Acked ${transIds.length} reward event(s)`);
        }
      }

      await this.saveWallet();
      this.onWalletUpdated();
    } catch (err) {
      this.log(`Wallet sync failed: ${String(err)}`);
    }
  }
}

function unsyncedConfirmedEvents(events: WalletSummaryEvent[] | undefined): WalletSummaryEvent[] {
  return (events ?? []).filter(
    (e) => !e.synced && e.status === 'confirmed' && e.points > 0
  );
}

function rewardLabel(events: WalletSummaryEvent[], delta: number): string {
  if (events.length === 1) {
    return events[0].label;
  }
  if (events.length > 1) {
    return `CPX · ${events.length} rewards`;
  }
  return `CPX earnings (+${delta} ⭐)`;
}
