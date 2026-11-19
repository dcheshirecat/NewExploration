import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ensureMonth, getWarnings, upsertRecurring } from '../actions';
import { CategoryEditor, ExpenseForm, ExpenseList, IncomeForm, MonthPicker } from '../components/forms';
import { Jar } from '../components/Jar';
import { Banner, Btn, Card, Chip, Empty, Heading, Input, ListRow, Progress, Row, SmallLink, Stat, Sub, SummaryRow, Title, Wrap } from '../components/ui';
import { emptyMonth, INCOME_SOURCES } from '../storage';
import { confirmAction, useStore } from '../store';
import type { RecurringItem, RecurringKind } from '../types';
import { daysLeftInPeriod, fmt, getMonthKey, getPeriodLabel, parseAmount, shortDate, sum, uid } from '../utils';
import { Segmented } from '../components/ui';
import { UpcomingTab } from './UpcomingTab';

export type BudgetTab = 'jar' | 'life' | 'upcoming' | 'recurring';
const QUICK_BUDGETS = [250, 500, 750, 1000, 1500, 2000];

export function BudgetScreen({ selKey, setSelKey, tab, setTab }: { selKey: string; setSelKey: (k: string) => void; tab: BudgetTab; setTab: (t: BudgetTab) => void }) {
  return (
    <View style={{ gap: 14 }}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'jar', label: '🫙 Fun' }, { key: 'life', label: '💳 Life' }, { key: 'upcoming', label: '📆 Upcoming' }, { key: 'recurring', label: '🔁 Repeat' }]} />
      {(tab === 'jar' || tab === 'life') && <MonthPicker value={selKey} onChange={setSelKey} />}
      {tab === 'jar' && <FunJarTab selKey={selKey} />}
      {tab === 'life' && <LifeTab selKey={selKey} />}
      {tab === 'upcoming' && <UpcomingTab />}
      {tab === 'recurring' && <RecurringTab />}
    </View>
  );
}

