import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { contributeToGoal, goalSaved } from '../actions';
import { DatePicker } from '../components/DatePicker';
import { Btn, Card, Chip, Empty, Heading, Input, Progress, Row, SmallLink, Stat, Sub, Title, Wrap } from '../components/ui';
import { coinsForSaving } from '../game';
import { GOAL_COLORS } from '../storage';
import { confirmAction, useStore } from '../store';
import { PIXEL_FONT } from '../theme';
import type { Goal } from '../types';
import { fmt, parseAmount, shortDate, sum, todayStr, uid } from '../utils';

const EMOJIS = ['🎯', '📱', '🎮', '✈️', '🧶', '🎨', '🛋️', '🎁', '🚲', '💻', '🏖️', '🐶', '🎧', '📚', '🏠', '💍'];

export function GoalsScreen() {
  const { data, theme } = useStore();
  const [showForm, setShowForm] = useState(data.goals.length === 0);
  const active = data.goals.filter(g => !g.completedAt);
  const done = data.goals.filter(g => g.completedAt);
  const totalSaved = sum(data.goals, goalSaved);
  const totalTarget = sum(active, g => g.target);

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <Title>Savings goals 🎯</Title>
        <Sub>Save toward the things you want. Every shekel you add earns coins 🪙 and XP for your pets.</Sub>
        <Row><Stat tone="green" label="Saved in goals" value={fmt(totalSaved)} /><Stat tone="purple" label="Still to go" value={fmt(Math.max(0, totalTarget - sum(active, goalSaved)))} /></Row>
        {!showForm && <Btn icon="＋" label="New goal" onPress={() => setShowForm(true)} />}
      </Card>

      {showForm && <GoalForm onDone={() => setShowForm(false)} />}

      {active.length === 0 && !showForm && <Card><Empty>No active goals. Create one to start saving!</Empty></Card>}
      {active.map(g => <GoalCard key={g.id} goal={g} />)}

      {done.length > 0 && (
        <>
          <Text style={{ color: theme.textSoft, fontWeight: '800', fontSize: 15, marginTop: 4 }}>🏆 Completed</Text>
          {done.map(g => <GoalCard key={g.id} goal={g} />)}
        </>
      )}
    </View>
  );
}

