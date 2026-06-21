# StayOn — 5-slide finals pitch deck plan (MEGATHON)

Deck plan for **MEGATHON Startup Track** main-stage finals. Built from [01_product_overview.md](./01_product_overview.md), [19_possiblities.md](./19_possiblities.md), [19_02_possiblities_trucks.md](./19_02_possiblities_trucks.md), [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md), [22_hackathon_share_guide.md](./22_hackathon_share_guide.md), and what is shipped in the repo.

**Deck URL tip:** Host on [Pitch](https://pitch.com), Google Slides (public link), or a `/pitch` page on the site. Every slide should link to live proof:

- `https://stay-on-nu.vercel.app/try`
- [Open VSX listing](https://open-vsx.org/extension/stayon/stayon)
- Per-user earnings: `/earnings?userId=<uuid>`

Related: [11_branding.md](./11_branding.md) · [MEGATHON Startup Track](https://megathon.xyz/tracks/startup)

---

## How the 5 slides map to judging

MEGATHON Startup Track weights ([track page](https://megathon.xyz/tracks/startup)):

| Criterion | Weight |
|-----------|--------|
| **Execution Power** — Friday-to-Sunday delta | **35%** |
| **Product** — works, AI-native, craft | 25% |
| **Business** — market, wedge, revenue path | 15% |
| **The Edge** — why this, why now, why you | 15% |
| **Distribution Instinct** — GTM reflex | 10% |

| Slide | Primary rubric | Weight |
|-------|----------------|--------|
| 1 — Problem + why now | **The Edge** | 15% |
| 2 — Solution + product | **Product** | 25% |
| 3 — What we shipped this weekend | **Execution Power** | **35%** |
| 4 — Live proof & traction | **Execution Power** + Product | 35% + 25% |
| 5 — Business, GTM, vision | **Business** + **Distribution** | 15% + 10% |

**MEGATHON gates:**

- **Shipped gate** — live URL or working demo by Sunday deadline; no deploy, no main prize
- **Friday baseline** — 60-second video, repo link, metrics posted publicly; Sunday shows what changed
- **Open demos → shortlist → finals** — top 10–15 advance; finalists pitch live with judge Q&A
- **Qualify for Startup Track** — create a Mollie account

MEGATHON overall framing: momentum (Friday vs Sunday) and cleverness beat polish alone — but Product still scores craft, so keep slides clean and readable.

---

## Slide 1 — The hook (Problem + why now)

**Headline (≤8 words):**

> **AI agents made waiting the new distraction.**

**Subline (one sentence):**

Every Cursor prompt → wait → phone → lost context. Millions of devs hit this loop dozens of times per day.

**Visual (split screen):**

```
LEFT                          RIGHT
Cursor spinner /              Phone / social tab /
"Agent is working…"           "Where was I?"
```

- Optional: simple loop diagram — **Prompt → Wait → Drift → Return blind**
- Brand: dark bg `#0B0F14`, gold accent `#FBBF24`, StayOn mark (pause bars + coin)
- Logo: `extension/media/stayon-icon.png`

**Why now (small footer, 3 bullets max):**

- AI coding agents are default workflow (Cursor, Codex, Claude Code)
- Wait time = predictable, high-intent attention inventory
- Nobody monetizes it productively yet — only spinners and passive ads

**Speaker note (~20 sec):**

“Agents save hours but create a new failure mode: micro-waits that break focus. That’s not a UX bug — it’s unused attention. StayOn captures it.”

**Rubric:** Sets **The Edge** — timing, market shift, why this matters in 2026.

---

## Slide 2 — The solution (Product)

**Headline:**

> **Earn money while your agent works.**

**Subline:**

StayOn = reward layer for AI coding. Detects agent busy state → opens paid tasks → tracks real earnings → brings you back when the agent finishes.

**Visual (3-step horizontal flow):**

```
[1] Agent busy          [2] StayOn panel         [3] Agent ready
    (hooks detect)  →       paid survey      →       chime + focus
                            earn $ tracked          back to code
```

**Product screenshot (required):**

Real Cursor side panel — Surveys tab, wallet balance, “Open in browser”. Not mockups.

**Differentiation (3 icons, one line each):**

| Not this | StayOn |
|----------|--------|
| Generic offerwall | Triggered only during agent wait |
| Spinner ads | Real CPX postbacks + ledger |
| Distraction | Return-to-context when idle |

**Speaker note (~25 sec):**

“We’re not an ad in a spinner. We’re hook-native, privacy-first, and built for developers who already live in Cursor.”

**Rubric:** **Product** — AI-native (Cursor hooks, not a wrapper), clear UX story.

---

## Slide 3 — What we shipped (Execution Power) ⭐ heaviest slide

**Headline:**

> **Friday idea → Sunday: live product.**

**Visual: Before / After table (killer slide for Execution Power)**

| Friday baseline | Sunday (live) |
|-----------------|---------------|
| Concept + local dev | **Open VSX** extension published |
| Mock/local wallet | **CPX postbacks** → Supabase ledger |
| Hooks on one machine | **Windows inbox fallback** + hook installer |
| No public proof | **`/try`** onboarding + **`/earnings?userId=`** |
| — | **Live stats** on homepage (testers, surveys, points) |

**Architecture diagram (simple, one row):**

```
Cursor hooks → localhost bridge → Extension panel
                      ↓
              Vercel API + CPX postback
                      ↓
              Supabase (reward_events, balances)
```

**Callout box:**

“Real integrations: Cursor lifecycle hooks, CPX Research, Supabase, Vercel — not a weekend mock.”

**Optional metric strip (fill with real numbers before finals):**

`X testers · Y confirmed surveys · Z points earned · €W tracked`

Sources: homepage stats, `GET /api/stats/summary`, Supabase `reward_events`.

**Speaker note (~35 sec):**

“Execution Power is our story. We went from hooks on my laptop to strangers installing from Open VSX, completing surveys, and showing up on a public earnings page — during MEGATHON.”

**Rubric:** **Execution Power (35%)** — Friday baseline vs Sunday delta is exactly what they score.

---

## Slide 4 — Proof judges can verify (Traction)

**Headline:**

> **Real money. Real ledger. Open it now.**

**Visual: QR codes or short URLs (large, scannable on stage)**

| Proof | URL / asset |
|-------|-------------|
| Install | [open-vsx.org/extension/stayon/stayon](https://open-vsx.org/extension/stayon/stayon) |
| Onboard | `stay-on-nu.vercel.app/try` |
| Per-user earnings | `/earnings?userId=<uuid>` |
| Aggregate stats | Homepage live counters |

**Screenshot trio:**

1. Extension wallet (points + cash estimate)
2. Earnings page (confirmed events)
3. `/try` stats or Supabase `reward_events` row (timestamp blurred if needed)

**One quote / testimonial slot:**

Beta tester one-liner or before/after balance screenshot from Build-in-Public.

**Honest beta line (small, builds trust):**

“Earnings confirmed today. **Claim payout via Mollie** — sandbox/demo ready / shipping next.”

Adjust wording to match actual Mollie demo status on Sunday.

**Speaker note (~25 sec):**

“Don’t take our word for it — scan this. Here’s a user who earned during the hackathon. Here’s the postback in our ledger.”

**Rubric:** Backs **Execution** and **Product** with evidence; passes the “shipped gate.”

---

## Slide 5 — Business, GTM, vision (Close)

**Headline:**

> **The monetization layer for AI idle time.**

**Business model (3 revenue streams):**

```
1. Task revenue share     CPX / surveys today → StayOn keeps ~30%
2. Sponsored dev cards    Devtools pay for wait-time impressions (next)
3. AI feedback tasks      Labs pay for code-rating microtasks (Phase 3)
```

**Unit economics (one line):**

“Developer completes $0.50–$3 survey → user earns ~50% → StayOn margin on every wait session.”

**GTM / Distribution (10% rubric):**

| Channel | Why |
|---------|-----|
| **Open VSX / Cursor** | Where developers already are |
| **`/try` viral loop** | One link to install + prove earnings |
| **Build-in-Public** | Demo clips, live metrics, commits |
| **Expand agents** | Codex, Claude Code, Copilot — same wait-time wedge |

**Mollie angle (Startup Track + Mollie bounty):**

“CPX confirms earning → Supabase ledger → user claims → **Mollie payout layer**. Marketplace-ready architecture.”

Target flow (from [19_possiblities.md](./19_possiblities.md)):

```text
CPX confirms earning → reward_events + user_balances (confirmed)
↓
User balance ≥ threshold → status: claimable
↓
User clicks "Claim payout" (extension or web)
↓
Mollie handles payout / Connect onboarding (sandbox for demo)
↓
payout_requests.status → paid; ledger updated
```

**Vision footer (one line):**

Today: earn during Cursor waits. Tomorrow: earn, learn, or focus — across every AI coding agent.

**Closing line (memorable):**

> **Stay on the laptop. Stay in flow. StayOn.**

**Speaker note (~25 sec):**

“We’re not a feature — we’re infrastructure for a new attention surface. We shipped the hard part this weekend; payouts and sponsor inventory scale from here.”

**Rubric:** **Business (15%)** + **Distribution (10%)** + Mollie bounty narrative.

---

## Deck design best practices

### Layout

- **One idea per slide** — headline + one visual + ≤3 bullets
- **6×6 rule:** max ~6 bullets, ~6 words each (headlines can be shorter)
- **Dark deck** matches StayOn brand; gold for money/CTAs only
- **Real screenshots** > Figma mockups

### Typography

- Headline: bold sans (Inter / system)
- Code/agents: monospace for “Cursor hooks”, `busy_start`, etc.
- Logo: `extension/media/stayon-icon.png` on slide 1 + 5

### Timing (main-stage finals)

- Target **~2:30–3:00** spoken + **~1:30** demo or Q&A buffer
- ~30–40 sec per slide; **Slide 3 + live demo** get the most time
- Optional: **Slide 4 becomes live demo** on phone/laptop instead of static QR

### What to cut if over time

- Architecture detail → mention verbally
- Future modes (Learn/Focus) → one line on slide 5 only
- Gamification/streaks → omit from deck (not judge-critical)

### What NOT to do

- Don’t lead with “survey points” — lead with **earn money**
- Don’t claim full Mollie payout live unless you demo it
- Don’t compare to competitors by name unless you have a crisp one-liner
- Don’t use more than 5 slides — finals attention is short

---

## Suggested deck URL structure

If hosted on the site (`stay-on-nu.vercel.app/pitch`):

```
/pitch          → full 5-slide scroll or click-through
/pitch#proof    → jump to live links (for judges after talk)
```

Embed on slide 4:

- `/try`
- `/earnings?userId=…`
- Open VSX link
- Optional: 45s demo video (Build-in-Public clip)

---

## One-liner options (for slide subtitles or application forms)

**Recommended for judges (money + proof + wedge):**

> StayOn turns AI coding wait time into real money — when Cursor Agent is thinking, our extension opens paid surveys, tracks confirmed earnings on a live ledger, and brings you back to code when the agent finishes.

**Alternatives:**

| Angle | One sentence |
|-------|----------------|
| **Biggest vision** | StayOn is the monetization layer for AI-agent idle time — starting with Cursor, we turn every “agent is thinking” moment into paid microtasks, learning, and focus, then snap developers back to their code. |
| **Problem-first** | Every AI coding prompt creates a distraction trap — StayOn keeps developers on the laptop by letting them earn real money during agent wait time instead of reaching for their phone. |
| **Commercial / platform** | StayOn is a developer earning wallet for the AI era: task providers fund rewards, our extension captures wait-time attention, Supabase holds the ledger, and Mollie handles payouts. |
| **Short & punchy** | Earn money while your AI agent works — StayOn detects the wait, serves paid tasks, and pulls you back when the agent is ready. |
| **Honest beta** | StayOn is a Cursor extension that detects when Agent is busy, opens real CPX paid surveys in the browser, and syncs confirmed earnings to a public ledger — claim payout via Mollie is next. |

**Stage follow-up after one-liner:**

> “We already shipped it — Open VSX extension, live CPX postbacks, and per-user earnings pages judges can open right now.”

---

## Quick reference — one sentence per slide

1. **Problem:** AI wait time breaks developer focus.
2. **Solution:** StayOn turns wait time into real paid earnings.
3. **Execution:** Shipped extension + CPX + ledger + Open VSX in 48h.
4. **Proof:** Live earnings page — scan and verify.
5. **Business:** Revenue share today; marketplace + Mollie payouts tomorrow.

---

## Pre-finals checklist

- [ ] Fill Slide 3 with **real Friday baseline** (MEGATHON-posted video/repo link)
- [ ] Update Slide 4 numbers from `/api/stats/summary` morning-of
- [ ] Record **90 sec backup demo video** if Wi‑Fi fails on stage
- [ ] Prepare Mollie answer: “Claim flow architecture + sandbox status”
- [ ] Rehearse Q&A: privacy (hooks don’t read code), vs “spinner ads”, why Cursor first
- [ ] Confirm `/try` and `/earnings` deploy live on Vercel
- [ ] Open VSX listing shows logo + “Earn Money” README (v0.1.6+)

---

## Q&A prep (likely judge questions)

| Question | Answer direction |
|----------|------------------|
| How do you detect “agent busy”? | Cursor lifecycle hooks → localhost bridge; fail-open; no mock timers |
| Do you read user code? | No — hooks store max 120 chars of prompt as context note; privacy-first |
| Is the money real? | CPX postbacks → Supabase `reward_events`; public earnings page per user |
| vs spinner ad tools? | Productive tasks + ledger + return-to-context; not passive CPM ads |
| Why Cursor first? | VS Code extension + hooks shipped; expand to Codex, Claude Code, Copilot |
| How do users get paid? | Ledger live today; Mollie claim layer (marketplace payout story) |
| Business model? | Revenue share on surveys; sponsored dev cards; AI feedback tasks at scale |
| How do you acquire users? | Open VSX, `/try` link, Build-in-Public, developer communities |

---

## Multi-track alignment (optional mentions in Q&A)

From [19_02_possiblities_trucks.md](./19_02_possiblities_trucks.md):

| Priority | Track | StayOn angle |
|----------|-------|----------------|
| 1 | **Startup Track** | Working extension + real CPX + Supabase + commercial wedge |
| 2 | **Mollie bounty** | Claim payout layer |
| 3 | **Build-in-Public** | Demo clips, metrics, commits |
| 4 | **Pixverse Creative Video** | Side quest marketing video |

Do not dilute the 5-slide deck with secondary tracks — mention only if asked.

---

## What we built (reference for slide 3)

Current shipped stack (see [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md)):

| Component | Status |
|-----------|--------|
| Cursor hooks → busy detection | ✅ |
| Panel on agent wait (Surveys / Learn / Perks) | ✅ |
| CPX surveys + postback → ledger | ✅ |
| Supabase persistence | ✅ |
| Extension balance sync | ✅ |
| Agent-ready alert (sound + focus) | ✅ |
| Hook installer (`StayOn: Set Up`) | ✅ |
| Windows inbox fallback | ✅ |
| Open VSX publish | ✅ |
| `/try`, `/earnings`, live stats | ✅ |
| Mollie claim payout | 🔜 next |

---

## Pitch structure (from trucks doc)

Use this narrative arc across slides and live demo:

**Problem**

AI coding agents create frequent wait states. Developers use those moments badly: they check phones, lose focus, and waste time.

**Solution**

StayOn turns AI wait time into earning time. When Cursor, Claude Code, or Codex is thinking, StayOn opens a short paid microtask, tracks the reward, and brings the user back when the AI is ready.

**What we built**

A working IDE extension, connected to a real paid task provider, with actual survey completion, real reward events, and Supabase-based wallet tracking.

**What we added for MEGATHON**

A reward claim layer using Mollie (architecture + sandbox), a wallet ledger, and a path to sponsor-funded developer microtasks.

**Business**

StayOn earns from task provider revenue share, sponsored developer cards, and eventually developer-specific AI feedback tasks.