// ═════════════════════════════ FUN JAR ═════════════════════════════
function FunJarTab({ selKey }: { selKey: string }) {
  const { data, update, theme } = useStore();
  const month = data.months[selKey] ?? emptyMonth();
  const funSpent = sum(month.funExpenses, e => e.amount);
  const funLeft = month.funBudget - funSpent;
  const level = month.funBudget > 0 ? funLeft / month.funBudget : 0;
  const isCurrent = selKey === getMonthKey();
  const daysLeft = daysLeftInPeriod(selKey);
  const perDay = isCurrent && daysLeft > 0 && funLeft > 0 ? funLeft / daysLeft : 0;
  const warnings = getWarnings(data, selKey).filter(w => w.kind === 'fun');

  const [budgetIn, setBudgetIn] = useState('');
  const [savIn, setSavIn] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { setBudgetIn(month.funBudget ? `${month.funBudget}` : ''); setSavIn(month.savingsSetAside ? `${month.savingsSetAside}` : ''); }, [selKey, month.funBudget, month.savingsSetAside]);

  const saveBudget = () => {
    const v = parseAmount(budgetIn);
    if (!(v > 0)) { setErr('Enter a budget above 0'); return; }
    if (month.funBudget > 0 && v > month.funBudget) { setErr('Budget is locked — you can lower it, but not raise it once the month has started.'); return; }
    setErr('');
    update(d => { ensureMonth(d, selKey).funBudget = v; return `Fun budget set to ${fmt(v)}`; });
  };
  const toggleSavings = () => update(d => {
    const m = ensureMonth(d, selKey);
    if (m.savingsEnabled) { m.savingsEnabled = false; m.savingsSetAside = 0; } else m.savingsEnabled = true;
  });
  const saveSavings = () => {
    const v = parseAmount(savIn);
    if (!(v >= 0)) return;
    update(d => { const m = ensureMonth(d, selKey); m.savingsEnabled = true; m.savingsSetAside = v; return `Savings set aside: ${fmt(v)}`; });
  };
  const resetMonth = () => confirmAction('Reset this month?', 'This clears every entry for this month only.', 'Reset', () => update(d => { d.months[selKey] = emptyMonth(); return 'Month cleared'; }));
  const del = (id: string) => update(d => { const m = ensureMonth(d, selKey); m.funExpenses = m.funExpenses.filter(e => e.id !== id); });

  return (
    <>
      <Card>
        <Title>Fun Jar 🫙</Title>
        <Sub>{getPeriodLabel(selKey)} · the jar empties as you spend on fun things.</Sub>
        {warnings.map(w => <Banner key={w.key} tone={w.level === 'over' ? 'bad' : 'warn'} text={`${w.level === 'over' ? '🚨' : '⚠️'} ${w.text}`} />)}
        <Jar level={level} label={month.funBudget > 0 ? fmt(Math.max(funLeft, 0)) : undefined} />
        {month.funBudget === 0 && <Banner tone="info" text="Set a fun budget below to fill your jar ✨" />}
        <Row><Stat tone="pink" label="Fun spent" value={fmt(funSpent)} /><Stat tone="green" label="Left to spend" value={fmt(funLeft)} /></Row>
        <Row><Stat tone="yellow" label="Fun budget" value={fmt(month.funBudget)} /><Stat tone="purple" label={perDay ? 'Per day left' : 'Savings tucked away'} value={perDay ? fmt(perDay) : fmt(month.savingsEnabled ? month.savingsSetAside : 0)} /></Row>
      </Card>

      <Card>
        <Title right={<SmallLink label="Reset month" danger onPress={resetMonth} />}>Set fun budget</Title>
        <Sub>{month.funBudget > 0 ? `Locked at ${fmt(month.funBudget)}. You can lower it but not raise it.` : 'How much do you want to spend on fun things this month?'}</Sub>
        <Input value={budgetIn} onChangeText={setBudgetIn} keyboardType="decimal-pad" placeholder="e.g. 600" />
        <Wrap>{QUICK_BUDGETS.map(a => <Chip key={a} label={fmt(a)} active={budgetIn === `${a}`} color={theme.gold} onPress={() => setBudgetIn(`${a}`)} />)}</Wrap>
        {err ? <Sub style={{ color: theme.bad }}>{err}</Sub> : null}
        <Btn label={month.funBudget > 0 ? 'Save lower budget' : 'Save budget'} onPress={saveBudget} />
      </Card>

      <Card>
        <Title>Savings this month</Title>
        <Pressable onPress={toggleSavings} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: month.savingsEnabled ? theme.statPurple : theme.cardAlt, borderRadius: 16, padding: 12 }}>
          <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: theme.primary, backgroundColor: month.savingsEnabled ? theme.primary : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
            {month.savingsEnabled ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Heading>Set money aside this month</Heading>
            <Sub>A simple amount you put away. For specific things you&apos;re saving for, use Goals 🎯.</Sub>
          </View>
        </Pressable>
        {month.savingsEnabled && (
          <Row>
            <Input style={{ flex: 1 }} value={savIn} onChangeText={setSavIn} keyboardType="decimal-pad" placeholder="How much to save?" />
            <Btn label="Save" onPress={saveSavings} />
          </Row>
        )}
      </Card>

      <Card>
        <Title>Add fun expense</Title>
        <ExpenseForm kind="fun" />
      </Card>

      <Card>
        <Title>Fun spending by category</Title>
        {month.funExpenses.length === 0 ? <Empty>No fun expenses yet this month.</Empty> : data.funCategories.map(c => {
          const total = sum(month.funExpenses.filter(e => e.category === c.key), e => e.amount);
          if (!total) return null;
          return (
            <View key={c.key} style={{ gap: 6 }}>
              <Row><View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: c.color }} /><Text style={{ flex: 1, color: theme.text, fontWeight: '700' }}>{c.label}</Text><Text style={{ color: theme.text, fontWeight: '800' }}>{fmt(total)}</Text></Row>
              <Progress value={funSpent ? total / funSpent : 0} color={c.color} height={6} />
            </View>
          );
        })}
      </Card>

      <Card>
        <Title>Recent fun expenses</Title>
        {month.funExpenses.length === 0 ? <Empty>Nothing logged yet.</Empty> : <ExpenseList items={month.funExpenses} cats={data.funCategories} onDelete={del} limit={8} />}
      </Card>

      <Card>
        <Title>Fun categories</Title>
        <CategoryEditor kind="fun" />
      </Card>
    </>
  );
}

