import type { TaskMode, TaskPayload, Wallet } from '../types';
import { pickTask, validateQuizAnswer } from './taskBank';
import { awardTokens } from './streaks';
import type { AwardResult } from './streaks';

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

  completeQuiz(wallet: Wallet, taskId: string, answerIndex: number): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'quiz' || task.id !== taskId) {
      return null;
    }
    if (!validateQuizAnswer(task, answerIndex)) {
      return null;
    }
    return this.finishTask(wallet, task.reward, `Quiz: ${task.question.slice(0, 40)}…`);
  }

  completeSponsoredView(wallet: Wallet, taskId: string): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'sponsored' || task.id !== taskId || this.completedThisWait) {
      return null;
    }
    return this.finishTask(wallet, task.viewReward, `Sponsored: ${task.sponsor}`);
  }

  completeSponsoredClick(wallet: Wallet, taskId: string): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'sponsored' || task.id !== taskId) {
      return null;
    }
    if (this.completedThisWait) {
      const extra = awardTokens(wallet, task.clickReward - task.viewReward, 15, `Click: ${task.sponsor}`, 'bonus');
      return extra;
    }
    return this.finishTask(wallet, task.clickReward, `Sponsored click: ${task.sponsor}`);
  }

  completeLearn(wallet: Wallet, taskId: string): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'learn' || task.id !== taskId) {
      return null;
    }
    return this.finishTask(wallet, task.reward, `Learn: ${task.question.slice(0, 40)}…`);
  }

  completeFocus(wallet: Wallet, taskId: string): AwardResult | null {
    const task = this.currentTask;
    if (!task || task.kind !== 'focus' || task.id !== taskId) {
      return null;
    }
    wallet.focusSessions += 1;
    return this.finishTask(wallet, task.reward, 'Focus session');
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
