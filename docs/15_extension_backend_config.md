# Extension ↔ backend configuration

How `stayon.apiBaseUrl` works today and how users get it automatically after release.

Related: [09_cpx_postback_setup.md](./09_cpx_postback_setup.md), [14_extension_dev_workflow.md](./14_extension_dev_workflow.md)

---

## Two different URLs (do not confuse)

| URL | What it is |
|-----|------------|
| [publisher.cpx-research.com](https://publisher.cpx-research.com/) | **CPX publisher dashboard** — get `CPX_APP_ID`, postback settings, earnings |
| **Your StayOn `web/` deploy** | **StayOn backend** — e.g. `https://stayon.vercel.app` or `http://localhost:3000` |

Extension setting **`stayon.apiBaseUrl`** must point to **StayOn backend**, never to CPX.

CPX postback URL (in CPX dashboard) must be:

```
https://YOUR_STAYON_DOMAIN/api/cpx/postback?status={status}&…
```

---

## Set config manually (development)

### Option A — Cursor Settings UI

1. **Cmd + ,** (Settings)
2. Search **StayOn**
3. Set **Api Base Url** → `http://localhost:3000` (local) or your deployed URL
4. Enable **Cpx Surveys**

### Option B — `settings.json`

**User settings** (all projects):  
`~/Library/Application Support/Cursor/User/settings.json`

**Workspace** (this repo only):  
`.vscode/settings.json` (already includes local defaults):

```json
{
  "stayon.apiBaseUrl": "http://localhost:3000",
  "stayon.cpxSurveys": true
}
```

Use the **Extension Development Host** window (`.worktrees/ext-dev`) or copy the same into User settings there once.

### Option C — Command Palette

`Preferences: Open User Settings (JSON)` → paste the JSON above.

---

## Local dev checklist

1. Backend running:

```bash
cd web && npm run dev
# → http://localhost:3000
```

2. `web/.env.local` has `CPX_APP_ID` and `CPX_SECURE_HASH`

3. Extension settings (workspace or user):

```json
{
  "stayon.apiBaseUrl": "http://localhost:3000",
  "stayon.cpxSurveys": true
}
```

4. Recompile + F5 extension, run Agent in EH window

5. Test backend:

```bash
curl -s "http://localhost:3000/api/cpx/wall?userId=test-123"
curl -s "http://localhost:3000/api/config"
```

---

## Automatic config for end users (long term)

Users should **not** paste URLs manually after install. Use this priority:

```
1. User override     stayon.apiBaseUrl in settings (optional power users)
2. Package default   extension/package.json → configuration.default
3. Bundled constant  extension/src/api/defaults.ts → BUNDLED_API_BASE_URL
4. (Future)          GET /api/config on known domain at first run
```

### When you deploy `web/` to production

1. Set env on host (Vercel example):

```
NEXT_PUBLIC_APP_URL=https://stayon.vercel.app
CPX_APP_ID=…
CPX_SECURE_HASH=…
```

2. Update **one** of these before publishing VSIX:

**`extension/package.json`**

```json
"stayon.apiBaseUrl": {
  "type": "string",
  "default": "https://stayon.vercel.app",
  …
}
```

**and/or `extension/src/api/defaults.ts`**

```typescript
export const BUNDLED_API_BASE_URL = 'https://stayon.vercel.app';
```

3. CPX dashboard postback → `https://stayon.vercel.app/api/cpx/postback?…`

4. Ship VSIX / marketplace — users get CPX automatically with zero setup.

### Public config endpoint

`GET /api/config` returns:

```json
{
  "ok": true,
  "apiBaseUrl": "https://stayon.vercel.app",
  "cpxSurveys": true,
  "learnEnabled": true
}
```

Extension can fetch this in a future version for remote config without a new VSIX.

---

## Verify extension sees the URL

**StayOn: Show Debug Output** after agent busy — look for:

```
CPX SurveyWall loaded
```

or

```
CPX wall unavailable: …
```

If `stayon.apiBaseUrl` is empty, Earn mode uses local quiz tasks only (no CPX iframe).
