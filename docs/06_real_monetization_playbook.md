# StayOn Real Monetization Playbook

How to move from **mock tokens and hardcoded quizzes** to **real survey tasks and actual money** for users and StayOn.

Related docs:

- [01_product_overview.md](./01_product_overview.md) — product vision and revenue streams
- [04_technical_research.md](./04_technical_research.md) — BitLabs API sketch (Phase 2)
- [03_implementation_plan.md](./03_implementation_plan.md) — current MVP scope

---

## 1. Executive summary

**Today (MVP):** StayOn awards local ⭐ tokens from hardcoded tasks. Cash estimate is a formula, not real money. Redeem is stubbed.

**To make real money:** you need three layers that the extension alone cannot provide:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Task supply │ ──▶ │ StayOn backend│ ──▶ │ Payout provider │
│ (surveys,   │     │ ledger + fraud│     │ (Tremendous,    │
│  sponsors)  │     │ + callbacks   │     │  Stripe, etc.)  │
└─────────────┘     └──────────────┘     └─────────────────┘
        ▲                    ▲
        │                    │
   BitLabs / CPX       Extension fetches
   Direct sponsors     tasks + shows UI
   Microtask APIs      during agent wait
```

**Minimum viable real-money stack:**

1. **BitLabs** (or CPX) for paid surveys → money in via server callback
2. **Small backend** (API + DB) to verify callbacks and maintain a ledger
3. **Tremendous** (or Stripe Connect) to pay users out at redeem threshold

**Timeline estimate:**

| Phase | Outcome | Effort |
|-------|---------|--------|
| A — BitLabs sandbox | Real survey opens in browser; test callback credits ledger | 3–5 days |
| B — Production surveys | Live survey inventory for users | 1–2 weeks (+ publisher approval) |
| C — Redeem | User withdraws €5+ as gift card / PayPal | +1 week |
| D — Sponsored cards | Direct dev-tool sponsors pay CPM | +2–4 weeks sales |
| E — Developer microtasks | Higher-value labeling tasks | +1–3 months |

---

## 2. Why the extension cannot do this alone

| Requirement | Why not in-extension |
|-------------|---------------------|
| **Survey payouts** | BitLabs pays the **publisher** via server callback with HMAC hash — secret must not live in the VSIX |
| **User IP / geo** | Survey eligibility needs IP; extension should not expose or spoof it — backend forwards real IP |
| **Fraud prevention** | Duplicate `TX` IDs, velocity limits, device caps — needs server-side ledger |
| **Real redeem** | Gift cards / bank transfer require funded business account + API keys on server |
| **Tax / compliance** | W-9, KYC, payout records — payout providers handle this, not the IDE |

The extension stays responsible for: **wait detection**, **UI**, **opening survey URLs**, **displaying balance**.

---

## 3. Revenue channels (ranked for StayOn)

### Tier 1 — Fastest path to real money: Rewarded surveys (BitLabs)

**What it is:** User completes a third-party survey during agent wait time. BitLabs pays StayOn per complete/screenout; StayOn shares with user.

**Typical economics (indicative, varies by geo):**

| Event | Publisher receives (USD) | User share (50%) | StayOn share |
|-------|--------------------------|------------------|--------------|
| Survey complete | $0.50 – $3.00 | $0.25 – $1.50 | remainder |
| Screenout (partial) | $0.01 – $0.10 | small credit | remainder |

**Best for:** Hackathon demo with **real** payout flow, even if amounts are small.

### Tier 2 — Sponsored developer cards (direct sales)

**What it is:** Linear, Vercel, Sentry, etc. pay for impressions/clicks during wait time.

**Typical economics:**

| Model | Rate | Notes |
|-------|------|-------|
| CPM (1000 impressions) | $2 – $15 for dev audience | Competitors cite €0.02–€0.05 **per view** at floor |
| CPC (click) | 10–50× impression value | Requires labeled “Sponsored” |

**Best for:** Higher margin, brand-aligned — but requires **sales**, not just API signup.

**Alternatives:** Join an existing network (Kickbacks, IdleAds, Idlen) as publisher — faster but less differentiated.

### Tier 3 — Developer microtasks (StayOn moat)

**What it is:** Rate AI outputs, classify bugs, compare code snippets — paid by AI labs or research firms.

**Typical economics:** $0.10 – $2.00 per task (much higher than generic surveys).

**Best for:** Phase 3+; needs task supply partnerships (Scale, Surge, Prolific for devs, or direct AI lab contracts).

### Tier 4 — Team / enterprise

Companies pay per seat for internal training cards, not ads. Separate sales motion.

---

## 4. Recommended provider: BitLabs (surveys)

### 4.1 What you get

- Survey inventory matched to user profile/geo
- Server-to-server **callbacks** when user completes or screens out
- Dashboard for revenue, fraud, and testing
- Survey API: list surveys → user opens `click_url`

Docs: [developer.bitlabs.ai](https://developer.bitlabs.ai/)

### 4.2 Account setup steps (what YOU do)

| Step | Action | Who |
|------|--------|-----|
| 1 | Email **partnerships@bitlabs.ai** or use their sign-up flow — request publisher access for a developer productivity app | You |
| 2 | Create **company workspace** on [dashboard.bitlabs.ai](https://dashboard.bitlabs.ai) | You |
| 3 | Complete **workspace verification** (company details — required before live demand) | You |
| 4 | Create an **app placement** → copy **App/API Token** and **App Secret** | You |
| 5 | Enable **Surveys** under Demand Settings | You |
| 6 | Configure **Callback URL** pointing to your backend (see §6) | You |
| 7 | Start in **test mode**; complete a test survey; verify callback hits your server | You + dev |
| 8 | Ask account manager to go **live** and disable test mode | You |

**Expectation:** Approval is not always instant. Plan **1–2 weeks** for verification. For hackathon, use **test/sandbox callbacks** while waiting.

### 4.3 Survey API (integration summary)

**List surveys** (from backend, not extension — keeps token secret):

```http
GET https://api.bitlabs.ai/v2/client/surveys
X-Api-Token: YOUR_APP_TOKEN
X-User-Id: USER_UUID   (max 65 chars, use StayOn user id)
```

Optional query params: client IP, user agent, platform (pass from backend).

**Response:** array of surveys with `click_url`, estimated payout, LOI (length), category.

**Open survey:** extension calls `vscode.env.openExternal(Uri.parse(click_url))` — user completes in browser.

**After completion:** BitLabs sends HTTP GET callback to your server (see §6).

**Important:** Refresh survey list after each open (new impression ID). Cache ≤ few minutes.

### 4.4 Alternative: CPX Research

| Item | Detail |
|------|--------|
| Sign up | [cpx-research.com](https://www.cpx-research.com) publisher dashboard |
| API | `GET https://live-api.cpx-research.com/api/get-surveys.php` |
| Requires | `app_id`, `ext_user_id`, `ip_user`, `secure_hash` (MD5) |
| Downside | IP mandatory; script-tag oriented; backend proxy required |

