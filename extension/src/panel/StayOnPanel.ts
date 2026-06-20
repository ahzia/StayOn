import * as vscode from 'vscode';
import type {
  AgentStatus,
  BusyEndPayload,
  CpxSurveyTask,
  FromWebviewMessage,
  SurveyProfileSnapshot,
  TaskMode,
  ToWebviewMessage,
  Wallet,
} from '../types';
import { TaskSession } from '../gamification/tasks';
import { toSnapshot } from '../gamification/wallet';
import { applyFlowBonus, onWaitEndWithTask, onWaitEndWithoutTask } from '../gamification/streaks';
import { SECTION_META, normalizeMode } from '../gamification/modes';
import { pickTask } from '../gamification/taskBank';
import {
  clearPausedCpxSession,
  getPausedCpxSession,
  pausedSessionFromTask,
  savePausedCpxSession,
  taskFromPausedSession,
} from '../gamification/cpxSession';
import { fetchLearnTask } from '../api/learnApi';
import { fetchCpxWallUrl, fetchSurveyProfile, saveSurveyProfile } from '../api/stayonApi';
import { isCpxEnabled, getApiBaseUrl } from '../api/config';
import { alertAgentReady } from '../notify/agentReady';

export class StayOnPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'stayon.panel';

  private view: vscode.WebviewView | undefined;
  private pendingMessages: ToWebviewMessage[] = [];
  private surveyProfile: SurveyProfileSnapshot = { completed: false };
  private lastPostedState: { status: AgentStatus; contextNote: string; tool: string } = {
    status: 'idle',
    contextNote: '',
    tool: '',
  };

  constructor(
    private readonly context: vscode.ExtensionContext,
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

    void this.refreshSurveyProfile();
    this.postInit();
    this.flushPendingMessages();
  }

  async showPanel(focus = true): Promise<void> {
    try {
      await vscode.commands.executeCommand('workbench.view.extension.stayon');
    } catch {
      // ignore
    }

    // WebviewView is created lazily — wait briefly after opening the container.
    for (let i = 0; i < 20 && !this.view; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (this.view) {
      this.view.show?.(focus);
      return;
    }

    try {
      await vscode.commands.executeCommand('stayon.panel.focus');
    } catch {
      this.log('Could not focus StayOn panel — click the StayOn icon in the activity bar once, then retry');
    }
  }

  onBusyStart(): void {
    void this.startBusySession();
  }

  onCpxRewardSynced(): void {
    if (!this.taskSession.isCpxSurveyActive() && !this.taskSession.isSurveyPersisted()) {
      const paused = getPausedCpxSession(this.context);
      if (!paused) {
        return;
      }
    }

    void this.clearCpxSurvey('Survey complete — points synced');
    this.post({ type: 'state', status: 'idle' });
  }

  onStateChange(status: AgentStatus, contextNote?: string, tool?: string): void {
    if (status === 'idle' && this.taskSession.isSurveyPersisted()) {
      void this.pauseCpxSurvey();
      return;
    }

    const note = contextNote ?? '';
    const toolName = tool ?? '';
    if (
      this.lastPostedState.status === status &&
      this.lastPostedState.contextNote === note &&
      this.lastPostedState.tool === toolName
    ) {
      return;
    }
    this.lastPostedState = { status, contextNote: note, tool: toolName };
    this.post({ type: 'state', status, contextNote: note, tool: toolName });
  }

  private async pauseCpxSurvey(): Promise<void> {
    const task = this.taskSession.getCurrentTask();
    if (task?.kind !== 'cpx') {
      const existing = getPausedCpxSession(this.context);
      this.post({ type: 'cpxPaused', session: existing ?? null });
      this.post({ type: 'state', status: 'idle' });
      return;
    }

    const session = pausedSessionFromTask(task);
    await savePausedCpxSession(this.context, session);
    this.taskSession.clearSurveyPersist();
    this.log('CPX survey paused — resume on next agent wait or Continue survey');
    this.post({ type: 'cpxPaused', session });
    this.post({ type: 'state', status: 'idle' });
  }

  private async clearCpxSurvey(reason?: string): Promise<void> {
    await clearPausedCpxSession(this.context);
    this.taskSession.reset();
    this.post({ type: 'destroyCpxFrame' });
    this.post({ type: 'cpxPaused', session: null });
    if (reason) {
      this.log(reason);
    }
  }

  /** Stop current survey and open a fresh CPX wall to pick another. */
  private async restartCpxSurvey(): Promise<void> {
    const status = this.lastPostedState.status;
    await clearPausedCpxSession(this.context);
    this.taskSession.clearSurveyPersist();

    if (!isCpxEnabled() || this.getMode() !== 'surveys') {
      this.taskSession.reset();
      this.post({ type: 'destroyCpxFrame' });
      this.post({ type: 'cpxPaused', session: null });
      this.post({ type: 'state', status: 'idle' });
      return;
    }

    const freshWaitId = `browse-${Date.now()}`;
    const cpxTask = await this.loadCpxTask(freshWaitId);
    if (!cpxTask) {
      this.taskSession.reset();
      this.post({ type: 'destroyCpxFrame' });
      this.post({ type: 'cpxPaused', session: null });
      this.post({ type: 'state', status: 'idle' });
      void vscode.window.showWarningMessage('Could not load a new survey list.');
      return;
    }

    cpxTask.forceReload = true;
    this.post({ type: 'destroyCpxFrame' });

    if (status === 'busy') {
      this.taskSession.reset();
      this.taskSession.startWait('surveys', cpxTask);
      this.taskSession.noteCpxEngaged();
      this.post({ type: 'state', status: 'busy', contextNote: this.lastPostedState.contextNote });
      this.post({ type: 'task', task: cpxTask });
      this.post({ type: 'cpxPaused', session: null });
      this.log('CPX survey stopped — fresh survey list loaded');
      return;
    }

    this.taskSession.reset();
    this.taskSession.setTask(cpxTask);
    this.taskSession.noteCpxEngaged();

    if (status === 'ready') {
      this.post({
        type: 'ready',
        contextNote: this.lastPostedState.contextNote,
        surveyPersist: false,
      });
    } else {
      this.post({ type: 'state', status: 'idle' });
    }
    this.post({ type: 'task', task: cpxTask });
    this.post({ type: 'cpxPaused', session: null });
    this.log('CPX survey stopped — fresh survey list loaded');
  }

  private flushPendingMessages(): void {
    if (!this.view || this.pendingMessages.length === 0) {
      return;
    }
    for (const message of this.pendingMessages) {
      void this.view.webview.postMessage(message);
    }
    this.pendingMessages = [];
  }

  private async refreshSurveyProfile(): Promise<void> {
    if (!isCpxEnabled()) {
      this.surveyProfile = { completed: false };
      return;
    }

    const res = await fetchSurveyProfile(this.getUserId());
    if (res.ok && res.profile) {
      this.surveyProfile = res.profile;
      this.post({ type: 'surveyProfile', profile: this.surveyProfile });
    }
  }

  private async loadCpxTask(subId1?: string): Promise<CpxSurveyTask | undefined> {
    const wall = await fetchCpxWallUrl(this.getUserId(), subId1);
    if (!wall.ok || !wall.iframeUrl) {
      if (wall.error) {
        this.log(`CPX wall unavailable: ${wall.error}`);
      }
      return undefined;
    }

    if (wall.profileComplete !== undefined) {
      this.surveyProfile = { ...this.surveyProfile, completed: wall.profileComplete };
      this.post({ type: 'surveyProfile', profile: this.surveyProfile });
    }

    return {
      kind: 'cpx',
      id: 'cpx-wall',
      iframeUrl: wall.iframeUrl,
      label: 'CPX Research survey',
      inventoryType: 'cpx-wall',
    };
  }

  private async restorePausedCpxSession(agentBusy: boolean): Promise<boolean> {
    const paused = getPausedCpxSession(this.context);
    if (!paused || paused.inventoryType !== 'cpx-wall') {
      return false;
    }

    const task = taskFromPausedSession(paused);
    if (agentBusy) {
      this.taskSession.startWait('surveys', task);
      this.taskSession.noteCpxEngaged();
    } else {
      this.taskSession.reset();
      this.taskSession.setTask(task);
      this.taskSession.noteCpxEngaged();
    }

    await this.showPanel(true);
    this.post({ type: 'state', status: agentBusy ? 'busy' : 'idle' });
    this.post({ type: 'task', task });
    if (agentBusy) {
      this.postWallet();
    }
    this.log(agentBusy ? 'Resumed paused CPX survey (agent wait)' : 'Resumed paused CPX survey');
    return true;
  }

  private async startBusySession(): Promise<void> {
    const mode = this.getMode();

    if (mode === 'surveys' && isCpxEnabled()) {
      const resumed = await this.restorePausedCpxSession(true);
      if (resumed) {
        return;
      }
    }

    this.taskSession.startWait(mode, pickTask(mode));
    const task = this.taskSession.getCurrentTask();
    if (!task) {
      this.log('No task available for busy session');
      return;
    }

    await this.showPanel(true);
    this.post({ type: 'state', status: 'busy' });
    this.post({ type: 'task', task });
    this.postWallet();

    if (mode === 'learn') {
      try {
        const remote = await fetchLearnTask(this.getUserId(), this.taskSession.getWaitSessionId());
        if (remote) {
          this.taskSession.setTask(remote);
          this.post({ type: 'task', task: remote });
        }
      } catch (err) {
        this.log(`Learn task fetch failed: ${String(err)}`);
      }
      return;
    }

    if (mode !== 'surveys' || !isCpxEnabled()) {
      return;
    }

    try {
      const cpxTask = await this.loadCpxTask(this.taskSession.getWaitSessionId());
      if (cpxTask) {
        this.taskSession.setTask(cpxTask);
        this.post({ type: 'task', task: cpxTask });
        this.log('CPX SurveyWall loaded');
      }
    } catch (err) {
      this.log(`CPX wall failed: ${String(err)}`);
    }
  }

  async onBusyEnd(payload: BusyEndPayload): Promise<void> {
    const wallet = this.getWallet();
    let flowBonus: number | undefined;
    const persistCpx = this.taskSession.shouldPersistCpxSurvey();

    if (this.taskSession.hasCompletedTask()) {
      flowBonus = applyFlowBonus(wallet);
      onWaitEndWithTask(wallet);
    } else {
      onWaitEndWithoutTask(wallet);
    }

    await this.saveWallet();

    if (persistCpx) {
      this.taskSession.markSurveyPersist();
      this.post({
        type: 'ready',
        contextNote: payload.contextNote,
        flowBonus,
        taskReward: this.taskSession.getTaskRewardEarned(),
        surveyPersist: true,
      });
      this.postWallet();
      await alertAgentReady(this.log, {
        surveyPersist: true,
        contextNote: payload.contextNote,
      });
      void this.showPanel(true);
      return;
    }

    this.post({
      type: 'ready',
      contextNote: payload.contextNote,
      flowBonus,
      taskReward: this.taskSession.getTaskRewardEarned(),
      surveyPersist: false,
    });
    this.postWallet();
    this.taskSession.reset();
    await alertAgentReady(this.log, {
      surveyPersist: false,
      contextNote: payload.contextNote,
    });
    void this.showPanel(true);
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
      sectionMeta: SECTION_META,
      surveyProfile: this.surveyProfile,
      pausedCpxSession: getPausedCpxSession(this.context) ?? null,
      extensionUserId: this.getUserId(),
      apiBaseUrl: getApiBaseUrl(),
    });
  }

  private post(message: ToWebviewMessage): void {
    if (this.view) {
      void this.view.webview.postMessage(message);
      return;
    }
    this.pendingMessages.push(message);
  }

  private async handleMessage(msg: FromWebviewMessage): Promise<void> {
    const wallet = this.getWallet();

    switch (msg.type) {
      case 'ready':
        void this.refreshSurveyProfile();
        this.postInit();
        break;

      case 'setMode':
        this.setMode(msg.mode);
        this.postInit();
        break;

      case 'dismissReady':
        if (this.taskSession.isSurveyPersisted() || this.taskSession.isCpxEngaged()) {
          await this.pauseCpxSurvey();
        } else {
          this.post({ type: 'state', status: 'idle' });
        }
        break;

      case 'pauseSurvey':
        await this.pauseCpxSurvey();
        break;

      case 'openCpxInBrowser': {
        const task = this.taskSession.getCurrentTask();
        if (task?.kind === 'cpx' && task.iframeUrl) {
          void vscode.env.openExternal(vscode.Uri.parse(task.iframeUrl));
        }
        break;
      }

      case 'openCpxInCursor': {
        const task = this.taskSession.getCurrentTask();
        if (task?.kind === 'cpx' && task.iframeUrl) {
          try {
            await vscode.commands.executeCommand('simpleBrowser.show', task.iframeUrl, {
              viewColumn: vscode.ViewColumn.Beside,
              preserveFocus: false,
            });
          } catch {
            void vscode.env.openExternal(vscode.Uri.parse(task.iframeUrl));
          }
        }
        break;
      }

      case 'openEarnings': {
        const base = getApiBaseUrl();
        const userId = this.getUserId();
        if (!base) {
          void vscode.window.showWarningMessage('stayon.apiBaseUrl not set — cannot open earnings page.');
          break;
        }
        const url = `${base.replace(/\/$/, '')}/earnings?userId=${encodeURIComponent(userId)}`;
        void vscode.env.openExternal(vscode.Uri.parse(url));
        break;
      }

      case 'dismissSurvey':
        await this.restartCpxSurvey();
        break;

      case 'resumeSurvey': {
        const restored = await this.restorePausedCpxSession(false);
        if (!restored) {
          void vscode.window.showInformationMessage('No paused survey to resume.');
        }
        break;
      }

      case 'openSurveyProfile':
        await this.showPanel(true);
        break;

      case 'submitSurveyProfile': {
        const result = await saveSurveyProfile(this.getUserId(), {
          email: msg.email,
          birthdayYear: msg.birthdayYear,
          birthdayMonth: msg.birthdayMonth,
          birthdayDay: msg.birthdayDay,
          gender: msg.gender,
          countryCode: msg.countryCode,
        });
        if (!result.ok) {
          void vscode.window.showWarningMessage(result.error ?? 'Could not save profile');
          return;
        }
        this.surveyProfile = result.profile ?? { completed: true };
        this.post({ type: 'surveyProfile', profile: this.surveyProfile });
        void vscode.window.showInformationMessage('Survey profile saved — CPX will skip the signup form.');
        break;
      }

      case 'learnComplete': {
        const learnResult = this.taskSession.completeLearn(wallet, msg.taskId);
        if (learnResult) {
          await this.afterAward(learnResult);
        }
        break;
      }

      case 'cpxEngaged':
        this.taskSession.noteCpxEngaged();
        break;

      case 'redeemPerk': {
        const result = this.taskSession.redeemPerk(wallet, msg.perkId);
        if (!result.ok) {
          void vscode.window.showWarningMessage(result.error ?? 'Could not redeem perk');
          return;
        }
        if (msg.perkId === 'learn-refresh' && this.getMode() === 'learn') {
          const refreshed = this.taskSession.refreshLearnTask();
          this.post({ type: 'task', task: refreshed });
        } else {
          const current = this.taskSession.getCurrentTask();
          if (current) {
            this.post({ type: 'task', task: current });
          }
        }
        await this.saveWallet();
        this.postWallet();
        break;
      }

      case 'learnRefresh': {
        const refreshResult = this.taskSession.redeemPerk(wallet, 'learn-refresh');
        if (!refreshResult.ok) {
          void vscode.window.showWarningMessage(refreshResult.error ?? 'Could not refresh learn card');
          return;
        }
        const refreshed = this.taskSession.refreshLearnTask();
        this.post({ type: 'task', task: refreshed });
        await this.saveWallet();
        this.postWallet();
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data: https:; frame-src https: data: blob:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${codiconsUri}" rel="stylesheet">
  <link href="${styleUri}" rel="stylesheet">
  <title>StayOn</title>
</head>
<body>
  <div id="app"></div>
  <div id="cpx-host" class="cpx-host" hidden></div>
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
