import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as vscode from 'vscode';
import { HOOK_SCRIPT_NAME, resolveNodeForHooks } from './installHooks';

function readBridgePort(): number | undefined {
  try {
    const raw = fs.readFileSync(path.join(os.homedir(), '.stayon', 'port'), 'utf8').trim();
    const port = Number(raw);
    return Number.isFinite(port) && port > 0 ? port : undefined;
  } catch {
    return undefined;
  }
}

function fetchHealth(port: number): Promise<{ busy?: boolean } | undefined> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body) as { busy?: boolean });
        } catch {
          resolve(undefined);
        }
      });
    });
    req.on('error', () => resolve(undefined));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(undefined);
    });
  });
}

function runHookScript(hookScriptPath: string): string {
  const nodeBin = resolveNodeForHooks();
  const input = JSON.stringify({
    hook_event_name: 'beforeSubmitPrompt',
    prompt: 'StayOn bridge self-test',
  });
  return execFileSync(nodeBin, [hookScriptPath], {
    input,
    encoding: 'utf8',
    timeout: 8000,
    env: process.env,
  });
}

export async function testHookBridge(
  workspaceRoot: string | undefined,
  log: (msg: string) => void
): Promise<{ ok: boolean; message: string }> {
  const port = readBridgePort();
  if (!port) {
    return {
      ok: false,
      message: 'Bridge port file missing (~/.stayon/port). Reload Cursor after installing StayOn.',
    };
  }

  const hookScriptPath = workspaceRoot
    ? path.join(workspaceRoot, '.cursor', 'hooks', HOOK_SCRIPT_NAME)
    : undefined;
  if (!hookScriptPath || !fs.existsSync(hookScriptPath)) {
    return {
      ok: false,
      message: `Missing .cursor/hooks/${HOOK_SCRIPT_NAME} — run StayOn: Set Up.`,
    };
  }

  const before = await fetchHealth(port);
  if (!before) {
    return {
      ok: false,
      message: `Bridge not reachable on 127.0.0.1:${port}. Check StayOn output channel.`,
    };
  }

  let stdout = '';
  try {
    stdout = runHookScript(hookScriptPath);
  } catch (err) {
    return {
      ok: false,
      message: `Hook script failed (is Node.js installed?): ${String(err)}`,
    };
  }

  if (!stdout.includes('"continue"') || !stdout.includes('true')) {
    return {
      ok: false,
      message: `Hook did not return continue:true. Output: ${stdout.trim() || '(empty)'}`,
    };
  }

  await new Promise((r) => setTimeout(r, 250));
  const after = await fetchHealth(port);
  if (!after?.busy) {
    const logPath = path.join(os.homedir(), '.stayon', 'hook.log');
    const tail = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-3).join('\n')
      : '(no hook.log yet)';
    log(`Hook bridge test failed. hook.log tail:\n${tail}`);
    return {
      ok: false,
      message: `Hook ran but bridge did not receive busy_start. See ~/.stayon/hook.log — run StayOn: Set Up again.`,
    };
  }

  log('Hook bridge self-test passed (busy_start received)');
  return {
    ok: true,
    message: 'Hook → bridge works. Submit an Agent prompt to open the panel.',
  };
}

export async function showTestHookBridgeUI(
  workspaceRoot: string | undefined,
  log: (msg: string) => void
): Promise<void> {
  const result = await testHookBridge(workspaceRoot, log);
  if (result.ok) {
    await vscode.window.showInformationMessage(result.message);
  } else {
    await vscode.window.showWarningMessage(result.message, { modal: true });
  }
}
