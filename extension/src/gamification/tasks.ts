import type { LearnTask, TaskMode, TaskPayload, Wallet } from '../types';
import { pickRandomLearn, pickTask } from './taskBank';
import { awardTokens } from './streaks';
import type { AwardResult } from './streaks';
import { redeemPerk as applyPerkRedemption } from './perks';

export class TaskSession {
  private currentTask: TaskPayload | undefined;
  private completedThisWait = false;
  private taskRewardEarned = 0;
  private waitSessionId = '';

  reset(): void {
    this.currentTask = undefined;
    this.completedThisWait = false;
    this.taskRewardEarned = 0;
    this.waitSessionId = '';
  }

  startWait(mode: TaskMode, task?: TaskPayload): TaskPayload {
    this.completedThisWait = false;
    this.taskRewardEarned = 0;
    this.waitSessionId = `wait-${Date.now()}`;
    this.currentTask = task ?? pickTask(mode);
    return this.currentTask;
  }

  setTask(task: TaskPayload): void {
    this.currentTask = task;
  }

  getWaitSessionId(): string {
    return this.waitSessionId;
  }

  getCurrentTask(): TaskPayload | undefined {
    return this.currentTask;
  }

  hasCompletedTask(): boolean {
    return this.completedThisWait;
  }

  getTaskRewardEarned(): number {
    return this.taskRewardEarned;
  }

  completeLearn(wallet: Wallet, taskId: string): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'learn' || task.id !== taskId) {
      return null;
    }
    return this.finishTask(wallet, task.reward, `Learn: ${task.question.slice(0, 40)}…`);
  }

  redeemPerk(wallet: Wallet, perkId: string): { ok: boolean; error?: string } {
    return applyPerkRedemption(wallet, perkId);
  }

  refreshLearnTask(): LearnTask {
    const task = pickRandomLearn();
    this.currentTask = task;
    return task;
  }

  noteCpxEngaged(): void {
    const task = this.currentTask;
    if (task?.kind === 'cpx' && !this.completedThisWait) {
      this.completedThisWait = true;
    }
  }

  private finishTask(wallet: Wallet, reward: number, label: string): AwardResult {
    this.completedThisWait = true;
    const result = awardTokens(wallet, reward, 10, label, 'task');
    this.taskRewardEarned = result.tokens;
    return result;
  }
}
