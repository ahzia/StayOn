# StayOn Technical Research & Stack Reference

Pre-implementation research: libraries, APIs, tooling, and locked decisions so implementation can start immediately.

Related docs:

- [03_implementation_plan.md](./03_implementation_plan.md) — what to build
- [02_integration_options.md](./02_integration_options.md) — architecture rationale

---

## 1. Locked Stack Decisions (MVP)

These choices are **final for implementation**. Do not re-evaluate during the hackathon unless something blocks the build.

| Layer | Choice | Why |
|-------|--------|-----|
| **Runtime** | Cursor IDE (VS Code 1.105+ fork) | Target platform |
| **Busy detection** | `.cursor/hooks.json` shell hooks | Official, real agent state |
| **Hook → extension bridge** | Localhost HTTP (`127.0.0.1`, dynamic port) | Instant push; hooks stay <200ms |
| **Extension language** | TypeScript | Standard for VS Code extensions |
| **Extension bundler** | esbuild | Microsoft-recommended; fast F5 loop |
| **Webview UI** | Vanilla HTML + CSS + TS (esbuild browser bundle) | Fastest MVP; no React overhead |
| **Icons / theme** | `@vscode/codicons` + `--vscode-*` CSS vars | Native Cursor look |
| **Reward animation** | `canvas-confetti` (star burst on token earn) | Zero deps, tiny, works in webview |
| **Persistence** | `ExtensionContext.globalState` (Memento) | Built-in, survives reload |
| **HTTP server** | Node.js built-in `http` module | No Express dependency |
| **IDs / ledger** | `crypto.randomUUID()` | Built-in Node 18+ |
| **Task content (MVP)** | Hardcoded JSON in extension | No backend required for demo |
| **Real money surveys** | Phase 2 (BitLabs API) | Needs dashboard + callbacks |
| **Publish target** | Open VSX (`ovsx`) | Cursor marketplace |

---

## 2. Development Environment

### 2.1 Required tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ (20 LTS recommended) | Extension build + bridge server |
| **npm** | 9+ | Package management |
| **Cursor** | Latest stable | Runtime + Agent + Hooks |
| **jq** | 1.6+ | Hook scripts parse stdin JSON |
| **curl** | any recent | Hook scripts POST to bridge |
| **Git** | any | Version control |

Install jq on macOS:

```bash
brew install jq
```

Verify:

```bash
node -v && jq --version && curl --version
```

### 2.2 Cursor-specific setup

1. Open StayOn repo in **Cursor** (not plain VS Code) for hook testing.
2. After adding hooks, go to **Cursor Settings → Hooks** and **trust** StayOn hook definitions.
3. Use **Hooks Execution Log** (same settings page) to debug hook firing.
4. Extension dev: **Run → Start Debugging (F5)** launches Extension Development Host.

### 2.3 VS Code / Cursor API version

Cursor 2.5.x reports VS Code **1.105.x**. Pin extension compatibility:

```json
"engines": {
  "vscode": "^1.85.0"
}
```

Use `@types/vscode` matching your Cursor version when possible. Mismatch causes type errors but usually still runs.

---

## 3. Extension Scaffold

### 3.1 Starting point (do not use `yo code` blindly)

Use Microsoft's official samples as reference, not a black-box generator:

| Sample | URL | Use for |
|--------|-----|---------|
| **esbuild-sample** | [github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample) | Extension host bundling |
| **webview-view-sample** | [github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample) | Side panel (`WebviewViewProvider`) |
| **webview-codicons-sample** | [github.com/microsoft/vscode-extension-samples/tree/main/webview-codicons-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/webview-codicons-sample) | Icons + theming |

**Implementation command sequence:**

```bash
mkdir -p extension/src extension/media
cd extension
npm init -y
npm install -D typescript @types/vscode @types/node esbuild npm-run-all
npm install @vscode/codicons canvas-confetti
npm install -D @types/canvas-confetti
```

### 3.2 npm packages (extension host)

