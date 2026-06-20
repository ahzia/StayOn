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

1. **VSIX file** (GitHub Release or AirDrop) — build: `cd extension && npm run compile && npx vsce package --no-dependencies`
2. The `/try` page (steps 1–5)

---

## Host checklist (you, before sharing)

### Backend live

- [ ] `web/` deployed to Vercel
- [ ] Env: CPX, Supabase, `STORAGE_BACKEND=supabase`, `NEXT_PUBLIC_APP_URL`
- [ ] CPX postback URL points to `https://YOUR_DOMAIN/api/cpx/postback?...`
- [ ] Test: `curl https://YOUR_DOMAIN/api/config` → `"storageBackend":"supabase"`
- [ ] Test: `curl https://YOUR_DOMAIN/api/stats/summary` → shows stats

### Extension package

- [ ] `extension/src/api/defaults.ts` → `BUNDLED_API_BASE_URL = 'https://stay-on-nu.vercel.app'` (or your domain)
- [ ] `npm run compile && npx vsce package --no-dependencies`
- [ ] Upload `stayon-0.1.0.vsix` to GitHub Release

### Demo proof ready

- [ ] You completed 1+ survey yourself — row in Supabase `reward_events`
- [ ] Your earnings page works: `/earnings?userId=YOUR-UUID`
- [ ] `/try` shows live **Confirmed surveys** count &gt; 0 after testers run

---

## Tester flow (5 minutes)

```
Install VSIX
  → StayOn: Install Hooks in Workspace
  → Trust hooks in Cursor Settings
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

---

## After hackathon (not now)

- Mollie claim payout ([19_possiblities.md](./19_possiblities.md))
- Auth + account linking
- Open VSX public listing
