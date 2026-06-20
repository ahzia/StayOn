---
name: stayon-implement
description: >-
  Implement StayOn — Cursor-first VS Code extension with real hook-based busy
  detection, localhost bridge, gamified side panel, tokens/streaks/wallet.
  Use when building, scaffolding, or extending StayOn code in this repo.
---

# StayOn Implementation Skill

Use this skill for all StayOn coding in this repository. Read the linked docs before writing code.

## Canonical docs (read first)

| Doc | Purpose |
|-----|---------|
| [docs/03_implementation_plan.md](../../../docs/03_implementation_plan.md) | Architecture, busy state machine, gamification, build phases |
| [docs/04_technical_research.md](../../../docs/04_technical_research.md) | Locked stack, npm packages, hook script, bridge API, copy-paste snippets |
| [docs/02_integration_options.md](../../../docs/02_integration_options.md) | Integration rationale |

## Non-negotiable rules

1. **No mock busy state** — busy/idle comes only from Cursor hooks → bridge HTTP events.
2. **No spinner/webview patching** — do not modify Claude, Codex, or Cursor extension bundles.
3. **Hooks fail open** — always `exit 0`; never block the agent (`continue: true`, no deny).
4. **Never use `stop` hook `followup_message`** — return-to-context is panel UI only.
5. **Privacy** — store max 120 chars of user prompt as `context_note`; no file/code reads in hooks.
6. **Bridge binds `127.0.0.1` only** — hooks POST to `/event`; extension owns the server.

## Locked stack

- TypeScript extension + **esbuild** (dual bundle: `dist/extension.js` + `media/panel/main.js`)
- **WebviewView** side panel (`stayon.panel`), vanilla TS webview (no React for MVP)
- `@vscode/codicons` + `--vscode-*` CSS variables for theming
- `canvas-confetti` for token celebration
- `ExtensionContext.globalState` for wallet persistence
- Node built-in `http` for bridge (no Express)
- Single hook script: `.cursor/hooks/stayon-event.sh` + `.cursor/hooks.json`

## Implementation order

1. Extension scaffold + esbuild + bridge server + busy state machine
2. `.cursor/hooks/stayon-event.sh` (chmod +x) — verify in Cursor Hooks Execution Log
3. `WebviewViewProvider` + webview message protocol
4. Gamification: `wallet.ts`, `streaks.ts`, `levels.ts`, `taskBank.ts`, `economy.ts`
5. Setup command `stayon.verifyHooks` + output channel `StayOn`

## Gamification constants

From [docs/04_technical_research.md](../../../docs/04_technical_research.md) §7:

- Tokens (⭐), cash estimate = `tokens × 0.0001`
- Flow bonus +5 when task completed before `busy_end`
- Streak multipliers at 3/7/14 days
- MVP tasks: hardcoded quiz + sponsored cards in `taskBank.ts`

## Hook events (Cursor)

| Event | Bridge event |
|-------|--------------|
| `beforeSubmitPrompt` | `busy_start` |
| `preToolUse` / `postToolUse` / `afterAgentThought` | `busy_heartbeat` |
| `subagentStart` / `subagentStop` | `busy_ref` ±1 |
| `stop` | `busy_end` |
| `sessionEnd` | `session_end` |

## Related agent skills in this repo

- `vscode-extension-expert` — extension scaffold, package.json, activation
- `vscode-webview-expert` — WebviewView, CSP, postMessage protocol

## Acceptance before marking phase done

- Real Cursor Agent prompt triggers `idle → busy → idle` in StayOn output channel
- Panel opens on busy, shows task, awards tokens, shows return-to-context on idle
- Zero mock timers or fake busy flags in codebase
