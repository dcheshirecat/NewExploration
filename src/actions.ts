// All functions here mutate a draft copy of AppData and return messages to show.
import { COINS, coinsForPeriodBonus, coinsForSaving, earn, giveAllPetsXp, rewardLogging } from './game';
import { emptyMonth } from './storage';
import type { AppData, Goal, MonthData, RecurringItem, RecurringKind, ScheduledItem } from './types';
import { dateStrToIso, fmt, getMonthKey, periodBounds, recurringDateInPeriod, shiftMonth, sum, toLocalDateStr, todayStr, uid } from './utils';

export type Msgs = string[];

export function ensureMonth(d: AppData, mk: string): MonthData {
  if (!d.months[mk]) d.months[mk] = emptyMonth();
  return d.months[mk];
}

// ── Warnings ─────────────────────────────────────────────────────────────────
export type Warning = { level: 'warn' | 'over'; kind: 'fun' | 'reg'; key: string; text: string; ratio: number };

export function getWarnings(d: AppData, mk: string): Warning[] {
  const m = d.months[mk];
  if (!m) return [];
  const out: Warning[] = [];
  const warnAt = d.settings.warnAt;
  if (m.funBudget > 0) {
    const spent = sum(m.funExpenses, e => e.amount);
    const ratio = spent / m.funBudget;
    if (ratio > 1) out.push({ level: 'over', kind: 'fun', key: 'fun', ratio, text: `Fun jar is over budget by ${fmt(spent - m.funBudget)}` });
    else if (ratio >= warnAt) out.push({ level: 'warn', kind: 'fun', key: 'fun', ratio, text: `Fun jar is ${Math.round(ratio * 100)}% used — ${fmt(m.funBudget - spent)} left` });
  }
  for (const c of d.regCategories) {
    const planned = m.regBudgets[c.key] ?? 0;
    if (planned <= 0) continue;
    const actual = sum(m.regExpenses.filter(e => e.category === c.key), e => e.amount);
    const ratio = actual / planned;
    if (actual - planned > 0.005) out.push({ level: 'over', kind: 'reg', key: c.key, ratio, text: `${c.label} is over plan by ${fmt(actual - planned)}` });
    // exactly on plan (e.g. rent paid in full) is expected, not a warning
    else if (ratio >= warnAt && planned - actual > 0.005) out.push({ level: 'warn', kind: 'reg', key: c.key, ratio, text: `${c.label} is at ${Math.round(ratio * 100)}% of plan` });
  }
  return out.sort((a, b) => b.ratio - a.ratio);
}

function warningDelta(before: Warning[], after: Warning[]): Msgs {
  const msgs: Msgs = [];
  for (const w of after) {
    const prev = before.find(b => b.key === w.key);
    if (!prev || prev.level !== w.level) msgs.push(`${w.level === 'over' ? '🚨' : '⚠️'} ${w.text}`);
  }
  return msgs;
}

// ── Entries ──────────────────────────────────────────────────────────────────
export function addExpense(d: AppData, kind: 'fun' | 'reg', input: { amount: number; category: string; note: string; date: string }): Msgs {
  const mk = getMonthKey(new Date(input.date + 'T12:00:00'));
  const before = getWarnings(d, mk);
  const m = ensureMonth(d, mk);
  const entry = { id: uid(), amount: input.amount, category: input.category, note: input.note.trim(), createdAt: dateStrToIso(input.date), loggedAt: new Date().toISOString() };
  if (kind === 'fun') m.funExpenses.unshift(entry); else m.regExpenses.unshift(entry);
  const r = rewardLogging(d.game, input.amount, `${fmt(input.amount)} expense`);
  const msgs: Msgs = [`Logged ${fmt(input.amount)} · +${r.coins} 🪙`, ...r.messages];
  return [...msgs, ...warningDelta(before, getWarnings(d, mk))];
}

export function addIncome(d: AppData, mk: string, input: { amount: number; source: string; note: string; date?: string }): Msgs {
  const m = ensureMonth(d, mk);
  const now = new Date().toISOString();
  m.income.unshift({ id: uid(), amount: input.amount, source: input.source, note: input.note.trim(), createdAt: input.date ? dateStrToIso(input.date) : now, loggedAt: now });
  const r = rewardLogging(d.game, input.amount, `${fmt(input.amount)} income`);
  return [`Income of ${fmt(input.amount)} added · +${r.coins} 🪙`, ...r.messages];
}

