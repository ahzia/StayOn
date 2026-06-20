import type { PendingReward } from '../api/stayonApi';
import { ackRewards, fetchPendingRewards } from '../api/stayonApi';
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
      const res = await fetchPendingRewards(userId);
      if (!res.ok || !res.pending?.length) {
        if (res.error && res.error !== 'stayon.apiBaseUrl not set') {
          this.log(`Reward sync: ${res.error}`);
        }
        return;
      }

      const wallet = this.getWallet();
      const transIds: string[] = [];

      for (const reward of res.pending) {
        this.applyReward(wallet, reward);
        transIds.push(reward.transId);
      }

      await this.saveWallet();
      const acked = await ackRewards(userId, transIds);
      if (acked) {
        this.log(`Synced ${transIds.length} CPX reward(s)`);
      }
    } catch (err) {
      this.log(`Reward sync failed: ${String(err)}`);
    }
  }

  private applyReward(wallet: Wallet, reward: PendingReward): void {
    const result = awardTokens(wallet, reward.tokens, 20, reward.label, 'task');
    this.onReward(result.tokens, reward.label);
  }
}
