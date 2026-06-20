# StayOn Implementation Plan — Cursor First

This plan covers building StayOn for **Cursor IDE** with **real agent busy-state detection** (no simulated timers) and a **gamified side-panel UI**.

Related docs:

- [01_product_overview.md](./01_product_overview.md)
- [02_integration_options.md](./02_integration_options.md)

---

## 1. Goals

### In scope (MVP)

- Detect when **Cursor Agent is actually working** via official `.cursor/hooks.json` events
- Open a **StayOn side panel** automatically during wait time
- Serve **interactive microtasks** (quiz, sponsored card, short survey stub)
- Award **tokens** on task completion with visible gamification (streaks, levels, cash estimate)
- Show **return-to-context** when the agent goes idle
- One-command setup: install extension → enable Cursor hooks → trust hooks → demo

### Out of scope (MVP)

- Mock/fake busy timers
- Patching Cursor or third-party extension bundles
- Reading source code, prompts, or completions by default
- Real payout rails (Stripe, gift cards) — stub the redeem flow
- Claude Code / Codex hooks — same architecture later, not MVP

---

## 2. Recommended Cursor Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Cursor IDE                                                  │
│  ┌──────────────┐    hooks      ┌─────────────────────────┐ │
│  │ Cursor Agent │──────────────▶│ .cursor/hooks/stayon-*.sh│ │
│  └──────────────┘               └───────────┬─────────────┘ │
│                                              │ POST /event   │
│  ┌──────────────────────────────────────────▼─────────────┐ │
│  │ StayOn VS Code Extension                                │ │
│  │  • localhost bridge (127.0.0.1:3847)                    │ │
│  │  • busy state machine                                   │ │
│  │  • WebviewView side panel (gamified UI)                 │ │
│  │  • wallet + streaks in globalState                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Why this stack**

| Layer | Choice | Reason |
|-------|--------|--------|
| Detection | Cursor hooks | Official, no UI patching |
| Bridge | **Localhost HTTP** inside extension | Instant panel updates; no mock polling delay |
| UI | `WebviewView` side panel | Rich gamified tasks; works in Cursor |
| Persistence | `ExtensionContext.globalState` + optional `~/.stayon/wallet.json` | Survives restarts; auditable ledger |

File-based bridge (`~/.stayon/state.json`) is a fallback if HTTP is blocked; primary path is HTTP.

---

## 3. Busy State — Real Detection (No Mocks)

### 3.1 State machine

StayOn tracks agent activity with a **reference-counted busy model**, not a boolean timer.

```
                    beforeSubmitPrompt
                           │
                           ▼
                      ┌─────────┐
         ┌───────────│  BUSY   │◀── preToolUse / postToolUse / afterAgentThought
         │           └────┬────┘
         │                │
  subagentStart          │ heartbeat (extends last_active_at)
  (+1 ref)               │
         │                │
         │           subagentStop (-1 ref)
         │                │
         │                ▼
         │           stop (terminal)
         │                │
         └───────────▶ IDLE (when busy_ref === 0)
```

| State | Meaning | Panel behavior |
|-------|---------|----------------|
| `idle` | Agent not working | Panel collapsed or shows wallet/home |
| `busy` | Agent running (prompt submitted or tools active) | Panel opens with active task |
| `ready` | Agent just finished (2–5s) | Success overlay + return-to-context, then idle |

### 3.2 Hook events → actions

| Cursor hook | Script | Action |
|-------------|--------|--------|
| `beforeSubmitPrompt` | `stayon-busy.sh` | `event=busy_start`, save truncated prompt as `context_note` (max 120 chars, user text only) |
| `preToolUse` | `stayon-heartbeat.sh` | `event=busy_heartbeat`, include tool type |
| `postToolUse` | `stayon-heartbeat.sh` | `event=busy_heartbeat` |
| `afterAgentThought` | `stayon-heartbeat.sh` | `event=busy_heartbeat`, tag `phase=thinking` |
| `subagentStart` | `stayon-subagent.sh` | `event=busy_ref +1` |
| `subagentStop` | `stayon-subagent.sh` | `event=busy_ref -1` |
| `stop` | `stayon-idle.sh` | `event=busy_end`, pass `status` (`completed` / `aborted` / `error`) |
| `sessionEnd` | `stayon-idle.sh` | `event=session_end`, force idle |

