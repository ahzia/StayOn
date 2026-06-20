import confetti from 'canvas-confetti';
import { formatPoints, formatPointsDelta, formatRewardTag } from '../../src/brand/formatPoints';

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

interface SectionMeta {
  id: 'surveys' | 'learn' | 'perks';
  title: string;
  subtitle: string;
  earnLabel: string;
}

interface PerkDefinition {
  id: string;
  title: string;
  description: string;
  cost: number;
  benefit: string;
}

interface SurveyProfileSnapshot {
  completed: boolean;
  emailMasked?: string;
  birthdayYear?: number;
  countryCode?: string;
}

interface CpxPausedSession {
  iframeUrl: string;
  inventoryType: 'cpx-wall';
  label: string;
  pausedAt: string;
}

interface WalletSnapshot {
  tokens: number;
  cashEstimate: string;
  level: number;
  xp: number;
  xpForNext: number;
  xpProgress: number;
  dailyStreak: number;
  waitStreak: number;
  badges: string[];
  history: { label: string; tokens: number; ts: string }[];
  dailyChallenge: { label: string; progress: number; target: number; completed: boolean; reward: number };
  activePerks: string[];
  stats: { totalTasks: number; waitsCompleted: number; tasksToday: number };
}

type TaskMode = 'surveys' | 'learn' | 'perks';
type TaskPayload = Record<string, unknown>;
type AgentStatus = 'idle' | 'busy' | 'ready';

const DEFAULT_SECTIONS: SectionMeta[] = [
  {
    id: 'surveys',
    title: 'Surveys',
    subtitle: 'Real paid surveys via CPX Research',
    earnLabel: '50–500+ ⭐ per complete',
  },
  {
    id: 'learn',
    title: 'Learn',
    subtitle: 'Short dev tips matched to your stack',
    earnLabel: '1 ⭐ per card',
  },
  {
    id: 'perks',
    title: 'Perks',
    subtitle: 'Spend points on workflow boosts',
    earnLabel: '5–40 ⭐ each',
  },
];

let wallet: WalletSnapshot | undefined;
let mode: TaskMode = 'surveys';
let sections: SectionMeta[] = DEFAULT_SECTIONS;
let cpxEnabled = false;
let surveyProfile: SurveyProfileSnapshot = { completed: false };
let showProfileForm = false;
let status: AgentStatus = 'idle';
let contextNote = '';
let surveyPersist = false;
let surveyActive = false;
let pausedCpxSession: CpxPausedSession | null = null;
let activeTab: 'play' | 'wallet' | 'stats' = 'play';
let currentTask: TaskPayload | undefined;
let lastBalance = -1;

const CPX_FRAME_ID = 'stayon-cpx-frame';
const CPX_HOST_ID = 'cpx-host';
const app = document.getElementById('app')!;
let cpxRenderLocked = false;

vscode.postMessage({ type: 'ready' });

