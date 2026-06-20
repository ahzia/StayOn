

> **StayOn implementation docs (updated for Mollie payout):** [20_ship_and_lifecycle_plan.md](./20_ship_and_lifecycle_plan.md) · [19_possiblities.md](./19_possiblities.md) · [18_supabase_implementation_roadmap.md](./18_supabase_implementation_roadmap.md) Phase 5

You wrote **Megaton**, but the site and pages are **MEGATHON** at `megathon.xyz`. Based on the current tracks page, your project **StayOn** can target multiple tracks, but you should be strategic. MEGATHON explicitly says tracks stack and teams can enter as many as fit. citeturn630473view0

## My recommended target tracks

### 1. **MEGATHON Startup Track — highest priority**

This is your strongest fit.

The Startup Track is open to any domain and judges the most commercially viable product of the weekend. It scores **Execution Power 35%**, **Product 25%**, **Business 15%**, **The Edge 15%**, and **Distribution Instinct 10%**. It also requires a live URL or working demo by Sunday. citeturn891475view0

StayOn fits very well because you already have:

- a working extension;
- real paid survey integration;
- real money earned;
- Supabase storage;
- a clear AI-native use case;
- a commercial wedge: monetize AI-agent waiting time;
- a distribution angle: developers using Cursor, Claude Code, Codex, etc.

**What to emphasize in the pitch:**

> “Most AI coding tools create idle moments. StayOn turns those moments into money, learning, and focus. We already shipped a working extension, connected real paid tasks, stored reward history, and earned actual money during the hackathon.”

This track has the biggest prize: **#1 €10K cash + €15K Codex tokens**, #2 €3K Codex tokens, #3 €2K Codex tokens. It also has a Mollie bounty for cleverest use of Mollie: **€20K free processing volume**, **€5K**, and **€2K**. citeturn891475view0

### 2. **Mollie bounty inside Startup Track — very high priority**

This is probably the easiest sponsor add-on that makes business sense.

The Startup Track requires teams to create a Mollie account, and there is an extra Mollie bounty for cleverest use of Mollie. citeturn891475view0 Mollie Connect supports platform/marketplace use cases, including onboarding customers, payment processing, split payments, application fees, routing funds, and payouts. citeturn128189search3

For StayOn, add a **Claim Rewards** flow:

1. User completes CPX/paid survey.
2. Reward is confirmed in StayOn wallet.
3. User reaches a payout threshold.
4. User clicks **Claim payout**.
5. StayOn uses Mollie as the payout/payment infrastructure.

For the demo, you can implement one of two levels:

**Fast demo version:**
- Add “Connect payout account with Mollie.”
- Add “Claim payout” button.
- Use Mollie sandbox/test payment or payment status flow.
- Show transaction record in Supabase.

**Stronger version:**
- Use Mollie Connect-style positioning: StayOn is a marketplace where task providers/sponsors fund rewards and users claim them.
- Show a wallet ledger and payout status: `pending`, `confirmed`, `claimable`, `paid`.

Do not overbuild cash-outs. Judges mostly need to see that you understand the payment rails and that Mollie is not bolted on. Frame it as:

> “CPX/partners create earning events. Supabase stores the ledger. Mollie handles the claim/payout layer.”

### 3. **Best Build-in-Public — easy extra target**

This is a special track and very winnable if you execute socially. It requires public commits and a posted journey by Sunday. The track rewards teams that share progress publicly and tag MEGATHON; the strongest online signal wins. citeturn891475view6

You should absolutely target this.

Post 4–6 updates:

1. “We built StayOn: earn while your AI coding agent thinks.”
2. Demo clip: Cursor/Claude waiting → StayOn opens → paid survey appears.
3. Proof clip: actual reward confirmed in your dashboard.
4. Architecture clip: extension + CPX + Supabase + Mollie payout layer.
5. User reaction/interview at the venue.
6. Final 45-second product demo.

This track is a good match because your idea is instantly understandable in a short video.

### 4. **Base44 — possible, but only if you add a separate Base44-facing app**

Base44’s track is “Prompt to Paid.” It requires a **live Base44 app by Sunday afternoon**, and judging heavily values real traction, users, payments, partnerships, and weekend execution. citeturn891475view1

Your current extension probably does **not** qualify unless you build something meaningful with Base44.

