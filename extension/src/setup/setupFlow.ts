import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { HOOK_SCRIPT_NAME, installHooksInWorkspace } from './installHooks';
import { testHookBridge } from './testBridge';
import { verifyHookSetup } from './verifyHooks';

const SETUP_PROMPT_KEY = 'stayon.setupPromptedFor';

export async function runStayOnSetup(
  extensionUri: vscode.Uri,
  workspaceRoot: string | undefined,
  log: (msg: string) => void
): Promise<boolean> {
  if (!workspaceRoot) {
    await vscode.window.showWarningMessage(
      'Open a project folder first (File → Open Folder), then run StayOn: Set Up.'
    );
    return false;
  }

  const install = await installHooksInWorkspace(extensionUri, workspaceRoot);
  if (!install.ok) {
    await vscode.window.showErrorMessage(install.message);
    log(install.message);
    return false;
  }

  log(`Hooks installed (${HOOK_SCRIPT_NAME}, node=${install.nodeBinary ?? 'node'})`);

  const bridge = await testHookBridge(workspaceRoot, log);
  if (!bridge.ok) {
    await vscode.window.showWarningMessage(bridge.message, { modal: true }, 'Show Output').then((c) => {
      if (c === 'Show Output') {
        void vscode.commands.executeCommand('stayon.showOutput');
      }
    });
    return false;
  }

  await vscode.window.showInformationMessage(
    'StayOn bridge self-test passed. Submit a Cursor Agent prompt — the panel opens while the agent works. If it stays on “Waiting for agent…”, check ~/.stayon/hook.log (Hooks Execution Log ≠ bridge connected).',
    'Open Panel'
  ).then((choice) => {
    if (choice === 'Open Panel') {
      void vscode.commands.executeCommand('stayon.openPanel');
    }
  });

  log(bridge.message);
  log(`Hook command: node=${install.nodeBinary ?? 'node'} script=${install.hookScriptPath ?? '?'}`);
  log(`After an Agent prompt, ~/.stayon/hook.log should show "ok event=beforeSubmitPrompt port=..."`);
  return true;
}

export async function showStayOnSetupUI(
  extensionUri: vscode.Uri,
  workspaceRoot: string | undefined,
  log: (msg: string) => void
): Promise<void> {
  const confirm = await vscode.window.showInformationMessage(
    'One-time setup: StayOn installs small Cursor hooks in this project so the panel opens when Agent runs. No bash or jq required.',
    { modal: true },
    'Set Up StayOn'
  );
  if (confirm !== 'Set Up StayOn') {
    return;
  }

  await runStayOnSetup(extensionUri, workspaceRoot, log);
}

/** Prompt once per workspace when hooks are missing. */
export async function maybePromptSetup(
  context: vscode.ExtensionContext,
  extensionUri: vscode.Uri,
  workspaceRoot: string | undefined,
  log: (msg: string) => void
): Promise<void> {
  if (!workspaceRoot) {
    return;
  }

  const verify = verifyHookSetup(workspaceRoot);
  if (verify.hooksJsonExists && verify.hookScriptExists) {
    return;
  }

  const prompted = context.workspaceState.get<string[]>(SETUP_PROMPT_KEY) ?? [];
  if (prompted.includes(workspaceRoot)) {
    return;
  }

  await context.workspaceState.update(SETUP_PROMPT_KEY, [...prompted, workspaceRoot]);

  const choice = await vscode.window.showInformationMessage(
    'StayOn needs a one-time setup in this folder (installs hooks — works on Windows and Mac).',
    'Set Up Now',
    'Later'
  );

  if (choice === 'Set Up Now') {
    await runStayOnSetup(extensionUri, workspaceRoot, log);
  }
}

export function hookLogHint(): string {
  return path.join(os.homedir(), '.stayon', 'hook.log');
}