| Package | Type | Version (pin) | Purpose |
|---------|------|---------------|---------|
| `typescript` | dev | `^5.8.0` | Type checking (`tsc --noEmit`) |
| `@types/vscode` | dev | `^1.105.0` | Extension API types |
| `@types/node` | dev | `^22.0.0` | Node HTTP server types |
| `esbuild` | dev | `^0.25.0` | Bundle extension + webview |
| `npm-run-all` | dev | `^4.1.5` | Parallel watch scripts |
| `@vscode/vsce` | dev | `^3.7.0` | Package `.vsix` |
| `@vscode/codicons` | prod | `^0.0.39` | Webview icons (bundled in vsix) |

**Do not install** for MVP: Express, React, webpack, `@vscode/webview-ui-toolkit` (deprecated Jan 2025).

### 3.3 npm packages (webview bundle)

| Package | Purpose |
|---------|---------|
| `canvas-confetti` | Token-earn celebration animation |

Optional later: `js-confetti` (emoji confetti — e.g. ⭐ particles).

### 3.4 Dual esbuild setup

Two bundles from one repo:

```
esbuild.js builds:
  src/extension.ts  → dist/extension.js     (platform: node, external: vscode)
  media/panel/main.ts → media/panel/main.js  (platform: browser)
  media/panel/main.css → copied/bundled
```

Reference: [VS Code bundling docs](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) and [esbuild-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/esbuild-sample).

**package.json scripts (copy this):**

```json
{
  "scripts": {
    "check-types": "tsc --noEmit",
    "build:ext": "node esbuild.js --ext",
    "build:webview": "node esbuild.js --webview",
    "compile": "npm run check-types && npm run build:ext && npm run build:webview",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch",
    "vscode:prepublish": "npm run compile -- --production",
    "package": "vsce package --no-dependencies"
  }
}
```

### 3.5 `package.json` contributes (side panel)

```json
{
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "stayon",
        "title": "StayOn",
        "icon": "media/stayon-icon.svg"
      }]
    },
    "views": {
      "stayon": [{
        "type": "webview",
        "id": "stayon.panel",
        "name": "StayOn"
      }]
    },
    "commands": [
      { "command": "stayon.openPanel", "title": "StayOn: Open Panel" },
      { "command": "stayon.verifyHooks", "title": "StayOn: Verify Hook Setup" },
      { "command": "stayon.showOutput", "title": "StayOn: Show Debug Output" }
    ],
    "configuration": {
      "title": "StayOn",
      "properties": {
        "stayon.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable StayOn wait-time panel"
        },
        "stayon.bridgePort": {
          "type": "number",
          "default": 3847,
          "description": "Localhost port for hook bridge"
        },
        "stayon.mode": {
          "type": "string",
          "enum": ["earn", "learn", "focus"],
          "default": "earn"
        }
      }
    }
  }
}
```

---

## 4. Cursor Hooks — Reference for Implementation

