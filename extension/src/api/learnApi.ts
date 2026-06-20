import type { LearnTask } from '../types';
import { ECONOMY } from '../gamification/economy';
import { getApiBaseUrl } from './config';

type LearnApiTask = {
  kind?: string;
  id: string;
  question: string;
  answer?: string;
  rewardPoints?: number;
  tags?: string[];
};

export async function fetchLearnTask(
  userId: string,
  sessionId?: string
): Promise<LearnTask | null> {
  const base = getApiBaseUrl();
  if (!base) {
    return null;
  }

  const qs = new URLSearchParams({ userId });
  if (sessionId) {
    qs.set('sessionId', sessionId);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(`${base.replace(/\/$/, '')}/api/learn/task?${qs.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = (await res.json()) as { ok?: boolean; task?: LearnApiTask | null };
    if (!data.ok || !data.task) {
      return null;
    }
    const t = data.task;
    return {
      kind: 'learn',
      id: t.id,
      question: t.question,
      answer: t.answer ?? '',
      reward: Math.min(ECONOMY.LEARN_REWARD, t.rewardPoints ?? ECONOMY.LEARN_REWARD),
      tags: t.tags,
    };
  } catch {
    return null;
  }
}
