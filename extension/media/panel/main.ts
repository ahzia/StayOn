import confetti from 'canvas-confetti';

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

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
  stats: { totalTasks: number; waitsCompleted: number; tasksToday: number };
}

type TaskPayload = Record<string, unknown>;
type AgentStatus = 'idle' | 'busy' | 'ready';

let wallet: WalletSnapshot | undefined;
let mode: 'earn' | 'learn' | 'focus' = 'earn';
let status: AgentStatus = 'idle';
let contextNote = '';
let activeTab: 'play' | 'wallet' | 'stats' = 'play';
let currentTask: TaskPayload | undefined;
let sponsoredViewSent = new Set<string>();

const app = document.getElementById('app')!;

vscode.postMessage({ type: 'ready' });

window.addEventListener('message', (event) => {
  const msg = event.data;
  switch (msg.type) {
    case 'init':
      wallet = msg.wallet;
      mode = msg.mode;
      render();
      break;
    case 'state':
      status = msg.status;
      if (msg.contextNote) contextNote = msg.contextNote;
      render();
      break;
    case 'task':
      currentTask = msg.task;
      sponsoredViewSent = new Set();
      activeTab = 'play';
      render();
      if (currentTask?.kind === 'sponsored' && currentTask.id) {
        const id = String(currentTask.id);
        if (!sponsoredViewSent.has(id)) {
          sponsoredViewSent.add(id);
          vscode.postMessage({ type: 'sponsoredView', taskId: id });
        }
      }
      break;
    case 'wallet':
      wallet = msg.wallet;
      render();
      break;
    case 'reward':
      showRewardFloat(`+${msg.tokens} ⭐`);
      celebrate();
      render();
      break;
    case 'ready':
      status = 'ready';
      contextNote = msg.contextNote ?? contextNote;
      render();
      if (msg.flowBonus) {
        setTimeout(() => showRewardFloat(`Flow +${msg.flowBonus} ⭐`), 400);
      }
      break;
    case 'badge':
      showRewardFloat(`🏆 ${msg.name}`);
      break;
  }
});

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
    colors: ['#FFD700', '#FFA500', '#89d185'],
  });
}

function render(): void {
  if (!wallet) {
    app.innerHTML = '<p>Loading StayOn…</p>';
    return;
  }

  const state = vscode.getState() as { activeTab?: typeof activeTab } | undefined;
  if (state?.activeTab) activeTab = state.activeTab;

  app.innerHTML = `
    <div class="header">
      <div class="header-row">
        <span class="brand"><i class="codicon codicon-star-full"></i> StayOn</span>
        <span class="meta">Lv.${wallet.level} · 🔥 ${wallet.dailyStreak}</span>
      </div>
      <div class="balance">${wallet.tokens} ⭐</div>
      <div class="cash">${wallet.cashEstimate}</div>
    </div>

    <div class="tabs">
      <button class="tab ${activeTab === 'play' ? 'active' : ''}" data-tab="play">Play</button>
      <button class="tab ${activeTab === 'wallet' ? 'active' : ''}" data-tab="wallet">Wallet</button>
      <button class="tab ${activeTab === 'stats' ? 'active' : ''}" data-tab="stats">Stats</button>
    </div>

    ${renderTabContent()}

    <div class="mode-footer">
      ${(['earn', 'learn', 'focus'] as const)
        .map(
          (m) =>
            `<button class="mode-btn ${mode === m ? 'active' : ''}" data-mode="${m}">${capitalize(m)}</button>`
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
  const agentHtml =
    status === 'ready'
      ? `<div class="card ready-overlay">
          <div class="ready-title"><i class="codicon codicon-check"></i> Agent ready</div>
          <p>Return to:</p>
          <p class="context">"${escapeHtml(contextNote || 'your coding task')}"</p>
          <button class="btn" id="dismiss-ready">Back to code</button>
        </div>`
      : `<div class="agent-pill ${status}">
          <span class="dot ${status === 'busy' ? 'pulse' : ''}"></span>
          <div>
            <div>${status === 'busy' ? 'Cursor is working' : 'Waiting for agent…'}</div>
            ${contextNote ? `<div class="context">"${escapeHtml(contextNote)}"</div>` : ''}
          </div>
        </div>`;

  const taskHtml =
    status === 'busy' && currentTask ? renderTask(currentTask) : status === 'idle' ? renderIdleHint() : '';

  const challenge = wallet!.dailyChallenge;
  const challengeHtml =
    status === 'busy'
      ? `<div class="challenge">Today's challenge: ${challenge.progress}/${challenge.target} ${challenge.completed ? '✓' : ''}</div>`
      : '';

  return agentHtml + taskHtml + challengeHtml;
}

