# Product Overview: StayOn

## 1. Product Summary

**StayOn** is a productivity and earning layer for AI-powered coding workflows.

When developers use AI coding agents such as **OpenAI Codex**, **Claude Code**, or **Cursor**, there are natural waiting moments while the agent thinks, writes code, runs commands, reviews files, or prepares changes. These waiting moments often cause users to lose focus, check their phone, open social media, or leave the coding flow.

StayOn turns those waiting moments into useful micro-moments.

Instead of staring at a spinner, the developer can:

* earn small rewards from paid microtasks, surveys, or sponsored developer cards;
* answer short technical questions;
* review AI-generated code comparisons;
* complete small learning activities;
* write a “return-to-context” note;
* collect points, streaks, and rewards.

The long-term vision is to become the **monetization and engagement layer for AI-agent idle time**.

## 2. Core Problem

AI coding agents are becoming more powerful, but they introduce a new workflow pattern:

> Prompt → wait → review → prompt again → wait again.

These wait times are short, but frequent. They are usually not long enough to start a serious new task, but long enough to break attention.

The common user behavior is:

1. Developer sends prompt to AI coding agent.
2. AI starts thinking or generating.
3. Developer checks phone or opens another tab.
4. Developer gets distracted.
5. Developer returns later and loses context.
6. The productivity benefit of the AI agent is partially lost.

StayOn solves this by keeping the user on the laptop and giving them a useful action during the wait.

## 3. Core Insight

AI-agent waiting time is becoming a new form of digital attention inventory.

This waiting time has three valuable properties:

1. **It is predictable** — it happens every time an AI agent works.
2. **It is high-intent** — the user is a developer or builder actively working.
3. **It is underused** — most products show a spinner, random status text, or empty loading state.

StayOn captures this moment and turns it into:

* paid microtask inventory;
* sponsored developer attention;
* learning progress;
* focus protection;
* gamified productivity.

## 4. Product Vision

The future version of StayOn is not only an ad slot.

It becomes a full **AI wait-time operating layer** across coding agents.

The product eventually supports:

* OpenAI Codex
* Claude Code
* Cursor
* GitHub Copilot
* Windsurf
* VS Code-based editors
* terminal coding agents
* browser-based AI builders
* desktop AI agents

The user installs StayOn once and chooses what they want to do during AI wait time:

1. **Earn Mode**
   Complete paid surveys, sponsored actions, AI feedback tasks, or developer-relevant offers.

2. **Learn Mode**
   Answer short coding, language, or interview-prep questions.

3. **Focus Mode**
   Stay in flow with breathing, next-step notes, context reminders, and anti-distraction prompts.

4. **Codebase Mode**
   Learn facts about the current codebase, architecture, files, dependencies, or team conventions.

5. **Team Mode**
   Companies use the product to improve developer focus, deliver internal training, and reward productive AI usage.

## 5. Hackathon Demo Version

The hackathon demo should focus on a simple, clear story:

> “When your AI coding agent is thinking, StayOn gives you a tiny paid task. You earn points or real rewards, then return to your coding task when the AI is ready.”

### Demo Flow

1. User is coding in a VS Code-like environment.
2. User sends a prompt to Claude Code, Codex, or a simulated AI coding agent.
3. StayOn detects the agent is thinking.
4. A small side panel or overlay opens.
5. The user sees one of the following:

   * a paid survey/offer from a reward API;
   * a sponsored developer card;
   * a micro AI-feedback task;
   * a coding quiz with points.
6. The user completes or interacts with the task.
7. StayOn credits the user with coins, points, or estimated money.
8. The AI response is ready.
9. StayOn reminds the user what they were doing and sends them back to the code.

### Example Demo Moment

User asks Codex:

> “Refactor this React component and add tests.”

StayOn appears:

> “Codex is working. Earn while you wait.”

Task shown:

> “Quick paid task: answer a 45-second product question.”
> Reward: 12 coins / estimated €0.03.

After the AI finishes:

> “Codex is ready. Return to: review refactor and run tests.”

