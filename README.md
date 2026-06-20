# StayOn

Earn tokens during Cursor Agent wait time — real hook-based busy detection, gamified side panel.

## Quick start (manual steps)

### 1. Prerequisites

- **Cursor IDE** (with Hooks enabled)
- **Node.js 18+**
- **jq** and **curl** (`brew install jq`)

### 2. Build the extension

```bash
cd extension
npm install
npm run compile
```

### 3. Run in development

1. Open the **StayOn repo root** (this folder) in Cursor — not just `extension/`.
2. Press **F5** (Run StayOn Extension) — uses `.vscode/launch.json` at repo root.
3. A **second window** opens with folder **`.worktrees/ext-dev`** (not the same path — avoids Cursor merging/closing both windows).
4. Run Agent + test StayOn **only in that second window**.

> **Why two folders?** Cursor treats two windows on the same path as one workspace. See [docs/14_extension_dev_workflow.md](docs/14_extension_dev_workflow.md).

### 4. Trust Cursor hooks (required once)

1. Run command: **StayOn: Verify Hook Setup**
2. Open **Cursor Settings → Hooks**
3. **Trust** the StayOn hook entries (`.cursor/hooks/stayon-event.sh`)

Without trusted hooks, busy state will not fire (extension still runs).

### 5. Demo flow

1. Open the **StayOn** side panel (activity bar star icon).
2. Submit a **Cursor Agent** prompt (e.g. “List files in docs/”).
3. Panel opens with a task — complete quiz or sponsored card.
4. When the agent finishes, see **Agent ready** + return-to-context.

### 6. Debug

- **StayOn: Show Debug Output** — bridge events (`idle → busy → idle`)
- **Cursor Settings → Hooks → Execution Log** — verify hooks fired
- Test bridge: `curl -s http://127.0.0.1:$(cat ~/.stayon/port)/health`

## Architecture

```
Cursor Agent → .cursor/hooks/stayon-event.sh → HTTP POST → Extension bridge → Side panel
```

See [docs/03_implementation_plan.md](docs/03_implementation_plan.md) for full details.

## Package install

```bash
cd extension
npm run compile
npx vsce package --no-dependencies
# Install extension/dist/stayon-0.1.0.vsix in Cursor
```
