// ── Money ─────────────────────────────────────────────────────────────────────
export type Category = { key: string; label: string; color: string };

export type Expense = { id: string; amount: number; category: string; note: string; createdAt: string; recurringId?: string };
export type IncomeEntry = { id: string; amount: number; source: string; note: string; createdAt: string; recurringId?: string };

export type MonthData = {
  funBudget: number;
  funExpenses: Expense[];
  savingsEnabled: boolean;
  savingsSetAside: number;
  income: IncomeEntry[];
  regExpenses: Expense[];
  regBudgets: Record<string, number>;
  /** ids of recurring items already added to this period */
  recurringApplied: string[];
  /** coins bonus for finishing the period under the fun budget was paid */
  periodBonusPaid: boolean;
};

export type GoalContribution = { id: string; amount: number; note: string; createdAt: string };
export type Goal = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  target: number;
  deadline?: string; // yyyy-mm-dd
  createdAt: string;
  contributions: GoalContribution[];
  completedAt?: string;
};

export type RecurringKind = 'fun' | 'reg' | 'income';
export type RecurringItem = {
  id: string;
  kind: RecurringKind;
  /** category key for fun/reg, income source for income */
  category: string;
  amount: number;
  note: string;
  /** calendar day of month (1-31) it lands on */
  day: number;
  active: boolean;
};

export type ThemeMode = 'system' | 'light' | 'dark';
export type Settings = {
  theme: ThemeMode;
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** warn when a budget reaches this share (0-1) */
  warnAt: number;
};

// ── Game ──────────────────────────────────────────────────────────────────────
export type Rarity = 'common' | 'rare' | 'epic' | 'legend';
export type Pet = {
  id: number;
  typeId: string;
  name: string;
  level: number;
  xp: number;
  hunger: number;
  happiness: number;
  health: number;
  hatchedAt: string;
};
export type Incubation = { id: string; eggId: string; startTime: number; duration: number };
export type CoinTx = { id: string; type: 'earn' | 'spend'; amount: number; reason: string; date: string };

export type GameState = {
  coins: number;
  totalEarned: number;
  resistanceXP: number;
  totalResisted: number;
  pets: Pet[];
  incubating: Incubation[];
  inventory: Record<string, number>;
  coinLog: CoinTx[];
  lastChallengeDay: string | null;
  streak: { count: number; lastDay: string | null; best: number };
  logRewards: { day: string | null; count: number };
  nextPetId: number;
  welcomeGiven: boolean;
  lastDecayAt: number;
};

// ── Root ──────────────────────────────────────────────────────────────────────
export type AppData = {
  version: 2;
  funCategories: Category[];
  regCategories: Category[];
  months: Record<string, MonthData>;
  goals: Goal[];
  recurring: RecurringItem[];
  settings: Settings;
  game: GameState;
};