This creates a strong pitch moment because the audience immediately understands the behavior.

## 6. First Implementation Recommendation

The easiest first implementation is:

> **VS Code extension + Claude Code first, then OpenAI Codex, then Cursor.**

### Why Claude Code First

Claude Code is the easiest first target because it is heavily used in terminal and VS Code workflows, and it exposes extension points such as lifecycle hooks and status-line customization. This makes it easier to detect when the agent is active and display something during that moment.

For a hackathon, Claude Code gives the clearest path to a working demo because:

* developers already use it for long-running coding tasks;
* it has visible “thinking” moments;
* it can be used inside terminal and VS Code;
* there are known ways to add status-line or lifecycle-based behavior;
* direct competitors are already proving this surface works.

### Why OpenAI Codex Second

OpenAI Codex should be the second target because it is strategically important and highly relevant to the pitch.

Codex supports CLI, app, and IDE experiences. The Codex IDE extension works in VS Code-compatible editors, and OpenAI documents Codex hooks, IDE integration, and app-server concepts. That means Codex is a strong future platform for deeper integration.

For the demo, Codex can be supported in one of two ways:

1. **Simple version:** show StayOn as a VS Code side panel while Codex is working.
2. **Future version:** use Codex lifecycle hooks or streamed agent events to trigger earning cards more precisely.

### Why Cursor Later

Cursor is extremely important commercially, but it is not the easiest first integration.

Cursor is a full AI-native editor, and although it is VS Code-based and supports agent workflows, deeper integration may be more sensitive because Cursor controls more of the user experience. For a hackathon, it is safer to say:

> “StayOn works first in VS Code with Claude Code and Codex, then expands to Cursor through VS Code-compatible extension support, Codex-in-Cursor support, or a desktop overlay.”

Cursor can be part of the vision, but not the first dependency.

## 7. Practical Hackathon Scope

The hackathon MVP should not try to build everything.

The best scope is:

### Must-Have

* A small VS Code extension or web-based IDE demo.
* A simulated AI-agent loading state.
* A side panel/overlay that appears during waiting.
* One real rewarded task integration or sponsored card.
* A points/reward balance.
* A return-to-context reminder.

### Should-Have

* User can choose Earn, Learn, or Focus mode.
* Basic streaks and coins.
* Simple dashboard:

  * wait sessions completed;
  * coins earned;
  * estimated money;
  * distractions avoided;
  * learning cards completed.

### Nice-to-Have

* Claude Code status-line support.
* Codex panel support.
* Cursor-compatible mode.
* Real survey/offer API.
* Sponsor/admin dashboard.
* Team reward pool.

## 8. Money-Making Mechanism

StayOn can monetize through multiple channels.

### 1. Rewarded Survey and Offer APIs

This is the most realistic short-term way to show real earning.

StayOn can integrate with rewarded survey/offer providers. The user completes a short survey or offer, the provider pays StayOn, and StayOn shares part of the revenue with the user.

This is the easiest way to have real money flow without building your own advertiser marketplace.

### 2. Sponsored Developer Cards

This is the competitor model.

A relevant developer-tool company pays to show a small sponsored message during AI wait time.

Example:

> “Linear — issue tracking built for fast teams.”
> “Sentry — fix production bugs faster.”
> “Vercel — deploy frontend apps instantly.”

The developer gets a share of the impression or click revenue.

### 3. Developer-Specific Microtasks

This is the strongest future differentiation.

Instead of generic surveys, StayOn can offer developer-relevant paid tasks:

* compare two AI-generated code answers;
* rate whether an AI fix is correct;
* classify a bug report;
* check whether a code explanation is understandable;
* label a code snippet by category;
* evaluate documentation quality;
* review a short test case;
* validate whether an AI-generated answer followed the prompt.

These tasks are more valuable than normal surveys because developers are a specialized audience.

### 4. Learning Sponsorships

Companies, bootcamps, or developer-tool brands can sponsor learning cards.

Example:

