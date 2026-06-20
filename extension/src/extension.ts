import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { BridgeServer, findAvailablePort } from './bridge/server';
import { BusyState } from './bridge/busyState';
import { StayOnPanelProvider } from './panel/StayOnPanel';
import { TaskSession } from './gamification/tasks';
import { defaultWallet, WALLET_KEY } from './gamification/wallet';
import type { TaskMode, Wallet } from './types';
import { showHookVerifyUI, verifyHookSetup } from './setup/verifyHooks';

let outputChannel: vscode.OutputChannel;
let bridge: BridgeServer | undefined;
let statusBarItem: vscode.StatusBarItem;

const STAYON_DIR = path.join(os.homedir(), '.stayon');

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  outputChannel = vscode.window.createOutputChannel('StayOn');
  context.subscriptions.push(outputChannel);

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    outputChannel.appendLine(line);
  };

  let wallet = context.globalState.get<Wallet>(WALLET_KEY) ?? defaultWallet();
  const saveWallet = async () => {
    await context.globalState.update(WALLET_KEY, wallet);
  };

  const getMode = (): TaskMode =>
    vscode.workspace.getConfiguration('stayon').get<TaskMode>('mode') ?? 'earn';

  const setMode = (mode: TaskMode) => {
    void vscode.workspace.getConfiguration('stayon').update('mode', mode, vscode.ConfigurationTarget.Global);
  };

  const taskSession = new TaskSession();
  const busyState = new BusyState();

  const panelProvider = new StayOnPanelProvider(
    context.extensionUri,
    () => wallet,
    saveWallet,
    taskSession,
    getMode,
    setMode,
    log
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(StayOnPanelProvider.viewType, panelProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'stayon.openPanel';
  context.subscriptions.push(statusBarItem);
  updateStatusBar(statusBarItem, wallet, 'idle');

  busyState.on('busyStart', () => {
    if (!isEnabled()) {
      return;
    }
    log('Agent busy (hook)');
    panelProvider.onBusyStart();
    updateStatusBar(statusBarItem, wallet, 'busy');
  });

  busyState.on('stateChange', (status, contextNote, tool) => {
    panelProvider.onStateChange(status, contextNote, tool);
    updateStatusBar(statusBarItem, wallet, status);
  });

  busyState.on('busyEnd', (payload) => {
    log(`Agent idle (hook) status=${payload?.status ?? 'unknown'}`);
    if (payload) {
      void panelProvider.onBusyEnd(payload);
    }
    updateStatusBar(statusBarItem, wallet, 'ready');
  });

  bridge = new BridgeServer(busyState, log);
  const preferredPort = vscode.workspace.getConfiguration('stayon').get<number>('bridgePort') ?? 3847;

  try {
    const port = await findAvailablePort(preferredPort);
    await bridge.start(port);
    writeBridgeFiles(port);
    log(`Port file written to ~/.stayon/port (${port})`);
  } catch (err) {
    log(`Bridge failed to start: ${String(err)}`);
    void vscode.window.showErrorMessage('StayOn bridge failed to start. Check StayOn output channel.');
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('stayon.openPanel', () => {
      panelProvider.showPanel(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('stayon.showOutput', () => {
      outputChannel.show(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('stayon.verifyHooks', () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      void showHookVerifyUI(root).then((r) => log(r.message));
    })
  );

  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const verify = root ? verifyHookSetup(root) : null;
  if (verify && !verify.hookScriptExecutable) {
    log('Hook setup incomplete — run "StayOn: Verify Hook Setup"');
  }

  log('StayOn activated');
}

export function deactivate(): void {
  bridge?.stop();
  bridge = undefined;
  try {
    const pidPath = path.join(STAYON_DIR, 'pid');
    if (fs.existsSync(pidPath)) {
      fs.unlinkSync(pidPath);
    }
  } catch {
    // ignore
  }
}

function isEnabled(): boolean {
  return vscode.workspace.getConfiguration('stayon').get<boolean>('enabled') ?? true;
}

function writeBridgeFiles(port: number): void {
  fs.mkdirSync(STAYON_DIR, { recursive: true });
  fs.writeFileSync(path.join(STAYON_DIR, 'port'), String(port));
  fs.writeFileSync(path.join(STAYON_DIR, 'pid'), String(process.pid));
}

function updateStatusBar(item: vscode.StatusBarItem, wallet: Wallet, status: string): void {
  const busy = status === 'busy' ? '● ' : '';
  item.text = `${busy}StayOn · Lv.${wallet.level} · 🔥${wallet.dailyStreak} · ${wallet.tokens} ⭐`;
  item.tooltip = `StayOn — ${status}. Click to open panel.`;
  item.show();
}