Hooks must:

- Exit `0` always (fail open — never block the agent)
- Complete in **<200ms** (curl POST only)
- Never read files outside hook JSON payload

### 3.3 `.cursor/hooks.json`

Project-level (checked into repo for hackathon demo):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [
      { "command": ".cursor/hooks/stayon-busy.sh" }
    ],
    "preToolUse": [
      { "command": ".cursor/hooks/stayon-heartbeat.sh" }
    ],
    "postToolUse": [
      { "command": ".cursor/hooks/stayon-heartbeat.sh" }
    ],
    "afterAgentThought": [
      { "command": ".cursor/hooks/stayon-heartbeat.sh" }
    ],
    "subagentStart": [
      { "command": ".cursor/hooks/stayon-subagent.sh" }
    ],
    "subagentStop": [
      { "command": ".cursor/hooks/stayon-subagent.sh" }
    ],
    "stop": [
      { "command": ".cursor/hooks/stayon-idle.sh" }
    ],
    "sessionEnd": [
      { "command": ".cursor/hooks/stayon-idle.sh" }
    ]
  }
}
```

### 3.4 Hook script contract

Each script:

1. Reads JSON from stdin
2. Extracts minimal fields with `jq`
3. POSTs to bridge:

```bash
curl -sf -X POST "http://127.0.0.1:3847/event" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg e busy_start --arg note "$CONTEXT" '{event:$e, context_note:$note, ts:(now|todate)}')"
```

Shared env: `STAYON_PORT=3847` (extension writes `~/.stayon/port` on startup so hooks survive port changes).

### 3.5 Edge cases (real, not mocked)

| Case | Handling |
|------|----------|
| Prompt → long thinking before first tool | `beforeSubmitPrompt` already marked busy |
| Agent aborted mid-run | `stop` with `status=aborted` → `ready` briefly, no token penalty |
| Parallel subagents | `busy_ref` stays >0 until all stop |
| Hook not trusted | Extension shows setup banner: “Trust StayOn hooks in Cursor Settings → Hooks” |
| Extension not running | Hooks no-op (curl fails silently); agent unaffected |
| Double `stop` | Idempotent idle transition |

---

## 4. Extension — Technical Plan

### 4.1 Repo layout

```
StayOn/
├── extension/
│   ├── package.json
│   ├── src/
│   │   ├── extension.ts          # activate, register webview + bridge
│   │   ├── bridge/
│   │   │   ├── server.ts         # localhost HTTP server
│   │   │   └── busyState.ts      # ref-count state machine
│   │   ├── panel/
│   │   │   ├── StayOnPanel.ts    # WebviewView provider
│   │   │   └── webview/          # React or vanilla HTML/CSS/JS
│   │   ├── gamification/
│   │   │   ├── wallet.ts
│   │   │   ├── streaks.ts
│   │   │   ├── levels.ts
│   │   │   └── tasks.ts
│   │   └── setup/
│   │       └── installHooks.ts   # verify .cursor/hooks.json exists
│   └── media/                    # icons, sounds (optional)
├── .cursor/
│   ├── hooks.json
│   └── hooks/
│       ├── stayon-busy.sh
│       ├── stayon-heartbeat.sh
│       ├── stayon-subagent.sh
│       └── stayon-idle.sh
└── docs/
```

### 4.2 Extension activation

On `activate`:

1. Start HTTP bridge on `127.0.0.1:3847` (retry adjacent ports if busy)
2. Write `~/.stayon/port` and `~/.stayon/pid`
3. Register `WebviewViewProvider` (`stayon.panel`)
4. Load wallet from `globalState`
5. Run hook health check (`.cursor/hooks.json` present? last event <24h?)
6. Status bar: `StayOn · Lv.3 · 🔥 4 · 1,240 ⭐`

On `deactivate`: stop server, clear pid file.

### 4.3 Bridge API

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/event` | POST | `{ event, context_note?, status?, phase?, tool? }` | `204` |
| `/health` | GET | — | `{ ok: true, busy: boolean, busy_ref: number }` |
| `/state` | GET | — | full busy + session snapshot |

