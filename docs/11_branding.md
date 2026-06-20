# StayOn Branding Guide

Canonical reference for product voice, visual identity, and UI terminology across the web app, extension, and marketing.

Related: [01_product_overview.md](./01_product_overview.md), [10_backend_web_app.md](./10_backend_web_app.md)

Implementation: `web/src/theme/` (CSS tokens + TypeScript config)

---

## 1. Brand essence

| Field | Value |
|-------|--------|
| **Name** | **StayOn** — always one word, capital S and O |
| **Category** | Productivity + earning layer for AI coding agents |
| **One-liner** | Turn AI wait time into productive, rewarded moments |
| **Elevator pitch** | When Cursor, Codex, or Claude Code is thinking, StayOn keeps you on the laptop with short tasks and real **points** — then brings you back to your code when the agent is ready. |

### Brand personality

- **Calm** — not casino-like; respects developer focus
- **Capable** — real integrations, real postbacks, not mock hype
- **Rewarding** — progress feels earned (points, streaks, levels)
- **Developer-native** — IDE-first, monospace for code, no consumer fluff

### What we are not

- Not a generic offerwall or ad network
- Not “free money” spam — we frame **points** as micro-rewards for wait time
- Not distracting — tasks fit inside agent busy windows

---

## 2. Terminology (locked)

### Currency: **point / points**

Use **point** and **points** everywhere user-facing. Do **not** use: token, tokens, coin, coins, star, ⭐ (except legacy code paths being migrated).

| Context | Correct | Avoid |
|---------|---------|-------|
| Balance | `1,250 points` | `1,250 tokens`, `1,250 ⭐` |
| Singular | `1 point` | `1 token` |
| Compact UI | `250 pts` | `250 ⭐` |
| Earn action | `Earn points` | `Earn tokens` |
| Wallet tab | `Points balance` | `Token balance` |
| API / code | `points` in JSON fields; internal vars may say `tokens` until refactored | — |

**Cash estimate** (secondary line): `≈ €0.12` — always secondary to points, never the primary headline.

### Product & feature names

| Term | Usage |
|------|--------|
| **StayOn** | Product name |
| **Earn mode** | Paid surveys / CPX / sponsored tasks |
| **Learn mode** | Short technical Q&A |
| **Focus mode** | Mindful pause, no external offers |
| **Points** | In-app currency |
| **Streak** | Daily / wait streak (🔥 optional in UI) |
| **Level** | Gamification tier from XP |
| **Agent busy** | Cursor Agent is working (hook-detected) |
| **Flow bonus** | Extra points for finishing a task before agent stops |

### Voice & tone

- **Short, direct sentences.** Developers scan; don’t bury the lead.
- **Second person:** “Earn points while your agent works.”
- **Active verbs:** Earn, stay, return, complete, sync.
- **Avoid:** “Amazing”, “revolutionary”, excessive exclamation marks.

**Example microcopy**

- Panel idle: “Submit a Cursor Agent prompt to start earning points while you wait.”
- Agent busy: “Cursor is working — complete a task to earn points.”
- Reward toast: `+25 points`
- Ready state: “Agent ready — return to your task.”
- Redeem (future): “Redeem points” (min threshold in settings)

---

## 3. Logo & mark

### Wordmark

**StayOn** in **Geist Sans** (web) / system UI sans (extension), semibold for headers.

### Logomark (concept)

Rounded square with a **pause-bar “stay” motif** + upward point accent:

- Rounded rect (`radius: 8px` at 32px size)
- Two vertical bars (agent “working” pause)
- Small gold dot = **point** earned

SVG mark lives at `web/public/brand/stayon-mark.svg`. Use mark + wordmark in header; mark alone for favicon.

### Clear space

Minimum padding around mark = height of the gold point dot.

### Don’t

- Stretch or rotate the mark
- Change mark colors outside brand palette
- Place mark on busy photographic backgrounds without a surface card

---

## 4. Color system

StayOn uses a **dual-accent** system:

1. **Brand teal** — product chrome, links, primary buttons, focus rings  
2. **Points gold** — balances, rewards, point counts only  

