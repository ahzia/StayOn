import type { LearnTask, TaskMode, TaskPayload, Wallet } from '../types';
import { pickRandomLearn, pickTask } from './taskBank';
import { awardTokens } from './streaks';
import type { AwardResult } from './streaks';
import { redeemPerk as applyPerkRedemption } from './perks';

export class TaskSession {
  private currentTask: TaskPayload | undefined;
  /** Local task finished (learn, etc.) — not CPX iframe open */
  private completedThisWait = false;
  private taskRewardEarned = 0;
  private waitSessionId = '';
  private cpxEngaged = false;
  private surveyPersistAfterReady = false;

  reset(): void {
    this.currentTask = undefined;
    this.completedThisWait = false;
    this.taskRewardEarned = 0;
    this.waitSessionId = '';
    this.cpxEngaged = false;
    this.surveyPersistAfterReady = false;
  }

  startWait(mode: TaskMode, task?: TaskPayload): TaskPayload {
    this.completedThisWait = false;
    this.taskRewardEarned = 0;
    this.waitSessionId = `wait-${Date.now()}`;
    this.cpxEngaged = false;
    this.surveyPersistAfterReady = false;
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

  isCpxSurveyActive(): boolean {
    return this.currentTask?.kind === 'cpx';
  }

  isCpxEngaged(): boolean {
    return this.cpxEngaged;
  }

  shouldPersistCpxSurvey(): boolean {
    return this.isCpxSurveyActive() && this.cpxEngaged && !this.completedThisWait;
  }

  markSurveyPersist(): void {
    this.surveyPersistAfterReady = true;
  }

  isSurveyPersisted(): boolean {
    return this.surveyPersistAfterReady;
  }

  clearSurveyPersist(): void {
    this.surveyPersistAfterReady = false;
    this.reset();
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
    if (this.currentTask?.kind === 'cpx') {
      this.cpxEngaged = true;
    }
  }

  onCpxRewardReceived(): void {
    this.completedThisWait = true;
    this.surveyPersistAfterReady = false;
  }

  private finishTask(wallet: Wallet, reward: number, label: string): AwardResult {
    this.completedThisWait = true;
    const result = awardTokens(wallet, reward, 10, label, 'task');
    this.taskRewardEarned = result.tokens;
    return result;
  }
}
