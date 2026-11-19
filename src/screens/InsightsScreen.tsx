import { useMemo, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { forecast, goalContributionsInPeriod } from '../actions';
import { DailyBars, Donut, Legend, MonthCompare, type MonthPoint } from '../components/Charts';
import { MonthPicker } from '../components/forms';
import { Btn, Card, Empty, Heading, ListRow, Row, Segmented, Stat, Sub, SummaryRow, Title } from '../components/ui';
import { emptyMonth } from '../storage';
import { useStore } from '../store';
import { fmt, getMonthLabel, getPeriodLabel, getShortMonthLabel, periodBounds, shiftMonth, shortDate, sum, toLocalDateStr } from '../utils';

export type InsightsTab = 'charts' | 'daily' | 'balance' | 'history';

export function InsightsScreen({ selKey, setSelKey, tab, setTab, openMonth }: { selKey: string; setSelKey: (k: string) => void; tab: InsightsTab; setTab: (t: InsightsTab) => void; openMonth: (k: string) => void }) {
  return (
    <View style={{ gap: 14 }}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'charts', label: '📊 Charts' }, { key: 'daily', label: '📅 Daily' }, { key: 'balance', label: '💰 Balance' }, { key: 'history', label: '🗂 History' }]} />
      {tab !== 'history' && <MonthPicker value={selKey} onChange={setSelKey} />}
      {tab === 'charts' && <ChartsTab selKey={selKey} />}
      {tab === 'daily' && <DailyTab selKey={selKey} />}
      {tab === 'balance' && <BalanceTab selKey={selKey} />}
      {tab === 'history' && <HistoryTab openMonth={openMonth} />}
    </View>
  );
}

// ═════════════════════════════ CHARTS ═════════════════════════════
function ChartsTab({ selKey }: { selKey: string }) {
  const { data, theme } = useStore();
  const [scope, setScope] = useState<'all' | 'fun' | 'reg'>('all');
  const m = data.months[selKey] ?? emptyMonth();

  const slices = useMemo(() => {
    const out: { key: string; label: string; value: number; color: string }[] = [];
    if (scope !== 'reg') data.funCategories.forEach(c => out.push({ key: `f-${c.key}`, label: scope === 'all' ? `${c.label} (fun)` : c.label, color: c.color, value: sum(m.funExpenses.filter(e => e.category === c.key), e => e.amount) }));
    if (scope !== 'fun') data.regCategories.forEach(c => out.push({ key: `r-${c.key}`, label: c.label, color: c.color, value: sum(m.regExpenses.filter(e => e.category === c.key), e => e.amount) }));
    return out;
  }, [scope, data.funCategories, data.regCategories, m]);

  const points: MonthPoint[] = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const k = shiftMonth(selKey, i - 5);
    const mm = data.months[k] ?? emptyMonth();
    return { key: k, label: getShortMonthLabel(k), income: sum(mm.income, e => e.amount), reg: sum(mm.regExpenses, e => e.amount), fun: sum(mm.funExpenses, e => e.amount) };
  }), [selKey, data.months]);

  const prev = points[4];
  const cur = points[5];
  const curSpent = cur.reg + cur.fun;
  const prevSpent = prev.reg + prev.fun;
  const change = prevSpent > 0 ? (curSpent - prevSpent) / prevSpent : null;
  const active = points.filter(p => p.reg + p.fun > 0);
  const avg = active.length ? sum(active, p => p.reg + p.fun) / active.length : 0;

  return (
    <>
      <Card>
        <Title>Where the money went</Title>
        <Sub>{getPeriodLabel(selKey)} · tap a slice or a row for details.</Sub>
        <Segmented value={scope} onChange={setScope} options={[{ key: 'all', label: 'All' }, { key: 'reg', label: 'Regular' }, { key: 'fun', label: 'Fun' }]} />
        <Donut slices={slices} title={scope === 'all' ? 'Total spent' : scope === 'fun' ? 'Fun spent' : 'Regular spent'} />
      </Card>

      <Card>
        <Title>Month to month</Title>
        <Sub>The last 6 periods. Tap a month to see its numbers.</Sub>
        <MonthCompare points={points} />
      </Card>

      <Card>
        <Title>Quick insights</Title>
        <Row>
          <Stat tone="blue" label="Spent this period" value={fmt(curSpent)} />
          <Stat tone="peach" label="6-month average" value={fmt(avg)} />
        </Row>
        {change !== null && (
          <SummaryRow label={`vs ${getMonthLabel(prev.key)}`} value={`${change > 0 ? '▲' : '▼'} ${Math.abs(Math.round(change * 100))}%`} tone={change > 0 ? 'bad' : 'good'} />
        )}
        <Sub>{change === null ? 'Log a couple of months to see trends here.' : change > 0 ? 'You spent more than the previous period.' : 'You spent less than the previous period — nice! 🎉'}</Sub>
      </Card>
    </>
  );
}

