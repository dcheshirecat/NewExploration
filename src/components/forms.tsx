import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addExpense, addIncome } from '../actions';
import { FUN_COLORS, INCOME_SOURCES, REG_COLORS } from '../storage';
import { useStore } from '../store';
import type { Category, Expense } from '../types';
import { fmt, getMonthKey, getMonthLabel, parseAmount, shiftMonth, shortDate, todayStr } from '../utils';
import { DatePicker } from './DatePicker';
import { Btn, Chip, Input, ListRow, Row, SmallLink, Sub, Wrap, useStyles } from './ui';

// ── Month picker ─────────────────────────────────────────────────────────────
export function MonthPicker({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  const { data, theme } = useStore();
  const cur = getMonthKey();
  const ref = useRef<ScrollView>(null);
  const options = useMemo(() => {
    const keys = new Set(Object.keys(data.months));
    for (let i = -3; i <= 2; i++) keys.add(shiftMonth(cur, i));
    return Array.from(keys).sort();
  }, [data.months, cur]);
  const idx = options.indexOf(value);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.scrollTo({ x: Math.max(0, idx * 150 - 80), animated: false }), 50);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
      {options.map(mk => {
        const active = mk === value;
        return (
          <Pressable key={mk} onPress={() => onChange(mk)}
            style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: active ? theme.primary : theme.card, borderWidth: 1, borderColor: active ? theme.primary : theme.border }}>
            <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '700' }}>{getMonthLabel(mk)}{mk === cur ? ' •' : ''}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Expense form ─────────────────────────────────────────────────────────────
export function ExpenseForm({ kind, compact }: { kind: 'fun' | 'reg'; compact?: boolean }) {
  const { data, update } = useStore();
  const cats = kind === 'fun' ? data.funCategories : data.regCategories;
  const [cat, setCat] = useState(cats[0]?.key ?? '');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());
  const [err, setErr] = useState('');
  const category = cats.some(c => c.key === cat) ? cat : cats[0]?.key;

  const submit = () => {
    const v = parseAmount(amt);
    if (!(v > 0)) { setErr('Enter an amount above 0'); return; }
    setErr('');
    update(d => addExpense(d, kind, { amount: v, category, note, date }));
    setAmt(''); setNote('');
  };

  return (
    <View style={{ gap: 10 }}>
      <Wrap>
        {cats.map(c => <Chip key={c.key} label={c.label} active={category === c.key} color={c.color} onPress={() => setCat(c.key)} />)}
      </Wrap>
      <Input value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Amount spent (₪)" />
      <Input value={note} onChangeText={setNote} placeholder="Note (optional)" />
      {!compact && <DatePicker value={date} onChange={setDate} />}
      {err ? <Sub style={{ color: '#d14a76' }}>{err}</Sub> : null}
      <Btn label={kind === 'fun' ? 'Add fun expense' : 'Add regular expense'} onPress={submit} />
    </View>
  );
}