A realistic way to target it:

Build a **StayOn public dashboard / landing app in Base44**:

- user signup/waitlist;
- “how much money developers earned” leaderboard;
- public wallet preview;
- sponsor/task-provider interest form;
- demo analytics page;
- user testimonials;
- “install extension” CTA.

But Base44 judges also care about execution **in Base44** at 20%, so a thin landing page may not be enough. citeturn891475view1

I would only target Base44 if you can build a real user-facing web app there in a few hours.

### 5. **Best Build with Devin — target only if you can integrate Devin as part of the product**

The Devin track is not “use Devin to code faster.” It says Devin must act as an autonomous infrastructure layer, and there must be Devin commits in the repo history. citeturn891475view2

A valid StayOn angle:

> “StayOn uses Devin as an autonomous task-provider integration agent.”

Concrete feature:

- In StayOn admin dashboard, a task provider integration breaks or needs onboarding.
- StayOn triggers Devin to create/update a provider adapter.
- Devin opens PRs/commits to add new task sources or fix integration issues.
- Devin commits appear in your repo history.

This is cool, but probably too much unless you already have Devin API access and time.

I would mark this as **optional**.

### 6. **Vapi Voice Track — possible, but only with a real voice flow**

Vapi requires a live voice flow at the core of the demo. citeturn891475view4

Possible StayOn feature:

> “Voice payout and focus assistant.”

When the AI agent is working, StayOn asks by voice:

- “Do you want to earn, learn, or focus while Cursor is working?”
- User says: “Earn.”
- Voice agent opens a task.
- User later asks: “How much did I earn today?”
- Vapi answers from Supabase wallet data.
- User says: “Claim payout.”

This is a nice add-on, but it is probably not central enough unless the voice assistant becomes part of the main UX.

Target Vapi only if your team has someone free for a quick voice demo.

### 7. **Cala — possible if you add sponsor/task intelligence**

Cala’s track asks you to use Cala as a public-data layer with structured, sourced facts for real-world entities. It values depth of integration, replacing scraping/manual research, and product-data fit. citeturn891475view3

StayOn could use Cala for:

- sponsor discovery;
- company enrichment for sponsored tasks;
- matching developer-tool companies to users;
- showing sourced facts about companies offering tasks;
- building a “Sponsor Intelligence” dashboard.

Example feature:

> “StayOn uses Cala to enrich sponsored earning cards with structured company facts, replacing manual sponsor research.”

This is probably not your strongest track, but it can be added if Cala API integration is easy.

### 8. **Pixverse Creative Video — easy marketing side quest**

Pixverse Creative Video only requires a team video built in Pixverse and rewards the best creative AI video. citeturn929686view0

You should target this lightly. Create a fun video:

> Developer prompts Cursor → spinner appears → developer reaches for phone → StayOn slaps the phone away → money coins appear → “Stay on. Earn while AI thinks.”

This can also help Build-in-Public.

### 9. **Pixverse Creative Product — probably not worth targeting**

Pixverse Creative Product requires Pixverse to be in the core product workflow, not just a video. citeturn929686view1

StayOn is not naturally a video product. Skip unless you pivot a feature into “generate sponsor video ads during AI wait time,” which would distract from the main product.

### 10. **AnyBiz Live Company Auction — possible if you want to sell**

AnyBiz is for companies strong enough to be auctioned live, with real traction and buyer demand. citeturn891475view5

StayOn could be interesting because it already has:
- extension;
- monetization;
- real money proof;
- developer audience;
- AI-native timing wedge.

But only opt in if you are genuinely open to selling the project.

## Best multi-track strategy

Your best realistic stack is:

| Priority | Track | Why it fits | What to add |
|---:|---|---|---|
| 1 | **Startup Track** | Real product, real revenue, AI-native | Polish demo, metrics, business story |
| 2 | **Mollie bounty** | Payment/payout layer fits perfectly | Add claim rewards / payout flow |
| 3 | **Build-in-Public** | Easy to enter and can amplify traction | Post demos, metrics, commits |
| 4 | **Pixverse Creative Video** | Easy side quest | Make a funny product video |
| 5 | **Base44** | Possible if you build a public dashboard | Build Base44 landing/dashboard |
| 6 | **Vapi** | Nice if voice assistant is quick | Voice wallet/claim/focus assistant |
| 7 | **Cala** | Possible but less core | Sponsor/task intelligence |
| 8 | **Devin** | Only if Devin becomes infrastructure | Devin agent adds integrations |

