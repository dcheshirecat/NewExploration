import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { addScheduled, endOfCurrentPeriod, estimatedBalance, forecast, postScheduledNow } from '../actions';
import { DatePicker } from '../components/DatePicker';
import { Banner, Btn, Card, Chip, Empty, Heading, Input, Row, Segmented, SmallLink, Sub, Title, Wrap } from '../components/ui';
import { coinsForLog } from '../game';
import { INCOME_SOURCES } from '../storage';
import { confirmAction, useStore } from '../store';
import { PIXEL_FONT } from '../theme';
import type { RecurringKind } from '../types';
import { fmt, parseAmount, toLocalDateStr, todayStr } from '../utils';

const niceDate = (ds: string) => new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toLocalDateStr(d); };

// ── Bank balance ─────────────────────────────────────────────────────────────
export function BankBalanceCard() {
  const { data, update, theme } = useStore();
  const bank = data.settings.bank;
  const est = estimatedBalance(data);
  const [editing, setEditing] = useState(!bank);
  const [val, setVal] = useState('');
  const save = () => {
    const v = parseAmount(val);
    if (!Number.isFinite(v)) return;
    update(d => { d.settings.bank = { amount: v, asOf: new Date().toISOString() }; return `🏦 Bank balance set to ${fmt(v)}`; });
    setVal(''); setEditing(false);
  };
  return (
    <Card>
      <Title>🏦 Balance now</Title>
      {bank && est !== null ? (
        <>
          <Text style={{ fontFamily: PIXEL_FONT, fontSize: 40, color: est >= 0 ? theme.good : theme.bad }}>{fmt(est)}</Text>
          <Sub>You entered {fmt(bank.amount)} on {new Date(bank.asOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Everything you&apos;ve logged since then is included.</Sub>
        </>
      ) : <Sub>Type in how much money is in your bank account right now. The app adds and subtracts everything you log from here, and uses it to show your future balance.</Sub>}
      {editing ? (
        <Row>
          <Input style={{ flex: 1 }} value={val} onChangeText={setVal} keyboardType="numbers-and-punctuation" placeholder="Bank balance today (₪)" />
          <Btn label="Save" onPress={save} />
        </Row>
      ) : <Btn kind="secondary" label="Update from my bank app" onPress={() => setEditing(true)} />}
    </Card>
  );
}

// ── Projection summary (also used on Home) ──────────────────────────────────
export function ProjectionSummary({ compact, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const { data, theme } = useStore();
  const end = endOfCurrentPeriod();
  const f = useMemo(() => forecast(data, end), [data, end]);
  if (!f.hasBank) {
    return compact ? <Banner tone="info" text="🏦 Add your bank balance to see your future balance →" onPress={onOpen} /> : null;
  }
  const next = f.events.find(e => e.amount < 0);
  const nextIn = f.events.find(e => e.amount > 0);
  const body = (
    <View style={{ gap: 10 }}>
      <Row style={{ alignItems: 'stretch' }}>
        <View style={{ flex: 1, backgroundColor: theme.statBlue, borderRadius: 18, padding: 14, gap: 4 }}>
          <Text style={{ color: theme.statText, fontWeight: '700', fontSize: 13 }}>Balance now</Text>
          <Text style={{ color: theme.statText, fontFamily: PIXEL_FONT, fontSize: 22 }} adjustsFontSizeToFit numberOfLines={1}>{fmt(f.now)}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: f.end >= 0 ? theme.statGreen : theme.statPink, borderRadius: 18, padding: 14, gap: 4 }}>
          <Text style={{ color: theme.statText, fontWeight: '700', fontSize: 13 }}>Projected {niceDate(end).replace(/^\w+, /, '')}</Text>
          <Text style={{ color: theme.statText, fontFamily: PIXEL_FONT, fontSize: 22 }} adjustsFontSizeToFit numberOfLines={1}>{fmt(f.end)}</Text>
        </View>
      </Row>
      {next && <Text style={{ color: theme.textSoft, fontWeight: '600' }}>Next charge: <Text style={{ color: theme.text, fontWeight: '800' }}>{next.label} {fmt(-next.amount)}</Text> on {niceDate(next.date)} → {fmt(next.balance)}</Text>}
      {nextIn && <Text style={{ color: theme.textSoft, fontWeight: '600' }}>Next income: <Text style={{ color: theme.good, fontWeight: '800' }}>{nextIn.label} +{fmt(nextIn.amount)}</Text> on {niceDate(nextIn.date)}</Text>}
      {f.lowest.amount < 0 && <Banner tone="bad" text={`🚨 Your balance may drop to ${fmt(f.lowest.amount)} on ${niceDate(f.lowest.date)}`} />}
      {!next && !nextIn && <Sub>Nothing planned until the end of this period. Add upcoming charges in Budget → Upcoming.</Sub>}
    </View>
  );
  if (!compact) return body;
  return (
    <Pressable onPress={onOpen}>
      <Card>
        <Title>📆 Future balance</Title>
        {body}
      </Card>
    </Pressable>
  );
}

// ── Upcoming tab ─────────────────────────────────────────────────────────────
export function UpcomingTab() {
  const { data, update, theme } = useStore();
  const [horizon, setHorizon] = useState<'period' | '30' | '60'>('period');
  const end = horizon === 'period' ? endOfCurrentPeriod() : plusDays(Number(horizon));
  const f = useMemo(() => forecast(data, end), [data, end]);
  const posted = data.scheduled.filter(s => s.postedAt).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <>
      <BankBalanceCard />
      {f.hasBank && (
        <Card>
          <Title>📈 Projected balance</Title>
          <ProjectionSummary />
        </Card>
      )}

      <Card>
        <Title>Add an upcoming charge or income</Title>
        <Sub>Credit card bill, a planned purchase, a payment you&apos;re expecting… It shows on your calendar and gets logged automatically on its date.</Sub>
        <ScheduledForm />
      </Card>

      <Card>
        <Title>Coming up</Title>
        <Segmented value={horizon} onChange={setHorizon} options={[{ key: 'period', label: 'This period' }, { key: '30', label: '30 days' }, { key: '60', label: '60 days' }]} />
        {f.events.length === 0 && <Empty>Nothing coming up in this time.</Empty>}
        {f.events.map(e => (
          <View key={e.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.cardAlt, borderRadius: 16, padding: 12 }}>
            <View style={{ width: 46, alignItems: 'center' }}>
              <Text style={{ color: theme.textSoft, fontSize: 11, fontWeight: '800' }}>{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
              <Text style={{ color: theme.text, fontFamily: PIXEL_FONT, fontSize: 22 }}>{Number(e.date.slice(8))}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800' }} numberOfLines={1}>{e.label}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12 }} numberOfLines={1}>{e.detail}{e.source === 'scheduled' ? ' · planned' : ''}</Text>
              {e.source === 'scheduled' && (
                <Row style={{ gap: 14, marginTop: 4 }}>
                  <SmallLink label="Paid now" onPress={() => update(d => postScheduledNow(d, e.sourceId))} />
                  <SmallLink danger label="Delete" onPress={() => confirmAction('Delete this item?', `${e.label} on ${niceDate(e.date)}`, 'Delete', () => update(d => { d.scheduled = d.scheduled.filter(s => s.id !== e.sourceId); }))} />
                </Row>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: e.amount >= 0 ? theme.good : theme.bad, fontWeight: '900' }}>{e.amount >= 0 ? '+' : ''}{fmt(e.amount)}</Text>
              {f.hasBank && <Text style={{ color: e.balance >= 0 ? theme.textSoft : theme.bad, fontWeight: '700', fontSize: 12 }}>→ {fmt(e.balance)}</Text>}
            </View>
          </View>
        ))}
        {!f.hasBank && f.events.length > 0 && <Sub>Add your bank balance above to see your balance after each item.</Sub>}
        {posted.length > 0 && <>
          <Heading>Recently logged</Heading>
          {posted.map(p => <Text key={p.id} style={{ color: theme.textSoft }}>✅ {p.note || 'Item'} · {fmt(p.amount)} · {niceDate(p.date)}</Text>)}
        </>}
      </Card>
    </>
  );
}

