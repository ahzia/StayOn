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
let status: AgentStatus = 'idle';
let contextNote = '';
let activeTab: 'play' | 'wallet' | 'stats' = 'play';
let currentTask: TaskPayload | undefined;
let lastBalance = -1;

const app = document.getElementById('app')!;

vscode.postMessage({ type: 'ready' });

window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init':
      wallet = msg.wallet;
      mode = normalizeMode(msg.mode);
      sections = msg.sectionMeta ?? DEFAULT_SECTIONS;
      cpxEnabled = Boolean(msg.cpxEnabled);
      render();
      break;
    case 'state':
      status = msg.status;
      if (msg.contextNote) contextNote = msg.contextNote;
      render();
      break;
    case 'task':
      currentTask = msg.task;
      activeTab = 'play';
      render();
      if (currentTask?.kind === 'cpx') {
        vscode.postMessage({ type: 'cpxEngaged' });
      }
      break;
    case 'wallet':
      wallet = msg.wallet;
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

function normalizeMode(raw: string | undefined): TaskMode {
  if (raw === 'earn' || raw === 'surveys') return 'surveys';
  if (raw === 'focus' || raw === 'perks') return 'perks';
  if (raw === 'learn') return 'learn';
  return 'surveys';
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

function render(): void {
  if (!wallet) {
    app.innerHTML = '<p>Loading StayOn…</p>';
    return;
  }

  const state = vscode.getState() as { activeTab?: typeof activeTab } | undefined;
  if (state?.activeTab) activeTab = state.activeTab;

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
}

function renderTabContent(): string {
  if (activeTab === 'wallet') return renderWallet();
  if (activeTab === 'stats') return renderStats();
  return renderPlay();
}

function renderPlay(): string {
  const pinned = wallet!.activePerks?.includes('Context pinned');
  const agentHtml =
    status === 'ready'
      ? `<div class="card ready-overlay card-enter ${pinned ? 'context-pinned' : ''}">
          <div class="ready-title"><i class="codicon codicon-check"></i> Agent ready</div>
          ${pinned ? '<div class="pinned-badge">📌 Context pinned</div>' : ''}
          <p>Return to:</p>
          <p class="context">"${escapeHtml(contextNote || 'your coding task')}"</p>
          <button class="btn" id="dismiss-ready">Back to code</button>
        </div>`
      : `<div class="agent-pill ${status} card-enter">
          <span class="dot ${status === 'busy' ? 'pulse' : ''}"></span>
          <div>
            <div>${status === 'busy' ? 'Cursor is working' : 'Waiting for agent…'}</div>
            ${contextNote ? `<div class="context">"${escapeHtml(contextNote)}"</div>` : ''}
          </div>
        </div>`;

  const taskHtml =
    status === 'busy' && currentTask
      ? renderTask(currentTask)
      : status === 'idle'
        ? renderIdleOverview()
        : '';

  const challenge = wallet!.dailyChallenge;
  const challengeHtml =
    status === 'busy'
      ? `<div class="challenge">Today's challenge: ${challenge.progress}/${challenge.target} ${challenge.completed ? '✓' : ''}</div>`
      : '';

  return agentHtml + taskHtml + challengeHtml;
}

function renderIdleOverview(): string {
  return `<div class="activity-sections">
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
    return `<div class="card cpx-card card-enter section-surveys">
      <div class="card-label"><span>Surveys · CPX Research</span><span class="reward-tag">Paid</span></div>
      <p class="context">Complete a real survey while the agent works. Points sync when CPX confirms completion.</p>
      <iframe class="cpx-frame" src="${escapeHtml(String(task.iframeUrl))}" title="CPX SurveyWall"></iframe>
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
      vscode.setState({ activeTab });
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
    vscode.postMessage({ type: 'dismissReady' });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
