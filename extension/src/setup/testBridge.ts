import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as vscode from 'vscode';
import { HOOK_SCRIPT_NAME, resolveNodeForHooks } from './installHooks';
import { armSelfTestSkipPanel } from './selfTest';

const SELF_TEST_PROMPT = 'StayOn bridge self-test';

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
    prompt: SELF_TEST_PROMPT,
  });
  return execFileSync(nodeBin, [hookScriptPath], {
    input,
    encoding: 'utf8',
    timeout: 8000,
    env: process.env,
  });
}

function readHookLogTail(maxLines = 5): string {
  const logPath = path.join(os.homedir(), '.stayon', 'hook.log');
  if (!fs.existsSync(logPath)) {
    return '';
  }
  return fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-maxLines).join('\n');
}

function hookLogShowsBusyStartSuccess(): boolean {
  const tail = readHookLogTail(8);
  return (
    tail.includes('ok event=beforeSubmitPrompt') ||
    tail.includes('inbox event=beforeSubmitPrompt')
  );
}

function postBridgeEvent(port: number, body: Record<string, unknown>): Promise<boolean> {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/event',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 1500,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 204 || res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(data);
    req.end();
  });
}

async function resetBridgeAfterSelfTest(port: number): Promise<void> {
  await postBridgeEvent(port, { event: 'session_end', ts: new Date().toISOString() });
}

export interface TestHookBridgeOptions {
  /** Setup wizard: verify hook path without opening the panel or leaving busy state. */
  forSetup?: boolean;
}

export async function testHookBridge(
  workspaceRoot: string | undefined,
  log: (msg: string) => void,
  options?: TestHookBridgeOptions
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
  if (options?.forSetup) {
    armSelfTestSkipPanel();
  }

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

  await new Promise((r) => setTimeout(r, options?.forSetup ? 400 : 250));

  if (options?.forSetup) {
    const hookOk = hookLogShowsBusyStartSuccess();
    await resetBridgeAfterSelfTest(port);
    if (!hookOk) {
      const tail = readHookLogTail(3) || '(no hook.log yet)';
      log(`Hook bridge test failed. hook.log tail:\n${tail}`);
      return {
        ok: false,
        message: `Hook ran but bridge did not receive busy_start. See ~/.stayon/hook.log — run StayOn: Set Up again.`,
      };
    }

    log('Hook bridge self-test passed (busy_start received, panel not opened)');
    return {
      ok: true,
      message: 'Hook → bridge works. Submit an Agent prompt to open the panel.',
    };
  }

  const after = await fetchHealth(port);
  if (!after?.busy) {
    const tail = readHookLogTail(3) || '(no hook.log yet)';
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
