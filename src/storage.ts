import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultGame } from './game';
import type { AppData, Category, MonthData, Settings } from './types';
import { getMonthKey } from './utils';

/** Key used by the original Dini's Money Jar (read for migration, never deleted). */
export const LEGACY_KEY = 'dinis-money-jar-monthly-budget';
export const STORAGE_KEY = 'dinis-money-jar-v2';

export const DEFAULT_FUN_CATS: Category[] = [
  { key: 'crafts',  label: 'Crafts & Art',  color: '#ff8a80' },
  { key: 'fun',     label: 'Entertainment', color: '#ffd166' },
  { key: 'dining',  label: 'Dining Out',    color: '#ff9f6e' },
  { key: 'shop',    label: 'Shopping',      color: '#7c7cff' },
  { key: 'other-f', label: 'Other',         color: '#a78bfa' },
];
export const DEFAULT_REG_CATS: Category[] = [
  { key: 'grocery',  label: 'Groceries',      color: '#4ecdc4' },
  { key: 'transit',  label: 'Transport',      color: '#2ec4b6' },
  { key: 'housing',  label: 'Housing / Rent', color: '#6d8dff' },
  { key: 'utils',    label: 'Utilities',      color: '#64b5f6' },
  { key: 'medical',  label: 'Medical',        color: '#f48fb1' },
  { key: 'personal', label: 'Personal Care',  color: '#ce93d8' },
  { key: 'other-r',  label: 'Other',          color: '#90a4ae' },
];
export const FUN_COLORS = ['#ff8a80', '#ffd166', '#7c7cff', '#ff9f6e', '#a78bfa', '#ff5d8f', '#2ec4b6', '#ffd54f'];
export const REG_COLORS = ['#4ecdc4', '#2ec4b6', '#6d8dff', '#64b5f6', '#f48fb1', '#ce93d8', '#90a4ae', '#a5d6a7'];
export const GOAL_COLORS = ['#7c7cff', '#ff5d8f', '#4ecdc4', '#ffd166', '#a78bfa', '#ff9f6e', '#00d68f', '#64b5f6'];
export const INCOME_SOURCES = ['Salary', 'Disability', 'Freelance', 'Gift', 'Transfer', 'Other'];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system', remindersEnabled: false, reminderHour: 20, reminderMinute: 0, warnAt: 0.8,
};

export function emptyMonth(): MonthData {
  return {
    funBudget: 0, funExpenses: [], savingsEnabled: false, savingsSetAside: 0,
    income: [], regExpenses: [], regBudgets: {}, recurringApplied: [], periodBonusPaid: false,
  };
}

export function defaultData(): AppData {
  return {
    version: 2,
    funCategories: DEFAULT_FUN_CATS,
    regCategories: DEFAULT_REG_CATS,
    months: { [getMonthKey()]: emptyMonth() },
    goals: [], recurring: [],
    settings: { ...DEFAULT_SETTINGS },
    game: defaultGame(),
  };
}

const arr = (v: any) => (Array.isArray(v) ? v : []);
const num = (v: any, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function normalizeMonth(mv: any): MonthData {
  return {
    funBudget:       num(mv?.funBudget ?? mv?.budget),
    funExpenses:     arr(mv?.funExpenses ?? mv?.expenses),
    savingsEnabled:  !!mv?.savingsEnabled,
    savingsSetAside: num(mv?.savingsSetAside),
    income:          arr(mv?.income),
    regExpenses:     arr(mv?.regExpenses),
    regBudgets:      mv?.regBudgets ?? mv?.categoryBudgets ?? {},
    recurringApplied: arr(mv?.recurringApplied),
    periodBonusPaid: !!mv?.periodBonusPaid,
  };
}

/**
 * Turns anything we've ever stored (original app formats, v2, or a backup file)
 * into a complete, valid AppData.
 */
export function normalizeData(p: any): AppData {
  const base = defaultData();
  if (!p || typeof p !== 'object') return base;

  // Very first format: budget + expenses at the root
  if (!p.funCategories && !p.months && !p.categories) {
    if (p.budget !== undefined || p.expenses) {
      base.months = { [p.monthKey ?? getMonthKey()]: normalizeMonth({ funBudget: p.budget, funExpenses: p.expenses }) };
    }
    return base;
  }

  const funCats = arr(p.funCategories ?? p.categories);
  const regCats = arr(p.regCategories);
  const months: Record<string, MonthData> = {};
  for (const [k, v] of Object.entries(p.months ?? {})) months[k] = normalizeMonth(v);
  if (!Object.keys(months).length) months[getMonthKey()] = emptyMonth();

  return {
    version: 2,
    funCategories: funCats.length ? funCats : DEFAULT_FUN_CATS,
    regCategories: regCats.length ? regCats : DEFAULT_REG_CATS,
    months,
    goals: arr(p.goals).map((g: any) => ({ ...g, contributions: arr(g.contributions) })),
    recurring: arr(p.recurring),
    settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
    game: { ...defaultGame(), ...(p.game ?? {}) },
  };
}

export async function loadData(): Promise<{ data: AppData; migrated: boolean }> {
  const v2 = await AsyncStorage.getItem(STORAGE_KEY);
  if (v2) return { data: normalizeData(JSON.parse(v2)), migrated: false };
  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy) return { data: normalizeData(JSON.parse(legacy)), migrated: true };
  return { data: defaultData(), migrated: false };
}

export async function saveData(data: AppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isBackupLike(p: any) {
  return !!p && typeof p === 'object' && (p.months || p.funCategories || p.app === 'dinis-money-jar');
}
