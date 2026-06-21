# MEGATHON: share StayOn in 30 minutes

**Goal:** Other people install StayOn, complete surveys, and **see real earnings** on the web. Claim/payout (Mollie) comes **after** this works.

Related: [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md) · [21_beta_tester_guide.md](./21_beta_tester_guide.md)

---

## Priority order (hackathon)

| # | What | Why |
|---|------|-----|
| 1 | **Deployed backend** (Vercel + Supabase + CPX postback) | Postbacks + ledger must be public |
| 2 | **VSIX** with bundled API URL | Testers skip manual config |
| 3 | **Hook installer** command | Biggest friction removed |
| 4 | **Earnings page** `/earnings?userId=` | Proof of income per user |
| 5 | **Try page** `/try` + live stats | Onboarding + judge metrics |
| 6 | Claim payout (Mollie) | After you have 3+ real survey completes |

---

## What you ship to testers

Send them **one link**:

```
https://stay-on-nu.vercel.app/try
```

They need:

1. **VSIX file** (GitHub Release or AirDrop) — build: `cd extension && npm install && npm run compile && npm run package`
2. The `/try` page (steps 1–5)

---

## Host checklist (you, before sharing)

### Backend live

- [ ] `web/` deployed to Vercel (**redeploy after adding `/try`** — old deploys 404)
- [ ] Vercel project **Root Directory** = `web` (Project Settings → General)
- [ ] Env: CPX, Supabase, `STORAGE_BACKEND=supabase`, `NEXT_PUBLIC_APP_URL`
- [ ] CPX postback URL points to `https://YOUR_DOMAIN/api/cpx/postback?...`
- [ ] Test: `curl https://YOUR_DOMAIN/api/config` → `"storageBackend":"supabase"`
- [ ] Test: `curl https://YOUR_DOMAIN/api/stats/summary` → shows stats

### Extension package

- [ ] `BUNDLED_API_BASE_URL` in `extension/src/api/defaults.ts` → production URL
- [ ] `cd extension && npm run compile && npm run package` → `stayon-0.1.5.vsix`
- [ ] GitHub Release with VSIX attached
- [ ] Open VSX: `npm run publish:ovsx` ([23_open_vsx_publish.md](./23_open_vsx_publish.md))
- [ ] Vercel env: `CPX_CURRENCY_FACTOR=700`

### Demo proof ready

- [ ] You completed 1+ survey yourself — row in Supabase `reward_events`
- [ ] Your earnings page works: `/earnings?userId=YOUR-UUID`
- [ ] `/try` shows live **Confirmed surveys** count &gt; 0 after testers run

---

## Tester flow (5 minutes)

```
Install (Open VSX or VSIX)
  → StayOn: Set Up
  → Survey profile in panel
  → Agent prompt
  → Open in browser → complete survey
  → Wallet → View earnings online
```

---

## Show judges “real usage”

### Per-user proof

- **Wallet tab** in extension (points + user ID)
- **Earnings page**: `https://stay-on-nu.vercel.app/earnings?userId=<uuid>`
- Supabase Table Editor → `reward_events` (timestamp, points, status)

### Aggregate proof

- **Try page** live stats: testers, confirmed surveys, total points
- **API**: `GET /api/stats/summary`
- Build-in-Public clip: before/after balance on earnings page

### Pitch one-liner

> “Developers already earned real survey rewards during MEGATHON — here’s the live ledger and per-user earnings page. Claim via Mollie is next.”

---

## Troubleshooting at the venue

| Issue | Fix |
|-------|-----|
| Panel never opens | Install hooks + trust |
| No surveys | Reset survey identity; fix email; external browser |
| Points not updating | Check Vercel logs; CPX postback URL |
| Earnings page empty | Wait 30s; confirm `userId` matches Wallet tab |
| 0 on /try stats | Supabase env on Vercel wrong |
| **`/try` returns 404** | Redeploy `web/` — routes exist locally but production is stale. Push to git (if Vercel auto-deploy) or run `cd web && npx vercel --prod` after `vercel login` |

---

## After hackathon (not now)

- Mollie claim payout ([19_possiblities.md](./19_possiblities.md))
- Auth + account linking
- Final extension polish if needed (prefer web-only changes until then)
