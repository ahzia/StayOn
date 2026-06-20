import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface InstallHooksResult {
  ok: boolean;
  message: string;
  hooksJsonPath?: string;
  hookScriptPath?: string;
}

export async function installHooksInWorkspace(
  extensionUri: vscode.Uri,
  workspaceRoot: string
): Promise<InstallHooksResult> {
  const bundledHooksDir = path.join(extensionUri.fsPath, 'resources', 'hooks');
  const bundledJson = path.join(bundledHooksDir, 'hooks.json');
  const bundledScript = path.join(bundledHooksDir, 'stayon-event.sh');

  if (!fs.existsSync(bundledJson) || !fs.existsSync(bundledScript)) {
    return {
      ok: false,
      message: 'Bundled hook files missing from extension package.',
    };
  }

  const cursorDir = path.join(workspaceRoot, '.cursor');
  const hooksDir = path.join(cursorDir, 'hooks');
  const hooksJsonPath = path.join(cursorDir, 'hooks.json');
  const hookScriptPath = path.join(hooksDir, 'stayon-event.sh');

  fs.mkdirSync(hooksDir, { recursive: true });
  fs.copyFileSync(bundledJson, hooksJsonPath);
  fs.copyFileSync(bundledScript, hookScriptPath);

  try {
    fs.chmodSync(hookScriptPath, 0o755);
  } catch {
    return {
      ok: false,
      message: `Copied hooks but could not chmod +x. Run: chmod +x ${hookScriptPath}`,
      hooksJsonPath,
      hookScriptPath,
    };
  }

  return {
    ok: true,
    message:
      'StayOn hooks installed in this workspace. Trust them in Cursor Settings → Hooks, then run an Agent prompt.',
    hooksJsonPath,
    hookScriptPath,
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

  const confirm = await vscode.window.showInformationMessage(
    'Install StayOn Cursor hooks into this workspace? Required for agent busy detection.',
    { modal: true },
    'Install'
  );
  if (confirm !== 'Install') {
    return { ok: false, message: 'Cancelled' };
  }

  const result = await installHooksInWorkspace(extensionUri, workspaceRoot);
  if (result.ok) {
    const choice = await vscode.window.showInformationMessage(
      result.message,
      'Open Hooks Settings',
      'Verify Setup'
    );
    if (choice === 'Open Hooks Settings') {
      void vscode.commands.executeCommand('workbench.action.openSettings', 'cursor.hooks');
    } else if (choice === 'Verify Setup') {
      void vscode.commands.executeCommand('stayon.verifyHooks');
    }
  } else {
    await vscode.window.showWarningMessage(result.message);
  }

  return result;
}
