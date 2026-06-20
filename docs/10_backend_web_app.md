# StayOn backend & web app (Next.js)

Future-facing architecture for the `web/` Next.js app: marketing site, CPX integration, and eventual user accounts.

Related: [09_cpx_postback_setup.md](./09_cpx_postback_setup.md), [06_real_monetization_playbook.md](./06_real_monetization_playbook.md)

---

## Current scope (MVP)

| Route | Purpose |
|-------|---------|
| `/` | Landing — product overview, quick start |
| `/setup` | CPX postback URL template, extension config |
| `GET /api/cpx/postback` | CPX server postback (hash + IP validation) |
| `GET /api/cpx/wall` | SurveyWall iframe URL (secrets server-side) |
| `GET /api/wallet/:userId/pending` | Unsynced CPX rewards for extension |
| `POST /api/wallet/:userId/ack` | Extension marks rewards synced |

Storage: JSON file ledger at `web/.data/ledger.json` (dev / self-hosted).

---

## Planned phases

### Phase A — Deploy & CPX live (now)

- [x] Next.js app with postback + wall proxy
- [ ] Deploy to Vercel with env vars
- [ ] Paste postback URL in CPX dashboard
- [ ] End-to-end test: survey → postback → extension tokens

### Phase B — Persistent database

Replace JSON ledger with Postgres (Vercel Postgres or Supabase):

```
users(id, email?, created_at)
ledger(trans_id PK, user_id, status, amount_usd, tokens, synced, …)
```

Benefits: survives redeploys, supports analytics, fraud queries.

### Phase C — User accounts on web

- Sign in (GitHub / email magic link)
- Link extension `userId` to web account
- Dashboard: earnings history, redeem, download VSIX

### Phase D — Survey API mode

Optional upgrade from iframe to CPX `get-surveys.php` API for custom StayOn UI:

```
GET /api/cpx/surveys?userId=…
```

Backend forwards `ip_user`, `user_agent`, builds `secure_hash`, returns sanitized survey list (no secrets in extension).

### Phase E — Redeem & payouts

- Tremendous or Stripe Connect for gift cards
- Minimum redeem threshold (5,000 ⭐)
- KYC / tax handled by payout provider

### Phase F — Multi-provider

| Provider | Role |
|----------|------|
| CPX Research | Hackathon / fast surveys (iframe) |
| BitLabs | Production API, richer inventory |
| Direct sponsors | Developer tool CPM cards |
| StayOn marketplace | Microtasks for devs |

---

### Phase G — Learn content API (backend contributor)

Learn questions served from backend; extension integrates via HTTP when ready.

| Route | Purpose |
|-------|---------|
| `GET /api/learn/task` | One flashcard/quiz per wait ( **1 point ⭐** ) |
| `POST /api/learn/tasks` | Admin bulk import (optional) |

**Docs:** [12_backend_developer_guide.md](./12_backend_developer_guide.md), [13_learn_api_contract.md](./13_learn_api_contract.md)

Backend work does **not** require extension changes until integration PR.

---

## Deployment (Vercel)

```bash
cd web
vercel
```

Environment variables:

```
CPX_APP_ID=
CPX_SECURE_HASH=
CPX_USER_SHARE=0.5
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Postback URL becomes:

```
https://your-app.vercel.app/api/cpx/postback?status={status}&…
```

---

## Security notes

- Never expose `CPX_SECURE_HASH` to the extension or client JS
- Validate postback hash: `md5(trans_id + '-' + secret)`
- Whitelist CPX IPs in production
- Dedupe on `trans_id` (CPX may call twice on fraud cancel with `status=2`)
- Rate-limit `/api/cpx/wall` per userId if abused

---

## Monorepo layout

```
StayOn/
├── extension/     # VS Code / Cursor extension
├── web/           # Next.js — this doc
├── docs/
└── .env.example   # shared reference (copy to web/.env.local)
```

The web app is intentionally separate so it can deploy independently while the extension ships via VSIX / Open VSX.