Extension emits VS Code events internally: `onBusyStart`, `onBusyEnd`, `onHeartbeat`.

### 4.4 Panel lifecycle

```
busy_start  → fetch task → show "Agent working" + task card + timer
busy_heartbeat → refresh "still working" pulse (subtle animation)
task_complete → award tokens → celebration micro-animation
busy_end    → if task done: streak++; show "Agent ready" + context_note
            → if no task: gentle nudge only
```

Panel **auto-opens** on `busy_start` if StayOn enabled. User can pin or minimize; re-expands on next wait.

---

## 5. Gamification System

### 5.1 Currencies

| Currency | Symbol | Earned how | Display |
|----------|--------|------------|---------|
| **Tokens** | ⭐ | Complete wait-time tasks | Integer, primary UI number |
| **Cash estimate** | € / $ | Derived from tokens | Secondary, “≈ €0.12” |
| **XP** | ✦ | Every token + bonus objectives | Progress bar to next level |

**Conversion (MVP, fixed for demo):**

```
cash_estimate = tokens × 0.0001   // 1,000 tokens ≈ €0.10
```

Show both numbers so users feel progression (big token numbers) and real value (small cash estimate). Redeem button converts at this rate (stub payout).

### 5.2 Task rewards

| Task type | Tokens | XP | Notes |
|-----------|--------|-----|-------|
| Quick quiz (1 question) | 8–15 | 10 | Always available offline |
| Sponsored card (view + optional click) | 5 + 50 click | 5 / 25 | Label “Sponsored” |
| Focus prompt (30s breathing) | 12 | 15 | Focus mode |
| Learn flashcard | 10 | 12 | Learn mode |

**Wait session bonus:** complete any task while agent was busy → **+5 tokens** (“Flow bonus”).

### 5.3 Streaks

- **Daily streak:** at least one completed wait-task per calendar day (local timezone)
- **Wait streak:** consecutive agent waits where user completed a task before `busy_end`
- UI: 🔥 counter in panel header + status bar
- **Streak multiplier:** day 1 = 1×, day 3 = 1.1×, day 7 = 1.25×, day 14 = 1.5× (cap)

### 5.4 Levels

```
level = floor(sqrt(total_xp / 50)) + 1
xp_for_next = (level)^2 * 50
```

| Level | Unlock (cosmetic / feature) |
|-------|----------------------------|
| 1 | Earn mode |
| 2 | Learn mode |
| 3 | Focus mode |
| 5 | Custom return-to-context note |
| 10 | “Pro” badge + redeem stub |

### 5.5 Badges (achievements)

| Badge | Condition |
|-------|-----------|
| First Flow | Complete first wait-task |
| Night Owl | Task after 10pm |
| Streak Starter | 3-day daily streak |
| On Fire | 7-day daily streak |
| Multitasker | Task completed during subagent wait |
| Focused | 10 Focus mode sessions |
| Century | 100 total tasks |

Badges show in wallet tab; toast on unlock.

### 5.6 Daily challenge (hook for engagement)

One rotating objective per day, e.g.:

- “Complete 3 wait-tasks today” → +30 tokens
- “Earn a Flow bonus twice” → +20 tokens
- “Try Learn mode once” → +15 tokens

### 5.7 Wallet / redeem (MVP stub)

**Wallet tab shows:**

- Token balance (large)
- Cash estimate
- Streak + level
- History list (last 20 events)
- Badges grid
- **Redeem** button → modal: “Minimum 5,000 tokens (≈ €0.50). Payout coming soon.” (disabled or waitlist email)

