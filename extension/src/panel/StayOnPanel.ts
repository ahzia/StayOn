import * as vscode from 'vscode';
import type {
  AgentStatus,
  BusyEndPayload,
  CpxSurveyTask,
  FromWebviewMessage,
  TaskMode,
  ToWebviewMessage,
  Wallet,
} from '../types';
import { TaskSession } from '../gamification/tasks';
import { toSnapshot } from '../gamification/wallet';
import { applyFlowBonus, onWaitEndWithTask, onWaitEndWithoutTask } from '../gamification/streaks';
import { fetchCpxWallUrl } from '../api/stayonApi';
import { isCpxEnabled } from '../api/config';

export class StayOnPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'stayon.panel';

  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly getWallet: () => Wallet,
    private readonly saveWallet: () => Promise<void>,
    private readonly taskSession: TaskSession,
    private readonly getMode: () => TaskMode,
    private readonly setMode: (mode: TaskMode) => void,
    private readonly getUserId: () => string,
    private readonly log: (msg: string) => void
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media'),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg: FromWebviewMessage) => {
      await this.handleMessage(msg);
    });

    this.postInit();
  }

  showPanel(focus = true): void {
    if (this.view) {
      this.view.show?.(focus);
    } else {
      void vscode.commands.executeCommand('stayon.panel.focus');
    }
  }

  onBusyStart(): void {
    void this.startBusySession();
  }

  private async startBusySession(): Promise<void> {
    const mode = this.getMode();
    this.taskSession.startWait(mode);
    let task = this.taskSession.getCurrentTask()!;

    if (mode === 'earn' && isCpxEnabled()) {
      const wall = await fetchCpxWallUrl(this.getUserId(), this.taskSession.getWaitSessionId());
      if (wall.ok && wall.iframeUrl) {
        const cpxTask: CpxSurveyTask = {
          kind: 'cpx',
          id: 'cpx-wall',
          iframeUrl: wall.iframeUrl,
          label: 'CPX Research survey',
        };
        this.taskSession.setTask(cpxTask);
        task = cpxTask;
        this.log('CPX SurveyWall loaded');
      } else if (wall.error) {
        this.log(`CPX wall unavailable: ${wall.error}`);
      }
    }

    this.showPanel(true);
    this.post({ type: 'state', status: 'busy' });
    this.post({ type: 'task', task });
    this.postWallet();
  }

  onStateChange(status: AgentStatus, contextNote?: string, tool?: string): void {
    this.post({ type: 'state', status, contextNote, tool });
  }

  async onBusyEnd(payload: BusyEndPayload): Promise<void> {
    const wallet = this.getWallet();
    let flowBonus: number | undefined;

    if (this.taskSession.hasCompletedTask()) {
      flowBonus = applyFlowBonus(wallet);
      onWaitEndWithTask(wallet);
    } else {
      onWaitEndWithoutTask(wallet);
    }

    await this.saveWallet();

    this.post({
      type: 'ready',
      contextNote: payload.contextNote,
      flowBonus,
      taskReward: this.taskSession.getTaskRewardEarned(),
    });
    this.postWallet();
    this.taskSession.reset();
  }

  postWallet(): void {
    this.post({ type: 'wallet', wallet: toSnapshot(this.getWallet()) });
  }

  postReward(tokens: number, label: string): void {
    this.post({ type: 'reward', tokens, label });
    this.postWallet();
  }

  private postInit(): void {
    this.post({
      type: 'init',
      wallet: toSnapshot(this.getWallet()),
      mode: this.getMode(),
      cpxEnabled: isCpxEnabled(),
    });
  }

  private post(message: ToWebviewMessage): void {
    void this.view?.webview.postMessage(message);
  }

  private async handleMessage(msg: FromWebviewMessage): Promise<void> {
    const wallet = this.getWallet();

    switch (msg.type) {
      case 'ready':
        this.postInit();
        break;

      case 'setMode':
        this.setMode(msg.mode);
        this.postInit();
        break;

      case 'dismissReady':
        this.post({ type: 'state', status: 'idle' });
        break;

      case 'taskComplete': {
        if (msg.answerIndex === undefined) {
          return;
        }
        const result = this.taskSession.completeQuiz(wallet, msg.taskId, msg.answerIndex);
        if (!result) {
          void vscode.window.showWarningMessage('Wrong answer — try again!');
          return;
        }
        await this.afterAward(result);
        break;
      }

      case 'sponsoredView': {
        const viewResult = this.taskSession.completeSponsoredView(wallet, msg.taskId);
        if (viewResult) {
          await this.afterAward(viewResult);
        }
        break;
      }

      case 'learnComplete': {
        const learnResult = this.taskSession.completeLearn(wallet, msg.taskId);
        if (learnResult) {
          await this.afterAward(learnResult);
        }
        break;
      }

      case 'openSponsor': {
        const uri = vscode.Uri.parse(msg.url);
        void vscode.env.openExternal(uri);
        const result = this.taskSession.completeSponsoredClick(wallet, msg.taskId);
        if (result) {
          await this.afterAward(result);
        }
        break;
      }

      case 'cpxEngaged':
        this.taskSession.noteCpxEngaged();
        break;

      case 'focusComplete': {
        const result = this.taskSession.completeFocus(wallet, msg.taskId);
        if (result) {
          await this.afterAward(result);
        }
        break;
      }
    }
  }

  private async afterAward(result: {
    tokens: number;
    newBadges: { id: string; name: string }[];
    challengeBonus?: number;
  }): Promise<void> {
    await this.saveWallet();
    this.post({
      type: 'reward',
      tokens: result.tokens,
      label: 'Task complete',
      bonus: result.challengeBonus ? `Challenge +${result.challengeBonus}` : undefined,
    });
    for (const badge of result.newBadges) {
      this.post({ type: 'badge', id: badge.id, name: badge.name });
    }
    this.postWallet();
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'panel', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'panel', 'main.css')
    );
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'codicons', 'codicon.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:; frame-src https://offers.cpx-research.com https://click.cpx-research.com https://live-api.cpx-research.com;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${codiconsUri}" rel="stylesheet">
  <link href="${styleUri}" rel="stylesheet">
  <title>StayOn</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