## What I would change in the idea now

### 1. Reposition StayOn as a “developer earning wallet,” not just an extension

Right now it sounds like:

> “Extension that shows surveys while Cursor is waiting.”

Make it bigger:

> **StayOn is the reward layer for AI work. It detects idle moments in AI coding workflows, serves paid microtasks, tracks confirmed earnings, and lets users claim rewards.**

This makes the payment/payout track more natural.

### 2. Add a real wallet ledger in Supabase

You already have Supabase. Add these tables/features:

- `earnings_events`
- `provider_callbacks`
- `wallet_balance`
- `payout_requests`
- `payout_status`

Even if payout is not fully live, show:
- earned amount;
- pending amount;
- confirmed amount;
- claimable amount;
- payout requested;
- payout method: Mollie.

This will make the judges trust the money story.

### 3. Add Mollie as the “Claim Rewards” layer

The strongest sponsor integration is:

```text
CPX / survey provider confirms earning
↓
StayOn stores confirmed reward in Supabase
↓
User reaches threshold
↓
User clicks Claim
↓
Mollie handles payout/payment flow
↓
StayOn updates payout status
```

For hackathon, implement this with sandbox/test mode if needed. The business story still works.

### 4. Add a “Sponsor Mode” placeholder

This helps the business story:

- CPX is task supply now.
- Sponsored developer cards are next.
- Devtool companies can pay to reach developers during AI wait time.
- Users get a share of sponsor revenue.

You can show a basic sponsor admin page:
- create campaign;
- set budget;
- choose target: Cursor/Claude/Codex users;
- define reward per interaction.

This makes StayOn feel like a marketplace, not just a survey wrapper.

### 5. Add one non-survey task type

Even if CPX is the real money source, add one developer-native mock task:

> “Which AI-generated code answer is better?”

Reward it with points, not money.

This supports the future vision:

> Today: paid surveys.  
> Next: AI companies pay for developer feedback tasks.

## Best implementation plan from now

### Must do before demo

1. Polish extension flow.
2. Make the paid survey flow obvious.
3. Show proof of actual reward/money from provider.
4. Store sessions/rewards in Supabase.
5. Add dashboard with:
   - total wait sessions;
   - completed tasks;
   - earned amount;
   - pending/confirmed rewards.
6. Add “Claim rewards” button.
7. Add Mollie sandbox/test payment or payout status flow.
8. Prepare a clean 90-second demo.

### Should do if time remains

1. Build a Base44 public dashboard/landing page.
2. Add a Pixverse video.
3. Add a Vapi “ask wallet” voice assistant.
4. Post build-in-public updates.
5. Add “developer feedback task” mock.

## Best pitch structure

Use this:

**Problem**  
AI coding agents create frequent wait states. Developers use those moments badly: they check phones, lose focus, and waste time.

**Solution**  
StayOn turns AI wait time into earning time. When Cursor, Claude Code, or Codex is thinking, StayOn opens a short paid microtask, tracks the reward, and brings the user back when the AI is ready.

**What we built**  
A working browser/IDE extension, connected to a real paid task provider, with actual survey completion, real reward events, and Supabase-based wallet tracking.

**What we added for MEGATHON**  
A reward claim layer using Mollie, a wallet ledger, and a path to sponsor-funded developer microtasks.

**Business**  
StayOn earns from task provider revenue share, sponsored developer cards, and eventually developer-specific AI feedback tasks.

**Why now**  
AI agents are increasing wait-time inventory. Every coding agent has these idle moments. StayOn captures this new attention surface before it becomes a default ad slot owned by the tools themselves.

## My final recommendation

Target these tracks seriously:

1. **MEGATHON Startup Track**
2. **Mollie bounty**
3. **Build-in-Public**
4. **Pixverse Creative Video**

Target these only if time allows:

5. **Base44**
6. **Vapi**
7. **Cala**
8. **Devin**

The highest ROI change is **Mollie reward claiming**. It directly strengthens the Startup Track business score and gives you a sponsor-tech angle without changing the core product.