function renderIdleHint(): string {
  return `<div class="card"><p class="question">Submit a Cursor Agent prompt to start earning while you wait.</p></div>`;
}

function renderTask(task: TaskPayload): string {
  if (task.kind === 'quiz') {
    const options = (task.options as string[]) || [];
    return `<div class="card">
      <div class="card-label"><span>Quick task</span><span class="reward-tag">+${task.reward} ⭐</span></div>
      <div class="question">${escapeHtml(String(task.question))}</div>
      <div class="options">
        ${options
          .map(
            (opt, i) =>
              `<button class="option" data-quiz="${task.id}" data-index="${i}">${escapeHtml(opt)}</button>`
          )
          .join('')}
      </div>
    </div>`;
  }

  if (task.kind === 'sponsored') {
    return `<div class="card">
      <div class="sponsored-badge">Sponsored</div>
      <div class="card-label"><span>Developer card</span><span class="reward-tag">+${task.viewReward} ⭐</span></div>
      <div class="sponsor-name">${escapeHtml(String(task.sponsor))}</div>
      <p class="question">${escapeHtml(String(task.tagline))}</p>
      <button class="btn" data-sponsor-url="${escapeHtml(String(task.url))}" data-sponsor-id="${task.id}">
        Visit (+${task.clickReward} ⭐ click)
      </button>
    </div>`;
  }

  if (task.kind === 'learn') {
    return `<div class="card">
      <div class="card-label"><span>Learn</span><span class="reward-tag">+${task.reward} ⭐</span></div>
      <div class="question">${escapeHtml(String(task.question))}</div>
      <p class="context">Answer: ${escapeHtml(String(task.answer))}</p>
      <button class="btn" data-learn-id="${task.id}">Got it — earn tokens</button>
    </div>`;
  }

  if (task.kind === 'focus') {
    return `<div class="card">
      <div class="card-label"><span>Focus</span><span class="reward-tag">+${task.reward} ⭐</span></div>
      <div class="question">${escapeHtml(String(task.prompt))}</div>
      <button class="btn" data-focus-id="${task.id}">Done (${task.durationSec}s pause)</button>
    </div>`;
  }

  return '';
}

function renderWallet(): string {
  return `<div class="wallet-grid">
      <div class="stat-box"><div>Tokens</div><div class="stat-value">${wallet!.tokens} ⭐</div></div>
      <div class="stat-box"><div>Cash est.</div><div class="stat-value">${wallet!.cashEstimate}</div></div>
    </div>
    <div class="progress-wrap">
      <div class="meta">Level ${wallet!.level} · ${wallet!.xpProgress}% to next</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${wallet!.xpProgress}%"></div></div>
    </div>
    <div class="card">
      <div class="card-label"><span>Recent</span></div>
      ${
        wallet!.history.length
          ? wallet!.history
              .slice(0, 8)
              .map((h) => `<div class="history-item">+${h.tokens} ⭐ · ${escapeHtml(h.label)}</div>`)
              .join('')
          : '<p class="context">Complete a wait-task to earn tokens.</p>'
      }
    </div>
    <button class="btn secondary" disabled>Redeem (min 5,000 ⭐ — coming soon)</button>`;
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

  app.querySelectorAll('.mode-btn').forEach((el) => {
    el.addEventListener('click', () => {
      const m = (el as HTMLElement).dataset.mode as typeof mode;
      vscode.postMessage({ type: 'setMode', mode: m });
    });
  });

  app.querySelectorAll('.option').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.quiz!;
      const index = Number((el as HTMLElement).dataset.index);
      vscode.postMessage({ type: 'taskComplete', taskId: id, answerIndex: index });
    });
  });

  app.querySelector('[data-sponsor-url]')?.addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLElement;
    vscode.postMessage({
      type: 'openSponsor',
      url: btn.dataset.sponsorUrl!,
      taskId: btn.dataset.sponsorId!,
    });
  });

  app.querySelector('[data-learn-id]')?.addEventListener('click', (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.learnId!;
    vscode.postMessage({ type: 'learnComplete', taskId: id });
  });

  app.querySelector('[data-focus-id]')?.addEventListener('click', (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.focusId!;
    vscode.postMessage({ type: 'focusComplete', taskId: id });
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