Use CPX only if BitLabs rejects or is slow to approve.

---

## 5. Payout provider: paying users real money

Tokens must convert to something withdrawable.

### 5.1 Option A — Tremendous (recommended for MVP redeem)

**What:** Gift cards, PayPal, Visa prepaid, etc. via API.

| Step | Action |
|------|--------|
| 1 | Sign up at [tremendous.com](https://www.tremendous.com) |
| 2 | Build on **sandbox** immediately ($5,000 fake balance) — [developers.tremendous.com](https://developers.tremendous.com) |
| 3 | Request **production access** early (review can take days) |
| 4 | Fund balance (bank transfer / card) |
| 5 | On redeem: `POST /api/v2/orders` with recipient email + product ID |

**Minimum redeem:** You set it (e.g. 5,000 tokens ≈ €0.50 at current rate, or raise to €5 to match competitors).

**StayOn margin:** User redeem value < survey revenue earned — keep spread in ledger.

### 5.2 Option B — Stripe Connect

**What:** Cash to user's bank (what Kickbacks, SAI use).

| Step | Action |
|------|--------|
| 1 | Create Stripe account + enable **Connect** |
| 2 | Onboarding flow for users (KYC) |
| 3 | Transfer on redeem threshold |

**Downside:** Heavier compliance; better for scale, not fastest hackathon path.

### 5.3 Option C — API credits (no cash)

Partner with Cursor/Codex/Anthropic/OpenAI for **subscription credits** instead of cash — strong hackathon story, requires partnership outreach.

---

## 6. Backend architecture (required)

### 6.1 Minimal services

```
stayon-api/
├── POST /users/register     → issue stayon_user_id (UUID)
├── GET  /tasks/survey       → proxy BitLabs get-surveys (auth: user token)
├── POST /webhooks/bitlabs   → verify hash, credit ledger
├── GET  /wallet             → balance, pending, history
└── POST /redeem             → Tremendous order, debit ledger
```

**Stack suggestion:** Node/Express or Hono + Postgres (or SQLite for hackathon) + Redis for rate limits.

### 6.2 BitLabs callback verification

Callbacks are **HTTP GET** with query params + `&hash=...`.

Verify:

```typescript
import crypto from 'crypto';

function verifyBitLabsCallback(fullUrlWithoutHash: string, hash: string, appSecret: string): boolean {
  const expected = crypto
    .createHmac('sha1', appSecret)
    .update(fullUrlWithoutHash)
    .digest('hex');
  return expected === hash;
}
```

Store **`TX` (transaction ID)** — never credit twice for same TX.

Key callback params ([BitLabs docs](https://developer.bitlabs.ai/docs/callbacks)):

| Param | Meaning |
|-------|---------|
| `[%USER:UID%]` / `[%UID%]` | Your user id |
| `[%VALUE:USD%]` / `[%RAW%]` | What BitLabs paid you |
| `[%VALUE:CURRENCY%]` / `[%VAL%]` | User reward in your virtual currency |
| `[%TX%]` | Unique transaction — dedupe key |
| `&hash=` | HMAC-SHA1 signature |

**User credit rule (example):**

```
user_tokens += floor(publisher_usd_share * 10000)   // 1 USD = 10,000 tokens
stayon_revenue = callback_usd - user_cash_value
```

Align token economics with [03_implementation_plan.md](./03_implementation_plan.md) or retune `TOKEN_TO_EUR` to match real payouts.

### 6.3 Extension changes

| Change | Detail |
|--------|--------|
| User auth | Device registration → `stayon_user_id` stored in `SecretStorage` |
| Earn mode task | Fetch `GET /tasks/survey` when agent busy |
| UI | Show survey LOI, estimated €, “Open survey” button |
| Open | `openExternal(click_url)` — not iframe (CSP simpler) |
| Balance | Poll `/wallet` or push via websocket after callback |
| Redeem | Wallet tab → email → `POST /redeem` |

**Do not** embed BitLabs API token in the extension.

---

## 7. Realistic survey task UX in StayOn

During agent wait (`busy` state):

```
┌──────────────────────────────┐
│ ● Cursor is working          │
│   "Refactor auth module…"    │
├──────────────────────────────┤
│  PAID SURVEY        ~€0.80   │
│  Product feedback · 6 min    │
│  [ Open survey ]             │
│  Opens in browser · Sponsored│
├──────────────────────────────┤
│  ⭐ 1,240   ≈ €0.12          │
└──────────────────────────────┘
```

**Rules:**

- Label clearly: **“Partner survey”** or **“Sponsored”**
- Show estimated reward and duration from API
- Credit only after **callback**, not on click (show “Pending…” until confirmed)
- If no surveys: fall back to quiz/learn/focus (current MVP tasks)

---

## 8. Sponsored cards — getting real advertisers

### 8.1 Direct outreach (higher margin)

| Step | Action |
|------|--------|
| 1 | Build 30-second demo video: agent busy → StayOn card → return to code |
| 2 | Target 10 dev-tool companies (CI, observability, deployment, AI tools) |
| 3 | Offer pilot: **€500 for 10k qualified wait impressions** or CPC deal |
| 4 | Track impressions server-side (same ledger as surveys) |
| 5 | Replace hardcoded `SPONSORED_CARDS` in `taskBank.ts` with CMS/API |

### 8.2 Ad network / competitor platforms (faster, less margin)

| Platform | Model | Notes |
|----------|-------|-------|
| [Kickbacks.ai](https://kickbacksai.org/) | 50% rev share, spinner/status | Proves demand; less differentiated |
| [IdleAds](https://marketplace.visualstudio.com/items?itemName=idleads.idleads-vscode) | 70% rev share, gateway API | Has publisher API pattern to study |
| [Idlen](https://www.idlen.io/) | Editor + browser | Broader surface |

StayOn can integrate a **gateway API** later while keeping survey + microtask differentiation.

---

## 9. Developer microtasks (Phase 3)

| Step | Action |
|------|--------|
| 1 | Partner with AI lab or data vendor needing code/prompt evaluation |
| 2 | Build task format: two code diffs → “which is better?” |
| 3 | Host tasks on StayOn backend; pay $0.20–$1.00 per judgment |
| 4 | Quality: gold questions, agreement checks, block bots |

Platforms to explore: Prolific (research), Surge AI, Scale RT, Mercor — or direct contracts.

---

## 10. Legal, trust, and fraud (non-optional)

| Area | Requirement |
|------|-------------|
| **Privacy policy** | Disclose survey partners, data shared with BitLabs (user id, IP via backend) |
| **Terms of use** | Minimum age, geo restrictions, redeem rules |
| **Ad labeling** | “Sponsored” / “Partner survey” on every paid task |
| **Dedupe** | Transaction IDs, device limits, velocity caps |
| **Manual review** | Flag redeem spikes; block VPN abuse if survey quality drops |
| **Tax** | Tremendous/Stripe handle much recipient compliance; you need business entity for revenue |

StayOn principles from [01_product_overview.md](./01_product_overview.md): no code reading by default; separate tasks from agent output.

---

## 11. Implementation checklist (StayOn team)

### Week 1 — Real survey path (sandbox)

- [ ] Apply for BitLabs publisher account
- [ ] Deploy minimal backend (Railway, Fly.io, Vercel + serverless)
- [ ] Implement `POST /webhooks/bitlabs` with hash verification + TX dedupe
- [ ] Register test users; store UUID in extension `SecretStorage`
- [ ] Extension: fetch survey list from backend when busy
- [ ] Open `click_url` in external browser
- [ ] Show “Pending reward” until callback credits wallet
- [ ] Test end-to-end in BitLabs test mode

### Week 2 — Production + redeem

- [ ] BitLabs workspace verified → live demand
- [ ] Tremendous sandbox → test gift card redeem
- [ ] Tremendous production approval + fund account
- [ ] Implement `POST /redeem` with minimum threshold (e.g. €5)
- [ ] Update Wallet tab: real balance, redeem button enabled
- [ ] Privacy policy + terms pages (required for stores and partners)

### Week 3 — Sponsored revenue

- [ ] Replace static sponsors with admin API or JSON config on backend
- [ ] Track impressions server-side during verified `busy` sessions
- [ ] Send 5 pilot outreach emails to dev-tool companies
- [ ] A/B: survey vs sponsor vs quiz fallback rates

### Month 2+ — Moat

- [ ] Developer microtask pipeline
- [ ] Stripe Connect for cash-native users
- [ ] Team plans (internal cards, no ads)

---

## 12. What to do **today** to get actual tasks

### Surveys (fastest real money)

1. **Email BitLabs:** partnerships@bitlabs.ai — subject: “Publisher integration — developer IDE wait-time app (StayOn)”
2. **Create backend repo** with webhook endpoint (can be ngrok for dev)
3. **Sign up Tremendous sandbox** in parallel for redeem path
4. **Do not wait for approval** to build — use mock callbacks locally:

```bash
# Simulate BitLabs callback (dev only)
curl "https://YOUR_API/webhooks/bitlabs?uid=TEST_USER&val=80&raw=0.10&tx=tx_001&hash=COMPUTED_HASH"
```

### Sponsored cards (parallel track)

1. Record 30s demo of StayOn during real Cursor agent wait
2. List 10 target sponsors with contact emails
3. Send pilot offer: branded card in wait panel, €CPM or flat fee

### If BitLabs is slow

- Apply to **CPX Research** as backup publisher
- Keep MVP quizzes as fallback so product is never empty

---

## 13. Economics sanity check

**Assumptions:** Developer completes 2 surveys/day on agent wait; $0.40 avg publisher revenue; 50% user share.

| Metric | Value |
|--------|-------|
| User earns / day | ~$0.40 |
| User earns / month | ~$12 |
| StayOn revenue / user / month | ~$12 |
| At 1,000 active users | ~$12k/month gross |

Survey revenue is modest per user but scales with **wait frequency** — StayOn’s timing advantage vs generic offerwalls.

Sponsored dev cards + microtasks raise ARPU significantly.

---

## 14. Mapping to current codebase

| File / area | Change for real money |
|-------------|----------------------|
| `extension/src/gamification/taskBank.ts` | Surveys from API; sponsors from backend CMS |
| `extension/src/gamification/tasks.ts` | Pending → confirmed reward states |
| `extension/src/gamification/wallet.ts` | Sync with server ledger, not only `globalState` |
| `extension/src/panel/StayOnPanel.ts` | Survey card UI, pending badge, redeem flow |
| **New:** `stayon-api/` | Webhooks, BitLabs proxy, Tremendous redeem |
| `extension/package.json` | Add config: `stayon.apiBaseUrl` |

---

## 15. References

| Resource | URL |
|----------|-----|
| BitLabs — Getting started | https://developer.bitlabs.ai/docs |
| BitLabs — Sign up | https://developer.bitlabs.ai/docs/sign-up-set-up |
| BitLabs — Survey API | https://developer.bitlabs.ai/docs/user-based-survey-api |
| BitLabs — Callbacks | https://developer.bitlabs.ai/docs/callbacks |
| BitLabs — Get Surveys API | https://developer.bitlabs.ai/reference/getsurveysv2 |
| CPX Research API | https://www.cpx-research.com/main/en/doc.php |
| Tremendous API | https://developers.tremendous.com/docs/introduction |
| Stripe Connect | https://stripe.com/connect |

---

## 16. Decision summary

| Goal | Do this first |
|------|----------------|
| **Real paid surveys in app** | BitLabs account + backend webhook + open `click_url` |
| **Users withdraw cash/gift cards** | Tremendous API + redeem threshold |
| **Higher margin without surveys** | Direct sponsor sales + server-tracked impressions |
| **Long-term moat** | Developer microtasks + team plans |

The extension you built is the **demand capture layer** (wait time). Real money requires the **supply layer** (BitLabs/sponsors) and **settlement layer** (backend + payouts). Start BitLabs + backend this week; redeem can follow within days using Tremendous sandbox.
