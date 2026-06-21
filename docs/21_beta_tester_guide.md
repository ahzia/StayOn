# Beta tester guide

Short guide for **external testers** — not for repo developers (see [14_extension_dev_workflow.md](./14_extension_dev_workflow.md)).

Full ship plan: [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md) · MEGATHON: [19_02_possiblities_trucks.md](./19_02_possiblities_trucks.md)

---

## What you need

- **Cursor** with Agent + Hooks enabled
- **Windows or macOS** (use **v0.1.4** — Node hooks + Windows inbox fallback)
- **Node.js** on Windows if Set Up asks for it ([nodejs.org](https://nodejs.org))
- ~5 minutes for first-time setup

---

## 1. Install StayOn

1. Download **`stayon-0.1.4.vsix`** from the release link your host sent you.
2. In Cursor: **Extensions** → **`...`** menu → **Install from VSIX...**
3. Reload Cursor if prompted.
4. You should see **StayOn** in the activity bar.

---

## 2. One-time setup (required)

StayOn only opens when the **Cursor Agent** is working. That uses small project hooks.

1. **File → Open Folder** — open the project you code in (any folder).
2. **Cmd+Shift+P** (Ctrl+Shift+P on Windows) → **StayOn: Set Up**
3. Click **Set Up StayOn** — installs hooks and verifies the bridge (panel stays on “Waiting for agent…”).
4. Submit a **Cursor Agent** prompt — the panel should open automatically.

If setup fails, run **StayOn: Test Hook Bridge** and check hook log:

- macOS/Linux: `~/.stayon/hook.log`
- Windows: `%USERPROFILE%\.stayon\hook.log` (note the backslash before `.stayon`)

**Survey profile** (step 4 below) is optional for opening the panel — only needed for CPX paid surveys.

---

## 3. Connect to StayOn backend

The shipped VSIX should connect automatically. If the panel says *“Connect StayOn backend”*:

```json
{
  "stayon.apiBaseUrl": "https://stay-on-nu.vercel.app",
  "stayon.cpxSurveys": true
}
```

---

## 4. Survey profile (once)

1. Open **StayOn** panel → **Surveys**
2. **Set up survey profile** — use a **valid email** (no typos), real birthday, correct **country**
3. Wrong email/country often means **zero surveys** from CPX

Survey data is described on **/privacy** on the StayOn website.

---

## 5. Earn points

1. Pick **Surveys** at the bottom of the panel.
2. Submit a **Cursor Agent** prompt (e.g. “List files in src/”).
3. StayOn opens when the agent is busy.
4. Click **Open in browser** (most reliable for surveys).
5. Complete a survey in the browser.
6. Within ~30 seconds, survey points sync; **Survey earnings** line updates.
7. When the agent finishes, you’ll hear a **chime** and Cursor should try to come forward.

**Points vs money**

- **Total points** (header) includes Learn/Perks — not all are cash.
- **Survey earnings** (under balance) = confirmed CPX rewards (**1000 points = $1**).
- **Claim payout** (bank/PayPal) is **not available in this beta**.

---

## 6. Troubleshooting

| Problem | Try |
|---------|-----|
| Panel never opens on Agent | **StayOn: Set Up** again; check StayOn output for `bridge event: busy_start` |
| Hooks log fires but panel idle | Need **v0.1.4**. Check hook.log for `inbox event=` or `ok event=`. Reload after Set Up. |
| No surveys listed | **StayOn: Reset Survey Identity**; fix profile email; use external browser |
| Points not updating | Confirm backend live; wait 30s; **View earnings online** |
| Survey bounces in panel | Use **Open in browser** |

---

## 7. See your income

1. StayOn panel → **Wallet** tab → **View earnings online**
2. Or visit **https://stay-on-nu.vercel.app/earnings** and paste your user ID (shown in Wallet).

---

## 8. Privacy

Survey profile (email, DOB) is stored on the StayOn backend for CPX matching. See **/privacy** on the StayOn site.
