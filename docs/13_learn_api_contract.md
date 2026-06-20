# Learn mode API contract

HTTP API spec for **Learn mode** content served from `web/`. The extension will integrate against this contract; until then, backend can ship independently.

Related: [12_backend_developer_guide.md](./12_backend_developer_guide.md), [11_branding.md](./11_branding.md)

---

## 1. Purpose

**Learn mode** shows short developer Q&A during agent wait time. It is **not** paid inventory.

- Backend supplies **question content** (and optional grading metadata)
- Extension displays UI and awards **1 point ⭐** per completion (local wallet)
- Paid CPX surveys stay in **Earn mode** only

---

## 2. Points rule (locked)

| Field | Value |
|-------|--------|
| `rewardPoints` | **`1`** for every learn task (API must not exceed 1 without product sign-off) |
| Cash value | **None** — do not write to CPX ledger |
| Comparison | CPX complete might be **50–500+ ⭐**; Learn is intentionally trivial |

Extension constant (when integrated): `ECONOMY.LEARN_REWARD = 1`.

---

## 3. Task types (v1)

### Type A — Flashcard (MVP, matches current extension UI)

User reads question + answer, taps “Got it”. No server grading required.

```json
{
  "kind": "flashcard",
  "id": "learn-ts-001",
  "question": "What does `async/await` help you avoid in JavaScript?",
  "answer": "Callback hell / pyramid of doom",
  "rewardPoints": 1,
  "tags": ["javascript", "async"],
  "difficulty": "easy"
}
```

**Security note:** For flashcards, the `answer` is shown in the panel (same as today). Acceptable for hackathon MVP.

### Type B — Multiple choice (v2, server-graded)

```json
{
  "kind": "quiz",
  "id": "learn-git-002",
  "question": "Which command creates a new branch and switches to it?",
  "options": ["git branch name", "git checkout -b name", "git merge name"],
  "correctIndex": 1,
  "rewardPoints": 1,
  "tags": ["git"]
}
```

**Do not include `correctIndex` in GET responses** once extension enforces server grading — use `POST /api/learn/complete` instead. For v1 backend-only testing, you may include it; extension integration will strip it.

---

## 4. Endpoints

### `GET /api/learn/task`

Return **one** learn task for the current wait session.

**Query parameters**

| Param | Required | Description |
|-------|----------|-------------|
| `userId` | yes | Extension stable UUID (`ext_user_id` style) |
| `sessionId` | no | Wait session id (`wait-173…`) for analytics |
| `tags` | no | Comma-separated filter, e.g. `typescript,git` |

**Success — 200**

```json
{
  "ok": true,
  "task": {
    "kind": "flashcard",
    "id": "learn-ts-001",
    "question": "What does `async/await` help you avoid in JavaScript?",
    "answer": "Callback hell / pyramid of doom",
    "rewardPoints": 1,
    "tags": ["javascript"],
    "difficulty": "easy"
  }
}
```

**No content — 200**

```json
{
  "ok": true,
  "task": null,
  "message": "No learn tasks available right now"
}
```

**Error — 400 / 503**

```json
{ "ok": false, "error": "userId required" }
```

**Backend behavior**

- Pick random task from pool; prefer tags if provided
- Optional: skip tasks user saw in last 24h (key = `userId` + `task.id`)
- Always set `rewardPoints: 1`
- Cache responses per user max **120 seconds** (align with CPX refresh guidance)

**Example**

```bash
curl "http://localhost:3000/api/learn/task?userId=550e8400-e29b-41d4-a716-446655440000&sessionId=wait-1710000000"
```

---

### `GET /api/learn/tasks` (optional, admin/debug)

List or paginate tasks. Protect with `LEARN_ADMIN_KEY` header in production.

**Query:** `limit`, `offset`, `tag`

**Response**

```json
{
  "ok": true,
  "count": 42,
  "tasks": [ { "id": "…", "question": "…", "rewardPoints": 1 } ]
}
```

Omit `answer` / `correctIndex` in public list if exposing externally.

---

### `POST /api/learn/tasks` (optional, content import)

Bulk create/update learn tasks.

**Headers:** `Authorization: Bearer <LEARN_ADMIN_KEY>`

**Body**

```json
{
  "tasks": [
    {
      "kind": "flashcard",
      "id": "learn-dart-010",
      "question": "…",
      "answer": "…",
      "rewardPoints": 1,
      "tags": ["flutter"]
    }
  ]
}
```

**Response**

```json
{ "ok": true, "imported": 1, "skipped": 0 }
```

---

### `POST /api/learn/complete` (v2, optional)

Server validates quiz answers before extension credits points.

**Body**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "learn-git-002",
  "answerIndex": 1,
  "sessionId": "wait-1710000000"
}
```

**Success**

```json
{
  "ok": true,
  "correct": true,
  "rewardPoints": 1
}
```

**Wrong answer**

```json
{
  "ok": true,
  "correct": false,
  "rewardPoints": 0
}
```

Idempotent: same `userId` + `taskId` + `sessionId` cannot earn twice.

---

## 5. Content schema (storage)

Suggested file `web/src/lib/learn/catalog.json` or DB table:

```typescript
type LearnTaskRecord = {
  id: string;              // unique, stable slug e.g. learn-ts-001
  kind: 'flashcard' | 'quiz';
  question: string;
  answer?: string;         // flashcard
  options?: string[];      // quiz
  correctIndex?: number;   // quiz, server-only for graded mode
  rewardPoints: 1;         // always 1
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  active?: boolean;        // default true
};
```

**Validation rules**

- `question`: 10–500 chars
- `rewardPoints`: must be `1` (reject imports with higher values)
- `id`: unique, `[a-z0-9-]+`
- At least 20 seed questions before extension integration demo

---

## 6. Extension mapping (for integrator — not backend dev)

When extension owner wires this up:

| API field | Extension `LearnTask` |
|-----------|------------------------|
| `id` | `id` |
| `question` | `question` |
| `answer` | `answer` |
| `rewardPoints` | `reward` (capped at `ECONOMY.LEARN_REWARD`) |

Extension fetch (future pseudo-code):

```typescript
// extension/src/api/learnApi.ts — NOT implemented yet
const res = await fetch(`${apiBaseUrl}/api/learn/task?userId=${userId}&sessionId=${sessionId}`);
const { task } = await res.json();
if (task) return { kind: 'learn', ...task, reward: Math.min(task.rewardPoints, 1) };
```

**Backend dev:** do not add this file; extension team owns integration.

---

## 7. What not to build

- Do not merge Learn completions into `/api/wallet/:userId/pending` (that is CPX-only)
- Do not call CPX postback URLs for learn events
- Do not return `rewardPoints` > 1
- Do not require extension version bumps for new questions — only API content changes

---

## 8. Acceptance criteria (backend MVP done)

- [ ] `GET /api/learn/task` returns valid flashcards with `rewardPoints: 1`
- [ ] At least 20 questions in catalog (your content)
- [ ] Documented sample `curl` in PR
- [ ] CPX routes still pass manual smoke test
- [ ] Contract doc updated if fields change

Extension integration is a **separate milestone** after the above.