window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init':
      wallet = msg.wallet;
      mode = normalizeMode(msg.mode);
      sections = msg.sectionMeta ?? DEFAULT_SECTIONS;
      cpxEnabled = Boolean(msg.cpxEnabled);
      surveyProfile = msg.surveyProfile ?? { completed: false };
      pausedCpxSession = msg.pausedCpxSession ?? null;
      {
        const saved = vscode.getState() as {
          activeTab?: typeof activeTab;
          surveyPersist?: boolean;
          surveyActive?: boolean;
          currentTask?: TaskPayload;
          contextNote?: string;
        } | null;
        if (saved?.activeTab) activeTab = saved.activeTab;
        if (saved?.surveyPersist) surveyPersist = saved.surveyPersist;
        if (saved?.surveyActive) surveyActive = saved.surveyActive;
        if (saved?.currentTask) currentTask = saved.currentTask;
        if (saved?.contextNote) contextNote = saved.contextNote;
      }
      render();
      break;
    case 'cpxPaused':
      pausedCpxSession = msg.session ?? null;
      if (msg.session) {
        surveyPersist = false;
        surveyActive = false;
      } else {
        cpxRenderLocked = false;
      }
      persistUiState();
      render();
      break;
    case 'destroyCpxFrame':
      destroyCpxFrame();
      cpxRenderLocked = false;
      syncCpxFrameAfterRender();
      break;
    case 'surveyProfile':
      surveyProfile = msg.profile ?? { completed: false };
      if (surveyProfile.completed) {
        showProfileForm = false;
      }
      render();
      break;
    case 'state':
      if (
        status === msg.status &&
        msg.status === 'busy' &&
        isCpxWallTask(currentTask) &&
        !surveyPersist &&
        !surveyActive
      ) {
        break;
      }
      status = msg.status;
      if (msg.contextNote) contextNote = msg.contextNote;
      if (status === 'idle' && !surveyActive) {
        surveyPersist = false;
      }
      render();
      break;
    case 'task':
      currentTask = msg.task;
      activeTab = 'play';
      if (isCpxWallTask(currentTask)) {
        if (currentTask?.forceReload) {
          destroyCpxFrame();
          surveyPersist = false;
        }
        surveyActive =
          status === 'idle' ||
          status === 'ready' ||
          Boolean(currentTask?.resumed) ||
          Boolean(currentTask?.forceReload);
      }
      persistUiState();
      render();
      if (currentTask?.kind === 'cpx') {
        cpxRenderLocked = true;
        vscode.postMessage({ type: 'cpxEngaged' });
      }
      break;
    case 'wallet':
      wallet = msg.wallet;
      if (status === 'busy' && isCpxWallTask(currentTask) && activeTab === 'play') {
        updateBalanceOnly();
        break;
      }
      render();
      break;
    case 'reward':
      showRewardFloat(formatPointsDelta(msg.tokens));
      celebrate();
      render();
      break;
    case 'ready':
      status = 'ready';
      contextNote = msg.contextNote ?? contextNote;
      surveyPersist = Boolean(msg.surveyPersist);
      persistUiState();
      render();
      if (msg.flowBonus) {
        setTimeout(() => showRewardFloat(`Flow ${formatPointsDelta(msg.flowBonus)}`), 400);
      }
      break;
    case 'badge':
      showRewardFloat(`🏆 ${msg.name}`);
      break;
  }
});

function persistUiState(): void {
  vscode.setState({ activeTab, surveyPersist, surveyActive, currentTask, contextNote, pausedCpxSession });
}

function restoreUiState(): void {
  const state = vscode.getState() as {
    activeTab?: typeof activeTab;
    surveyPersist?: boolean;
    surveyActive?: boolean;
    currentTask?: TaskPayload;
    contextNote?: string;
    pausedCpxSession?: CpxPausedSession | null;
  } | undefined;
  if (!state) return;
  if (state.activeTab) activeTab = state.activeTab;
  // Only restore survey UI from persisted state on webview reload — not every render.
}

function normalizeMode(raw: string | undefined): TaskMode {
  if (raw === 'earn' || raw === 'surveys') return 'surveys';
  if (raw === 'focus' || raw === 'perks') return 'perks';
  if (raw === 'learn') return 'learn';
  return 'surveys';
}

function isCpxWallTask(task: TaskPayload | undefined): boolean {
  return task?.kind === 'cpx' && (task.inventoryType === 'cpx-wall' || !task.inventoryType);
}

function shouldShowCpxTask(): boolean {
  return Boolean(
    currentTask &&
      isCpxWallTask(currentTask) &&
      (status === 'busy' || status === 'ready' || surveyPersist || surveyActive)
  );
}

function detachCpxFrameBeforeRender(): void {
  // iframe lives in #cpx-host outside #app — no detach needed
}

function getCpxHost(): HTMLElement | null {
  return document.getElementById(CPX_HOST_ID);
}

function getOrCreateCpxFrame(): HTMLIFrameElement {
  let frame = document.getElementById(CPX_FRAME_ID) as HTMLIFrameElement | null;
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = CPX_FRAME_ID;
    frame.className = 'cpx-frame';
    frame.title = 'CPX SurveyWall';
    frame.setAttribute(
      'allow',
      'fullscreen; geolocation; microphone; camera; payment; clipboard-read; clipboard-write'
    );
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    const host = getCpxHost();
    if (host) {
      host.appendChild(frame);
    }
  }
  return frame;
}