// ── Income form ──────────────────────────────────────────────────────────────
export function IncomeForm({ monthKey }: { monthKey: string }) {
  const { update } = useStore();
  const [amt, setAmt] = useState('');
  const [src, setSrc] = useState(INCOME_SOURCES[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    const v = parseAmount(amt);
    if (!(v > 0)) { setErr('Enter an amount above 0'); return; }
    setErr('');
    update(d => addIncome(d, monthKey, { amount: v, source: src, note }));
    setAmt(''); setNote('');
  };
  return (
    <View style={{ gap: 10 }}>
      <Input value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Amount received (₪)" />
      <Wrap>{INCOME_SOURCES.map(s => <Chip key={s} label={s} active={src === s} onPress={() => setSrc(s)} />)}</Wrap>
      <Input value={note} onChangeText={setNote} placeholder="Note (optional)" />
      {err ? <Sub style={{ color: '#d14a76' }}>{err}</Sub> : null}
      <Btn label="Add income" onPress={submit} />
    </View>
  );
}

// ── Expense list ─────────────────────────────────────────────────────────────
export function ExpenseList({ items, cats, onDelete, limit }: { items: Expense[]; cats: Category[]; onDelete?: (id: string) => void; limit?: number }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = limit && !showAll ? sorted.slice(0, limit) : sorted;
  return (
    <View style={{ gap: 8 }}>
      {shown.map(e => {
        const c = cats.find(x => x.key === e.category);
        return (
          <ListRow key={e.id} color={c?.color ?? '#a78bfa'} title={c?.label ?? 'Other'}
            subtitle={`${e.recurringId ? '🔁 ' : ''}${e.note || 'No note'} · ${shortDate(e.createdAt)}`}
            right={<View style={{ alignItems: 'flex-end', gap: 6 }}>
              <AmountText v={e.amount} />
              {onDelete && <SmallLink label="Delete" danger onPress={() => onDelete(e.id)} />}
            </View>} />
        );
      })}
      {limit && sorted.length > limit ? <SmallLink label={showAll ? 'Show less' : `Show all ${sorted.length}`} onPress={() => setShowAll(s => !s)} /> : null}
    </View>
  );
}

export function AmountText({ v, signed }: { v: number; signed?: boolean }) {
  const { theme } = useStore();
  const color = signed ? (v >= 0 ? theme.good : theme.bad) : theme.text;
  return <Text style={{ color, fontWeight: '800' }}>{signed && v > 0 ? '+' : ''}{fmt(v)}</Text>;
}

// ── Category editor ──────────────────────────────────────────────────────────
export function CategoryEditor({ kind }: { kind: 'fun' | 'reg' }) {
  const { data, update } = useStore();
  const s = useStyles(t => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.cardAlt, borderRadius: 16, padding: 10 },
    label: { flex: 1, color: t.text, fontWeight: '700' },
    dot: { width: 30, height: 30, borderRadius: 999 },
    dotActive: { borderWidth: 3, borderColor: t.text },
    swatch: { width: 16, height: 16, borderRadius: 999 },
  }));
  const cats = kind === 'fun' ? data.funCategories : data.regCategories;
  const colors = kind === 'fun' ? FUN_COLORS : REG_COLORS;
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const setCats = (d: typeof data, next: Category[]) => { if (kind === 'fun') d.funCategories = next; else d.regCategories = next; };

  const add = () => {
    const l = label.trim(); if (!l) return;
    const base = l.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cat';
    update(d => {
      const list = kind === 'fun' ? d.funCategories : d.regCategories;
      const key = list.some(c => c.key === base) ? `${base}-${Date.now()}` : base;
      setCats(d, [...list, { key, label: l, color }]);
      return `Added category “${l}”`;
    });
    setLabel('');
  };
  const rename = () => {
    if (!editKey || !editVal.trim()) return;
    update(d => setCats(d, (kind === 'fun' ? d.funCategories : d.regCategories).map(c => c.key === editKey ? { ...c, label: editVal.trim() } : c)));
    setEditKey(null);
  };
  const remove = (key: string) => {
    if (cats.length <= 1) return;
    update(d => {
      const list = kind === 'fun' ? d.funCategories : d.regCategories;
      const fb = list.find(c => c.key !== key)!;
      setCats(d, list.filter(c => c.key !== key));
      for (const m of Object.values(d.months)) {
        const exps = kind === 'fun' ? m.funExpenses : m.regExpenses;
        exps.forEach(e => { if (e.category === key) e.category = fb.key; });
        if (kind === 'reg') delete m.regBudgets[key];
      }
      d.recurring.forEach(r => { if (r.kind === kind && r.category === key) r.category = fb.key; });
      return `Category removed — its entries moved to “${fb.label}”`;
    });
  };

  return (
    <View style={{ gap: 8 }}>
      {cats.map(c => (
        <View key={c.key} style={{ gap: 8 }}>
          <View style={s.row}>
            <View style={[s.swatch, { backgroundColor: c.color }]} />
            <Text style={s.label}>{c.label}</Text>
            <Btn small kind="secondary" label="Rename" onPress={() => { setEditKey(c.key); setEditVal(c.label); }} />
            {cats.length > 1 && <Btn small kind="danger" label="Delete" onPress={() => remove(c.key)} />}
          </View>
          {editKey === c.key && (
            <Row>
              <Input style={{ flex: 1 }} value={editVal} onChangeText={setEditVal} placeholder="New name" />
              <Btn label="Save" onPress={rename} />
              <Btn kind="secondary" label="✕" onPress={() => setEditKey(null)} />
            </Row>
          )}
        </View>
      ))}
      <Input value={label} onChangeText={setLabel} placeholder={kind === 'fun' ? 'New fun category' : 'New regular category'} />
      <Wrap>{colors.map(col => <Pressable key={col} onPress={() => setColor(col)} style={[s.dot, { backgroundColor: col }, color === col && s.dotActive]} />)}</Wrap>
      <Btn kind="secondary" label="Add category" onPress={add} />
    </View>
  );
}