Phase 2: Stripe Connect, gift cards, API credits.

---

## 6. UI Design — Gamified Side Panel

### 6.1 Visual direction

- Dark panel matching Cursor chrome
- Accent: electric green / gold for token gains
- Compact — fits beside agent chat without stealing focus
- Motion: short confetti or +⭐ float on reward (CSS, no heavy libs)

### 6.2 Panel tabs

| Tab | Content |
|-----|---------|
| **Play** (default during busy) | Active task, agent status pill, countdown “Agent working…” |
| **Wallet** | Balance, cash estimate, streak, level bar, redeem |
| **Stats** | Tasks today, waits completed, distractions avoided*, badges |

*Distractions avoided = wait sessions with completed task (proxy metric for hackathon)

### 6.3 Play tab — busy state UI

```
┌──────────────────────────────┐
│ StayOn          Lv.4  🔥 5   │
│ ⭐ 1,240    ≈ €0.12          │
├──────────────────────────────┤
│ ● Cursor is working          │
│   "Refactor Button.tsx…"     │
├──────────────────────────────┤
│  QUICK TASK          +12 ⭐  │
│  Which hook marks busy?      │
│  ○ stop  ● beforeSubmit…    │
│  ○ mockTimer                 │
│         [ Submit ]           │
├──────────────────────────────┤
│  Today's challenge  2/3 ✓    │
└──────────────────────────────┘
```

### 6.4 Agent ready overlay

When `busy_end`:

```
┌──────────────────────────────┐
│  ✓ Agent ready               │
│  +12 ⭐  Flow bonus +5       │
│                              │
│  Return to:                  │
│  "Refactor Button.tsx and    │
│   add tests"                 │
│         [ Back to code ]     │
└──────────────────────────────┘
```

Auto-dismiss after 8s or on click.

### 6.5 Mode selector (settings in panel footer)

Toggle: **Earn** | **Learn** | **Focus** — changes task pool. Default Earn.

---

## 7. Data Models

### 7.1 Bridge event

```typescript
type BridgeEvent =
  | { event: "busy_start"; context_note?: string; ts: string }
  | { event: "busy_heartbeat"; phase?: "thinking"; tool?: string; ts: string }
  | { event: "busy_ref"; delta: 1 | -1; ts: string }
  | { event: "busy_end"; status: "completed" | "aborted" | "error"; ts: string }
  | { event: "session_end"; ts: string };
```

### 7.2 Wallet (persisted)

```typescript
interface Wallet {
  tokens: number;
  totalXp: number;
  level: number;
  dailyStreak: number;
  waitStreak: number;
  lastActiveDate: string;       // YYYY-MM-DD
  badges: string[];
  history: LedgerEntry[];
  dailyChallenge: { id: string; progress: number; completed: boolean };
}

interface LedgerEntry {
  id: string;
  ts: string;
  type: "task" | "bonus" | "streak" | "challenge" | "redeem";
  tokens: number;
  label: string;
}
```

---

## 8. Build Phases

### Phase 1 — Bridge + hooks (Day 1)

**Deliverable:** Cursor agent activity toggles `busy` in extension logs.

| Task | Detail |
|------|--------|
| Scaffold VS Code extension (TypeScript) | `yo code` or minimal template |
| Implement `bridge/server.ts` | POST `/event`, GET `/health` |
| Implement `busyState.ts` | ref-count + transitions |
| Write four hook shell scripts | curl + jq |
| Add `.cursor/hooks.json` | all events wired |
| Manual test | Submit Cursor Agent prompt → see `busy_start` in Output channel |

**Acceptance:** Output log shows `idle → busy → idle` on real agent run; no mock code paths.

### Phase 2 — Panel shell (Day 2)

**Deliverable:** Panel opens/closes on real busy state.

