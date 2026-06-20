import type { LearnTask, PerkCatalogTask, SurveysTask, TaskMode, TaskPayload } from '../types';
import { ECONOMY } from './economy';
import { PERK_CATALOG } from './perks';

export const LEARN_TASKS: LearnTask[] = [
  {
    kind: 'learn',
    id: 'l1',
    question: 'What does `async/await` help you avoid in JavaScript?',
    answer: 'Callback hell / pyramid of doom',
    reward: ECONOMY.LEARN_REWARD,
    tags: ['javascript'],
  },
  {
    kind: 'learn',
    id: 'l2',
    question: 'In React, what hook runs after every render?',
    answer: 'useEffect',
    reward: ECONOMY.LEARN_REWARD,
    tags: ['react'],
  },
  {
    kind: 'learn',
    id: 'l3',
    question: 'What HTTP method is idempotent for updates?',
    answer: 'PUT',
    reward: ECONOMY.LEARN_REWARD,
    tags: ['http'],
  },
  {
    kind: 'learn',
    id: 'l4',
    question: 'Which Cursor hook fires when you submit an Agent prompt?',
    answer: 'beforeSubmitPrompt',
    reward: ECONOMY.LEARN_REWARD,
    tags: ['cursor'],
  },
];

let lastTaskId = '';

export function pickTask(mode: TaskMode): TaskPayload {
  if (mode === 'learn') {
    return pickRandom(LEARN_TASKS);
  }
  if (mode === 'perks') {
    return perkCatalogTask();
  }
  return surveysPlaceholder();
}

export function surveysPlaceholder(): SurveysTask {
  return {
    kind: 'surveys',
    id: 'surveys-load',
    label: 'Loading real surveys…',
  };
}

export function perkCatalogTask(): PerkCatalogTask {
  return {
    kind: 'perk-catalog',
    id: 'perk-catalog',
    perks: PERK_CATALOG,
  };
}

export function pickRandomLearn(): LearnTask {
  return pickRandom(LEARN_TASKS);
}

function pickRandom<T extends { id: string }>(items: T[]): T {
  let item = items[Math.floor(Math.random() * items.length)];
  if (items.length > 1 && item.id === lastTaskId) {
    item = items[(items.indexOf(item) + 1) % items.length];
  }
  lastTaskId = item.id;
  return item;
}
