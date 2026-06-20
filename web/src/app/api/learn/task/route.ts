import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TASKS = [
  {
    kind: 'flashcard' as const,
    id: 'learn-ts-001',
    question: 'What does `async/await` help you avoid in JavaScript?',
    answer: 'Callback hell / pyramid of doom',
    rewardPoints: 1,
    tags: ['javascript', 'async'],
  },
  {
    kind: 'flashcard' as const,
    id: 'learn-react-002',
    question: 'In React, what hook runs after every render?',
    answer: 'useEffect',
    rewardPoints: 1,
    tags: ['react'],
  },
  {
    kind: 'flashcard' as const,
    id: 'learn-next-003',
    question: 'In Next.js App Router, which file defines a route segment layout?',
    answer: 'layout.tsx',
    rewardPoints: 1,
    tags: ['nextjs', 'react'],
  },
  {
    kind: 'flashcard' as const,
    id: 'learn-git-004',
    question: 'Which command creates a new branch and switches to it?',
    answer: 'git checkout -b name',
    rewardPoints: 1,
    tags: ['git'],
  },
  {
    kind: 'flashcard' as const,
    id: 'learn-cursor-005',
    question: 'Which Cursor hook fires when you submit an Agent prompt?',
    answer: 'beforeSubmitPrompt',
    rewardPoints: 1,
    tags: ['cursor'],
  },
];

/** One learn flashcard per wait — persona filtering via `stack` query (MVP). */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
  }

  const stack = req.nextUrl.searchParams.get('stack')?.toLowerCase();
  let pool = TASKS;
  if (stack) {
    const filtered = TASKS.filter((t) => t.tags.some((tag) => tag.includes(stack) || stack.includes(tag)));
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  const task = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json({ ok: true, task });
}
