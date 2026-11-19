import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getWarnings, goalSaved } from '../actions';
import { ExpenseForm, IncomeForm } from '../components/forms';
import { Jar } from '../components/Jar';
import { EggArt } from '../components/PetArt';
import { PetArt } from '../components/PetSprite';
import { Banner, Btn, Card, Progress, Row, Segmented, Stat, Sub, Title } from '../components/ui';
import { earn, getMood, todaysChallenge } from '../game';
import { emptyMonth } from '../storage';
import { useStore } from '../store';
import { ProjectionSummary } from './UpcomingTab';
import { SavingsCard } from '../components/SavingsCard';
import { daysLeftInPeriod, fmt, getMonthKey, getPeriodLabel, sum, todayStr } from '../utils';

export type Nav = (tab: 'home' | 'budget' | 'insights' | 'goals' | 'pets', sub?: string) => void;

export function HomeScreen({ go }: { go: Nav }) {
  const { data, update, theme } = useStore();
  const mk = getMonthKey();
  const m = data.months[mk] ?? emptyMonth();
  const funSpent = sum(m.funExpenses, e => e.amount);
  const funLeft = m.funBudget - funSpent;
  const income = sum(m.income, e => e.amount);
  const out = sum(m.regExpenses, e => e.amount) + funSpent;
  const daysLeft = daysLeftInPeriod(mk);
  const warnings = getWarnings(data, mk);
  const challenge = todaysChallenge();
  const claimed = data.game.lastChallengeDay === todayStr();
  const [quick, setQuick] = useState<'fun' | 'reg' | 'income'>('fun');
  const [poke, setPoke] = useState(0);
  const pet = [...data.game.pets].sort((a, b) => b.level - a.level || b.xp - a.xp)[0];
  const goals = data.goals.filter(g => !g.completedAt).slice(0, 3);
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const claim = () => update(d => {
    if (d.game.lastChallengeDay === todayStr()) return;
    d.game.lastChallengeDay = todayStr();
    earn(d.game, challenge.reward, `Daily challenge: ${challenge.title}`);
    return `⭐ Challenge complete! +${challenge.reward} 🪙`;
  });

  // What the pet says depends on how the budget is doing
  let bubble = 'Log your spending today and I get a treat! 🍓';
  if (pet) {
    const mood = getMood(pet);
    if (mood === 'sad') bubble = `I'm hungry… could you feed me? 🥺`;
    else if (warnings.some(w => w.level === 'over')) bubble = `Uh oh, a budget went over. We can do better next week! 💪`;
    else if (warnings.length) bubble = `Careful — ${warnings[0].text.toLowerCase()}. 👀`;
    else if (m.funBudget > 0 && funLeft > 0) bubble = `We still have ${fmt(funLeft)} of fun money. Spend it wisely! ✨`;
    else if (data.game.streak.count > 1) bubble = `${data.game.streak.count} days in a row! You're amazing! 🔥`;
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: theme.btn, borderRadius: 28, padding: 20, gap: 6, overflow: 'hidden' }}>
        {/* pastel rainbow bubbles */}
        <View style={{ position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 999, backgroundColor: theme.sections.goals.accent, opacity: 0.9 }} />
        <View style={{ position: 'absolute', right: 70, bottom: -50, width: 110, height: 110, borderRadius: 999, backgroundColor: theme.sections.budget.accent, opacity: 0.9 }} />
        <View style={{ position: 'absolute', right: -20, bottom: 20, width: 60, height: 60, borderRadius: 999, backgroundColor: theme.sections.insights.accent, opacity: 0.95 }} />
        <Text style={{ color: theme.btnText, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, opacity: 0.8 }}>{hello}, Dini</Text>
        <Text style={{ color: theme.btnText, fontSize: 26, fontWeight: '900', lineHeight: 32 }}>{m.funBudget > 0 ? `${fmt(Math.max(funLeft, 0))} left to have fun with` : 'Set your fun budget to get started ✨'}</Text>
        <Text style={{ color: theme.btnText, fontWeight: '600', opacity: 0.85 }}>{getPeriodLabel(mk)} · {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</Text>
        <Row style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
          <Pill text={`🪙 ${data.game.coins}`} onPress={() => go('pets', 'wallet')} />
          <Pill text={data.game.streak.count ? `🔥 ${data.game.streak.count} day${data.game.streak.count === 1 ? '' : 's'}` : '🔥 Start a streak'} />
          {m.funBudget === 0 && <Pill text="Set budget →" onPress={() => go('budget', 'jar')} />}
        </Row>
      </View>

      {warnings.slice(0, 3).map(w => (
        <Banner key={w.key} tone={w.level === 'over' ? 'bad' : 'warn'} text={`${w.level === 'over' ? '🚨' : '⚠️'} ${w.text}`} onPress={() => go('budget', w.kind === 'fun' ? 'jar' : 'life')} />
      ))}

      <ProjectionSummary compact onOpen={() => go('budget', 'upcoming')} />

      <SavingsCard compact onOpen={() => go('goals')} />

      <Card>
        <Title>Quick add</Title>
        <Segmented value={quick} onChange={setQuick} options={[{ key: 'fun', label: '🫙 Fun' }, { key: 'reg', label: '💳 Regular' }, { key: 'income', label: '💵 Income' }]} />
        {quick === 'income' ? <IncomeForm monthKey={mk} /> : <ExpenseForm key={quick} kind={quick} />}
      </Card>

      <Row style={{ alignItems: 'stretch' }}>
        <Pressable style={{ flex: 1 }} onPress={() => go('budget', 'jar')}>
          <Card style={{ alignItems: 'center', padding: 12, gap: 4, flex: 1 }}>
            <Jar level={m.funBudget > 0 ? funLeft / m.funBudget : 0} size={0.42} />
            <Text style={{ color: theme.textSoft, fontWeight: '700', fontSize: 12 }}>Fun jar</Text>
            <Text style={{ color: theme.text, fontWeight: '900' }}>{m.funBudget > 0 ? `${Math.max(0, Math.round((funLeft / m.funBudget) * 100))}% left` : 'No budget'}</Text>
          </Card>
        </Pressable>
        <View style={{ flex: 1, gap: 12 }}>
          <Stat tone="green" label="Income" value={fmt(income)} />
          <Stat tone="pink" label="Spent" value={fmt(out)} />
        </View>
      </Row>

      <Card>
        <Row>
          <Pressable onPress={() => (pet ? setPoke(p => p + 1) : go('pets', 'hatch'))}>
            {pet ? <PetArt typeId={pet.typeId} level={pet.level} mood={getMood(pet)} size={110} reactKey={poke} /> : <EggArt eggId="plain" size={62} />}
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ backgroundColor: theme.cardAlt, borderRadius: 16, borderTopLeftRadius: 4, padding: 12 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{pet ? bubble : `You have ${data.game.coins} coins — enough to hatch your first pet! 🥚`}</Text>
            </View>
            <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>{pet ? `${pet.name} · Lv.${pet.level}` : 'Visit the hatchery'}</Text>
          </View>
        </Row>
        <Btn kind="secondary" label={pet ? 'Visit your pets' : 'Hatch an egg'} onPress={() => go('pets', pet ? 'pets' : 'hatch')} />
      </Card>

      <Card style={{ borderWidth: 2, borderColor: claimed ? theme.border : theme.gold }}>
        <Row>
          <Text style={{ fontSize: 30 }}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '800' }}>DAILY CHALLENGE · +{challenge.reward} 🪙</Text>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{challenge.title}</Text>
            <Sub>{challenge.desc}</Sub>
          </View>
        </Row>
        <Btn kind={claimed ? 'secondary' : 'gold'} label={claimed ? 'Done for today ✓' : 'I did it!'} disabled={claimed} onPress={claim} />
      </Card>

      <Card>
        <Title right={<Btn small kind="secondary" label="All goals" onPress={() => go('goals')} />}>Goals 🎯</Title>
        {goals.length === 0 ? <Sub>No goals yet. What are you saving for?</Sub> : goals.map(g => {
          const saved = goalSaved(g);
          return (
            <Pressable key={g.id} onPress={() => go('goals')} style={{ gap: 6 }}>
              <Row>
                <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
                <Text style={{ flex: 1, color: theme.text, fontWeight: '700' }} numberOfLines={1}>{g.name}</Text>
                <Text style={{ color: theme.textSoft, fontWeight: '700' }}>{fmt(saved)} / {fmt(g.target)}</Text>
              </Row>
              <Progress value={saved / g.target} color={g.color} />
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

function Pill({ text, onPress }: { text: string; onPress?: () => void }) {
  const { theme } = useStore();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ color: theme.btnText, fontWeight: '800' }}>{text}</Text>
    </Pressable>
  );
}
