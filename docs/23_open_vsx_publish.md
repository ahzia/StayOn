# Publish StayOn to Open VSX (Cursor marketplace)

Cursor installs extensions from [Open VSX](https://open-vsx.org), not the Microsoft Marketplace.

---

## One-time setup (you, ~15 min)

### 1. Create Open VSX account

1. Go to [open-vsx.org](https://open-vsx.org) → sign in (GitHub recommended).
2. Note your login — you’ll create a **namespace** matching `publisher` in `extension/package.json` (`stayon`).

### 2. Create a Personal Access Token

1. Open VSX profile → **Access Tokens** → generate token.
2. Save as `OVSX_PAT` (do not commit).

### 3. Create publisher namespace (once)

```bash
cd extension
npx ovsx create-namespace stayon -p "$OVSX_PAT"
```

If namespace already exists under your account, skip.

---

## Publish each release

```bash
cd extension
npm install
npm run publish:ovsx
```

Or manually:

```bash
npm run compile
npm run package
npx ovsx publish stayon-0.1.5.vsix -p "$OVSX_PAT"
```

### Verify

1. Open [open-vsx.org/extension/stayon/stayon](https://open-vsx.org/extension/stayon/stayon)
2. In Cursor: Extensions → search **StayOn** → Install
3. Reload → **StayOn: Set Up** → Agent prompt

---

## Requirements checklist (in repo)

| Item | Location |
|------|----------|
| MIT `LICENSE` | `extension/LICENSE` |
| Marketplace README | `extension/README.md` |
| `publisher`: `stayon` | `extension/package.json` |
| Compiled `dist/` | `npm run compile` before publish |
| Bundled API URL | `extension/src/api/defaults.ts` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Namespace not found` | Run `ovsx create-namespace stayon` |
| `401 Unauthorized` | Regenerate `OVSX_PAT` |
| `Extension already published` | Bump `version` in `package.json`, repackage |
| Cursor doesn’t show extension | Wait ~5 min; search exact id `stayon.stayon` |

---

## What you need to give the agent (optional)

If someone else runs publish for you, provide **only**:

- `OVSX_PAT` (secret — use env var, never commit)
- Confirm namespace `stayon` is created under your account

Do **not** share GitHub or Open VSX passwords in chat logs.

---

## After publish

Update `/try` and beta guide with:

> Install from Cursor Extensions → search **StayOn**

Keep VSIX on GitHub Releases as fallback for offline installs.