Official docs: [cursor.com/docs/hooks](https://cursor.com/docs/hooks)

### 4.1 Hook rules (critical)

| Rule | Detail |
|------|--------|
| Fail open | Always `exit 0` for StayOn telemetry hooks |
| Speed | <200ms — only `curl` POST, no heavy logic |
| Trust | User must trust hooks in Cursor Settings |
| Matchers | Start **without** matchers; add later if needed |
| Regex | Matchers use **JavaScript** regex, not POSIX |
| Project paths | Hooks run from **project root** → use `.cursor/hooks/foo.sh` |

### 4.2 Events StayOn uses + stdin fields

All hooks receive **base fields** on stdin:

```typescript
interface HookBase {
  conversation_id?: string;
  generation_id?: string;
  model?: string;
  hook_event_name: string;
  cursor_version?: string;
  workspace_roots?: string[];
  user_email?: string | null;
  transcript_path?: string | null;
}
```

| Event | Extra fields we read | Bridge event |
|-------|---------------------|--------------|
| `beforeSubmitPrompt` | `prompt`, `attachments[]` | `busy_start` + `context_note` |
| `preToolUse` | `tool_name`, `tool_use_id`, `cwd` | `busy_heartbeat` |
| `postToolUse` | `tool_name`, `duration` | `busy_heartbeat` |
| `afterAgentThought` | `text`, `duration_ms` | `busy_heartbeat` + `phase=thinking` |
| `subagentStart` | `subagent_type`, `task` | `busy_ref` delta `+1` |
| `subagentStop` | `status`, `subagent_type` | `busy_ref` delta `-1` |
| `stop` | `status`, `loop_count` | `busy_end` |
| `sessionEnd` | — | `session_end` (force idle) |

**Privacy:** From `beforeSubmitPrompt`, only store `prompt.slice(0, 120)` as `context_note`. Do **not** read `attachments`, `transcript_path`, or file contents in hooks.

### 4.3 Recommended: single hook script

Instead of four separate scripts, use **one router script** to reduce duplication:

```bash
#!/usr/bin/env bash
# .cursor/hooks/stayon-event.sh
set -euo pipefail
INPUT=$(cat)
PORT=$(cat "$HOME/.stayon/port" 2>/dev/null || echo "3847")
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')

case "$EVENT" in
  beforeSubmitPrompt)
    NOTE=$(echo "$INPUT" | jq -r '.prompt // ""' | head -c 120)
    BODY=$(jq -nc --arg e busy_start --arg n "$NOTE" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, context_note:$n, ts:$t}')
    ;;
  preToolUse|postToolUse)
    TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')
    BODY=$(jq -nc --arg e busy_heartbeat --arg tool "$TOOL" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, tool:$tool, ts:$t}')
    ;;
  afterAgentThought)
    BODY=$(jq -nc --arg e busy_heartbeat --arg phase thinking --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, phase:$phase, ts:$t}')
    ;;
  subagentStart)
    BODY=$(jq -nc --arg e busy_ref --argjson d 1 --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, delta:$d, ts:$t}')
    ;;
  subagentStop)
    BODY=$(jq -nc --arg e busy_ref --argjson d -1 --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, delta:$d, ts:$t}')
    ;;
  stop)
    STATUS=$(echo "$INPUT" | jq -r '.status // "completed"')
    BODY=$(jq -nc --arg e busy_end --arg s "$STATUS" --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, status:$s, ts:$t}')
    ;;
  sessionEnd)
    BODY=$(jq -nc --arg e session_end --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      '{event:$e, ts:$t}')
    ;;
  *)
    exit 0
    ;;
esac

curl -sf -X POST "http://127.0.0.1:${PORT}/event" \
  -H "Content-Type: application/json" \
  -d "$BODY" >/dev/null 2>&1 || true
exit 0
```

**hooks.json** (one command, multiple events):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "preToolUse": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "postToolUse": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "afterAgentThought": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "subagentStart": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "subagentStop": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "stop": [{ "command": ".cursor/hooks/stayon-event.sh" }],
    "sessionEnd": [{ "command": ".cursor/hooks/stayon-event.sh" }]
  }
}
```

Make executable: `chmod +x .cursor/hooks/stayon-event.sh`

### 4.4 Optional: TypeScript hooks (alternative)

If shell + jq is fragile on Windows, compile hook handlers to Node scripts:

| Package | Purpose |
|---------|---------|
| `cursor-hooks` (community) | TypeScript types for payloads — [egghead lesson](https://egghead.io/lessons/type-safe-cursor-hooks-with-the-cursor-hooks-package~6ba9w) |
| `@mherod/agent-hook-schemas` | Zod schemas for Cursor/Claude/Codex hooks |

For hackathon on macOS, **bash + jq is faster to ship**. Windows support can use Node hooks in Phase 2.

### 4.5 Do NOT use `stop` hook `followup_message` for StayOn UI

The `stop` hook can return `{ "followup_message": "..." }` which **auto-submits a new agent prompt**. StayOn should **never** do this — it would hijack the agent loop.

Return-to-context belongs in the **extension panel overlay only**, not hook stdout.

---

## 5. Localhost Bridge — Implementation Notes

### 5.1 Port file contract

On extension `activate`:

```typescript
// Write ~/.stayon/port and ~/.stayon/pid
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const STAYON_DIR = path.join(os.homedir(), '.stayon');
fs.mkdirSync(STAYON_DIR, { recursive: true });
fs.writeFileSync(path.join(STAYON_DIR, 'port'), String(port));
fs.writeFileSync(path.join(STAYON_DIR, 'pid'), String(process.pid));
```

On `deactivate`: delete pid file, close server.

### 5.2 HTTP server (built-in `http`)

```typescript
import * as http from 'http';

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, busy: state.isBusy(), busy_ref: state.ref }));
    return;
  }
  if (req.method === 'POST' && req.url === '/event') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        state.handle(event);
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(port, '127.0.0.1');
```

**Security:** Bind only to `127.0.0.1`, not `0.0.0.0`.

### 5.3 Busy state machine (extension-side)

```typescript
class BusyState {
  private ref = 0;
  private contextNote = '';
  private status: 'idle' | 'busy' | 'ready' = 'idle';

