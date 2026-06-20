# Backend developer guide

Guide for contributors working on the **StayOn Next.js backend** (`web/`). Your APIs are consumed by the VS Code extension later — you do **not** need to change the extension to ship backend work.

Related:

- [10_backend_web_app.md](./10_backend_web_app.md) — overall backend roadmap
- [13_learn_api_contract.md](./13_learn_api_contract.md) — Learn mode API (your main task area)
- [09_cpx_postback_setup.md](./09_cpx_postback_setup.md) — CPX (already implemented, do not break)
- [11_branding.md](./11_branding.md) — terminology (`points`, ⭐)

---

## 1. Golden rule: backend only

```
┌─────────────────┐         HTTP JSON          ┌─────────────────┐
│  extension/     │  ──── (future integration) ─▶│  web/           │
│  Cursor panel   │                              │  Next.js APIs   │
│  (other dev)    │  ◀── never import web code ──│  (you)          │
└─────────────────┘                              └─────────────────┘
```

| Do | Don't |
|----|--------|
| Work in `web/` | Edit `extension/` unless explicitly coordinated |
| Add routes under `web/src/app/api/` | Put secrets or DB logic in the extension |
| Document new endpoints in `docs/13_*` | Change extension `package.json` or panel UI |
| Test with `curl` / Postman / browser | Assume extension will auto-pick up breaking changes |
| Use env vars in `web/.env.local` | Commit `.env` or real API keys |

The extension team integrates your APIs in a **separate PR** when the contract is stable.

---

## 2. Repo layout (your scope)

```
StayOn/
├── web/                          ← YOU WORK HERE
│   ├── src/app/api/              ← API routes
│   ├── src/lib/                  ← shared server logic, DB, validators
│   ├── .env.local                ← local secrets (gitignored)
│   └── .data/                    ← dev JSON storage (gitignored)
├── extension/                    ← DO NOT TOUCH (extension owner)
├── docs/                         ← update API contracts when you change responses
└── .cursor/                      ← hooks only; not backend
```

### Run locally

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000
```

### Existing APIs (leave working)

| Route | Owner note |
|-------|------------|
| `GET /api/cpx/postback` | CPX callbacks — do not rename without updating CPX dashboard |
| `GET /api/cpx/wall` | Survey iframe URL for Earn mode |
| `GET /api/wallet/:userId/pending` | CPX point sync |
| `POST /api/wallet/:userId/ack` | CPX ack |

New Learn routes should live alongside these, e.g. `web/src/app/api/learn/…`.

---

## 3. Integration model (how extension will use you)

Today the extension uses **hardcoded** tasks in `extension/src/gamification/taskBank.ts`. That is intentional.

**Your job:** expose HTTP APIs. **Extension job (later):** call your APIs when `stayon.apiBaseUrl` is set and mode is `learn`.

Flow (future):

```
Agent busy + Learn mode
       ↓
Extension  GET /api/learn/task?userId=…&sessionId=…
       ↓
Backend returns one learn card (question + metadata, NOT the answer in client-trusted form for graded quizzes)
       ↓
User completes task in panel
       ↓
Extension awards local points (1 ⭐) OR POST /api/learn/complete for server-validated quizzes (v2)
```

Until integration lands, **test your APIs independently**. Extension behavior must not change when you deploy backend updates.

---

## 4. Points economy (important)

Learn tasks are **engagement**, not monetization. They must stay **far below** paid tasks.

| Task source | Typical points | Real money? |
|-------------|----------------|-------------|
| **CPX / paid surveys** | 50–500+ ⭐ (from USD payout) | Yes |
| Quiz (Earn mode, local) | 8–15 ⭐ | No |
| Sponsored click | up to 50 ⭐ | Indirect |
| **Learn (your API)** | **1 ⭐** (fixed; maybe 0.5 in future) | **No** |
| Focus | 12 ⭐ (local only) | No |

**Backend rules for Learn content:**

- Set `rewardPoints: 1` in API responses (extension may cap lower; never send `> 1` without product approval)
- Do not tie Learn completions to CPX ledger or cash estimate
- Do not reuse CPX `trans_id` or postback flow for Learn

See [13_learn_api_contract.md](./13_learn_api_contract.md) for field names.

---

## 5. Suggested implementation plan (Learn)

### Phase 1 — Content API (start here)

- [ ] `GET /api/learn/task` — return one learn card per request
- [ ] Store questions in JSON file, SQLite, or Postgres under `web/src/lib/learn/`
- [ ] Categories/tags optional (`typescript`, `git`, `cursor`, …)
- [ ] Dedupe: avoid same `taskId` for same `userId` within 24h (simple in-memory or file store OK for hackathon)

### Phase 2 — Admin / bulk import

- [ ] `POST /api/learn/tasks` (admin key) — bulk create questions
- [ ] Or a script `web/scripts/import-learn.ts` reading CSV/JSON

### Phase 3 — Server-side grading (optional)

- [ ] Multiple-choice learn tasks with `correctIndex` — extension sends answer to `POST /api/learn/complete`
- [ ] Backend returns `{ ok, rewardPoints: 1 }` — extension applies points only on `ok: true`

**Phase 1 is enough** for the other developer to add many questions without touching the extension.

---

## 6. API design standards

Follow existing `web/` patterns:

- Routes in `web/src/app/api/<name>/route.ts`
- `export const dynamic = 'force-dynamic'` for non-static endpoints
- JSON responses: `{ ok: boolean, … }` on success/error
- Validate query/body; return `400` / `401` / `503` with `{ ok: false, error: "…" }`
- No secrets in responses
- Timeouts: extension uses 8s — keep handlers fast

### Error shape (consistent)

```json
{ "ok": false, "error": "Human-readable message" }
```

### Success shape

```json
{ "ok": true, "…": "payload fields" }
```

---

## 7. Environment variables

Add new vars to `web/.env.example` and document here when introduced:

```bash
# Learn content (optional)
LEARN_ADMIN_KEY=          # for POST import routes
LEARN_MAX_PER_DAY=20      # rate limit per userId
```

Never commit real values.

---

## 8. Testing checklist (before asking for extension integration)

```bash
# One learn task
curl "http://localhost:3000/api/learn/task?userId=test-user-1"

# Should return ok + task with rewardPoints: 1
# Repeat — should rotate or dedupe per contract

# CPX still works
curl "http://localhost:3000/api/cpx/wall?userId=test-user-1"
# → 503 if CPX_APP_ID unset (expected locally)
```

Update [13_learn_api_contract.md](./13_learn_api_contract.md) if response fields change.

---

## 9. Git workflow

- Branch from `main`, work in `web/` + `docs/`
- PR description: list new routes + sample `curl`
- Tag extension owner when contract is frozen for integration
- Do **not** merge extension changes in the same PR unless agreed

---

## 10. Questions?

| Topic | Doc |
|-------|-----|
| Learn API fields | [13_learn_api_contract.md](./13_learn_api_contract.md) |
| CPX / paid tasks | [09_cpx_postback_setup.md](./09_cpx_postback_setup.md) |
| Product modes | [03_implementation_plan.md](./03_implementation_plan.md) |
| Branding / points | [11_branding.md](./11_branding.md) |