function GoalForm({ onDone, initial }: { onDone: () => void; initial?: Goal }) {
  const { update, theme } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [color, setColor] = useState(initial?.color ?? GOAL_COLORS[0]);
  const [target, setTarget] = useState(initial ? `${initial.target}` : '');
  const [hasDeadline, setHasDeadline] = useState(!!initial?.deadline);
  const [deadline, setDeadline] = useState(initial?.deadline ?? todayStr());
  const [err, setErr] = useState('');

  const save = () => {
    const v = parseAmount(target);
    if (!name.trim()) { setErr('Give your goal a name'); return; }
    if (!(v > 0)) { setErr('Enter a target amount above 0'); return; }
    update(d => {
      if (initial) {
        const g = d.goals.find(x => x.id === initial.id);
        if (g) {
          Object.assign(g, { name: name.trim(), emoji, color, target: v, deadline: hasDeadline ? deadline : undefined });
          g.completedAt = goalSaved(g) >= g.target ? g.completedAt ?? new Date().toISOString() : undefined;
        }
        return 'Goal updated';
      }
      d.goals.push({ id: uid(), name: name.trim(), emoji, color, target: v, deadline: hasDeadline ? deadline : undefined, createdAt: new Date().toISOString(), contributions: [] });
      return `${emoji} New goal: ${name.trim()}`;
    });
    onDone();
  };

  return (
    <Card>
      <Title>{initial ? 'Edit goal' : 'New goal'}</Title>
      <Input value={name} onChangeText={setName} placeholder="What are you saving for?" />
      <Input value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Target amount (₪)" />
      <Heading>Pick an icon</Heading>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {EMOJIS.map(e => (
          <Pressable key={e} onPress={() => setEmoji(e)} style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === e ? theme.statPurple : theme.cardAlt, borderWidth: emoji === e ? 2 : 0, borderColor: theme.primary }}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <Wrap>{GOAL_COLORS.map(c => <Pressable key={c} onPress={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.text }} />)}</Wrap>
      <Pressable onPress={() => setHasDeadline(h => !h)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: theme.primary, backgroundColor: hasDeadline ? theme.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {hasDeadline && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
        </View>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Set a target date</Text>
      </Pressable>
      {hasDeadline && <DatePicker value={deadline} onChange={setDeadline} />}
      {err ? <Sub style={{ color: theme.bad }}>{err}</Sub> : null}
      <Row>
        <Btn style={{ flex: 1 }} label={initial ? 'Save goal' : 'Create goal'} onPress={save} />
        <Btn kind="secondary" label="Cancel" onPress={onDone} />
      </Row>
    </Card>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { update, theme } = useStore();
  const [amt, setAmt] = useState('');
  const [editing, setEditing] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const saved = goalSaved(goal);
  const ratio = goal.target > 0 ? saved / goal.target : 0;
  const left = Math.max(0, goal.target - saved);

  let pace = '';
  if (goal.deadline && left > 0) {
    const days = Math.ceil((new Date(goal.deadline + 'T23:59:59').getTime() - Date.now()) / 86400000);
    if (days <= 0) pace = '⏰ Target date has passed';
    else {
      const months = Math.max(1, days / 30.4);
      pace = `${days} days left · about ${fmt(left / months)} per month`;
    }
  }

  const add = (sign: 1 | -1) => {
    const v = parseAmount(amt);
    if (!(v > 0)) return;
    if (sign < 0 && v > saved) return;
    update(d => contributeToGoal(d, goal.id, sign * v, ''));
    setAmt('');
  };

  if (editing) return <GoalForm initial={goal} onDone={() => setEditing(false)} />;

  return (
    <Card>
      <Row>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: goal.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>{goal.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>{goal.name}</Text>
          <Text style={{ color: theme.textSoft }}>{fmt(saved)} of {fmt(goal.target)}</Text>
        </View>
        <Text style={{ color: theme.text, fontSize: 22, fontFamily: PIXEL_FONT }}>{Math.min(100, Math.round(ratio * 100))}%</Text>
      </Row>
      <Progress value={ratio} color={goal.color} height={14} />
      {goal.completedAt ? <Sub>🎉 Reached on {shortDate(goal.completedAt)}!</Sub> : <Sub>{fmt(left)} to go{pace ? ` · ${pace}` : ''}</Sub>}
      {!goal.completedAt && (
        <>
          <Row>
            <Input style={{ flex: 1 }} value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder="Amount (₪)" />
            <Btn label="Add" onPress={() => add(1)} />
          </Row>
          <Wrap>{[20, 50, 100, 200].map(v => <Chip key={v} label={`+${fmt(v)}`} onPress={() => update(d => contributeToGoal(d, goal.id, v, ''))} />)}</Wrap>
          {parseAmount(amt) > 0 && <Sub>Adding {fmt(parseAmount(amt))} earns {coinsForSaving(parseAmount(amt))} 🪙</Sub>}
        </>
      )}
      <Row style={{ gap: 16, flexWrap: 'wrap' }}>
        <SmallLink label={showLog ? 'Hide history' : `History (${goal.contributions.length})`} onPress={() => setShowLog(s => !s)} />
        {!goal.completedAt && saved > 0 && <SmallLink label="Take money out" onPress={() => add(-1)} />}
        <SmallLink label="Edit" onPress={() => setEditing(true)} />
        <SmallLink danger label="Delete" onPress={() => confirmAction('Delete this goal?', `“${goal.name}” and its history will be removed.`, 'Delete', () => update(d => { d.goals = d.goals.filter(g => g.id !== goal.id); return 'Goal deleted'; }))} />
      </Row>
      {showLog && (goal.contributions.length === 0 ? <Empty>No deposits yet.</Empty> : goal.contributions.map(c => (
        <Row key={c.id} style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: theme.textSoft }}>{shortDate(c.createdAt)}{c.note ? ` · ${c.note}` : ''}</Text>
          <Text style={{ color: c.amount >= 0 ? theme.good : theme.bad, fontWeight: '800' }}>{c.amount >= 0 ? '+' : ''}{fmt(c.amount)}</Text>
        </Row>
      )))}
    </Card>
  );
}
