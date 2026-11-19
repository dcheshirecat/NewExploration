import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { totalSavings } from '../actions';
import { useStore } from '../store';
import { fmt, getMonthKey, getMonthLabel, parseAmount } from '../utils';
import { Btn, Card, Input, Row, SmallLink, Sub, SummaryRow, Title } from './ui';

/** Total savings up to today. `compact` is the short Home version. */
export function SavingsCard({ compact, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const { data, update, theme } = useStore();
  const s = useMemo(() => totalSavings(data), [data]);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [showAll, setShowAll] = useState(false);
  const thisPeriod = s.byPeriod.find(p => p.mk === getMonthKey())?.total ?? 0;

  const big = (
    <View style={{ backgroundColor: theme.statGreen, borderRadius: 20, padding: 16, gap: 2 }}>
      <Text style={{ color: theme.statText, fontWeight: '700', fontSize: 13, opacity: 0.85 }}>Total saved so far</Text>
      <Text style={{ color: theme.statText, fontWeight: '900', fontSize: compact ? 30 : 38 }} adjustsFontSizeToFit numberOfLines={1}>{fmt(s.total)}</Text>
      <Text style={{ color: theme.statText, fontWeight: '600', fontSize: 13, opacity: 0.85 }}>
        {thisPeriod > 0 ? `+${fmt(thisPeriod)} this period 🌱` : 'Nothing saved yet this period'}
      </Text>
    </View>
  );

  if (compact) {
    return (
      <Pressable onPress={onOpen}>
        <Card>
          <Title>💰 My savings</Title>
          {big}
        </Card>
      </Pressable>
    );
  }

  const saveBase = () => {
    const v = parseAmount(val);
    if (!(v >= 0)) return;
    update(d => { d.settings.savingsBase = v; return `Earlier savings set to ${fmt(v)}`; });
    setEditing(false); setVal('');
  };
  const periods = [...s.byPeriod].reverse();
  const shown = showAll ? periods : periods.slice(0, 6);
  const max = Math.max(1, ...periods.map(p => Math.abs(p.total)));

  return (
    <Card>
      <Title>💰 My total savings</Title>
      {big}
      <SummaryRow label="Savings before the app" value={fmt(s.before)} tone="plain" />
      <SummaryRow label="Set aside each month" value={fmt(s.setAside)} tone="plain" />
      <SummaryRow label="Saved in goals 🎯" value={fmt(s.inGoals)} tone="plain" />
      {editing ? (
        <Row>
          <Input style={{ flex: 1 }} value={val} onChangeText={setVal} keyboardType="decimal-pad" placeholder="Savings you already had (₪)" />
          <Btn label="Save" onPress={saveBase} />
        </Row>
      ) : <SmallLink label={s.before ? 'Change savings from before the app' : '+ Add savings you had before using the app'} onPress={() => { setVal(s.before ? `${s.before}` : ''); setEditing(true); }} />}

      {periods.length > 0 && <>
        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginTop: 4 }}>Month by month</Text>
        {shown.map(p => (
          <View key={p.mk} style={{ gap: 4 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{getMonthLabel(p.mk)}</Text>
              <Text style={{ color: p.total >= 0 ? theme.good : theme.bad, fontWeight: '800' }}>{p.total >= 0 ? '+' : ''}{fmt(p.total)}</Text>
            </Row>
            <View style={{ height: 8, borderRadius: 999, backgroundColor: theme.chip, overflow: 'hidden' }}>
              <View style={{ width: `${(Math.abs(p.total) / max) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: p.total >= 0 ? theme.good : theme.bad }} />
            </View>
            <Text style={{ color: theme.textFaint, fontSize: 12 }}>
              {[p.setAside ? `${fmt(p.setAside)} set aside` : '', p.goals ? `${fmt(p.goals)} into goals` : ''].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
        {periods.length > 6 && <SmallLink label={showAll ? 'Show less' : `Show all ${periods.length} months`} onPress={() => setShowAll(v => !v)} />}
      </>}
      {periods.length === 0 && <Sub>Turn on “Set money aside this month” in the Fun Jar, or add money to a goal, and it&apos;ll count here.</Sub>}
    </Card>
  );
}
