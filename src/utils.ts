// Budget periods run from the 15th of one month to the 14th of the next.
// A period is identified by the "yyyy-mm" of the month it starts in.

export const PERIOD_START_DAY = 15;

export function getMonthKey(date = new Date()) {
  if (date.getDate() < PERIOD_START_DAY) {
    const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function shiftMonth(mk: string, delta: number) {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function getMonthLabel(mk: string) {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function getShortMonthLabel(mk: string) {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export function periodBounds(mk: string) {
  const [y, m] = mk.split('-').map(Number);
  return { start: new Date(y, m - 1, PERIOD_START_DAY), end: new Date(y, m, PERIOD_START_DAY - 1) };
}

export function getPeriodLabel(mk: string) {
  const { start, end } = periodBounds(mk);
  const s = start.toLocaleString('en-US', { month: 'long', day: 'numeric' });
  const e = end.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

/** Days left in the period, counting today. */
export function daysLeftInPeriod(mk: string, now = new Date()) {
  const { end } = periodBounds(mk);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86400000) + 1);
}

export function pad(n: number) { return `${n}`.padStart(2, '0'); }

/** Local yyyy-mm-dd, never a UTC slice (avoids timezone-shift bugs). */
export function toLocalDateStr(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr() { return toLocalDateStr(new Date()); }

export function dateStrToIso(dateStr: string) { return new Date(dateStr + 'T12:00:00').toISOString(); }

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmt(v: number) {
  const neg = v < 0;
  const abs = Math.abs(v);
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${neg ? '-' : ''}₪${s}`;
}

export function fmtShort(v: number) {
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${Math.round(abs)}`;
  return `${v < 0 ? '-' : ''}₪${s}`;
}

export function parseAmount(text: string) {
  const v = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(v) ? v : NaN;
}

let idCounter = 0;
export function uid() {
  idCounter = (idCounter + 1) % 1000;
  return `${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function sum<T>(items: T[], pick: (t: T) => number) {
  return items.reduce((s, t) => s + pick(t), 0);
}

export function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/** Date (yyyy-mm-dd) a recurring "day of month" lands on inside a period. */
export function recurringDateInPeriod(mk: string, day: number) {
  const [y, m] = mk.split('-').map(Number);
  // days >= 15 fall in the starting month, days < 15 in the following month
  const monthIndex = day >= PERIOD_START_DAY ? m - 1 : m;
  const lastDay = new Date(y, monthIndex + 1, 0).getDate();
  const d = new Date(y, monthIndex, Math.min(day, lastDay));
  return toLocalDateStr(d);
}
