# Beta tester guide

Short guide for **external testers** — not for repo developers (see [14_extension_dev_workflow.md](./14_extension_dev_workflow.md)).

Full ship plan: [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md) · MEGATHON: [19_02_possiblities_trucks.md](./19_02_possiblities_trucks.md)

---

## What you need

- **Cursor** with Agent + Hooks enabled
- **macOS** recommended (agent-ready chime/focus tested there)
- ~15 minutes for first-time setup

---

## 1. Install StayOn

1. Download **`stayon-0.1.0.vsix`** from the release link your host sent you.
2. In Cursor: **Extensions** → **`...`** menu → **Install from VSIX...**
3. Reload Cursor if prompted.
4. You should see **StayOn** in the activity bar.

---

## 2. Enable hooks (required)

StayOn only opens when the **Cursor Agent** is working. That uses project hooks.

**Option A — StayOn repo (easiest if you have the repo)**

The project already contains `.cursor/hooks.json` and `.cursor/hooks/stayon-event.sh`.

```bash
chmod +x .cursor/hooks/stayon-event.sh
```

**Option B — Your own project**

Copy from the StayOn repo into **your project root**:

- `.cursor/hooks.json`
- `.cursor/hooks/stayon-event.sh`

Then:

```bash
chmod +x .cursor/hooks/stayon-event.sh
```

**Trust hooks in Cursor**

1. **Cursor Settings → Hooks**
2. **Trust** the StayOn hook entries
3. Run command: **StayOn: Verify Hook Setup** — should report OK

---

## 3. Connect to StayOn backend

If the panel says *“Connect StayOn backend”*:

1. **Cmd + ,** → search **StayOn**
2. Set **Api Base Url** to the URL your host gave you (e.g. `https://stay-on-nu.vercel.app`)
3. Enable **Cpx Surveys**

Or in `settings.json`:

```json
{
  "stayon.apiBaseUrl": "https://YOUR_STAYON_BACKEND",
  "stayon.cpxSurveys": true
}
```

---

## 4. Survey profile (once)

1. Open **StayOn** panel → **Surveys**
2. **Set up survey profile** — use a **valid email** (no typos), real birthday, correct **country**
3. Wrong email/country often means **zero surveys** from CPX

---

## 5. Earn points

1. Pick **Surveys** at the bottom of the panel.
2. Submit a **Cursor Agent** prompt (e.g. “List files in src/”).
3. StayOn opens when the agent is busy.
4. Click **Open in browser** (most reliable for surveys).
5. Complete a survey in the browser.
6. Within ~30 seconds, your **⭐ balance** should increase.
7. When the agent finishes, you’ll hear a **chime** and Cursor should come forward.

**Learn** and **Perks** give small engagement points — they are **not** cash-redeemable in the current beta.

---

## 6. Troubleshooting

| Problem | Try |
|---------|-----|
| Panel never opens on Agent | Trust hooks; run **StayOn: Verify Hook Setup**; check **StayOn: Show Debug Output** |
| No surveys listed | **StayOn: Reset Survey Identity**; fix profile email; use external browser |
| Points not updating | Confirm `stayon.apiBaseUrl`; wait 30s; check output channel |
| Survey bounces in panel | Use **Open in browser** instead of in-panel list |

---

## 7. See your income

1. StayOn panel → **Wallet** tab → **View earnings online** (opens your personal page).
2. Or visit **https://stay-on-nu.vercel.app/earnings** and paste your user ID (shown in Wallet).

Survey earnings are stored on the server. **Claim payout** comes in a later release.

Full hackathon steps: [22_hackathon_share_guide.md](./22_hackathon_share_guide.md)

---

## 8. Privacy

Survey profile (email, DOB) is stored on the StayOn backend for CPX survey matching. See your host’s privacy policy when published.