  handle(event: BridgeEvent) {
    switch (event.event) {
      case 'busy_start':
        this.ref = Math.max(1, this.ref);
        this.contextNote = event.context_note ?? '';
        this.status = 'busy';
        this.emit('busyStart');
        break;
      case 'busy_heartbeat':
        if (this.status !== 'idle') this.ref = Math.max(1, this.ref);
        break;
      case 'busy_ref':
        this.ref = Math.max(0, this.ref + event.delta);
        if (this.ref > 0) this.status = 'busy';
        break;
      case 'busy_end':
        this.ref = 0;
        this.status = 'ready';
        this.emit('busyEnd', { status: event.status, contextNote: this.contextNote });
        setTimeout(() => { if (this.ref === 0) this.status = 'idle'; }, 8000);
        break;
      case 'session_end':
        this.ref = 0;
        this.status = 'idle';
        break;
    }
  }
}
```

### 5.4 File-based fallback

If HTTP fails (corporate firewall, port conflict after retries):

- Hooks write append-only JSON lines to `~/.stayon/events.jsonl`
- Extension polls every 500ms

Implement fallback only if HTTP blocked during testing — not default path.

---

## 6. Webview UI — Implementation Notes

### 6.1 WebviewViewProvider pattern

Reference: [webview-view-sample](https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/src/extension.ts)

Key methods:

- `resolveWebviewView()` — set `enableScripts: true`, `localResourceRoots`
- `webview.postMessage()` — extension → panel (busy state, wallet updates)
- `onDidReceiveMessage` — panel → extension (task complete, tab change)
- `view.show?.(true)` — auto-open panel on busy (API available in recent VS Code)

### 6.2 Message protocol (extension ↔ webview)

```typescript
// Extension → Webview
type ToWebview =
  | { type: 'state'; status: 'idle' | 'busy' | 'ready'; contextNote?: string }
  | { type: 'wallet'; wallet: WalletSnapshot }
  | { type: 'task'; task: TaskPayload }
  | { type: 'reward'; tokens: number; label: string; bonus?: string };

// Webview → Extension
type FromWebview =
  | { type: 'ready' }
  | { type: 'taskComplete'; taskId: string; answer?: string }
  | { type: 'openWallet' }
  | { type: 'dismissReady' };
```

### 6.3 Theming (match Cursor dark UI)

Use VS Code CSS variables — no hardcoded colors:

```css
body {
  background: var(--vscode-sideBar-background);
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
}

.token-balance {
  color: var(--vscode-charts-yellow);
}

.agent-pill.busy {
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
}

