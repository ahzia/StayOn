# CPX Research postback setup

Step-by-step for CPX publisher dashboard after you create an account and app.

Related: [07_easier_option_for_servey.md](./07_easier_option_for_servey.md), [08_api_setup.md](./08_api_setup.md), [10_backend_web_app.md](./10_backend_web_app.md)

---

## Architecture

```
Cursor Agent busy
       ↓
StayOn extension panel
       ↓  GET /api/cpx/wall?userId=…
StayOn Next.js backend  ←── CPX postback (server-to-server)
       ↓  GET /api/wallet/:userId/pending
Extension syncs ⭐ tokens to local wallet
```

Secrets (`CPX_APP_ID`, `CPX_SECURE_HASH`) live **only** on the backend. The extension only knows `stayon.apiBaseUrl`.

---

## 1. Deploy or run the backend

```bash
cd web
cp .env.example .env.local
# Fill CPX_APP_ID and CPX_SECURE_HASH from publisher.cpx-research.com
npm install
npm run dev
```

For production, deploy `web/` to Vercel (or any Node host) and set the same env vars in the dashboard.

---

## 2. Main Postback URL (mandatory)

In CPX publisher dashboard → your app → **Postback Settings**, paste:

```
https://YOUR_DOMAIN/api/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}
```

Replace `YOUR_DOMAIN` with your deployed URL (e.g. `stayon.vercel.app`).

### Placeholders

| Placeholder | Meaning |
|-------------|---------|
| `{status}` | `1` = completed, `2` = canceled (fraud reversal, may arrive 15–60 days later) |
| `{trans_id}` | Unique transaction ID — we dedupe on this |
| `{user_id}` | StayOn `ext_user_id` (extension UUID) |
| `{subid_1}` | Wait session id (`wait-…`) |
| `{amount_usd}` | Publisher payout in USD |
| `{secure_hash}` | `md5({trans_id}-YOUR_CPX_SECURE_HASH)` |
| `{type}` | `complete`, `out` (screen out), `bonus` |

### Postback whitelist IPs

Only accept postbacks from:

- `188.40.3.73`
- `2a01:4f8:d0a:30ff::2`
- `157.90.97.92`

The backend enforces this in production. For local testing set `CPX_SKIP_IP_CHECK=true` in `.env.local`.

---

## 3. Expert postback settings (optional)

You can use the **same URL** for:

- Postback Url Screen Out
- Postback Bonus/Rating
- Postback Url Event Canceled

Our handler reads `{type}` and `{status}` to credit or reverse rewards.

---

## 4. Extension settings

In VS Code / Cursor settings:

```json
{
  "stayon.apiBaseUrl": "https://YOUR_DOMAIN",
  "stayon.cpxSurveys": true
}
```

Each user gets a stable UUID stored in extension global state — this is sent to CPX as `ext_user_id`.

---

## 5. Test checklist

1. Backend health: open `https://YOUR_DOMAIN/setup`
2. CPX wall: `GET /api/cpx/wall?userId=test-user-123` (requires env vars)
3. Trigger agent busy → CPX iframe appears in StayOn panel
4. Complete or screen out of a survey
5. Check backend logs / `.data/ledger.json` for the postback entry
6. Within ~30s extension polls and adds tokens

### Simulate postback locally

```bash
TRANS_ID=test-001
HASH=$(echo -n "${TRANS_ID}-YOUR_CPX_SECURE_HASH" | md5)
curl "http://localhost:3000/api/cpx/postback?status=1&trans_id=${TRANS_ID}&user_id=YOUR_EXTENSION_USER_ID&amount_usd=0.50&hash=${HASH}&type=complete"
```

Then poll:

```bash
curl "http://localhost:3000/api/wallet/YOUR_EXTENSION_USER_ID/pending"
```

---

## Token conversion

Credits use **`amount_local`** from the CPX postback (Points shown to the user in the survey wall). CPX already applies your publisher commission via the **currency factor** in the CPX dashboard (e.g. **700** = user gets 700 Points per $1 CPX pays you).

| Setting | Env var | Default |
|---------|---------|---------|
| Currency factor | `CPX_CURRENCY_FACTOR` | `700` |
| Base rate | — | **1000 Points = $1** user-facing value |

Fallback when `amount_local` is missing: `round(amount_usd × CPX_CURRENCY_FACTOR)`.

Cash estimates in the app and on `/earnings`: **`points ÷ 1000` USD**.

`CPX_USER_SHARE` is legacy and **not** applied to credits (avoid double commission).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Forbidden IP | Deploy behind proxy that forwards `x-forwarded-for`; or test with `CPX_SKIP_IP_CHECK=true` |
| 401 Invalid hash | `CPX_SECURE_HASH` must match publisher dashboard exactly |
| No iframe in panel | Set `stayon.apiBaseUrl`; run backend with `CPX_APP_ID` set |
| Postback received, no tokens | Check `amount_usd`; extension polls every 30s |