// ═════════════════════════════ LIFE ═════════════════════════════
function LifeTab({ selKey }: { selKey: string }) {
  const { data, update, theme } = useStore();
  const month = data.months[selKey] ?? emptyMonth();
  const totalIncome = sum(month.income, e => e.amount);
  const regSpent = sum(month.regExpenses, e => e.amount);
  const disposable = totalIncome - regSpent;
  const afterFun = disposable - month.funBudget;
  const [planInputs, setPlanInputs] = useState<Record<string, string>>({});
  const warnings = getWarnings(data, selKey).filter(w => w.kind === 'reg');

  const savePlan = (key: string) => {
    const v = parseAmount(planInputs[key] ?? '');
    if (!(v >= 0)) return;
    update(d => { ensureMonth(d, selKey).regBudgets[key] = v; });
    setPlanInputs(p => ({ ...p, [key]: '' }));
  };
  const copyPlans = () => update(d => {
    const keys = Object.keys(d.months).filter(k => k < selKey && Object.keys(d.months[k].regBudgets).length).sort();
    const src = keys.at(-1);
    if (!src) return 'No earlier month with plans to copy';
    ensureMonth(d, selKey).regBudgets = { ...d.months[src].regBudgets };
    return 'Copied plans from your last planned month';
  });

  return (
    <>
      <Card>
        <Title>This month at a glance</Title>
        <Sub>{getPeriodLabel(selKey)}</Sub>
        <Row><Stat tone="green" label="Income received" value={fmt(totalIncome)} /><Stat tone="pink" label="Regular expenses" value={fmt(regSpent)} /></Row>
        <SummaryRow label="Disposable income" value={fmt(disposable)} tone={disposable >= 0 ? 'good' : 'bad'} />
        <SummaryRow label="Fun budget allocated" value={fmt(month.funBudget)} tone="plain" />
        {totalIncome > 0 ? <SummaryRow label="After fun budget" value={fmt(afterFun)} tone={afterFun >= 0 ? 'info' : 'bad'} /> : <Sub>Log your income below to see the full picture.</Sub>}
      </Card>

      <Card>
        <Title>Income received</Title>
        <Sub>Log every paycheck, payment or transfer.</Sub>
        <IncomeForm monthKey={selKey} />
        {month.income.map(e => (
          <ListRow key={e.id} color={theme.chartIncome} title={e.source} subtitle={`${e.recurringId ? '🔁 ' : ''}${e.note || 'No note'} · ${shortDate(e.createdAt)}`}
            right={<View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: theme.good, fontWeight: '800' }}>+{fmt(e.amount)}</Text>
              <SmallLink danger label="Delete" onPress={() => update(d => { const m = ensureMonth(d, selKey); m.income = m.income.filter(x => x.id !== e.id); })} />
            </View>} />
        ))}
      </Card>

      <Card>
        <Title>Regular expenses</Title>
        <Sub>Groceries, transport, rent, utilities — the essentials. Planned vs actual:</Sub>
        {warnings.map(w => <Banner key={w.key} tone={w.level === 'over' ? 'bad' : 'warn'} text={`${w.level === 'over' ? '🚨' : '⚠️'} ${w.text}`} />)}
        {data.regCategories.map(c => {
          const planned = month.regBudgets[c.key] ?? 0;
          const actual = sum(month.regExpenses.filter(e => e.category === c.key), e => e.amount);
          if (!planned && !actual) return null;
          const ratio = planned > 0 ? actual / planned : 0;
          const over = planned > 0 && actual > planned;
          const nearing = !over && ratio >= data.settings.warnAt && planned - actual > 0.005;
          const color = over ? theme.bad : nearing ? '#f5a623' : c.color;
          return (
            <View key={c.key} style={{ gap: 6 }}>
              <Row>
                <View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: c.color }} />
                <Text style={{ flex: 1, color: theme.text, fontWeight: '700' }}>{c.label}</Text>
                <Text style={{ color: over ? theme.bad : theme.text, fontWeight: '800' }}>{fmt(actual)}{planned > 0 ? ` / ${fmt(planned)}` : ''}</Text>
              </Row>
              {planned > 0 && <Progress value={ratio} color={color} />}
            </View>
          );
        })}
        <Heading>Log a regular expense</Heading>
        <ExpenseForm kind="reg" />
        {month.regExpenses.length > 0 && <>
          <Heading>Recent</Heading>
          <ExpenseList items={month.regExpenses} cats={data.regCategories} limit={8} onDelete={id => update(d => { const m = ensureMonth(d, selKey); m.regExpenses = m.regExpenses.filter(e => e.id !== id); })} />
        </>}
      </Card>

      <Card>
        <Title right={<SmallLink label="Copy last month" onPress={copyPlans} />}>Monthly plans</Title>
        <Sub>How much you expect to spend per category. You&apos;ll get a warning at {Math.round(data.settings.warnAt * 100)}% and when you go over.</Sub>
        {data.regCategories.map(c => {
          const planned = month.regBudgets[c.key] ?? 0;
          return (
            <View key={c.key} style={{ gap: 6 }}>
              <Row>
                <View style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: c.color }} />
                <Text style={{ flex: 1, color: theme.text, fontWeight: '700' }}>{c.label}</Text>
                {planned > 0 && <Text style={{ color: theme.textSoft, fontWeight: '700' }}>{fmt(planned)} planned</Text>}
              </Row>
              <Row>
                <Input style={{ flex: 1 }} value={planInputs[c.key] ?? ''} onChangeText={v => setPlanInputs(p => ({ ...p, [c.key]: v }))} keyboardType="decimal-pad" placeholder={planned > 0 ? `Currently ${fmt(planned)}` : 'Set planned amount'} />
                <Btn label="Set" onPress={() => savePlan(c.key)} />
              </Row>
            </View>
          );
        })}
      </Card>

      <Card>
        <Title>Regular categories</Title>
        <CategoryEditor kind="reg" />
      </Card>
    </>
  );
}

