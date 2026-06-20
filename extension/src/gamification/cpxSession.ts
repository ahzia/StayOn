import * as vscode from 'vscode';
import type { CpxPausedSession, CpxSurveyTask } from '../types';

export const CPX_SESSION_KEY = 'stayon.cpxSession';

export function getPausedCpxSession(
  context: vscode.ExtensionContext
): CpxPausedSession | undefined {
  return context.globalState.get<CpxPausedSession>(CPX_SESSION_KEY);
}

export async function savePausedCpxSession(
  context: vscode.ExtensionContext,
  session: CpxPausedSession
): Promise<void> {
  await context.globalState.update(CPX_SESSION_KEY, session);
}

export async function clearPausedCpxSession(context: vscode.ExtensionContext): Promise<void> {
  await context.globalState.update(CPX_SESSION_KEY, undefined);
}

export function taskFromPausedSession(session: CpxPausedSession): CpxSurveyTask {
  return {
    kind: 'cpx',
    id: 'cpx-wall',
    iframeUrl: session.iframeUrl,
    label: session.label,
    inventoryType: 'cpx-wall',
    resumed: true,
  };
}

export function pausedSessionFromTask(task: CpxSurveyTask): CpxPausedSession {
  return {
    iframeUrl: task.iframeUrl,
    inventoryType: 'cpx-wall',
    label: task.label,
    pausedAt: new Date().toISOString(),
  };
}
