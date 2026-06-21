# StayOn

**Earn survey points while Cursor Agent works.**

StayOn detects real agent busy time via Cursor hooks, opens a side panel with paid surveys (CPX Research), and syncs confirmed earnings to your StayOn wallet.

## Install (Cursor)

1. Install **StayOn** from Open VSX (Extensions → search “StayOn”) **or** install from VSIX.
2. Open your **project folder** in Cursor.
3. Run **`StayOn: Set Up`** from the command palette (installs hooks — one time per project).
4. Submit a **Cursor Agent** prompt — the panel opens while the agent works.

Full beta guide: [stay-on-nu.vercel.app/try](https://stay-on-nu.vercel.app/try)

## Features

- **Real busy detection** — Cursor project hooks → localhost bridge (no mock timers)
- **Paid surveys** — CPX Research SurveyWall; open in browser while Agent runs
- **Points & streaks** — gamified wait time (Learn/Perks for engagement)
- **Survey earnings sync** — server-backed balance; view online from Wallet tab
- **Agent ready alert** — chime + focus Cursor when Agent finishes (macOS & Windows)

## Requirements

- **Cursor** with Agent + Hooks
- **Node.js** on PATH (for project hooks on Windows/Mac)
- StayOn backend connected automatically in shipped builds (override: `stayon.apiBaseUrl`)

## Commands

| Command | Purpose |
|---------|---------|
| `StayOn: Set Up` | Install hooks + verify bridge (run once per project) |
| `StayOn: Open Panel` | Open the side panel |
| `StayOn: Test Hook Bridge` | Debug hook → bridge path |
| `StayOn: Show Debug Output` | Bridge event log |

## Settings

- `stayon.apiBaseUrl` — StayOn web backend (CPX + reward sync)
- `stayon.cpxSurveys` — Enable paid surveys mode
- `stayon.alertSoundOnReady` / `stayon.alertFocusOnReady` — Agent finished alerts

## Privacy

Survey profile (email, DOB) is stored on the StayOn backend for CPX matching. Hooks send at most 120 chars of your prompt to the local bridge only.

[Privacy (beta)](https://stay-on-nu.vercel.app/privacy)

## Beta note

**Claim payout** (withdraw to bank/PayPal) is not in this release — balances are tracked on the [earnings page](https://stay-on-nu.vercel.app/earnings).

## Source

[github.com/ahzia/StayOn](https://github.com/ahzia/StayOn)
