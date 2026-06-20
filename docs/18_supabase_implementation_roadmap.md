# Supabase implementation roadmap

Step-by-step plan to move StayOn from JSON files + local wallet to **Supabase-backed earnings tracking** and (later) **cash redeem**.

Prerequisites: read [17_supabase_data_model.md](./17_supabase_data_model.md).

---

## Phase 0 — Supabase project setup (½ day)

### 0.1 Create project

1. [supabase.com](https://supabase.com) → New project (region close to users; EU if NL-heavy).
2. Save **Project URL**, **anon key**, **service role key** (Settings → API).
3. Enable **Database** → note connection string for local migrations.

### 0.2 Apply schema

```bash
cd web
# Option A: Supabase CLI
npx supabase link --project-ref <ref>
npx supabase db push

# Option B: SQL Editor in dashboard
# Paste contents of supabase/migrations/001_initial_schema.sql
```

### 0.3 Wire Next.js

```bash
cd web
npm install @supabase/supabase-js
```

Add to `web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STORAGE_BACKEND=supabase
```

Create `web/src/lib/supabase/server.ts`:

- `createServiceClient()` — service role, **server routes only**
- `createAnonClient()` — future web dashboard / auth

Add vars to `web/.env.example` (no real keys).

### 0.4 Acceptance

- [ ] Tables visible in Supabase Table Editor
- [ ] `extension_installs` insert works from SQL editor
- [ ] RLS enabled; anon cannot read `survey_profiles.email`

---

## Phase 1 — Replace JSON ledger + profiles (2–3 days)

**Goal:** CPX postbacks and survey profiles persist across Vercel redeploys.

### 1.1 Repository layer

Add `web/src/lib/db/`:

| Module | Replaces | Functions |
|--------|----------|-----------|
| `rewardEvents.ts` | `ledger.ts` | `upsertFromPostback`, `getUnackedForInstall`, `ackEvents` |
| `balances.ts` | — | `getBalance`, `applyPointsDelta` (transactional) |
| `surveyProfiles.ts` | `userProfile.ts` | `get`, `save`, `delete` |
| `extensionInstalls.ts` | — | `ensureInstall`, `touchLastSeen` |

Use feature flag:

```typescript
const backend = process.env.STORAGE_BACKEND ?? 'json';
```

Keep JSON implementations until Supabase path is tested; then delete JSON writers.

### 1.2 Update routes (no extension change yet)

| Route | Change |
|-------|--------|
| `GET /api/cpx/postback` | Write `reward_events` + update `user_balances` in one transaction |
| `GET /api/wallet/:id/pending` | Same response shape; read from Supabase |
| `POST /api/wallet/:id/ack` | Insert `reward_sync_acks` |
| `GET/POST/DELETE /api/user/:id/profile` | `survey_profiles` + `ensureInstall` |

On first profile save or wall request, `INSERT extension_installs ON CONFLICT DO NOTHING`.

### 1.3 Migration script

`web/scripts/migrate-json-to-supabase.ts`:

1. Read `web/.data/ledger.json` and `user-profiles.json`.
2. Upsert all rows.
3. Recompute `user_balances` from confirmed events.

### 1.4 Deploy

- Set env vars on Vercel.
- `STORAGE_BACKEND=supabase`
- CPX postback URL unchanged.

### 1.5 Acceptance

- [ ] Complete test survey → row in `reward_events`
- [ ] Redeploy / restart → data still present
- [ ] Extension still syncs via existing pending/ack endpoints
- [ ] `curl GET /api/wallet/:userId/pending` matches pre-migration behavior

---

## Phase 2 — Server-authoritative balance (2–3 days)

**Goal:** Fix double-credit risk; extension displays server earned balance.

### 2.1 New API

**`GET /api/wallet/:extensionUserId/summary`**

```json
{
  "ok": true,
  "availablePoints": 1240,
  "pendingPoints": 0,
  "lifetimeEarnedPoints": 1500,
  "cashEstimate": "≈ €0.12",
  "recentEvents": [
    { "id": "…", "points": 120, "label": "CPX survey", "createdAt": "…" }
  ]
}
```

### 2.2 Extension changes (`extension/`)

| File | Change |
|------|--------|
| `api/stayonApi.ts` | Add `fetchWalletSummary()` |
| `api/rewardSync.ts` | Poll summary; update earned portion of wallet from server |
| `extension.ts` | On activate, fetch summary once |
| `gamification/wallet.ts` | Split `earnedPoints` (server) vs `engagementPoints` (local) OR document that `tokens` = server + local engagement |

**Recommended UX:** `wallet.tokens = serverAvailable + localEngagement` for display; redeem API uses **server only**.

### 2.3 Idempotent ack

Ack records which events the device has **displayed** (toast/confetti). Do not use ack as the only credit mechanism.

### 2.4 Acceptance

- [ ] Wipe extension `globalState` → balance restores from server after sync
- [ ] Repeat ack does not change `user_balances`
- [ ] CPX complete → balance updates within 30s poll

---

## Phase 3 — Auth + account linking (3–5 days)

**Goal:** One human, multiple installs; foundation for redeem.

### 3.1 Supabase Auth

- Enable GitHub provider (and/or email magic link).
- Web routes: `/login`, `/dashboard`.

### 3.2 Link extension to account

**`POST /api/account/link`**

- Body: `{ extensionUserId }` + Supabase JWT.
- Sets `extension_installs.user_id = auth.uid()`.
- Optional: merge balances into account-level view.

Extension: command **StayOn: Link account** → opens browser to web link flow with `extensionUserId` query param.

### 3.3 Dashboard (minimal)

- Earnings history from `reward_events`
- Masked survey profile
- “Download extension” / setup docs

### 3.4 Acceptance

- [ ] Sign in on web → see earnings for linked install
- [ ] Second machine links to same account → combined history visible

---

## Phase 4 — Learn + engagement on server (optional, 2 days)

Only if you need dedupe / analytics:

- `learn_tasks` content table
- `POST /api/learn/complete` → `engagement_events` (1 point, non-withdrawable)
- Extension calls complete endpoint instead of local-only award

See [13_learn_api_contract.md](./13_learn_api_contract.md).

---

## Phase 5 — Redeem / payouts (1–2 weeks)

**Goal:** User converts ⭐ to real money (gift card / PayPal).

### 5.1 Provider

Start with [Tremendous sandbox](https://developers.tremendous.com) per [06_real_monetization_playbook.md](./06_real_monetization_playbook.md) §5.1.

Env:

```bash
TREMENDOUS_API_KEY=
TREMENDOUS_FUNDING_SOURCE_ID=
TREMENDOUS_SANDBOX=true
```

### 5.2 API

**`POST /api/redeem`** (requires auth)

```json
{ "points": 5000, "method": "tremendous_gift_card", "productId": "…" }
```

Server:

1. Verify `available_points >= points` and `points >= REDEEM_MIN`.
2. Transaction: debit balance, insert `payout_requests`.
3. Call Tremendous `POST /orders`.
4. Store `provider_order_id`; update status on webhook.

**`POST /api/webhooks/tremendous`** — verify signature, update `payout_requests`.

### 5.3 Extension UI

Enable Wallet tab button (currently stub in `extension/media/panel/main.ts`):

- “Redeem” → open web dashboard or in-panel email confirm → calls redeem API.

### 5.4 Compliance checklist

- [ ] Minimum redeem high enough to cover provider fees
- [ ] Terms of service / “points have no cash value until redeem”
- [ ] Payout email matches account
- [ ] Fraud: velocity limits on redeem + new accounts

### 5.5 Acceptance

- [ ] Sandbox Tremendous order completes
- [ ] Balance debited exactly once
- [ ] Failed order rolls back or marks `failed` without double debit

---

## Phase 6 — Multi-provider + analytics (ongoing)

| Provider | Integration |
|----------|-------------|
| BitLabs | New postback route → same `reward_events` with `provider = 'bitlabs'` |
| Sponsored cards | Impression/click events → `reward_events` or separate `sponsor_events` |
| Publisher dashboard | Materialized view `publisher_revenue_daily` |

---

## Suggested PR sequence

Keep changes reviewable:

| PR | Scope |
|----|--------|
| **PR 1** | `supabase/migrations/001_initial_schema.sql` + `web/src/lib/supabase/server.ts` + env docs |
| **PR 2** | DB repository layer + feature flag; postback + profile routes |
| **PR 3** | JSON migration script + deploy docs |
| **PR 4** | `GET /wallet/summary` + extension sync refactor |
| **PR 5** | Supabase Auth + link flow + dashboard skeleton |
| **PR 6** | Tremendous redeem (sandbox) |

---

## Testing checklist

```bash
# Profile
curl -X POST http://localhost:3000/api/user/TEST-UUID/profile \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","birthdayYear":1990,"birthdayMonth":1,"birthdayDay":15}'

# Simulated postback (use real hash from 09_cpx_postback_setup.md)
curl "http://localhost:3000/api/cpx/postback?status=1&trans_id=test-1&..."

# Pending / summary
curl http://localhost:3000/api/wallet/TEST-UUID/pending
curl http://localhost:3000/api/wallet/TEST-UUID/summary  # after PR 4

# Supabase sanity (SQL)
select * from reward_events order by created_at desc limit 5;
select * from user_balances;
```

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Service role key leaked | Server-only env; never in extension or `NEXT_PUBLIC_*` |
| Double postback credit | UNIQUE on `external_trans_id`; upsert logic |
| Extension/server drift | Phase 2 server-authoritative balance |
| Payout liability > revenue | Monitor `sum(available_points)` vs CPX dashboard gross |
| GDPR / email in DB | RLS, encrypt at rest (Supabase default), delete on account delete |

---

## What not to do yet

- Do not move gamification XP/levels to Supabase until needed — adds complexity without payout value.
- Do not expose Supabase anon key write access to `reward_events` from extension — all writes via Next.js API.
- Do not implement redeem before Phase 1–2 balance truth is stable.
