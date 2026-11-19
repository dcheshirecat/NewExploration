// ── Money ─────────────────────────────────────────────────────────────────────
export type Category = { key: string; label: string; color: string };

/** createdAt = the date the money moved · loggedAt = when it was entered in the app (used for the bank-balance estimate) */
export type Expense = { id: string; amount: number; category: string; note: string; createdAt: string; loggedAt?: string; recurringId?: string; scheduledId?: string };
export type IncomeEntry = { id: string; amount: number; source: string; note: string; createdAt: string; loggedAt?: string; recurringId?: string; scheduledId?: string };

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

/** A one-off future charge or income, e.g. a credit card bill on the 10th. */
export type ScheduledItem = {
  id: string;
  kind: RecurringKind;
  category: string;
  amount: number;
  note: string;
  date: string; // yyyy-mm-dd
  postedAt?: string; // set once it has been logged automatically
};

export type BankBalance = { amount: number; asOf: string };

export type ThemeMode = 'system' | 'light' | 'dark';
export type Settings = {
  theme: ThemeMode;
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** warn when a budget reaches this share (0-1) */
  warnAt: number;
  /** real bank balance the forecast starts from */
  bank?: BankBalance;
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
  totalLogged: number;
  pets: Pet[];
  incubating: Incubation[];
  inventory: Record<string, number>;
  coinLog: CoinTx[];
  lastChallengeDay: string | null;
  streak: { count: number; lastDay: string | null; best: number };
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
  scheduled: ScheduledItem[];
  settings: Settings;
  game: GameState;
};
