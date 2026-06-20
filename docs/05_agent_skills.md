# Agent Skills for StayOn

Skills extend the Cursor agent with domain-specific implementation guidance. Install before coding so the agent follows StayOn conventions automatically.

## Installed skills

| Skill | Location | Purpose |
|-------|----------|---------|
| **stayon-implement** | `.cursor/skills/stayon-implement/` | Project-specific rules: no mock busy state, locked stack, doc links, build order |
| **vscode-extension-expert** | `.agents/skills/vscode-extension-expert/` | VS Code extension scaffold, `package.json`, activation, publishing |
| **vscode-webview-expert** | `.agents/skills/vscode-webview-expert/` | WebviewView side panel, CSP, postMessage, state persistence |

Lock file: `skills-lock.json` (tracks versions from skills.sh registry).

## Already available globally (Cursor built-in)

These live in your user Cursor install — no project install needed:

| Skill | When it helps |
|-------|---------------|
| **create-hook** | Writing `.cursor/hooks.json` and hook scripts correctly |
| **create-skill** | Adding new project skills later |
| **create-rule** | Project coding standards in `.cursor/rules/` |

## What we skipped

| Skill | Why skipped |
|-------|-------------|
| `suggesting-cursor-hooks` | Meta-skill for suggesting lint hooks — not StayOn busy-state work; uses outdated hooks format |
| `groove-admin-cursor-hooks` | Admin/ops hooks, not product implementation |
| React / Next.js skills | MVP uses vanilla TS webview per [04_technical_research.md](./04_technical_research.md) |
| BitLabs / payout skills | Phase 2; no public skill needed yet |

## Install / update commands

```bash
# From repo root
cd /path/to/StayOn

# List project skills
npx skills list

# Add a skill (example)
npx skills add s-hiraoku/vscode-sidebar-terminal@vscode-webview-expert --agent cursor -y

# Update all project skills
npx skills update -y
```

Browse more: [skills.sh](https://skills.sh/)

## Security note

`vscode-webview-expert` was flagged **Critical Risk** by the skills.sh automated scanner (likely false positive on example code). Review `.agents/skills/vscode-webview-expert/SKILL.md` before use. `vscode-extension-expert` scanned **Safe**.

## Before implementation

Agent should have loaded:

1. **stayon-implement** — project rules
2. **vscode-extension-expert** + **vscode-webview-expert** — extension mechanics
3. Global **create-hook** — when editing `.cursor/hooks/`

Then follow [03_implementation_plan.md](./03_implementation_plan.md) Phase 1.