// ── Recurring ────────────────────────────────────────────────────────────────
/** Adds every active recurring item whose date in the current period has arrived. */
export function applyRecurring(d: AppData, now = new Date()): Msgs {
  const mk = getMonthKey(now);
  const today = todayStr();
  const m = ensureMonth(d, mk);
  let added = 0;
  for (const r of d.recurring) {
    if (!r.active || m.recurringApplied.includes(r.id)) continue;
    const date = recurringDateInPeriod(mk, r.day);
    if (date > today) continue;
    const createdAt = dateStrToIso(date);
    const loggedAt = new Date().toISOString();
    if (r.kind === 'income') {
      m.income.unshift({ id: uid(), amount: r.amount, source: r.category, note: r.note || 'Recurring', createdAt, loggedAt, recurringId: r.id });
    } else {
      const e = { id: uid(), amount: r.amount, category: r.category, note: r.note || 'Recurring', createdAt, loggedAt, recurringId: r.id };
      if (r.kind === 'fun') m.funExpenses.unshift(e); else m.regExpenses.unshift(e);
    }
    m.recurringApplied.push(r.id);
    added++;
  }
  return added ? [`🔁 Added ${added} recurring ${added === 1 ? 'item' : 'items'} for this period`] : [];
}

export function upsertRecurring(d: AppData, item: RecurringItem) {
  const i = d.recurring.findIndex(r => r.id === item.id);
  if (i >= 0) d.recurring[i] = item; else d.recurring.push(item);
}

// ── Period bonus ─────────────────────────────────────────────────────────────
/** Pays a coin bonus when the previous period finished under the fun budget. */
export function payPeriodBonuses(d: AppData, now = new Date()): Msgs {
  const cur = getMonthKey(now);
  const prev = shiftMonth(cur, -1);
  const msgs: Msgs = [];
  for (const [mk, m] of Object.entries(d.months)) {
    if (mk >= cur || m.periodBonusPaid) continue;
    m.periodBonusPaid = true;
    if (mk !== prev || m.funBudget <= 0) continue; // only the period that just ended counts
    const left = m.funBudget - sum(m.funExpenses, e => e.amount);
    if (left >= 0) {
      const coins = earn(d.game, coinsForPeriodBonus(left), 'Finished a period under the fun budget');
      msgs.push(`🏆 You stayed under your fun budget last period! +${coins} 🪙`);
    }
  }
  return msgs;
}

// ── Goals ────────────────────────────────────────────────────────────────────
export function goalSaved(g: Goal) { return sum(g.contributions, c => c.amount); }

export function contributeToGoal(d: AppData, goalId: string, amount: number, note: string, fromResisted = false): Msgs {
  const g = d.goals.find(x => x.id === goalId);
  if (!g) return [];
  const wasDone = goalSaved(g) >= g.target;
  g.contributions.unshift({ id: uid(), amount, note: note.trim(), createdAt: new Date().toISOString() });
  const msgs: Msgs = [];
  if (amount > 0 && !fromResisted) {
    const coins = earn(d.game, coinsForSaving(amount), `Saved ${fmt(amount)} for ${g.name}`);
    msgs.push(`${g.emoji} ${fmt(amount)} saved for ${g.name} · +${coins} 🪙`);
    msgs.push(...giveAllPetsXp(d.game, 10));
  } else if (amount < 0) {
    msgs.push(`Took ${fmt(-amount)} out of ${g.name}`);
  }
  if (!wasDone && goalSaved(g) >= g.target) {
    g.completedAt = new Date().toISOString();
    earn(d.game, COINS.goalCompleted, `Completed goal: ${g.name}`);
    msgs.push(`🎉 Goal reached: ${g.name}! +${COINS.goalCompleted} 🪙`);
  } else if (wasDone && goalSaved(g) < g.target) {
    g.completedAt = undefined;
  }
  return msgs;
}

/** Goal contributions made inside a period (for the balance view). */
export function goalContributionsInPeriod(d: AppData, mk: string) {
  const out: { id: string; amount: number; createdAt: string; label: string; note: string }[] = [];
  for (const g of d.goals) {
    for (const c of g.contributions) {
      if (getMonthKey(new Date(c.createdAt)) === mk) out.push({ id: c.id, amount: c.amount, createdAt: c.createdAt, label: `${g.emoji} ${g.name}`, note: c.note });
    }
  }
  return out;
}

// ── Scheduled (future one-off) items ─────────────────────────────────────────
export function addScheduled(d: AppData, item: Omit<ScheduledItem, 'id'>): Msgs {
  d.scheduled.push({ ...item, id: uid() });
  const r = rewardLogging(d.game, item.amount, `upcoming ${item.note || 'item'}`);
  const msgs = [`📆 ${item.note || 'Item'} added for ${new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · +${r.coins} 🪙`, ...r.messages];
  return [...msgs, ...applyScheduled(d)];
}

function postEntry(d: AppData, kind: RecurringKind, category: string, amount: number, note: string, date: string, extra: { scheduledId?: string }) {
  const m = ensureMonth(d, getMonthKey(new Date(date + 'T12:00:00')));
  const base = { id: uid(), amount, note, createdAt: dateStrToIso(date), loggedAt: new Date().toISOString(), ...extra };
  if (kind === 'income') m.income.unshift({ ...base, source: category });
  else if (kind === 'fun') m.funExpenses.unshift({ ...base, category });
  else m.regExpenses.unshift({ ...base, category });
}