// ═════════════════════════════ RECURRING ═════════════════════════════
const KIND_LABEL: Record<RecurringKind, string> = { reg: 'Regular expense', fun: 'Fun expense', income: 'Income' };

function RecurringTab() {
  const { data, update, theme } = useStore();
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const totals = {
    income: sum(data.recurring.filter(r => r.active && r.kind === 'income'), r => r.amount),
    out: sum(data.recurring.filter(r => r.active && r.kind !== 'income'), r => r.amount),
  };
  const labelFor = (r: RecurringItem) => r.kind === 'income' ? r.category
    : (r.kind === 'fun' ? data.funCategories : data.regCategories).find(c => c.key === r.category)?.label ?? 'Other';
  const colorFor = (r: RecurringItem) => r.kind === 'income' ? theme.chartIncome
    : (r.kind === 'fun' ? data.funCategories : data.regCategories).find(c => c.key === r.category)?.color ?? theme.primary;

  return (
    <>
      <Card>
        <Title>Recurring items 🔁</Title>
        <Sub>Rent, phone bill, subscriptions, your salary… Add them once and they&apos;re logged automatically on their day every month.</Sub>
        <Row><Stat tone="green" label="Monthly in" value={fmt(totals.income)} /><Stat tone="pink" label="Monthly out" value={fmt(totals.out)} /></Row>
      </Card>

      <Card>
        <Title>{editing && data.recurring.some(r => r.id === editing.id) ? 'Edit recurring item' : 'Add recurring item'}</Title>
        <RecurringForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />
      </Card>

      <Card>
        <Title>Your recurring items</Title>
        {data.recurring.length === 0 ? <Empty>No recurring items yet.</Empty> : [...data.recurring].sort((a, b) => a.day - b.day).map(r => (
          <ListRow key={r.id} color={colorFor(r)} title={`${r.note || labelFor(r)}`}
            subtitle={`${KIND_LABEL[r.kind]} · ${labelFor(r)} · every ${ordinal(r.day)}${r.active ? '' : ' · paused'}`}
            right={<View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ color: r.kind === 'income' ? theme.good : theme.text, fontWeight: '800', opacity: r.active ? 1 : 0.5 }}>{r.kind === 'income' ? '+' : ''}{fmt(r.amount)}</Text>
              <Row style={{ gap: 10 }}>
                <SmallLink label="Edit" onPress={() => setEditing(r)} />
                <SmallLink label={r.active ? 'Pause' : 'Resume'} onPress={() => update(d => { const x = d.recurring.find(i => i.id === r.id); if (x) x.active = !x.active; })} />
                <SmallLink danger label="Delete" onPress={() => confirmAction('Delete recurring item?', 'Entries already added stay in your history.', 'Delete', () => update(d => { d.recurring = d.recurring.filter(i => i.id !== r.id); }))} />
              </Row>
            </View>} />
        ))}
      </Card>
    </>
  );
}

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

