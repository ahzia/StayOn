import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { BUNDLED_API_BASE_URL } from './defaults';

const USER_ID_KEY = 'stayon.userId';

export function getOrCreateUserId(context: vscode.ExtensionContext): string {
  let userId = context.globalState.get<string>(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    void context.globalState.update(USER_ID_KEY, userId);
  }
  return userId;
}

export async function resetSurveyIdentity(context: vscode.ExtensionContext): Promise<string> {
  const userId = crypto.randomUUID();
  await context.globalState.update(USER_ID_KEY, userId);
  return userId;
}

/** User setting → package.json default → bundled release URL */
export function getApiBaseUrl(): string | undefined {
  const cfg = vscode.workspace.getConfiguration('stayon');
  const fromSetting = cfg.get<string>('apiBaseUrl')?.trim();
  if (fromSetting) {
    return fromSetting.replace(/\/$/, '');
  }
  const fromPackageDefault = cfg.inspect<string>('apiBaseUrl')?.defaultValue?.trim();
  if (fromPackageDefault) {
    return fromPackageDefault.replace(/\/$/, '');
  }
  const bundled = BUNDLED_API_BASE_URL.trim();
  return bundled ? bundled.replace(/\/$/, '') : undefined;
}

export function isCpxEnabled(): boolean {
  const cfg = vscode.workspace.getConfiguration('stayon');
  if (!getApiBaseUrl()) {
    return false;
  }
  return cfg.get<boolean>('cpxSurveys') ?? true;
}