### Core palette

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--stayon-brand` | `#00A896` | `#2DD4BF` | Primary actions, links |
| `--stayon-brand-muted` | `#E6F7F4` | `#0D3D38` | Brand tinted surfaces |
| `--stayon-points` | `#D97706` | `#FBBF24` | Point balances & reward text |
| `--stayon-points-muted` | `#FEF3C7` | `#422006` | Point highlight backgrounds |
| `--stayon-accent` | `#6366F1` | `#818CF8` | Secondary (AI / tech highlights) |
| `--stayon-success` | `#16A34A` | `#4ADE80` | Confirmations |
| `--stayon-warning` | `#D97706` | `#FBBF24` | Caution |
| `--stayon-danger` | `#DC2626` | `#F87171` | Errors |

### Surfaces & text

| Token | Light | Dark |
|-------|-------|------|
| `--stayon-bg` | `#F8FAFC` | `#0B0F14` |
| `--stayon-surface` | `#FFFFFF` | `#141B24` |
| `--stayon-surface-raised` | `#FFFFFF` | `#1A2332` |
| `--stayon-border` | `#E2E8F0` | `#2A3544` |
| `--stayon-text` | `#0F172A` | `#F1F5F9` |
| `--stayon-text-muted` | `#64748B` | `#94A3B8` |

All values are defined in `web/src/theme/tokens.css` and exported in `web/src/theme/config.ts`.

---

## 5. Typography

| Role | Font | Weight | Size (web) |
|------|------|--------|------------|
| Display / H1 | Geist Sans | 600 | 2.25–3rem |
| H2 / section | Geist Sans | 600 | 1.25–1.5rem |
| Body | Geist Sans | 400 | 1rem |
| Small / meta | Geist Sans | 400 | 0.875rem |
| Code / CLI | Geist Mono | 400 | 0.875rem |

**Line height:** 1.5 body, 1.2 headings.

Extension panel inherits VS Code editor fonts; use **points gold** for balance only.

---

## 6. Spacing, radius, elevation

| Token | Value | Use |
|-------|-------|-----|
| `--stayon-radius-sm` | `6px` | Chips, inputs |
| `--stayon-radius-md` | `10px` | Cards, buttons |
| `--stayon-radius-lg` | `14px` | Modals, hero cards |
| `--stayon-shadow-sm` | subtle | Cards in light mode |
| `--stayon-shadow-md` | medium | Dropdowns |

Grid: 4px base unit (4, 8, 12, 16, 24, 32, 48).

---

## 7. UI components (web)

Use shared primitives from `web/src/components/ui/`:

- **Button** — `primary` (brand), `secondary` (surface), `ghost`
- **Card** — surface + border, optional `raised`
- **Badge** — mode labels (Earn / Learn / Focus)
- **Points display** — always `--stayon-points` color, suffix “points” or “pts”

Theme toggle: sun/moon in header; respects `prefers-color-scheme` until user overrides (stored in `localStorage` key `stayon-theme`).

---

## 8. Extension panel (IDE)

Extension runs inside VS Code/Cursor chrome:

- Background / text: VS Code theme variables
- **Points balance:** `--stayon-points` gold accent (see `extension/media/panel/main.css`)
- User-facing copy uses **point / points** via `extension/src/brand/formatPoints.ts`
- Confetti: brand teal + points gold + soft green

Shared formatter:

```ts
import { formatPoints } from './brand/formatPoints';
formatPoints(1250);       // "1,250 points"
formatPoints(1250, true); // "1,250 pts"
```

---

## 9. Imagery & illustration

- Prefer **abstract flow diagrams** (agent → wait → task → return)
- Screenshots of real panel + CPX iframe for credibility
- No stock photos of generic “happy office people”
- Dark mode screenshots for developer audience

---

## 10. Social & meta

| Asset | Guideline |
|-------|-----------|
| **Site title** | `StayOn — Earn points while your AI agent works` |
| **OG description** | Short pitch + “points” |
| **Hashtags** | `#StayOn` `#CursorIDE` `#DevTools` (sparingly) |
| **GitHub repo description** | “Earn points during AI agent wait time — Cursor hooks + CPX surveys” |

---

## 11. File reference

```
docs/11_branding.md          ← this document
web/src/theme/tokens.css     ← CSS variables (light + .dark)
web/src/theme/config.ts      ← TS theme object + formatPoints()
web/public/brand/            ← logo SVG, favicon
web/src/components/ui/       ← themed components
```

When adding new UI, import tokens — do not hardcode hex colors in pages.

---

## 12. Quick checklist for new screens

- [ ] User-facing currency says **points**, not tokens
- [ ] Primary CTA uses brand teal
- [ ] Point amounts use points gold
- [ ] Works in light and dark mode
- [ ] Code samples use Geist Mono
- [ ] Copy matches calm, developer-native tone
