# Extension development workflow (two windows)

Cursor/VS Code **merges windows** when both open the **same folder path**. That breaks StayOn dev:

- F5 opens **Extension Development Host**
- Clicking the project folder in EH focuses the **original** window
- Closing one window can **close both**

## Fix: separate folder path for Extension Host

We use a **git worktree** at `.worktrees/ext-dev` — same code, different path — so Cursor treats it as a second workspace.

F5 launch config (`.vscode/launch.json`) opens:

```
.worktrees/ext-dev          ← Extension Development Host (run Agent here)
StayOn/ (main window)       ← edit code, press F5
```

Also uses `--user-data-dir=.vscode-ext-dev-profile` so EH has its own profile.

---

## Daily workflow

### 1. Main window (this repo)

- Edit code in `extension/`, `web/`, `docs/`
- Press **F5** → preLaunch runs `npm run compile` + creates worktree if needed

### 2. Extension Development Host window

- Opens automatically with folder **`.worktrees/ext-dev`**
- **Trust hooks once:** Cursor Settings → Hooks → trust `stayon-event.sh`
- Run **StayOn: Verify Hook Setup**
- Submit **Cursor Agent** prompts **in this window only**
- StayOn panel + hooks work here

### 3. Do not

- Do not try to “re-open” the main `StayOn` folder inside EH — use the worktree path shown in the title bar
- Do not close the main window while debugging (keep both open; they are no longer the same folder path)

---

## First-time setup

```bash
chmod +x scripts/ensure-ext-dev-worktree.sh
./scripts/ensure-ext-dev-worktree.sh
```

Or just press F5 — the preLaunch task runs this automatically.

---

## Sync after git pull

The worktree shares the same commits as main. After `git pull` in the main window:

```bash
cd .worktrees/ext-dev && git pull
```

Or remove and recreate:

```bash
git worktree remove .worktrees/ext-dev --force
./scripts/ensure-ext-dev-worktree.sh
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| EH still focuses main window | Confirm EH title bar shows `.worktrees/ext-dev`, not `StayOn` root only |
| Hooks not firing in EH | Trust hooks in **EH window**; verify script is executable |
| Worktree missing | Run `./scripts/ensure-ext-dev-worktree.sh` |
| Bridge not running | **StayOn: Show Debug Output** in EH window |

---

## Alternative: installed VSIX (no F5)

For demos without two windows:

```bash
cd extension && npm run compile && npx vsce package --no-dependencies
```

Install `.vsix` in Cursor, open repo root once, trust hooks — single window.