function RecurringForm({ initial, onDone }: { initial: RecurringItem | null; onDone: () => void }) {
  const { data, update, theme } = useStore();
  const [kind, setKind] = useState<RecurringKind>(initial?.kind ?? 'reg');
  const [cat, setCat] = useState(initial?.category ?? '');
  const [amt, setAmt] = useState(initial ? `${initial.amount}` : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [day, setDay] = useState(initial?.day ?? 1);
  const [err, setErr] = useState('');
  const options = kind === 'income' ? INCOME_SOURCES.map(s => ({ key: s, label: s, color: theme.chartIncome })) : (kind === 'fun' ? data.funCategories : data.regCategories);
  const category = options.some(o => o.key === cat) ? cat : options[0]?.key;

  const save = () => {
    const v = parseAmount(amt);
    if (!(v > 0)) { setErr('Enter an amount above 0'); return; }
    const item: RecurringItem = { id: initial?.id ?? uid(), kind, category, amount: v, note: note.trim(), day, active: initial?.active ?? true };
    update(d => { upsertRecurring(d, item); return initial ? 'Recurring item updated' : `Added — it'll be logged on the ${ordinal(day)} each month`; });
    setAmt(''); setNote(''); setErr('');
    onDone();
  };

  return (
    <View style={{ gap: 10 }}>
      <Segmented value={kind} onChange={setKind} options={[{ key: 'reg', label: 'Regular' }, { key: 'fun', label: 'Fun' }, { key: 'income', label: 'Income' }]} />
      <Input value={note} onChangeText={setNote} placeholder="Name (e.g. Rent, Netflix, Salary)" />
      <Input value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Amount (₪)" />
      <Wrap>{options.map(o => <Chip key={o.key} label={o.label} active={category === o.key} color={o.color} onPress={() => setCat(o.key)} />)}</Wrap>
      <Heading>Day of the month: {ordinal(day)}</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(n => (
          <Pressable key={n} onPress={() => setDay(n)} style={{ width: 38, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: n === day ? theme.primary : theme.chip }}>
            <Text style={{ color: n === day ? '#fff' : theme.chipText, fontWeight: '700', fontSize: 13 }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      {err ? <Sub style={{ color: theme.bad }}>{err}</Sub> : null}
      <Row>
        <Btn style={{ flex: 1 }} label={initial ? 'Save changes' : 'Add recurring item'} onPress={save} />
        {initial && <Btn kind="secondary" label="Cancel" onPress={onDone} />}
      </Row>
    </View>
  );
}