function setCpxFrameUrl(url: string, forceReload = false): void {
  if (!url) return;
  const frame = getOrCreateCpxFrame();
  const currentSrc = frame.getAttribute('src') ?? '';

  if (forceReload) {
    frame.src = url;
    return;
  }

  // Only set the initial wall URL. Once the user picks a survey, CPX navigates
  // the iframe (survey_id, click.cpx-research.com, etc.) — resetting src here
  // sends them back to the survey list.
  if (!currentSrc) {
    frame.src = url;
  }
}

function mountCpxFrame(show: boolean): void {
  const host = getCpxHost();
  const frame = document.getElementById(CPX_FRAME_ID);
  if (!host) {
    return;
  }
  host.hidden = !show;
  document.body.classList.toggle('cpx-visible', show);
  if (show && frame && !host.contains(frame)) {
    host.appendChild(frame);
  }
}

function destroyCpxFrame(): void {
  cpxRenderLocked = false;
  const frame = document.getElementById(CPX_FRAME_ID);
  if (frame) {
    frame.removeAttribute('src');
    frame.remove();
  }
  const host = getCpxHost();
  if (host) {
    host.hidden = true;
  }
  document.body.classList.remove('cpx-visible');
}

function syncCpxFrameAfterRender(): void {
  if (!shouldShowCpxTask() || !currentTask) {
    mountCpxFrame(false);
    return;
  }
  const url = String(currentTask.iframeUrl ?? '');
  if (!url) {
    mountCpxFrame(false);
    return;
  }
  const forceReload = Boolean(currentTask.forceReload);
  setCpxFrameUrl(url, forceReload);
  mountCpxFrame(true);
}