> “Answer 3 Kubernetes questions and earn 20 coins.”

This combines earning, education, and advertising.

### 5. Team Plans

In the future, companies can use StayOn internally.

Instead of individual ad earnings, the company may choose:

* team reward pools;
* learning budgets;
* internal knowledge quizzes;
* security training;
* onboarding questions;
* productivity analytics.

## 9. Why This Is Different From Existing Competitors

Most direct competitors focus on one idea:

> “Show ads while the AI is thinking and share revenue.”

StayOn is broader.

It is not just an ad slot. It is a wait-time productivity and earning platform.

### Competitor Difference

| Competitor Type         | What They Do                                  | StayOn Difference                                                             |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Spinner ad tools        | Show sponsored text while Claude/Codex thinks | StayOn adds microtasks, learning, focus, codebase knowledge, and reward modes |
| Passive ad extensions   | Show developer ads in IDE/browser             | StayOn is triggered by AI-agent wait states, not general browsing             |
| Survey/offerwall apps   | Give users paid surveys                       | StayOn embeds tasks into AI coding workflows                                  |
| Productivity break apps | Encourage breaks or focus                     | StayOn adds monetization and developer-specific context                       |
| Learning apps           | Teach through flashcards                      | StayOn uses natural AI wait time as the learning trigger                      |

## 10. Competitive Advantage

StayOn can win by combining five things:

1. **Contextual timing**
   It appears only when the user is already waiting.

2. **Developer-specific audience**
   Developers are valuable for AI feedback, devtool ads, and technical research.

3. **Multiple reward types**
   Money, coins, API credits, subscriptions, learning points, or team rewards.

4. **Better user trust**
   StayOn should be privacy-first and avoid reading source code unless the user explicitly enables codebase learning mode.

5. **Productive earning, not random ads**
   The product should feel useful, not spammy.

## 11. Differentiation Strategy

The product should not be positioned as:

> “We put ads in your coding spinner.”

That is too easy to copy and already exists.

The stronger positioning is:

> “StayOn turns AI-agent waiting time into productive earning moments for developers.”

The difference is that StayOn supports:

* paid tasks;
* developer microtasks;
* learning;
* focus;
* codebase education;
* team rewards;
* productivity analytics.

The user can choose how they want to use wait time.

## 12. User Modes

### Earn Mode

For users who want real rewards.

Tasks:

* paid surveys;
* sponsored cards;
* AI code evaluation;
* devtool feedback;
* research questions;
* product testing;
* short preference tasks.

Rewards:

* cash;
* points;
* gift cards;
* API credits;
* Cursor/Codex/Claude subscription credits;
* charity donations.

### Learn Mode

For users who want growth.

Tasks:

* TypeScript flashcards;
* React questions;
* system design questions;
* German vocabulary;
* interview prep;
* codebase facts;
* security tips.

Rewards:

* XP;
* streaks;
* skill badges;
* unlockable learning paths.

### Focus Mode

For users who want fewer distractions.

Tasks:

* “What are you waiting for?”
* “What will you check after the AI responds?”
* 30-second breathing reset.
* hand/neck stretch prompt;
* anti-phone reminder;
* next-action note.

Rewards:

* focus streak;
* deep-work score;
* distractions avoided.

### Codebase Mode

For professional developers and teams.

Tasks:

* “Which folder handles authentication?”
* “What command runs tests?”
* “What is the difference between service A and service B?”
* “Which file owns the checkout flow?”

This is useful for onboarding, learning unfamiliar repos, and reducing context loss.

## 13. Target Customers

### Primary Users

* AI coding tool users
* developers using Claude Code, Codex, Cursor, Copilot, Windsurf
* hackathon builders
* indie hackers
* students
* software engineers
* AI power users

### Paying Customers

* advertisers targeting developers;
* survey and research companies;
* AI labs needing feedback;
* developer-tool startups;
* bootcamps;
* engineering teams;
* companies using AI coding agents internally.

## 14. Business Model

StayOn can have multiple revenue streams.

