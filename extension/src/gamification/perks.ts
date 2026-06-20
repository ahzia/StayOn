import type { PerkDefinition, Wallet } from '../types';
import { ECONOMY } from './economy';
import { addLedgerEntry } from './wallet';

export const PERK_CATALOG: PerkDefinition[] = [
  {
    id: 'context-pin',
    title: 'Pin return context',
    description: 'Keep your task front-and-center when the agent finishes.',
    cost: ECONOMY.PERKS.CONTEXT_PIN,
    benefit: 'Pinned context on Agent ready',
  },
  {
    id: 'flow-boost',
    title: 'Flow boost',
    description: 'Bigger bonus when you finish a task before the agent stops.',
    cost: ECONOMY.PERKS.FLOW_BOOST,
    benefit: `+${ECONOMY.FLOW_BONUS + ECONOMY.FLOW_BOOST_BONUS} ⭐ flow bonus next wait`,
  },
  {
    id: 'learn-refresh',
    title: 'New learn card',
    description: 'Swap to another learn question (Learn mode).',
    cost: ECONOMY.PERKS.LEARN_REFRESH,
    benefit: 'Fresh learn task this wait',
  },
  {
    id: 'streak-shield',
    title: 'Streak shield',
    description: 'Protect your wait streak if you skip a task once.',
    cost: ECONOMY.PERKS.STREAK_SHIELD,
    benefit: 'One free miss on wait streak',
  },
];

export function getPerk(id: string): PerkDefinition | undefined {
  return PERK_CATALOG.find((p) => p.id === id);
}

export function redeemPerk(wallet: Wallet, perkId: string): { ok: boolean; error?: string } {
  const perk = getPerk(perkId);
  if (!perk) {
    return { ok: false, error: 'Unknown perk' };
  }
  if (wallet.tokens < perk.cost) {
    return { ok: false, error: 'Not enough points' };
  }

  wallet.tokens -= perk.cost;
  addLedgerEntry(wallet, 'redeem', -perk.cost, `Perk: ${perk.title}`);

  switch (perkId) {
    case 'context-pin':
      wallet.contextPinned = true;
      break;
    case 'flow-boost':
      wallet.flowBoostPending = true;
      break;
    case 'streak-shield':
      wallet.streakShieldPending = true;
      break;
    case 'learn-refresh':
      break;
    default:
      return { ok: false, error: 'Unknown perk' };
  }

  return { ok: true };
}

export function getActivePerkLabels(wallet: Wallet): string[] {
  const labels: string[] = [];
  if (wallet.contextPinned) {
    labels.push('Context pinned');
  }
  if (wallet.flowBoostPending) {
    labels.push('Flow boost');
  }
  if (wallet.streakShieldPending) {
    labels.push('Streak shield');
  }
  return labels;
}