| Task | Detail |
|------|--------|
| `WebviewViewProvider` | register view id `stayon.panel` |
| Basic webview HTML/CSS | header, tabs scaffold |
| Wire `onBusyStart` / `onBusyEnd` | show/hide Play tab |
| Status bar item | busy indicator + token count |
| Setup command | `StayOn: Verify Hook Setup` |

**Acceptance:** Panel appears within ~500ms of prompt submit; closes on agent stop.

### Phase 3 — Gamification + tasks (Day 3)

**Deliverable:** Complete task → tokens → streak → level.

| Task | Detail |
|------|--------|
| `wallet.ts`, `streaks.ts`, `levels.ts` | persist to globalState |
| Task engine | 5–10 hardcoded quiz questions + 2 sponsored cards |
| Task completion flow | POST from webview → extension → wallet update |
| Reward animations | +⭐ toast, progress bar bump |
| Agent ready overlay | context_note from hook |
| Daily challenge | one static challenge |

**Acceptance:** End-to-end: agent busy → answer quiz → earn tokens → agent done → return overlay.

### Phase 4 — Polish + demo hardening (Day 4)

| Task | Detail |
|------|--------|
| Hook install wizard | copy hooks if missing, open Cursor Hooks settings |
| Badge unlock toasts | |
| Wallet + Stats tabs | |
| Redeem stub modal | |
| README + demo script | |
| Pre-demo checklist | trust hooks, reload window |

---

## 9. Demo Script (Real Busy State)

1. Open repo in **Cursor** with StayOn extension installed.
2. Confirm hooks trusted: **Cursor Settings → Hooks** (green / trusted).
3. Open StayOn side panel; show wallet at `⭐ 0`.
4. In Cursor Agent chat: *“Refactor the README and fix typos.”*
5. **Panel opens** — “Cursor is working” + context line from prompt.
6. Complete quick quiz → **+12 ⭐**, streak updates, level progress animates.
7. Wait for agent to finish → **“Agent ready — Return to: Refactor the README…”**
8. Open Wallet tab → tokens, cash estimate, badge if first task.

**Fallback (not mock):** if hooks untrusted, show setup banner — fix live by trusting hooks and resubmitting prompt.

---

## 10. Testing Checklist

| Test | Expected |
|------|----------|
| Submit agent prompt | `busy_start` within 1s, panel opens |
| Agent uses Shell/Read tools | heartbeats logged, panel stays open |
| Agent completes | `busy_end`, ready overlay |
| User aborts agent | `status=aborted`, panel closes gracefully |
| Subagent Task tool | ref count >1 until subagent stops |
| Extension reload | wallet persists; server restarts |
| Hooks untrusted | agent works; StayOn shows setup warning |
| Complete task then agent ends | Flow bonus applied once |

---

## 11. Dependencies

| Dependency | Purpose |
|------------|---------|
| Node 18+ | Extension build |
| `jq` | Hook scripts (document in README) |
| `curl` | Hook → bridge POST |
| Cursor with Hooks enabled | Runtime |

Optional later: React in webview, real offerwall API, Stripe.

---

## 12. Privacy Defaults

- `context_note` = first 120 chars of **user prompt only** (from hook payload), not agent response
- No file path or repo name in hook payloads unless user opts into Codebase Mode (post-MVP)
- Ledger stored locally; no cloud sync in MVP
- Sponsored tasks clearly labeled

---

## 13. Success Criteria

MVP is done when:

1. Busy state comes **only** from Cursor hooks — zero mock timers in codebase
2. Panel opens on real agent work and closes on real agent stop
3. User earns tokens, sees streak/level/cash estimate, and gets return-to-context
4. Demo runs reliably on a fresh Cursor window after hook trust

---

## 14. After MVP (same architecture)

| Next | Work |
|------|------|
| Claude Code | Duplicate hooks → `.claude/settings.json`, same bridge |
| Codex | `.codex/hooks.json` |
| Cursor plugin | Bundle hooks for Marketplace |
| Real payouts | Backend + Stripe Connect |
| Developer microtasks | Task supply API |

The bridge and gamification layer stay unchanged; only hook installers multiply.
