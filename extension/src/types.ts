export type AgentStatus = 'idle' | 'busy' | 'ready';

export type BridgeEvent =
  | { event: 'busy_start'; context_note?: string; ts: string }
  | { event: 'busy_heartbeat'; phase?: string; tool?: string; ts: string }
  | { event: 'busy_ref'; delta: number; ts: string }
  | { event: 'busy_end'; status: string; ts: string }
  | { event: 'session_end'; ts: string };

export interface LedgerEntry {
  id: string;
  ts: string;
  type: 'task' | 'bonus' | 'streak' | 'challenge' | 'redeem';
  tokens: number;
  label: string;
}

export interface DailyChallenge {
  id: string;
  progress: number;
  target: number;
  completed: boolean;
  label: string;
  reward: number;
}

export interface Wallet {
  tokens: number;
  totalXp: number;
  level: number;
  dailyStreak: number;
  waitStreak: number;
  lastActiveDate: string;
  badges: string[];
  history: LedgerEntry[];
  dailyChallenge: DailyChallenge;
  totalTasks: number;
  focusSessions: number;
  subagentTasks: number;
  waitsCompleted: number;
  tasksToday: number;
  tasksTodayDate: string;
  /** Active perks / boosts */
  flowBoostPending: boolean;
  streakShieldPending: boolean;
  contextPinned: boolean;
}

export interface WalletSnapshot {
  tokens: number;
  cashEstimate: string;
  level: number;
  xp: number;
  xpForNext: number;
  xpProgress: number;
  dailyStreak: number;
  waitStreak: number;
  badges: string[];
  history: LedgerEntry[];
  dailyChallenge: DailyChallenge;
  activePerks: string[];
  stats: {
    totalTasks: number;
    waitsCompleted: number;
    tasksToday: number;
  };
}

export type TaskMode = 'surveys' | 'learn' | 'perks';

/** @deprecated aliases — migrated on read */
export type LegacyTaskMode = 'earn' | 'learn' | 'focus';

export interface QuizTask {
  kind: 'quiz';
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  reward: number;
}

export interface SponsoredTask {
  kind: 'sponsored';
  id: string;
  sponsor: string;
  tagline: string;
  url: string;
  viewReward: number;
  clickReward: number;
}

export interface FocusTask {
  kind: 'focus';
  id: string;
  prompt: string;
  durationSec: number;
  reward: number;
}

export interface LearnTask {
  kind: 'learn';
  id: string;
  question: string;
  answer: string;
  reward: number;
  tags?: string[];
}

export interface SurveysTask {
  kind: 'surveys';
  id: string;
  label: string;
}

export interface PerkDefinition {
  id: string;
  title: string;
  description: string;
  cost: number;
  benefit: string;
}

export interface PerkCatalogTask {
  kind: 'perk-catalog';
  id: string;
  perks: PerkDefinition[];
}

export interface CpxSurveyTask {
  kind: 'cpx';
  id: string;
  iframeUrl: string;
  label: string;
  /** CPX SurveyWall — points only after postback completion */
  inventoryType: 'cpx-wall';
  /** Restored from a paused session (same iframe URL, do not reload) */
  resumed?: boolean;
}

export interface CpxPausedSession {
  iframeUrl: string;
  inventoryType: 'cpx-wall';
  label: string;
  pausedAt: string;
}

export interface SurveyProfileSnapshot {
  completed: boolean;
  emailMasked?: string;
  birthdayYear?: number;
  countryCode?: string;
}

export type TaskPayload =
  | QuizTask
  | SponsoredTask
  | FocusTask
  | LearnTask
  | SurveysTask
  | PerkCatalogTask
  | CpxSurveyTask;

export interface BusyEndPayload {
  status: string;
  contextNote: string;
  flowBonus?: number;
  taskReward?: number;
}

export type ToWebviewMessage =
  | {
      type: 'init';
      wallet: WalletSnapshot;
      mode: TaskMode;
      cpxEnabled?: boolean;
      sectionMeta?: SectionMeta[];
      surveyProfile?: SurveyProfileSnapshot;
      pausedCpxSession?: CpxPausedSession | null;
    }
  | { type: 'state'; status: AgentStatus; contextNote?: string; tool?: string }
  | { type: 'task'; task: TaskPayload }
  | { type: 'wallet'; wallet: WalletSnapshot }
  | { type: 'reward'; tokens: number; label: string; bonus?: string }
  | {
      type: 'ready';
      contextNote: string;
      flowBonus?: number;
      taskReward?: number;
      surveyPersist?: boolean;
    }
  | { type: 'badge'; id: string; name: string }
  | { type: 'surveyProfile'; profile: SurveyProfileSnapshot }
  | { type: 'cpxPaused'; session: CpxPausedSession | null }
  | { type: 'destroyCpxFrame' };

export type SectionMeta = {
  id: TaskMode;
  title: string;
  subtitle: string;
  earnLabel: string;
};

export type FromWebviewMessage =
  | { type: 'ready' }
  | { type: 'taskComplete'; taskId: string; answerIndex?: number }
  | { type: 'sponsoredView'; taskId: string }
  | { type: 'learnComplete'; taskId: string }
  | { type: 'setMode'; mode: TaskMode }
  | { type: 'dismissReady' }
  | { type: 'openSponsor'; url: string; taskId: string }
  | { type: 'cpxEngaged' }
  | { type: 'redeemPerk'; perkId: string }
  | { type: 'learnRefresh' }
  | { type: 'submitSurveyProfile'; email: string; birthdayYear: number; birthdayMonth: number; birthdayDay: number; gender?: 'm' | 'f'; countryCode?: string }
  | { type: 'openSurveyProfile' }
  | { type: 'dismissSurvey' }
  | { type: 'resumeSurvey' }
  | { type: 'pauseSurvey' };
