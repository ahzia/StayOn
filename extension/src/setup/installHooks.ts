import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as vscode from 'vscode';

export interface InstallHooksResult {
  ok: boolean;
  message: string;
  hooksJsonPath?: string;
  hookScriptPath?: string;
  nodeBinary?: string;
}

const HOOK_EVENTS = [
  'beforeSubmitPrompt',
  'preToolUse',
  'postToolUse',
  'afterAgentThought',
  'subagentStart',
  'subagentStop',
  'stop',
  'sessionEnd',
] as const;

export const HOOK_SCRIPT_NAME = 'stayon-event.js';

function quoteForHookCommand(part: string): string {
  if (process.platform === 'win32') {
    return `"${part.replace(/"/g, '""')}"`;
  }
  return JSON.stringify(part);
}

/** Resolve a Node binary hooks can invoke (probed at install time). */
export function resolveNodeForHooks(): string {
  const candidates: string[] = [];

  if (process.platform === 'win32') {
    candidates.push('node.exe', 'node');
    const programFiles = process.env.ProgramFiles;
    if (programFiles) {
      candidates.push(path.join(programFiles, 'nodejs', 'node.exe'));
    }
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    if (programFilesX86) {
      candidates.push(path.join(programFilesX86, 'nodejs', 'node.exe'));
    }
  } else {
    candidates.push('node');
    candidates.push('/usr/local/bin/node');
    candidates.push('/opt/homebrew/bin/node');
  }

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore', timeout: 5000 });
      return candidate;
    } catch {
      // try next
    }
  }

  return 'node';
}

function writeHooksJson(hooksJsonPath: string, nodeBinary: string, hookScriptPath: string): void {
  const command = `${quoteForHookCommand(nodeBinary)} ${quoteForHookCommand(hookScriptPath)}`;
  const hooks = Object.fromEntries(
    HOOK_EVENTS.map((event) => [event, [{ command }]])
  );
  fs.writeFileSync(hooksJsonPath, `${JSON.stringify({ version: 1, hooks }, null, 2)}\n`);
}

export async function installHooksInWorkspace(
  extensionUri: vscode.Uri,
  workspaceRoot: string
): Promise<InstallHooksResult> {
  const bundledScript = path.join(extensionUri.fsPath, 'resources', 'hooks', HOOK_SCRIPT_NAME);

  if (!fs.existsSync(bundledScript)) {
    return {
      ok: false,
      message: 'Bundled hook files missing from extension package.',
    };
  }

  const nodeBinary = resolveNodeForHooks();
  const cursorDir = path.join(workspaceRoot, '.cursor');
  const hooksDir = path.join(cursorDir, 'hooks');
  const hooksJsonPath = path.join(cursorDir, 'hooks.json');
  const hookScriptPath = path.join(hooksDir, HOOK_SCRIPT_NAME);

  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(bundledScript, hookScriptPath);
  writeHooksJson(hooksJsonPath, nodeBinary, hookScriptPath);

  return {
    ok: true,
    message: 'StayOn hooks installed. Run an Agent prompt to open the panel.',
    hooksJsonPath,
    hookScriptPath,
    nodeBinary,
  };
}

export async function showInstallHooksUI(
  extensionUri: vscode.Uri,
  workspaceRoot: string | undefined
): Promise<InstallHooksResult> {
  if (!workspaceRoot) {
    const msg = 'Open a project folder first (File → Open Folder).';
    await vscode.window.showWarningMessage(msg);
    return { ok: false, message: msg };
  }

  return installHooksInWorkspace(extensionUri, workspaceRoot);
}