### Revenue Stream 1: Revenue Share From Tasks

StayOn receives payment from task providers and shares a percentage with users.

Example:

* task provider pays €0.10;
* user receives €0.05;
* StayOn keeps €0.05.

### Revenue Stream 2: Sponsored Developer Ads

Advertisers pay for impressions or clicks during AI wait moments.

Example:

* developer tool company pays for 1,000 wait-time impressions;
* StayOn shares revenue with developers.

### Revenue Stream 3: Premium User Plan

Users pay for advanced focus, analytics, and learning features.

Example:

* free plan includes basic earning;
* pro plan includes advanced dashboards, better learning packs, and codebase mode.

### Revenue Stream 4: Team Plan

Companies pay per seat to turn AI wait time into internal training, focus improvement, and rewards.

Example:

* €5–€15 per developer/month;
* company controls whether users see sponsored content, internal learning cards, or team tasks.

### Revenue Stream 5: Learning Marketplace

Creators publish microlearning packs. StayOn takes a commission.

Examples:

* React interview prep;
* TypeScript mastery;
* German for developers;
* security basics;
* AI coding best practices.

## 15. Trust and Privacy Principles

Trust is critical because developers are sensitive about source code, prompts, API keys, and company IP.

StayOn should follow these principles:

1. **No source-code reading by default.**
2. **No prompt reading by default.**
3. **No completions reading by default.**
4. **Clear labels for sponsored content.**
5. **User can disable earning mode at any time.**
6. **Separate ads/tasks from code output.**
7. **Transparent reward ledger.**
8. **Team/admin controls for company environments.**
9. **Codebase Mode must be explicitly enabled.**
10. **Open-source local client or auditable privacy layer in the future.**

## 16. MVP Positioning

For the hackathon, the pitch should be:

> “AI coding agents save time, but their wait states create distraction loops. StayOn turns those moments into small earning opportunities, learning progress, and focus recovery. Starting with Claude Code and Codex, we help developers earn rewards while staying in flow.”

## 17. Demo Positioning

The demo should show one clear moment:

> The AI is thinking. Instead of checking your phone, you earn.

Demo script:

1. “I ask Codex to refactor a component.”
2. “Codex starts working.”
3. “StayOn detects the wait state.”
4. “A small earning card appears.”
5. “I complete a quick task and earn coins.”
6. “Codex finishes.”
7. “StayOn reminds me what I was doing.”
8. “I return to the code without losing focus.”

## 18. Future Roadmap

### Phase 1: Hackathon MVP

* VS Code/web demo.
* Claude Code or simulated Codex wait state.
* Earn overlay.
* BitLabs/CPX-style survey or mock sponsored card.
* Points wallet.
* Return-to-context note.

### Phase 2: Real Extension

* Claude Code support.
* Codex support.
* Basic Cursor compatibility.
* Reward wallet.
* Postback/reward verification.
* Sponsored card marketplace.

### Phase 3: Developer Microtask Network

* AI code answer comparison.
* Bug classification.
* Documentation validation.
* Prompt-following evaluation.
* Code explanation rating.
* Devtool feedback tasks.

### Phase 4: Team and Enterprise

* Company-controlled task inventory.
* Internal training cards.
* Team reward pools.
* Security/onboarding quizzes.
* Privacy controls.
* Admin dashboard.

### Phase 5: Full AI Wait-Time Platform

* Works across IDEs, terminals, browsers, and desktop agents.
* Supports all major AI coding agents.
* Connects developers, advertisers, AI labs, and task providers.
* Turns AI wait time into a new earning and learning economy.

## 19. Final Product Statement

StayOn is the earning and productivity layer for AI coding agents.

It transforms AI wait time from a distraction risk into a useful moment where developers can earn small rewards, learn, stay focused, and return to their code with context intact.

In the short term, it integrates with Claude Code and Codex to show paid tasks or sponsored cards during AI thinking time. In the long term, it becomes the platform where AI-agent idle time is monetized through developer-relevant microtasks, learning, and team productivity workflows.