function ScheduledForm() {
  const { data, update, theme } = useStore();
  const [kind, setKind] = useState<RecurringKind>('reg');
  const [cat, setCat] = useState('');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(plusDays(1));
  const [err, setErr] = useState('');
  const options = kind === 'income' ? INCOME_SOURCES.map(s => ({ key: s, label: s, color: theme.chartIncome })) : (kind === 'fun' ? data.funCategories : data.regCategories);
  const category = options.some(o => o.key === cat) ? cat : options[0]?.key;
  const v = parseAmount(amt);

  const save = () => {
    if (!(v > 0)) { setErr('Enter an amount above 0'); return; }
    if (date < todayStr()) { setErr('Pick today or a future date — for past spending, log it normally.'); return; }
    setErr('');
    update(d => addScheduled(d, { kind, category, amount: v, note: note.trim(), date }));
    setAmt(''); setNote('');
  };

  return (
    <View style={{ gap: 10 }}>
      <Segmented value={kind} onChange={setKind} options={[{ key: 'reg', label: 'Regular' }, { key: 'fun', label: 'Fun' }, { key: 'income', label: 'Income' }]} />
      <Input value={note} onChangeText={setNote} placeholder={kind === 'income' ? 'What is it? (e.g. Bonus)' : 'What is it? (e.g. Credit card)'} />
      <Input value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Amount (₪)" />
      <Wrap>{options.map(o => <Chip key={o.key} label={o.label} active={category === o.key} color={o.color} onPress={() => setCat(o.key)} />)}</Wrap>
      <DatePicker value={date} onChange={setDate} />
      {err ? <Sub style={{ color: theme.bad }}>{err}</Sub> : null}
      <Btn label={v > 0 ? `Add to Upcoming · +${coinsForLog(v)} 🪙` : 'Add to Upcoming'} onPress={save} />
    </View>
  );
}