// ═════════════════════════════ DAILY ═════════════════════════════
function DailyTab({ selKey }: { selKey: string }) {
  const { data, theme } = useStore();
  const m = data.months[selKey] ?? emptyMonth();
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const { start, end } = periodBounds(selKey);
    const out: { dateStr: string; label: string; fun: number; reg: number; dayNum: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const ds = toLocalDateStr(cur);
      out.push({
        dateStr: ds, dayNum: cur.getDate(),
        label: cur.toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        fun: sum(m.funExpenses.filter(e => toLocalDateStr(e.createdAt) === ds), e => e.amount),
        reg: sum(m.regExpenses.filter(e => toLocalDateStr(e.createdAt) === ds), e => e.amount),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [selKey, m]);
  const max = Math.max(1, ...days.map(d => d.fun + d.reg));
  const today = toLocalDateStr(new Date());
  const periodEnd = days[days.length - 1].dateStr;
  const upcoming = useMemo(() => (periodEnd > today ? forecast(data, periodEnd).events.filter(e => e.date >= days[0].dateStr) : []), [data, periodEnd, today, days]);
  const upcomingByDay = useMemo(() => {
    const m: Record<string, { out: number; inc: number }> = {};
    upcoming.forEach(e => { const x = (m[e.date] ??= { out: 0, inc: 0 }); if (e.amount < 0) x.out += -e.amount; else x.inc += e.amount; });
    return m;
  }, [upcoming]);
  const noSpend = days.filter(d => d.dateStr <= toLocalDateStr(new Date()) && d.fun + d.reg === 0).length;

  const cells: (typeof days[0] | null)[] = [];
  const firstWd = new Date(days[0].dateStr + 'T12:00:00').getDay();
  for (let i = 0; i < firstWd; i++) cells.push(null);
  cells.push(...days);
  while (cells.length % 7) cells.push(null);
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const day = selected ? days.find(d => d.dateStr === selected) : null;
  const dayFun = selected ? m.funExpenses.filter(e => toLocalDateStr(e.createdAt) === selected) : [];
  const dayReg = selected ? m.regExpenses.filter(e => toLocalDateStr(e.createdAt) === selected) : [];

  return (
    <>
      <Card>
        <Title>Daily spending calendar</Title>
        <Sub>{getPeriodLabel(selKey)} · darker = more spent. Tap a day.</Sub>
        <Legend items={[{ label: 'Spent', color: theme.primary }, { label: 'No-spend day', color: theme.cardAlt }]} />
        {upcoming.length > 0 && <Text style={{ color: theme.textSoft, fontSize: 13, fontWeight: '600' }}>⬚ Dashed days have upcoming charges (red) or income (green).</Text>}
        <View style={{ flexDirection: 'row' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={{ flex: 1, textAlign: 'center', color: theme.textFaint, fontSize: 11, fontWeight: '700' }}>{d}</Text>)}
        </View>
        {weeks.map((w, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap: 4 }}>
            {w.map((d, di) => {
              if (!d) return <View key={di} style={{ flex: 1, aspectRatio: 1 }} />;
              const total = d.fun + d.reg;
              const intensity = total > 0 ? 0.2 + 0.8 * Math.min(total / max, 1) : 0;
              const sel = selected === d.dateStr;
              const up = upcomingByDay[d.dateStr];
              const isToday = d.dateStr === today;
              return (
                <Pressable key={di} onPress={() => setSelected(sel ? null : d.dateStr)}
                  style={{ flex: 1, aspectRatio: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: total > 0 ? hexAlpha(theme.primary, intensity) : theme.cardAlt,
                    borderWidth: sel || up || isToday ? 2 : 0, borderStyle: up && !sel ? 'dashed' : 'solid', borderColor: sel ? theme.accent : up ? (up.out >= up.inc ? theme.bad : theme.good) : theme.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: intensity > 0.55 ? '#fff' : theme.text }}>{d.dayNum}</Text>
                  {total > 0 && <Text style={{ fontSize: 8, fontWeight: '800', color: intensity > 0.55 ? '#fff' : theme.textSoft }}>₪{Math.round(total)}</Text>}
                  {!total && up && <Text style={{ fontSize: 8, fontWeight: '800', color: up.out >= up.inc ? theme.bad : theme.good }}>{up.out >= up.inc ? `-₪${Math.round(up.out)}` : `+₪${Math.round(up.inc)}`}</Text>}
                </Pressable>
              );
            })}
          </View>
        ))}
        <Sub>🌱 {noSpend} no-spend {noSpend === 1 ? 'day' : 'days'} so far this period.</Sub>
      </Card>

      {day && (
        <Card>
          <Title>{day.label}</Title>
          {!dayFun.length && !dayReg.length && !upcoming.some(e => e.date === selected) && <Empty>{selected && selected > today ? 'Nothing planned for this day.' : 'Nothing spent on this day. 🌱'}</Empty>}
          {upcoming.some(e => e.date === selected) && <Heading>📆 Coming up</Heading>}
          {upcoming.filter(e => e.date === selected).map(e => (
            <ListRow key={e.key} color={e.amount >= 0 ? theme.chartIncome : theme.bad} title={e.label} subtitle={`${e.detail}${e.source === 'scheduled' ? ' · planned' : ''}`}
              right={<Text style={{ color: e.amount >= 0 ? theme.good : theme.bad, fontWeight: '800' }}>{e.amount >= 0 ? '+' : ''}{fmt(e.amount)}</Text>} />
          ))}
          {dayFun.length > 0 && <Heading>🫙 Fun</Heading>}
          {dayFun.map(e => { const c = data.funCategories.find(x => x.key === e.category); return <ListRow key={e.id} color={c?.color} title={c?.label ?? 'Other'} subtitle={e.note || 'No note'} right={<Text style={{ color: theme.text, fontWeight: '800' }}>{fmt(e.amount)}</Text>} />; })}
          {dayReg.length > 0 && <Heading>💳 Regular</Heading>}
          {dayReg.map(e => { const c = data.regCategories.find(x => x.key === e.category); return <ListRow key={e.id} color={c?.color} title={c?.label ?? 'Other'} subtitle={e.note || 'No note'} right={<Text style={{ color: theme.text, fontWeight: '800' }}>{fmt(e.amount)}</Text>} />; })}
          {day.fun + day.reg > 0 && <SummaryRow label="Total this day" value={fmt(day.fun + day.reg)} />}
        </Card>
      )}

      <Card>
        <Title>Daily totals</Title>
        <Sub>Scroll sideways to see the whole period.</Sub>
        <DailyBars days={days} selected={selected} onSelect={setSelected} />
      </Card>
    </>
  );
}

function hexAlpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

// ═════════════════════════════ BALANCE ═════════════════════════════
type TxType = 'income' | 'fun' | 'reg' | 'savings';

function BalanceTab({ selKey }: { selKey: string }) {
  const { data, theme } = useStore();
  const m = data.months[selKey] ?? emptyMonth();
  const goalsIn = goalContributionsInPeriod(data, selKey);

  const txs = [
    ...m.income.map(e => ({ id: e.id, date: e.createdAt, amount: e.amount, type: 'income' as TxType, label: e.source, note: e.note })),
    ...m.funExpenses.map(e => ({ id: e.id, date: e.createdAt, amount: -e.amount, type: 'fun' as TxType, label: data.funCategories.find(c => c.key === e.category)?.label ?? 'Fun', note: e.note })),
    ...m.regExpenses.map(e => ({ id: e.id, date: e.createdAt, amount: -e.amount, type: 'reg' as TxType, label: data.regCategories.find(c => c.key === e.category)?.label ?? 'Regular', note: e.note })),
    ...(m.savingsEnabled && m.savingsSetAside > 0 ? [{ id: 'savings', date: periodBounds(selKey).start.toISOString(), amount: -m.savingsSetAside, type: 'savings' as TxType, label: 'Savings', note: 'Set aside this month' }] : []),
    ...goalsIn.map(g => ({ id: g.id, date: g.createdAt, amount: -g.amount, type: 'savings' as TxType, label: g.label, note: g.note || (g.amount < 0 ? 'Taken out of goal' : 'Goal savings') })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const withBal = txs.map(t => { running += t.amount; return { ...t, balance: running }; });

  const totalIn = sum(m.income, e => e.amount);
  const regSpent = sum(m.regExpenses, e => e.amount);
  const funSpent = sum(m.funExpenses, e => e.amount);
  const saved = (m.savingsEnabled ? m.savingsSetAside : 0) + sum(goalsIn, g => g.amount);
  const net = totalIn - regSpent - funSpent - saved;
  const color: Record<TxType, string> = { income: theme.chartIncome, fun: theme.chartFun, reg: theme.chartReg, savings: theme.gold };
  const icon: Record<TxType, string> = { income: '↑', fun: '↓', reg: '↓', savings: '→' };

  return (
    <>
      <Card style={{ backgroundColor: net >= 0 ? theme.goodBg : theme.badBg }}>
        <Title>Account balance</Title>
        <Sub>{getPeriodLabel(selKey)}</Sub>
        <Text style={{ fontSize: 46, fontWeight: '900', color: net >= 0 ? theme.good : theme.bad, letterSpacing: -1 }}>{net >= 0 ? '+' : ''}{fmt(net)}</Text>
        <Sub>{net >= 0 ? 'You are in the green this month. 💚' : 'Your expenses are more than your logged income this month.'}</Sub>
      </Card>
      <Card>
        <Title>Breakdown</Title>
        <SummaryRow label="↑ Total income" value={fmt(totalIn)} tone="good" />
        <SummaryRow label="↓ Regular expenses" value={`−${fmt(regSpent)}`} tone="bad" />
        <SummaryRow label="↓ Fun expenses" value={`−${fmt(funSpent)}`} tone="bad" />
        {saved !== 0 && <SummaryRow label="→ Saved (incl. goals)" value={`−${fmt(saved)}`} tone="warn" />}
        <SummaryRow bold label="= Balance" value={`${net >= 0 ? '+' : ''}${fmt(net)}`} tone={net >= 0 ? 'good' : 'bad'} />
      </Card>
      <Card>
        <Title>Transaction log</Title>
        <Sub>Every entry in order, with your running balance.</Sub>
        {withBal.length === 0 && <Empty>Nothing logged yet.</Empty>}
        {withBal.map((t, i) => (
          <View key={t.id + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: color[t.type], justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>{icon[t.type]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800' }} numberOfLines={1}>{t.label}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12 }} numberOfLines={1}>{t.note ? `${t.note} · ` : ''}{shortDate(t.date)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '800', color: t.amount >= 0 ? theme.good : theme.bad }}>{t.amount >= 0 ? '+' : ''}{fmt(t.amount)}</Text>
              <Text style={{ fontWeight: '700', fontSize: 12, color: theme.textSoft }}>{fmt(t.balance)}</Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

// ═════════════════════════════ HISTORY ═════════════════════════════
function HistoryTab({ openMonth }: { openMonth: (k: string) => void }) {
  const { data } = useStore();
  const entries = Object.entries(data.months).sort(([a], [b]) => b.localeCompare(a));
  const csv = useMemo(() => {
    const rows = Object.entries(data.months).sort().map(([mk, v]) => {
      const f = sum(v.funExpenses, e => e.amount), inc = sum(v.income, e => e.amount), r = sum(v.regExpenses, e => e.amount);
      return `"${getPeriodLabel(mk)}",${inc.toFixed(2)},${r.toFixed(2)},${v.funBudget.toFixed(2)},${f.toFixed(2)}`;
    });
    return ['Period,Income,Regular Expenses,Fun Budget,Fun Spent', ...rows].join('\n');
  }, [data.months]);

  return (
    <>
      <Card>
        <Title>Month-by-month history</Title>
        <Sub>Every period in one place. For a full backup, use Settings ⚙️.</Sub>
        <Btn kind="secondary" label="Share as CSV" onPress={() => Share.share({ message: csv, title: "Dini's Money Jar export" })} />
      </Card>
      {entries.map(([mk, v]) => {
        const f = sum(v.funExpenses, e => e.amount), inc = sum(v.income, e => e.amount), r = sum(v.regExpenses, e => e.amount);
        return (
          <Card key={mk}>
            <Title right={<Btn small kind="secondary" label="Open" onPress={() => openMonth(mk)} />}>{getMonthLabel(mk)}</Title>
            <Sub>{getPeriodLabel(mk)}</Sub>
            <Row><Stat tone="green" label="Income" value={fmt(inc)} /><Stat tone="pink" label="Regular" value={fmt(r)} /></Row>
            <SummaryRow label="Disposable income" value={fmt(inc - r)} tone={inc - r >= 0 ? 'good' : 'bad'} />
            <Row><Stat tone="yellow" label="Fun budget" value={fmt(v.funBudget)} /><Stat tone="purple" label="Fun spent" value={fmt(f)} /></Row>
          </Card>
        );
      })}
    </>
  );
}