/** Logs every scheduled item whose date has arrived. */
export function applyScheduled(d: AppData): Msgs {
  const today = todayStr();
  const posted: string[] = [];
  for (const it of d.scheduled) {
    if (it.postedAt || it.date > today) continue;
    postEntry(d, it.kind, it.category, it.amount, it.note || 'Scheduled', it.date, { scheduledId: it.id });
    it.postedAt = new Date().toISOString();
    posted.push(it.note || 'item');
  }
  return posted.length ? [`📆 Logged today's ${posted.length === 1 ? `“${posted[0]}”` : `${posted.length} planned items`}`] : [];
}

/** Log a scheduled item right now (e.g. the card was charged early). */
export function postScheduledNow(d: AppData, id: string): Msgs {
  const it = d.scheduled.find(x => x.id === id);
  if (!it || it.postedAt) return [];
  postEntry(d, it.kind, it.category, it.amount, it.note || 'Scheduled', todayStr(), { scheduledId: it.id });
  it.postedAt = new Date().toISOString();
  return [`✅ ${it.note || 'Item'} logged as paid today`];
}

// ── Forecast ─────────────────────────────────────────────────────────────────
export type ForecastEvent = {
  key: string; date: string; label: string; detail: string; amount: number; kind: RecurringKind;
  source: 'scheduled' | 'recurring'; sourceId: string; balance: number;
};
export type Forecast = {
  hasBank: boolean;
  /** estimated balance right now (bank balance + what was logged since) */
  now: number;
  events: ForecastEvent[];
  end: number;
  endDate: string;
  lowest: { amount: number; date: string };
};

function itemLabel(d: AppData, kind: RecurringKind, category: string) {
  if (kind === 'income') return category;
  return (kind === 'fun' ? d.funCategories : d.regCategories).find(c => c.key === category)?.label ?? 'Other';
}

/** Balance right now: the last bank balance you entered plus everything logged after it. */
export function estimatedBalance(d: AppData) {
  const bank = d.settings.bank;
  if (!bank) return null;
  const asOfDay = toLocalDateStr(bank.asOf);
  const today = todayStr();
  let v = bank.amount;
  for (const m of Object.values(d.months)) {
    const counts = (e: { loggedAt?: string; createdAt: string }) => !!e.loggedAt && e.loggedAt > bank.asOf && toLocalDateStr(e.createdAt) >= asOfDay && toLocalDateStr(e.createdAt) <= today;
    v += sum(m.income.filter(counts), e => e.amount);
    v -= sum(m.funExpenses.filter(counts), e => e.amount);
    v -= sum(m.regExpenses.filter(counts), e => e.amount);
  }
  return v;
}

/** Everything expected to happen after today, up to and including endDate. */
export function forecast(d: AppData, endDate: string): Forecast {
  const today = todayStr();
  const est = estimatedBalance(d);
  const start = est ?? 0;
  const raw: Omit<ForecastEvent, 'balance'>[] = [];

  for (const it of d.scheduled) {
    if (it.postedAt || it.date < today || it.date > endDate) continue;
    raw.push({ key: `s-${it.id}`, date: it.date, label: it.note || itemLabel(d, it.kind, it.category), detail: itemLabel(d, it.kind, it.category),
      amount: it.kind === 'income' ? it.amount : -it.amount, kind: it.kind, source: 'scheduled', sourceId: it.id });
  }
  // recurring items in every period between now and endDate that haven't been added yet
  let pk = getMonthKey();
  const lastPk = getMonthKey(new Date(endDate + 'T12:00:00'));
  for (let guard = 0; pk <= lastPk && guard < 24; guard++, pk = shiftMonth(pk, 1)) {
    const applied = d.months[pk]?.recurringApplied ?? [];
    for (const r of d.recurring) {
      if (!r.active || applied.includes(r.id)) continue;
      const date = recurringDateInPeriod(pk, r.day);
      if (date <= today || date > endDate) continue;
      raw.push({ key: `r-${r.id}-${pk}`, date, label: r.note || itemLabel(d, r.kind, r.category), detail: `🔁 ${itemLabel(d, r.kind, r.category)}`,
        amount: r.kind === 'income' ? r.amount : -r.amount, kind: r.kind, source: 'recurring', sourceId: r.id });
    }
  }
  raw.sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
  let bal = start;
  let lowest = { amount: start, date: today };
  const events = raw.map(e => {
    bal += e.amount;
    if (bal < lowest.amount) lowest = { amount: bal, date: e.date };
    return { ...e, balance: bal };
  });
  return { hasBank: est !== null, now: start, events, end: bal, endDate, lowest };
}

export function endOfCurrentPeriod() { return toLocalDateStr(periodBounds(getMonthKey()).end); }
