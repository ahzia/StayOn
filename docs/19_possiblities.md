# StayOn possibilities (exploration)

Ideas for distribution, monetization, and payouts. **Not a build list** — use [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md) for what we are actually shipping next.

Related:

- [19_02_possiblities_trucks.md](./19_02_possiblities_trucks.md) — **MEGATHON track strategy** (Mollie bounty, pitch framing)
- [06_real_monetization_playbook.md](./06_real_monetization_playbook.md) — Tremendous / BitLabs economics
- [01_product_overview.md](./01_product_overview.md)

---

## Full user lifecycle (target story)

Reposition (MEGATHON pitch): **StayOn is the reward layer for AI work** — not only “surveys while Cursor waits.”

```
Install StayOn → Trust hooks → Agent runs → Panel opens
       → Pick mode (Surveys / Learn / Perks)
       → Do task (browser survey, flashcard, spend points)
       → Earn ⭐ (CPX = real money path)
       → Supabase ledger: pending → confirmed → claimable
       → Claim payout (Mollie) → paid
       → Agent ready → back to code
```

**Today:** install → hooks → busy → surveys/learn → earn CPX points (server-backed) → **no claim/payout yet**.

---

## Payout options (ranked)

| Option | Pros | Cons | When to use |
|--------|------|------|-------------|
| **Mollie** (Connect / payouts) | **MEGATHON Startup Track + Mollie bounty**; EU-native; platform/marketplace story; sandbox for demo | Requires Mollie account; Connect setup for production | **Primary for hackathon demo + EU claim flow** |
| **Tremendous** (gift cards, PayPal) | Fast US-style sandbox; simple gift-card API | Less aligned with MEGATHON sponsor; US-centric | Post-hackathon or global gift-card path |
| **Stripe Connect** | Bank cash at scale | Heavy KYC | Phase 3+ |
| **Manual bank transfer** | Zero integration for 3 judges | Not scalable | Demo fallback only |

**Decision (updated):** Build **Claim payout via Mollie** first (sandbox OK for judges). Keep Tremendous documented as an alternative in [06_real_monetization_playbook.md](./06_real_monetization_playbook.md) — not the hackathon-critical path.

### Mollie claim flow (target)

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

**Hackathon demo level (minimum):** Claim button + Mollie test/sandbox payment + `payout_requests` row in Supabase.

**Stronger demo:** Position StayOn as a marketplace — task providers fund rewards, users claim via Mollie Connect.

Do **not** overbuild full cash-out rails before Sunday; judges need to see you understand payment layers and that Mollie is intentional, not bolted on.

---

## Wallet states (UI + Supabase)

Show users (and judges) explicit states:

| State | Meaning | Source |
|-------|---------|--------|
| `pending` | Provider event received, not yet confirmed | `reward_events.status` |
| `confirmed` | CPX postback confirmed | `reward_events` + `user_balances` |
| `claimable` | Confirmed balance ≥ min threshold, not yet claimed | derived from `user_balances.available_points` |
| `payout_requested` | User clicked Claim | `payout_requests.status = requested` |
| `paid` | Mollie payout completed | `payout_requests.status = paid` |

Maps to existing schema: `reward_events`, `user_balances`, `payout_requests` ([17_supabase_data_model.md](./17_supabase_data_model.md)).

---

## Distribution options (how testers get StayOn)

| Channel | Effort | Best for |
|---------|--------|----------|
| **VSIX sideload** (GitHub Release) | Low | Private beta, **MEGATHON demo** |
| **Setup page download** (`web/setup`) | Low | Live URL requirement |
| **Open VSX** | Medium | Public install without marketplace |
| **Hooks bundled in extension** | Medium–high | Removes #1 tester friction |

---

## Task supply options

| Source | Money? | Status in repo |
|--------|--------|----------------|
| **CPX Research** | Yes | **Live** — external browser |
| **Learn** | No (1 ⭐) | Live — not claimable |
| **Perks** | No | Live |
| **Sponsored dev cards** | Indirect | Placeholder for marketplace story |
| **Developer feedback task** (mock) | No (points) | Optional MEGATHON add-on |

---

## MEGATHON track stack (from trucks doc)

| Priority | Track | StayOn angle |
|----------|-------|----------------|
| 1 | **Startup Track** | Working extension + real CPX + Supabase + commercial wedge |
| 2 | **Mollie bounty** | Claim payout layer (see above) |
| 3 | **Build-in-Public** | Demo clips, metrics, commits |
| 4 | **Pixverse Creative Video** | Side quest marketing video |
| Optional | Base44, Vapi, Cala, Devin | Only if time |

---

## Subfeatures to defer

- Full Mollie Connect production onboarding for all users
- Tremendous multi-country gift catalog
- BitLabs second provider
- Cross-device gamification sync
- AI microtasks marketplace (beyond one mock task)
