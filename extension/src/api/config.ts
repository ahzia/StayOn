import * as crypto from 'crypto';
import * as vscode from 'vscode';

const USER_ID_KEY = 'stayon.userId';

export function getOrCreateUserId(context: vscode.ExtensionContext): string {
  let userId = context.globalState.get<string>(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    void context.globalState.update(USER_ID_KEY, userId);
  }
  return userId;
}

export function getApiBaseUrl(): string | undefined {
  const url = vscode.workspace.getConfiguration('stayon').get<string>('apiBaseUrl')?.trim();
  return url || undefined;
}

export function isCpxEnabled(): boolean {
  const cfg = vscode.workspace.getConfiguration('stayon');
  if (!getApiBaseUrl()) {
    return false;
  }
  return cfg.get<boolean>('cpxSurveys') ?? true;
}
