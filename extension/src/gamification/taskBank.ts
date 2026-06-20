import type { FocusTask, LearnTask, QuizTask, SponsoredTask, TaskMode, TaskPayload } from '../types';
import { ECONOMY } from './economy';

export const QUIZ_TASKS: QuizTask[] = [
  {
    kind: 'quiz',
    id: 'q1',
    question: 'Which Cursor hook marks the start of a wait session?',
    options: ['stop', 'beforeSubmitPrompt', 'afterFileEdit'],
    correctIndex: 1,
    reward: 12,
  },
  {
    kind: 'quiz',
    id: 'q2',
    question: 'What signals that the Cursor Agent finished working?',
    options: ['sessionStart', 'preCompact', 'stop'],
    correctIndex: 2,
    reward: 10,
  },
  {
    kind: 'quiz',
    id: 'q3',
    question: 'StayOn detects busy state via…',
    options: ['Mock timers', 'Cursor hooks → HTTP bridge', 'Spinner patching'],
    correctIndex: 1,
    reward: 15,
  },
  {
    kind: 'quiz',
    id: 'q4',
    question: 'Which hook fires during the agent tool loop?',
    options: ['beforeTabFileRead', 'preToolUse', 'workspaceOpen'],
    correctIndex: 1,
    reward: 10,
  },
  {
    kind: 'quiz',
    id: 'q5',
    question: 'Flow bonus tokens are earned when you…',
    options: [
      'Complete a task before the agent stops',
      'Redeem tokens',
      'Disable hooks',
    ],
    correctIndex: 0,
    reward: 12,
  },
  {
    kind: 'quiz',
    id: 'q6',
    question: 'StayOn stores context notes from…',
    options: ['Agent responses', 'User prompt (max 120 chars)', 'Git history'],
    correctIndex: 1,
    reward: 11,
  },
  {
    kind: 'quiz',
    id: 'q7',
    question: 'Parallel subagents adjust busy state with…',
    options: ['busy_ref +/-1', 'Mock polling', 'File watchers'],
    correctIndex: 0,
    reward: 13,
  },
  {
    kind: 'quiz',
    id: 'q8',
    question: '1,000 StayOn tokens ≈',
    options: ['€1.00', '€0.10', '€10.00'],
    correctIndex: 1,
    reward: 9,
  },
];

export const SPONSORED_CARDS: SponsoredTask[] = [
  {
    kind: 'sponsored',
    id: 's1',
    sponsor: 'Linear',
    tagline: 'Issue tracking built for fast teams.',
    url: 'https://linear.app',
    viewReward: ECONOMY.SPONSORED_VIEW,
    clickReward: ECONOMY.SPONSORED_CLICK,
  },
  {
    kind: 'sponsored',
    id: 's2',
    sponsor: 'Sentry',
    tagline: 'Fix production bugs faster.',
    url: 'https://sentry.io',
    viewReward: ECONOMY.SPONSORED_VIEW,
    clickReward: ECONOMY.SPONSORED_CLICK,
  },
];

export const LEARN_TASKS: LearnTask[] = [
  {
    kind: 'learn',
    id: 'l1',
    question: 'What does `async/await` help you avoid in JavaScript?',
    answer: 'Callback hell / pyramid of doom',
    reward: ECONOMY.LEARN_REWARD,
  },
  {
    kind: 'learn',
    id: 'l2',
    question: 'In React, what hook runs after every render?',
    answer: 'useEffect',
    reward: ECONOMY.LEARN_REWARD,
  },
  {
    kind: 'learn',
    id: 'l3',
    question: 'What HTTP method is idempotent for updates?',
    answer: 'PUT',
    reward: ECONOMY.LEARN_REWARD,
  },
];

export const FOCUS_TASKS: FocusTask[] = [
  {
    kind: 'focus',
    id: 'f1',
    prompt: 'Take 3 slow breaths. What will you check when the agent finishes?',
    durationSec: 30,
    reward: ECONOMY.FOCUS_REWARD,
  },
  {
    kind: 'focus',
    id: 'f2',
    prompt: 'Relax your shoulders. Name the next file you will open.',
    durationSec: 20,
    reward: ECONOMY.FOCUS_REWARD,
  },
];

let lastTaskId = '';

export function pickTask(mode: TaskMode): TaskPayload {
  if (mode === 'focus') {
    return pickRandom(FOCUS_TASKS);
  }
  if (mode === 'learn') {
    return pickRandom(LEARN_TASKS);
  }
  if (Math.random() < 0.35) {
    return pickRandom(SPONSORED_CARDS);
  }
  return pickRandom(QUIZ_TASKS);
}

function pickRandom<T extends TaskPayload>(items: T[]): T {
  let item = items[Math.floor(Math.random() * items.length)];
  if (items.length > 1 && item.id === lastTaskId) {
    item = items[(items.indexOf(item) + 1) % items.length];
  }
  lastTaskId = item.id;
  return item;
}

export function validateQuizAnswer(task: QuizTask, answerIndex: number): boolean {
  return answerIndex === task.correctIndex;
}
