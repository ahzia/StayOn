For **24-hour implementation + demoable real paid tasks**, the most realistic option is:

# **Use CPX Research first**

Not BitLabs first.

BitLabs is stronger long-term, especially for custom APIs, but their docs say you need a Dashboard account, placement/app token, and workspace verification before receiving demand. That adds approval risk. ([BitLabs][1])

**CPX Research is more realistic for a hackathon** because it has a very simple web integration: script tag, iframe, and API options. Their docs literally show how to embed the survey wall with an `app_id`, `ext_user_id`, optional `secure_hash`, and postback settings. ([cpx-research.com][2])

## Best recommendation

Use:

> **CPX Research SurveyWall iframe/script integration inside StayOn overlay**

Then later add:

> **BitLabs Survey API as the cleaner production provider**

## Why CPX is the easiest

CPX gives you multiple integration options:

| Option                |     Hackathon fit | Why                             |
| --------------------- | ----------------: | ------------------------------- |
| **Script tag widget** |         Very high | Fastest to embed in web overlay |
| **Iframe SurveyWall** |         Very high | Simple URL-based integration    |
| **Survey API**        |       Medium/high | More custom UI, but more work   |
| SDKs                  | Low for your case | Better for mobile apps          |

Their docs recommend the script tag for web, and the setup is basically adding their JS library plus configuration and a div where surveys appear. ([cpx-research.com][2])

For StayOn, that means your first version can be:

```text
Claude Code / Codex wait starts
↓
StayOn overlay opens
↓
CPX SurveyWall loads inside overlay
↓
User starts/completes survey
↓
CPX postback hits StayOn backend
↓
StayOn wallet updates coins / estimated money
```

## What makes it “real money”

CPX supports postback/server-to-server communication. Their docs say you should fill out your postback URL in the publisher settings so they can inform you about the amount of money earned. ([cpx-research.com][2])

So the real-money proof is:

1. You create a CPX publisher account.
2. You create an app/project.
3. You get an `app_id`.
4. You embed CPX SurveyWall in StayOn.
5. You set StayOn’s backend callback URL as the CPX postback URL.
6. A completed survey triggers a transaction/postback.
7. StayOn credits the user wallet.

You may not receive cash in your bank account within 24 hours, but you can potentially show **real provider inventory, real survey interaction, real transaction/postback, and real dashboard earnings**.

That is enough for a strong hackathon demo.

## Minimum implementation

### 1. Sign up as CPX publisher

Use CPX as a publisher/business project, not as an end survey user. Their publisher signup page says it is for business owners, not survey participants. ([publisher.cpx-research.com][3])

### 2. Create a StayOn app/project

You need:

```text
app_id
secure_hash / secret
postback URL
```

### 3. Embed CPX in StayOn overlay

Simplest iframe version:

```html
<iframe
  width="100%"
  height="600"
  frameborder="0"
  src="https://offers.cpx-research.com/index.php?app_id=YOUR_APP_ID&ext_user_id=USER_ID&secure_hash=SECURE_HASH&subid_1=WAIT_SESSION_ID">
</iframe>
```

CPX requires `ext_user_id` as a stable unique ID for each user, and the API/iframe docs show this ID is also used for postback/webhook communication. ([cpx-research.com][2])

### 4. Add targeting info if possible

To improve survey matching, pass optional basic info if the user agrees:

```text
email
username
country
birth year
gender
zip code
```

CPX docs say extra basic targeting information like age, gender, country, and zip code can be added to improve the user experience. ([cpx-research.com][2])

### 5. Receive postbacks

Create a backend endpoint:

```text
GET /api/provider-callbacks/cpx
```

When CPX sends a conversion/postback, store it and update the StayOn wallet.

### 6. Show wallet update

In the StayOn overlay:

```text
+25 StayOn Coins
Reward source: CPX Research
Status: confirmed / pending
```

## If you want more control over the UI

Use CPX API instead of iframe.

CPX has an API endpoint for listing available surveys for a user. It requires values like `app_id`, `ext_user_id`, `ip_user`, `user_agent`, `limit`, and `secure_hash`. ([cpx-research.com][2])

But for a 24-hour hackathon, I would **not** start with the API. Use the iframe or script tag first, because it is much faster.

## My ranking

| Rank | Provider         | Best use                                           | 24h realism |
| ---: | ---------------- | -------------------------------------------------- | ----------: |
|    1 | **CPX Research** | Fast web/iframe survey wall                        | **Highest** |
|    2 | **BitLabs**      | Better long-term API/provider architecture         |      Medium |
|    3 | TheoremReach     | Survey API, but more setup risk                    |      Medium |
|    4 | TapResearch      | Good survey provider, likely more setup            |  Medium/low |
|    5 | Prodege/AdGate   | Offers/actions, not ideal for focused dev workflow |  Medium/low |

## My final answer

Use **CPX Research** for the hackathon.

Use this exact positioning:

> **StayOn uses CPX Research as the first real paid-task provider. When Claude Code, Codex, or Cursor is thinking, StayOn opens a short rewarded survey/task window. CPX handles survey supply and reward verification; StayOn handles timing, user experience, wallet, and return-to-flow.**

Then in the future architecture:

> **Provider 1: CPX Research for fast paid surveys.
> Provider 2: BitLabs for richer API-based surveys/offers.
> Provider 3: StayOn’s own developer microtask marketplace.**

This gives you the fastest real-money demo without locking the product into only surveys.

[1]: https://developer.bitlabs.ai/docs/getting-started "Welcome to BitLabs"
[2]: https://cpx-research.com/main/en/doc.php "CPX Research"
[3]: https://publisher.cpx-research.com/index.php?page=register&utm_source=chatgpt.com "Publisher Sign Up CPX-RESEARCH"
