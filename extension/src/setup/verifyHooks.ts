import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import * as vscode from 'vscode';
import { HOOK_SCRIPT_NAME } from './installHooks';

export interface HookVerifyResult {
  hooksJsonExists: boolean;
  hookScriptExists: boolean;
  hookScriptExecutable: boolean;
  usesNodeHook: boolean;
  nodeAvailable: boolean;
  bridgePortFileExists: boolean;
  hookEvents: string[];
  message: string;
}

function hooksJsonUsesNodeHook(hooksJsonPath: string): boolean {
  try {
    const raw = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8')) as {
      hooks?: Record<string, { command?: string }[]>;
    };
    for (const entries of Object.values(raw.hooks ?? {})) {
      for (const entry of entries ?? []) {
        if (typeof entry?.command === 'string' && entry.command.includes(HOOK_SCRIPT_NAME)) {
          return true;
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
}

function isNodeAvailable(): boolean {
  try {
    execSync('node --version', { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    if (process.platform === 'win32') {
      try {
        execSync('where node', { stdio: 'ignore', timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function verifyHookSetup(workspaceRoot: string | undefined): HookVerifyResult {
  const bridgePortFileExists = fs.existsSync(path.join(os.homedir(), '.stayon', 'port'));
  const nodeAvailable = isNodeAvailable();

  if (!workspaceRoot) {
    return {
      hooksJsonExists: false,
      hookScriptExists: false,
      hookScriptExecutable: false,
      usesNodeHook: false,
      nodeAvailable,
      bridgePortFileExists,
      hookEvents: [],
      message: 'Open a project folder (File → Open Folder), then run StayOn: Set Up.',
    };
  }

  const hooksJsonPath = path.join(workspaceRoot, '.cursor', 'hooks.json');
  const hookScriptPath = path.join(workspaceRoot, '.cursor', 'hooks', HOOK_SCRIPT_NAME);
  const legacyShPath = path.join(workspaceRoot, '.cursor', 'hooks', 'stayon-event.sh');

  const hooksJsonExists = fs.existsSync(hooksJsonPath);
  const hookScriptExists = fs.existsSync(hookScriptPath) || fs.existsSync(legacyShPath);
  let hookScriptExecutable = false;
  let hookEvents: string[] = [];
  const usesNodeHook = hooksJsonExists ? hooksJsonUsesNodeHook(hooksJsonPath) : false;

  const scriptPath = fs.existsSync(hookScriptPath) ? hookScriptPath : legacyShPath;
  if (fs.existsSync(scriptPath) && !usesNodeHook) {
    try {
      fs.accessSync(scriptPath, fs.constants.X_OK);
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

  const scriptOk =
    fs.existsSync(hookScriptPath) ||
    (fs.existsSync(legacyShPath) && (hookScriptExecutable || usesNodeHook));
  const ok = hooksJsonExists && scriptOk && bridgePortFileExists && (usesNodeHook ? nodeAvailable : true);

  let message: string;
  if (ok) {
    message = 'Hooks look good. Submit a Cursor Agent prompt to open the panel.';
  } else if (!bridgePortFileExists) {
    message =
      'StayOn bridge is not running. Reload Cursor after installing the VSIX.';
  } else if (!nodeAvailable && usesNodeHook) {
    message =
      'Node.js not found on PATH. Install Node.js (nodejs.org) or reinstall Cursor, then run StayOn: Set Up again.';
  } else if (!hooksJsonExists || !fs.existsSync(hookScriptPath)) {
    message = 'Hooks not installed — run StayOn: Set Up (one command, no bash/jq).';
  } else if (fs.existsSync(legacyShPath) && !usesNodeHook) {
    message = 'Old bash hooks detected — run StayOn: Set Up to upgrade (works on Windows).';
  } else {
    message = 'Hooks look good. Submit a Cursor Agent prompt to open the panel.';
  }

  return {
    hooksJsonExists,
    hookScriptExists,
    hookScriptExecutable,
    usesNodeHook,
    nodeAvailable,
    bridgePortFileExists,
    hookEvents,
    message,
  };
}

export async function showHookVerifyUI(
  workspaceRoot: string | undefined
): Promise<HookVerifyResult> {
  const result = verifyHookSetup(workspaceRoot);
  const scriptOk =
    result.hookScriptExists &&
    (result.usesNodeHook || result.hookScriptExecutable);
  const hooksOk =
    result.hooksJsonExists && scriptOk && result.bridgePortFileExists;
  const detail = [
    result.message,
    '',
    `hooks.json: ${result.hooksJsonExists ? '✓' : '✗'}`,
    `${HOOK_SCRIPT_NAME}: ${fs.existsSync(workspaceRoot ? path.join(workspaceRoot, '.cursor', 'hooks', HOOK_SCRIPT_NAME) : '') ? '✓' : '✗'}`,
    `node hook: ${result.usesNodeHook ? '✓' : 'upgrade with Set Up'}`,
    `node on PATH: ${result.nodeAvailable ? '✓' : '✗'}`,
    `extension bridge: ${result.bridgePortFileExists ? '✓' : '✗'}`,
    result.bridgePortFileExists ? `hook log: ~/.stayon/hook.log` : '',
    result.hookEvents.length ? `events: ${result.hookEvents.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (hooksOk) {
    await vscode.window.showInformationMessage(
      'StayOn hooks configured. Submit an Agent prompt to test.',
      'Test Hook Bridge',
      'Show Output'
    ).then((choice) => {
      if (choice === 'Test Hook Bridge') {
        void vscode.commands.executeCommand('stayon.testHookBridge');
      } else if (choice === 'Show Output') {
        void vscode.commands.executeCommand('stayon.showOutput');
      }
    });
  } else {
    await vscode.window.showWarningMessage('StayOn setup incomplete', { detail, modal: true }, 'Set Up StayOn').then(
      (choice) => {
        if (choice === 'Set Up StayOn') {
          void vscode.commands.executeCommand('stayon.setup');
        }
      }
    );
  }

  return result;
}