.btn-primary {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
```

Docs: [Webview theming](https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content)

### 6.4 Codicons for gamification

```html
<link href="${codiconsUri}" rel="stylesheet" />
<i class="codicon codicon-star-full"></i>   <!-- tokens -->
<i class="codicon codicon-flame"></i>       <!-- streak -->
<i class="codicon codicon-trophy"></i>      <!-- badges -->
<i class="codicon codicon-check"></i>       <!-- task done -->
<i class="codicon codicon-loading spin"></i> <!-- agent working -->
```

Install: `npm install @vscode/codicons`

### 6.5 Token celebration animation

```typescript
// media/panel/reward.ts
import confetti from 'canvas-confetti';

export function celebrateTokens(amount: number) {
  confetti({
    particleCount: Math.min(80, 20 + amount),
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#FFD700', '#FFA500', '#90EE90'],
  });
}
```

CSP must allow script from webview bundle URI. No external CDN in production webview.

### 6.6 Content Security Policy template

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  style-src ${webview.cspSource} 'unsafe-inline';
  script-src ${webview.cspSource};
  font-src ${webview.cspSource};
  img-src ${webview.cspSource} data:;
">
```

Generate nonce for inline scripts if needed: [Webview CSP docs](https://code.visualstudio.com/api/extension-guides/webview#content-security-policy)

### 6.7 `acquireVsCodeApi` state

```typescript
const vscode = acquireVsCodeApi();
const prev = vscode.getState() ?? {};
vscode.setState({ ...prev, activeTab: 'play' });
```

Persists tab selection across panel hide/show.

---

## 7. Gamification — Constants & Logic (copy into code)

### 7.1 Economy constants

```typescript
export const ECONOMY = {
  TOKEN_TO_EUR: 0.0001,           // 1,000 ⭐ ≈ €0.10
  FLOW_BONUS: 5,                  // complete task before agent stops
  REDEEM_MIN_TOKENS: 5000,        // stub threshold
  QUIZ_REWARD: { min: 8, max: 15 },
  SPONSORED_VIEW: 5,
  SPONSORED_CLICK: 50,
  FOCUS_REWARD: 12,
  LEARN_REWARD: 10,
} as const;
```

### 7.2 Level formula

```typescript
export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 50)) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * level * 50;
}
```

### 7.3 Streak multiplier

```typescript
export function streakMultiplier(dailyStreak: number): number {
  if (dailyStreak >= 14) return 1.5;
  if (dailyStreak >= 7) return 1.25;
  if (dailyStreak >= 3) return 1.1;
  return 1;
}
```

### 7.4 Badge definitions

```typescript
export const BADGES = [
  { id: 'first_flow', name: 'First Flow', test: (w: Wallet) => w.totalTasks >= 1 },
  { id: 'streak_3', name: 'Streak Starter', test: (w: Wallet) => w.dailyStreak >= 3 },
  { id: 'streak_7', name: 'On Fire', test: (w: Wallet) => w.dailyStreak >= 7 },
  { id: 'multitasker', name: 'Multitasker', test: (w: Wallet) => w.subagentTasks >= 1 },
  { id: 'focused_10', name: 'Focused', test: (w: Wallet) => w.focusSessions >= 10 },
  { id: 'century', name: 'Century', test: (w: Wallet) => w.totalTasks >= 100 },
] as const;
```

### 7.5 MVP task bank (hardcoded)

Ship 8 quiz questions + 2 sponsored cards in `extension/src/gamification/taskBank.ts`:

```typescript
export const QUIZ_TASKS = [
  {
    id: 'q1',
    question: 'Which Cursor hook marks the start of a wait session?',
    options: ['stop', 'beforeSubmitPrompt', 'afterFileEdit'],
    correctIndex: 1,
    reward: 12,
  },
  // ... 7 more dev/AI trivia questions
];

export const SPONSORED_CARDS = [
  {
    id: 's1',
    sponsor: 'Linear',
    tagline: 'Issue tracking built for fast teams.',
    url: 'https://linear.app',
    viewReward: 5,
    clickReward: 50,
  },
  {
    id: 's2',
    sponsor: 'Sentry',
    tagline: 'Fix production bugs faster.',
    url: 'https://sentry.io',
    viewReward: 5,
    clickReward: 50,
  },
];
```

---

## 8. Persistence (Memento API)

```typescript
const KEY = 'stayon.wallet';

export function loadWallet(ctx: vscode.ExtensionContext): Wallet {
  return ctx.globalState.get<Wallet>(KEY) ?? defaultWallet();
}

export async function saveWallet(ctx: vscode.ExtensionContext, wallet: Wallet) {
  await ctx.globalState.update(KEY, wallet);
}
```

`globalState` survives extension reload and Cursor restart. No SQLite needed for MVP.

Optional export: write pretty JSON to `~/.stayon/wallet.json` on each save for user audit.

---

## 9. External APIs — Phase 2 (research now, integrate later)

### 9.1 BitLabs (recommended reward provider)

| Item | Detail |
|------|--------|
| Docs | [developer.bitlabs.ai](https://developer.bitlabs.ai/) |
| Get surveys | `GET https://api.bitlabs.ai/v2/client/surveys` |
| Headers | `X-Api-Token`, `X-User-Id` (max 65 chars, use UUID) |
| Open survey | Redirect to `click_url` from response |
| Callbacks | HTTP GET to your server; verify `hash` HMAC-SHA1 with App Secret |
| Dashboard | [dashboard.bitlabs.ai](https://dashboard.bitlabs.ai) |

**MVP approach:** Hardcoded tasks. **Phase 2:** Extension opens survey in external browser; backend receives callback → credits tokens.

**Hackathon shortcut:** BitLabs iframe in webview requires CSP `frame-src` — easier to open `click_url` via `vscode.env.openExternal()`.

### 9.2 CPX Research (alternative)

| Item | Detail |
|------|--------|
| API | `GET https://live-api.cpx-research.com/api/get-surveys.php` |
| Required params | `app_id`, `ext_user_id`, `output_method=api`, `ip_user` |
| React SDK | `cpx-research-sdk-react` (npm) — overkill for side panel |
| Cache | Max 120 seconds |

CPX requires user IP — awkward in extension (need backend proxy). **Prefer BitLabs for Phase 2.**

### 9.3 Payouts (Phase 3)

| Provider | Use |
|----------|-----|
| **Stripe Connect** | Cash redeem to bank |
| **Tremendous / Tango** | Gift cards API |
| **Manual** | Hackathon stub modal |

---

## 10. Publishing & Distribution

### 10.1 Local install (development)

```bash
cd extension
npm run compile
npx vsce package --no-dependencies
# Install in Cursor: Extensions → ... → Install from VSIX
```

### 10.2 Open VSX (Cursor marketplace)

| Step | Command |
|------|---------|
| Create account | [open-vsx.org](https://open-vsx.org) |
| Create namespace | `npx ovsx create-namespace stayon -p $OVSX_PAT` |
| Publish | `npx ovsx publish -p $OVSX_PAT` |

Requires open-source license in `package.json`. Wiki: [Publishing Extensions](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)

### 10.3 Hooks in repo vs extension install

Hooks live in **project** `.cursor/hooks.json` (checked into StayOn repo). Extension install wizard should:

1. Verify hooks exist
2. Open Cursor Hooks settings
3. Show trust instructions

Future: Cursor plugin bundle (`.cursor-plugin/`) for marketplace hook distribution.

---

## 11. Debugging & Observability

| Tool | Purpose |
|------|---------|
| **Output channel** | `StayOn` log — bridge events, state transitions |
| **Cursor Hooks Execution Log** | Settings → Hooks → verify hook ran |
| **curl test** | `curl -X POST http://127.0.0.1:3847/event -d '{"event":"busy_start","context_note":"test","ts":"..."}'` |
| **GET /health** | `curl http://127.0.0.1:3847/health` |

Create output channel on activate:

```typescript
const log = vscode.window.createOutputChannel('StayOn');
log.appendLine(`Bridge listening on 127.0.0.1:${port}`);
```

---

## 12. Security & Privacy Checklist

| Item | MVP behavior |
|------|--------------|
| Bridge binds localhost only | Yes |
| Hooks read prompt slice only | 120 chars max |
| No transcript file reads | Yes |
| No `beforeReadFile` hook | Yes |
| Sponsored links open externally | `openExternal` + user click |
| CSP on webview | Strict, no CDN |
| Secrets in extension | None for MVP |
| BitLabs tokens | Phase 2 via env/backend, not in client |

---

## 13. Competitor Reference (architecture only)

| Product | Technique | StayOn difference |
|---------|-----------|-------------------|
| Kickbacks.ai | Patches Claude/Codex webview bundles | We use official hooks + side panel |
| BoringSpinner | Spinner verb + statusLine injection | We use gamified tasks, not spinner ads |
| RuntimeAds | Modifies extension files + hooks | We don't patch third-party files |

Useful for **pitch positioning**, not code to copy.

---

## 14. File Checklist Before Coding

Create these files in order:

```
StayOn/
├── .cursor/
│   ├── hooks.json
│   └── hooks/stayon-event.sh          ← chmod +x
├── extension/
│   ├── package.json
│   ├── tsconfig.json
│   ├── esbuild.js
│   ├── .vscodeignore
│   ├── .vscode/launch.json
│   ├── .vscode/tasks.json
│   ├── src/
│   │   ├── extension.ts
│   │   ├── bridge/server.ts
│   │   ├── bridge/busyState.ts
│   │   ├── panel/StayOnPanel.ts
│   │   ├── gamification/wallet.ts
│   │   ├── gamification/streaks.ts
│   │   ├── gamification/levels.ts
│   │   ├── gamification/tasks.ts
│   │   ├── gamification/taskBank.ts
│   │   ├── gamification/economy.ts
│   │   └── setup/verifyHooks.ts
│   └── media/
│       ├── stayon-icon.svg
│       └── panel/
│           ├── main.ts
│           ├── main.css
│           └── index.html (or inline HTML in provider)
└── docs/
```

---

## 15. Pre-Implementation Verification (run once)

```bash
# 1. Tools present
command -v node && command -v jq && command -v curl

# 2. Cursor opens repo
# 3. F5 extension dev host works (after scaffold)
# 4. Manual bridge test (after Phase 1)
curl -s http://127.0.0.1:3847/health

# 5. Hook test (after hooks added)
# Submit Cursor Agent prompt → check StayOn output channel + Hooks Execution Log
```

---

## 16. What We Are NOT Using (and why)

| Skipped | Reason |
|---------|--------|
| React + Vite webview | Slower setup; vanilla TS sufficient for MVP |
| `@vscode/webview-ui-toolkit` | Deprecated Jan 2025 |
| Express / Fastify | Built-in `http` is enough |
| Mock busy timers | Product requirement: real hooks only |
| Spinner/webview patching | Fragile, trust-hostile |
| `stop` hook followup_message | Would hijack agent chat |
| Cloud backend (MVP) | localState + hardcoded tasks |
| CPX Research (MVP) | Needs IP proxy; BitLabs easier later |

---

## 17. Official Documentation Links

| Topic | URL |
|-------|-----|
| Cursor Hooks | https://cursor.com/docs/hooks |
| VS Code Extension API | https://code.visualstudio.com/api |
| Webview API | https://code.visualstudio.com/api/extension-guides/webview |
| WebviewView sample | https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample |
| esbuild bundling | https://code.visualstudio.com/api/working-with-extensions/bundling-extension |
| Open VSX publish | https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions |
| BitLabs developer docs | https://developer.bitlabs.ai/docs |
| BitLabs callbacks | https://developer.bitlabs.ai/docs/callbacks |

---

## 18. Ready to Implement

With this document + [03_implementation_plan.md](./03_implementation_plan.md), implementation can proceed in this order:

1. Scaffold `extension/` with esbuild dual bundle
2. Implement bridge server + busy state + output channel
3. Add `.cursor/hooks/stayon-event.sh` + trust in Cursor
4. Build `WebviewViewProvider` + gamified panel
5. Wire wallet, tasks, streaks, celebrations
6. Polish setup command + demo checklist

No further research required before Phase 1.
