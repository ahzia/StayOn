import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface HookVerifyResult {
  hooksJsonExists: boolean;
  hookScriptExists: boolean;
  hookScriptExecutable: boolean;
  hookEvents: string[];
  message: string;
}

export function verifyHookSetup(workspaceRoot: string | undefined): HookVerifyResult {
  if (!workspaceRoot) {
    return {
      hooksJsonExists: false,
      hookScriptExists: false,
      hookScriptExecutable: false,
      hookEvents: [],
      message: 'Open the StayOn project folder in Cursor to use project hooks.',
    };
  }

  const hooksJsonPath = path.join(workspaceRoot, '.cursor', 'hooks.json');
  const hookScriptPath = path.join(workspaceRoot, '.cursor', 'hooks', 'stayon-event.sh');

  const hooksJsonExists = fs.existsSync(hooksJsonPath);
  const hookScriptExists = fs.existsSync(hookScriptPath);
  let hookScriptExecutable = false;
  let hookEvents: string[] = [];

  if (hookScriptExists) {
    try {
      fs.accessSync(hookScriptPath, fs.constants.X_OK);
      hookScriptExecutable = true;
    } catch {
      hookScriptExecutable = false;
    }
  }

  if (hooksJsonExists) {
    try {
      const raw = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8')) as {
        hooks?: Record<string, unknown[]>;
      };
      hookEvents = Object.keys(raw.hooks ?? {});
    } catch {
      hookEvents = [];
    }
  }

  const ok = hooksJsonExists && hookScriptExists && hookScriptExecutable;
  let message: string;
  if (ok) {
    message =
      'Hooks look good. Trust them in Cursor Settings → Hooks, then run a Cursor Agent prompt.';
  } else if (!hooksJsonExists) {
    message = 'Missing .cursor/hooks.json in workspace root.';
  } else if (!hookScriptExists) {
    message = 'Missing .cursor/hooks/stayon-event.sh';
  } else {
    message = 'Hook script is not executable. Run: chmod +x .cursor/hooks/stayon-event.sh';
  }

  return {
    hooksJsonExists,
    hookScriptExists,
    hookScriptExecutable,
    hookEvents,
    message,
  };
}

export async function showHookVerifyUI(
  workspaceRoot: string | undefined
): Promise<HookVerifyResult> {
  const result = verifyHookSetup(workspaceRoot);
  const detail = [
    result.message,
    '',
    `hooks.json: ${result.hooksJsonExists ? '✓' : '✗'}`,
    `stayon-event.sh: ${result.hookScriptExists ? '✓' : '✗'}`,
    `executable: ${result.hookScriptExecutable ? '✓' : '✗'}`,
    result.hookEvents.length ? `events: ${result.hookEvents.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (result.hooksJsonExists && result.hookScriptExists && result.hookScriptExecutable) {
    await vscode.window.showInformationMessage(
      'StayOn hooks configured. Trust them in Cursor Settings → Hooks.',
      'Open Hooks Settings'
    ).then((choice) => {
      if (choice === 'Open Hooks Settings') {
        void vscode.commands.executeCommand('workbench.action.openSettings', 'cursor.hooks');
      }
    });
  } else {
    await vscode.window.showWarningMessage('StayOn hook setup incomplete', { detail, modal: true });
  }

  return result;
}