function showRewardFloat(text: string): void {
  const el = document.createElement('div');
  el.className = 'reward-float';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function celebrate(): void {
  confetti({
    particleCount: 50,
    spread: 55,
    origin: { y: 0.75 },
    colors: ['#FFD700', '#FFA500', '#2DD4BF', '#89d185'],
  });
}

function updateBalanceOnly(): void {
  if (!wallet) return;
  const balanceEl = document.querySelector('.balance');
  const cashEl = document.querySelector('.cash');
  if (balanceEl) balanceEl.textContent = formatPoints(wallet.tokens);
  if (cashEl) cashEl.textContent = wallet.cashEstimate;
  lastBalance = wallet.tokens;
}

function render(): void {
  if (!wallet) {
    app.innerHTML = '<p>Loading StayOn…</p>';
    mountCpxFrame(false);
    return;
  }

  if (cpxRenderLocked && shouldShowCpxTask()) {
    updateBalanceOnly();
    syncCpxFrameAfterRender();
    return;
  }

  restoreUiState();

  const balancePop = lastBalance >= 0 && wallet.tokens > lastBalance ? ' balance-pop' : '';
  lastBalance = wallet.tokens;

  const activePerksHtml =
    wallet.activePerks?.length > 0
      ? `<div class="active-perks">${wallet.activePerks.map((p) => `<span class="perk-pill">${escapeHtml(p)}</span>`).join('')}</div>`
      : '';

  app.innerHTML = `
    <div class="header">
      <div class="header-row">
        <span class="brand"><i class="codicon codicon-star-full brand-star"></i> StayOn</span>
        <span class="meta">Lv.${wallet.level} · 🔥 ${wallet.dailyStreak}</span>
      </div>
      <div class="balance${balancePop}">${formatPoints(wallet.tokens)}</div>
      <div class="cash">${wallet.cashEstimate}</div>
      ${activePerksHtml}
    </div>

    <div class="tabs">
      <button class="tab ${activeTab === 'play' ? 'active' : ''}" data-tab="play">Play</button>
      <button class="tab ${activeTab === 'wallet' ? 'active' : ''}" data-tab="wallet">Wallet</button>
      <button class="tab ${activeTab === 'stats' ? 'active' : ''}" data-tab="stats">Stats</button>
    </div>

    ${renderTabContent()}

    <div class="activity-footer">
      ${sections
        .map(
          (section) =>
            `<button class="activity-btn ${mode === section.id ? 'active' : ''}" data-mode="${section.id}" title="${escapeHtml(section.subtitle)}">
              <span class="activity-btn-title">${escapeHtml(section.title)}</span>
              <span class="activity-btn-earn">${escapeHtml(section.earnLabel)}</span>
            </button>`
        )
        .join('')}
    </div>
  `;

  bindEvents();
  syncCpxFrameAfterRender();
}

function renderTabContent(): string {
  if (activeTab === 'wallet') return renderWallet();
  if (activeTab === 'stats') return renderStats();
  return renderPlay();
}

function renderPlay(): string {
  const pinned = wallet!.activePerks?.includes('Context pinned');
  const showCpxWall = shouldShowCpxTask();
  const agentReadyInline = status === 'ready' && showCpxWall && surveyPersist;
  const showFullReadyOverlay = status === 'ready' && !showCpxWall;

  const agentHtml = showFullReadyOverlay
    ? `<div class="card ready-overlay card-enter ${pinned ? 'context-pinned' : ''}">
        <div class="ready-title"><i class="codicon codicon-check"></i> Agent ready</div>
        ${pinned ? '<div class="pinned-badge">📌 Context pinned</div>' : ''}
        <p>Return to:</p>
        <p class="context">"${escapeHtml(contextNote || 'your coding task')}"</p>
        <button class="btn" id="dismiss-ready">Back to code</button>
      </div>`
    : agentReadyInline
      ? `<div class="card agent-ready-inline card-enter ${pinned ? 'context-pinned' : ''}">
          <div class="ready-inline-row">
            <span class="ready-inline-title"><i class="codicon codicon-check"></i> Agent ready</span>
            <span class="ready-inline-hint">Survey saved in place — finish for points or pause below</span>
          </div>
          ${pinned ? `<p class="context pinned-line">Return to: "${escapeHtml(contextNote || 'your coding task')}"</p>` : ''}
        </div>`
      : `<div class="agent-pill ${status} card-enter">
          <span class="dot ${status === 'busy' ? 'pulse' : ''}"></span>
          <div>
            <div>${status === 'busy' ? 'Cursor is working' : status === 'ready' ? 'Agent finished' : 'Waiting for agent…'}</div>
            ${contextNote && status !== 'ready' && !showCpxWall ? `<div class="context">"${escapeHtml(contextNote)}"</div>` : ''}
          </div>
        </div>`;

  const showTask =
    currentTask &&
    (!isCpxWallTask(currentTask) ? status === 'busy' : showCpxWall);

  const taskHtml = showTask
    ? renderTask(currentTask!)
    : status === 'idle' && !showCpxWall
      ? renderIdleOverview()
      : '';

  const surveyStopHtml =
    showCpxWall && isCpxWallTask(currentTask)
      ? `<div class="survey-persist-actions">
        <button class="btn secondary" id="pause-survey">Pause survey</button>
        <button class="btn secondary" id="stop-survey" title="Discard this survey and pick another">New survey</button>
        ${status === 'ready' && surveyPersist ? '<button class="btn" id="back-to-code">Back to code</button>' : ''}
      </div>`
      : '';

  const challenge = wallet!.dailyChallenge;
  const challengeHtml =
    status === 'busy'
      ? `<div class="challenge">Today's challenge: ${challenge.progress}/${challenge.target} ${challenge.completed ? '✓' : ''}</div>`
      : '';

  return agentHtml + taskHtml + surveyStopHtml + challengeHtml;
}

function renderIdleOverview(): string {
  const profileBlock = renderProfileSection();
  const pausedBlock = renderPausedSurveyCard();

  return `${profileBlock}${pausedBlock}<div class="activity-sections">
    ${sections
      .map(
        (section) => `
      <section class="activity-section ${mode === section.id ? 'selected' : ''}">
        <div class="activity-section-head">
          <h3 class="activity-section-title">${escapeHtml(section.title)}</h3>
          <span class="activity-section-earn">${escapeHtml(section.earnLabel)}</span>
        </div>
        <p class="activity-section-sub">${escapeHtml(section.subtitle)}</p>
      </section>`
      )
      .join('')}
    <p class="idle-hint">Pick an activity below, then submit a Cursor Agent prompt to start.</p>
  </div>`;
}

function renderPausedSurveyCard(): string {
  if (!pausedCpxSession || surveyActive || shouldShowCpxTask()) {
    return '';
  }

  const pausedDate = new Date(pausedCpxSession.pausedAt);
  const when = Number.isNaN(pausedDate.getTime())
    ? 'recently'
    : pausedDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `<div class="card profile-card survey-paused card-enter">
    <div class="card-label"><span>Survey in progress</span><span class="reward-tag">Paused</span></div>
    <p class="question">You have a CPX survey saved mid-way (paused ${escapeHtml(when)}).</p>
    <p class="context">Continue now or it will auto-resume on your next Agent prompt.</p>
    <div class="btn-row">
      <button class="btn" id="resume-survey">Continue survey</button>
      <button class="btn secondary" id="stop-paused-survey">Start fresh survey list</button>
    </div>
  </div>`;
}

function renderProfileSection(): string {
  if (!cpxEnabled || mode !== 'surveys') {
    return '';
  }

  if (showProfileForm) {
    return `<div class="card profile-card card-enter">
      <div class="card-label"><span>Survey profile</span><span class="reward-tag">One-time</span></div>
      <p class="context">CPX uses this to match surveys and skip their signup form. Stored on StayOn backend only.</p>
      <label class="field-label">Email</label>
      <input class="field-input" type="email" id="profile-email" placeholder="you@example.com" />
      <label class="field-label">Date of birth</label>
      <div class="dob-row">
        <input class="field-input" type="number" id="profile-month" placeholder="MM" min="1" max="12" />
        <input class="field-input" type="number" id="profile-day" placeholder="DD" min="1" max="31" />
        <input class="field-input" type="number" id="profile-year" placeholder="YYYY" min="1900" max="2012" />
      </div>
      <label class="field-label">Gender (optional)</label>
      <select class="field-input" id="profile-gender">
        <option value="">Prefer not to say</option>
        <option value="m">Male</option>
        <option value="f">Female</option>
      </select>
      <label class="field-label">Country (optional)</label>
      <input class="field-input" type="text" id="profile-country" placeholder="US" maxlength="2" />
      <p class="context profile-tip">Use your real country (must match your IP). US/UK/DE usually have the most surveys. Age 25–54 typical.</p>
      <div class="btn-row">
        <button class="btn" id="save-profile">Save profile</button>
        <button class="btn secondary" id="cancel-profile">Cancel</button>
      </div>
    </div>`;
  }

  if (surveyProfile.completed) {
    return `<div class="card profile-card profile-done">
      <div class="card-label"><span>Survey profile</span><span class="reward-tag">✓ Ready</span></div>
      <p class="context">${surveyProfile.emailMasked ? `Signed in as ${escapeHtml(surveyProfile.emailMasked)}` : 'Profile on file'} — surveys load without CPX signup.</p>
      <button class="btn secondary" id="edit-profile">Update profile</button>
    </div>`;
  }

  return `<div class="card profile-card profile-prompt card-enter">
    <div class="card-label"><span>Survey profile</span><span class="reward-tag">Setup</span></div>
    <p class="question">Complete a one-time profile so you get real surveys instead of CPX's signup form mid-wait.</p>
    <button class="btn" id="open-profile">Set up survey profile</button>
  </div>`;
}

function renderTask(task: TaskPayload): string {
  if (task.kind === 'learn') {
    const tags = (task.tags as string[] | undefined)?.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') ?? '';
    return `<div class="card card-enter section-learn">
      <div class="card-label"><span>Learn</span><span class="reward-tag">${formatRewardTag(Number(task.reward))}</span></div>
      ${tags ? `<div class="tags">${tags}</div>` : ''}
      <div class="question">${escapeHtml(String(task.question))}</div>
      <p class="context">Answer: ${escapeHtml(String(task.answer))}</p>
      <div class="btn-row">
        <button class="btn" data-learn-id="${task.id}">Got it — earn point</button>
        <button class="btn secondary" data-learn-refresh>New card (5 ⭐)</button>
      </div>
    </div>`;
  }

  if (task.kind === 'perk-catalog') {
    const perks = (task.perks as PerkDefinition[]) ?? [];
    return `<div class="section-perks">
      <div class="section-intro">Spend points on small workflow boosts. Effects apply on your next wait or when the agent finishes.</div>
      ${perks
        .map((perk) => {
          const afford = wallet!.tokens >= perk.cost;
          return `<div class="card perk-card card-enter">
            <div class="card-label"><span>${escapeHtml(perk.title)}</span><span class="reward-tag">${formatRewardTag(perk.cost)}</span></div>
            <p class="question">${escapeHtml(perk.description)}</p>
            <div class="perk-benefit">${escapeHtml(perk.benefit)}</div>
            <button class="btn ${afford ? '' : 'disabled'}" data-perk-id="${perk.id}" ${afford ? '' : 'disabled'}>
              Redeem ${formatPoints(perk.cost, true)}
            </button>
          </div>`;
        })
        .join('')}
    </div>`;
  }

  if (task.kind === 'cpx') {
    const persistNote = surveyPersist
      ? '<p class="context survey-persist-note">Agent finished — your place in the survey is kept. Pause anytime and continue on the next Agent wait.</p>'
      : surveyActive && status === 'idle'
        ? '<p class="context survey-persist-note">Pick a survey from the list below.</p>'
        : '<p class="context">Complete a real survey while the agent works. Long surveys can be paused and continued later.</p>';

    return `<div class="card cpx-card card-enter section-surveys">
      <div class="card-label"><span>Surveys · CPX Research</span><span class="reward-tag">Paid</span></div>
      ${persistNote}
      <p class="context cpx-browser-hint">In-panel list, Cursor Browser, or external browser — use what works best. External browser is most reliable for CPX today. StayOn chimes and brings Cursor back when the agent finishes.</p>
      <div class="btn-row">
        <button class="btn" id="open-cpx-browser">Open in browser</button>
        <button class="btn secondary" id="open-cpx-cursor">Open in Cursor Browser</button>
      </div>
    </div>`;
  }

  if (task.kind === 'surveys') {
    const needsBackend = !cpxEnabled;
    return `<div class="card card-enter section-surveys">
      <div class="card-label"><span>Surveys</span><span class="reward-tag">50–500+ ⭐</span></div>
      ${
        needsBackend
          ? `<p class="question">Connect StayOn backend to load paid surveys.</p>
             <p class="context">Set <code>stayon.apiBaseUrl</code> to your StayOn web app (e.g. http://localhost:3000), then reload.</p>`
          : `<p class="question">${escapeHtml(String(task.label))}</p>
             <p class="context">Loading CPX SurveyWall…</p>`
      }
    </div>`;
  }

  return '';
}

function renderWallet(): string {
  return `<div class="wallet-grid">
      <div class="stat-box"><div>Points</div><div class="stat-value points-value">${formatPoints(wallet!.tokens)}</div></div>
      <div class="stat-box"><div>Cash est.</div><div class="stat-value">${wallet!.cashEstimate}</div></div>
    </div>
    <div class="progress-wrap">
      <div class="meta">Level ${wallet!.level} · ${wallet!.xpProgress}% to next</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${wallet!.xpProgress}%"></div></div>
    </div>
    ${
      wallet!.activePerks?.length
        ? `<div class="card"><div class="card-label"><span>Active perks</span></div>
           ${wallet!.activePerks.map((p) => `<div class="history-item">${escapeHtml(p)}</div>`).join('')}</div>`
        : ''
    }
    <div class="card">
      <div class="card-label"><span>Recent</span></div>
      ${
        wallet!.history.length
          ? wallet!.history
              .slice(0, 8)
              .map((h) => `<div class="history-item">${formatPointsDelta(h.tokens)} · ${escapeHtml(h.label)}</div>`)
              .join('')
          : '<p class="context">Complete a wait-task to earn points.</p>'
      }
    </div>
    <button class="btn secondary" disabled>Redeem cash (min 5,000 ${formatPoints(5000, true)} — coming soon)</button>`;
}

function renderStats(): string {
  const s = wallet!.stats;
  return `<div class="wallet-grid">
      <div class="stat-box"><div>Tasks today</div><div class="stat-value">${s.tasksToday}</div></div>
      <div class="stat-box"><div>Waits done</div><div class="stat-value">${s.waitsCompleted}</div></div>
      <div class="stat-box"><div>Total tasks</div><div class="stat-value">${s.totalTasks}</div></div>
      <div class="stat-box"><div>Wait streak</div><div class="stat-value">${wallet!.waitStreak}</div></div>
    </div>
    <div class="card">
      <div class="card-label"><span>Badges</span></div>
      <div class="badges">
        ${
          wallet!.badges.length
            ? wallet!.badges.map((b) => `<span class="badge">${escapeHtml(b)}</span>`).join('')
            : '<span class="context">Earn badges by completing tasks.</span>'
        }
      </div>
    </div>`;
}

function bindEvents(): void {
  app.querySelectorAll('.tab').forEach((el) => {
    el.addEventListener('click', () => {
      activeTab = (el as HTMLElement).dataset.tab as typeof activeTab;
      vscode.setState({ ...(vscode.getState() as object), activeTab });
      render();
    });
  });

  app.querySelectorAll('.activity-btn').forEach((el) => {
    el.addEventListener('click', () => {
      const m = (el as HTMLElement).dataset.mode as TaskMode;
      vscode.postMessage({ type: 'setMode', mode: m });
    });
  });

  app.querySelector('[data-learn-id]')?.addEventListener('click', (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.learnId!;
    vscode.postMessage({ type: 'learnComplete', taskId: id });
  });

  app.querySelector('[data-learn-refresh]')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'learnRefresh' });
  });

  app.querySelectorAll('[data-perk-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const perkId = (el as HTMLElement).dataset.perkId!;
      vscode.postMessage({ type: 'redeemPerk', perkId });
    });
  });

  document.getElementById('dismiss-ready')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'pauseSurvey' });
  });

  document.getElementById('open-cpx-browser')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'openCpxInBrowser' });
  });
  document.getElementById('open-cpx-cursor')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'openCpxInCursor' });
  });

  document.getElementById('pause-survey')?.addEventListener('click', () => {
    surveyActive = false;
    surveyPersist = false;
    cpxRenderLocked = false;
    vscode.postMessage({ type: 'pauseSurvey' });
  });

  document.getElementById('stop-survey')?.addEventListener('click', () => {
    surveyPersist = false;
    cpxRenderLocked = false;
    vscode.postMessage({ type: 'dismissSurvey' });
  });

  document.getElementById('back-to-code')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'pauseSurvey' });
  });

  document.getElementById('resume-survey')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'resumeSurvey' });
  });

  document.getElementById('stop-paused-survey')?.addEventListener('click', () => {
    vscode.postMessage({ type: 'dismissSurvey' });
  });

  document.getElementById('open-profile')?.addEventListener('click', () => {
    showProfileForm = true;
    render();
  });

  document.getElementById('edit-profile')?.addEventListener('click', () => {
    showProfileForm = true;
    render();
  });

  document.getElementById('cancel-profile')?.addEventListener('click', () => {
    showProfileForm = false;
    render();
  });

  document.getElementById('save-profile')?.addEventListener('click', () => {
    const email = (document.getElementById('profile-email') as HTMLInputElement).value.trim();
    const birthdayMonth = Number((document.getElementById('profile-month') as HTMLInputElement).value);
    const birthdayDay = Number((document.getElementById('profile-day') as HTMLInputElement).value);
    const birthdayYear = Number((document.getElementById('profile-year') as HTMLInputElement).value);
    const genderRaw = (document.getElementById('profile-gender') as HTMLSelectElement).value;
    const countryRaw = (document.getElementById('profile-country') as HTMLInputElement).value.trim().toUpperCase();

    vscode.postMessage({
      type: 'submitSurveyProfile',
      email,
      birthdayYear,
      birthdayMonth,
      birthdayDay,
      gender: genderRaw === 'm' || genderRaw === 'f' ? genderRaw : undefined,
      countryCode: countryRaw.length === 2 ? countryRaw : undefined,
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
