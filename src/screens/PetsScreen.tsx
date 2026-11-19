import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { EggArt } from '../components/PetArt';
import { PetArt } from '../components/PetSprite';
import { Btn, Card, Empty, Heading, Input, Progress, Row, Segmented, Stat, Sub, Title } from '../components/ui';
import {
  applyItem, checkLevelUp, coinsForLog, coinsForSaving, COINS, EGG_TYPES, getMood, hatchProgress, MAX_INCUBATING, MAX_PETS,
  PET_ACTIONS, petType, RARITY_COLORS, rollPet, SHOP_ITEMS, skipCost, spend, xpForNext, type PetType,
} from '../game';
import { confirmAction, useStore } from '../store';
import type { Pet } from '../types';
import { clamp, fmt, shortDate, uid } from '../utils';

export type PetsTab = 'pets' | 'hatch' | 'shop' | 'wallet';

export function PetsScreen({ tab, setTab }: { tab: PetsTab; setTab: (t: PetsTab) => void }) {
  const { data, theme } = useStore();
  const g = data.game;
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: theme.border }}>
        <View>
          <Text style={{ color: theme.textSoft, fontWeight: '700', fontSize: 12 }}>YOUR COINS</Text>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 30 }}>🪙 {g.coins.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>🔥 {g.streak.count}-day streak</Text>
          <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>🐾 {g.pets.length}/{MAX_PETS} pets</Text>
        </View>
      </View>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'pets', label: '🐾 Pets' }, { key: 'hatch', label: '🥚 Hatch' }, { key: 'shop', label: '🛍 Shop' }, { key: 'wallet', label: '👛 Wallet' }]} />
      {tab === 'pets' && <MyPets goHatch={() => setTab('hatch')} />}
      {tab === 'hatch' && <Hatchery />}
      {tab === 'shop' && <Shop />}
      {tab === 'wallet' && <Wallet />}
    </View>
  );
}

// ═════════════════════════════ MY PETS ═════════════════════════════
function MyPets({ goHatch }: { goHatch: () => void }) {
  const { data, theme } = useStore();
  const [openId, setOpenId] = useState<number | null>(null);
  const pets = data.game.pets;
  const open = pets.find(p => p.id === openId) ?? null;

  return (
    <>
      <Card>
        <Title>My pets</Title>
        <Sub>Pets get hungry and bored over time — even when the app is closed. Keep them happy with coins you earn by managing your money well!</Sub>
        {pets.length === 0 && (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <EggArt eggId="plain" size={70} />
            <Empty>No pets yet. Hatch your first egg!</Empty>
            <Btn kind="gold" label="Go to the hatchery" onPress={goHatch} />
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {pets.map(p => {
            const t = petType(p.typeId);
            const mood = getMood(p);
            return (
              <Pressable key={p.id} onPress={() => setOpenId(p.id)} style={{ width: '48%', flexGrow: 1, backgroundColor: theme.cardAlt, borderRadius: 18, padding: 12, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: mood === 'sad' ? theme.bad : 'transparent' }}>
                <PetArt typeId={p.typeId} level={p.level} mood={mood} size={96} />
                <Text style={{ color: theme.text, fontWeight: '800' }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: RARITY_COLORS[t.rarity], fontWeight: '800', fontSize: 12 }}>Lv.{p.level} · {t.rarity}</Text>
                <Text style={{ color: theme.textSoft, fontSize: 12 }}>{mood === 'happy' ? '😊 happy' : mood === 'ok' ? '😐 okay' : '😢 needs care'}</Text>
                <View style={{ alignSelf: 'stretch' }}><Progress value={p.hunger / 100} color="#f5a623" height={6} /></View>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <PetModal pet={open} onClose={() => setOpenId(null)} />
    </>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { theme } = useStore();
  return (
    <View style={{ flex: 1, gap: 4, backgroundColor: theme.cardAlt, borderRadius: 14, padding: 10 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>{Math.round(value)}%</Text>
      </Row>
      <Progress value={value / 100} color={color} height={7} />
    </View>
  );
}

function PetModal({ pet, onClose }: { pet: Pet | null; onClose: () => void }) {
  const { data, update, theme } = useStore();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [react, setReact] = useState(0);
  useEffect(() => { setRenaming(false); setName(pet?.name ?? ''); }, [pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pet) return null;
  const t = petType(pet.typeId);
  const mood = getMood(pet);
  const inv = Object.entries(data.game.inventory).filter(([, n]) => n > 0);

  const act = (kind: keyof typeof PET_ACTIONS) => { if (data.game.coins >= PET_ACTIONS[kind].cost) setReact(r => r + 1); update(d => {
    const p = d.game.pets.find(x => x.id === pet.id); if (!p) return;
    const { cost } = PET_ACTIONS[kind];
    if (!spend(d.game, cost, `${PET_ACTIONS[kind].label} ${p.name}`)) return `Not enough coins (need ${cost} 🪙)`;
    if (kind === 'feed') { p.hunger = clamp(p.hunger + 25, 0, 100); p.xp += 5; }
    if (kind === 'play') { p.happiness = clamp(p.happiness + 20, 0, 100); p.hunger = clamp(p.hunger - 5, 0, 100); p.xp += 8; }
    if (kind === 'heal') { p.health = clamp(p.health + 40, 0, 100); p.xp += 10; }
    const up = checkLevelUp(d.game, p);
    return [kind === 'feed' ? `Yum! ${p.name} is fed 🍓` : kind === 'play' ? `${p.name} had a blast! 🎾` : `${p.name} feels much better 💖`, ...(up ? [up] : [])];
  }); };
  const useItem = (itemId: string) => { setReact(r => r + 1); update(d => {
    const p = d.game.pets.find(x => x.id === pet.id); const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!p || !item || !(d.game.inventory[itemId] > 0)) return;
    d.game.inventory[itemId] -= 1;
    const up = applyItem(d.game, p, item);
    return [`Used ${item.emoji} ${item.name} on ${p.name}`, ...(up ? [up] : [])];
  }); };
  const saveName = () => {
    if (!name.trim()) return;
    update(d => { const p = d.game.pets.find(x => x.id === pet.id); if (p) p.name = name.trim().slice(0, 20); });
    setRenaming(false);
  };
  const release = () => confirmAction(`Release ${pet.name}?`, 'This cannot be undone.', 'Release', () => {
    update(d => { d.game.pets = d.game.pets.filter(p => p.id !== pet.id); return `${pet.name} waved goodbye 👋`; });
    onClose();
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: theme.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 999, backgroundColor: theme.border }} />
            <View style={{ alignItems: 'center' }}>
              <Pressable onPress={() => setReact(r => r + 1)}><PetArt typeId={pet.typeId} level={pet.level} mood={mood} size={160} reactKey={react} /></Pressable>
              {renaming ? (
                <Row style={{ marginTop: 6 }}>
                  <Input style={{ flex: 1 }} value={name} onChangeText={setName} placeholder="Pet name" autoFocus />
                  <Btn label="Save" onPress={saveName} />
                </Row>
              ) : (
                <Pressable onPress={() => setRenaming(true)}><Text style={{ color: theme.text, fontSize: 28, fontWeight: '900' }}>{pet.name} ✏️</Text></Pressable>
              )}
              <Text style={{ color: RARITY_COLORS[t.rarity], fontWeight: '800' }}>Level {pet.level} · {t.element} · {t.rarity}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12 }}>{t.name} · hatched {shortDate(pet.hatchedAt)}</Text>
            </View>
            <Row><StatBar label="Hunger" value={pet.hunger} color="#f5a623" /><StatBar label="Happiness" value={pet.happiness} color="#ff6b9b" /></Row>
            <Row><StatBar label="Health" value={pet.health} color="#00d68f" /><StatBar label={`XP ${pet.xp}/${xpForNext(pet.level)}`} value={(pet.xp / xpForNext(pet.level)) * 100} color="#a29bfe" /></Row>
            <Row>
              <Btn style={{ flex: 1 }} kind="gold" label={`Feed · ${PET_ACTIONS.feed.cost}🪙`} onPress={() => act('feed')} />
              <Btn style={{ flex: 1 }} label={`Play · ${PET_ACTIONS.play.cost}🪙`} onPress={() => act('play')} />
            </Row>
            <Btn kind="secondary" label={`Heal · ${PET_ACTIONS.heal.cost}🪙`} onPress={() => act('heal')} />
            {inv.length > 0 && <>
              <Heading>Use an item</Heading>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {inv.map(([id, n]) => { const it = SHOP_ITEMS.find(i => i.id === id); if (!it) return null; return <Btn key={id} small kind="secondary" label={`${it.emoji} ${it.name} ×${n}`} onPress={() => useItem(id)} />; })}
              </View>
            </>}
            <Sub>Your coins: 🪙 {data.game.coins}. Pets gain XP every time you log something or save toward a goal. Tap your pet to say hi!</Sub>
            <Row>
              <Btn style={{ flex: 1 }} kind="secondary" label="Close" onPress={onClose} />
              <Btn kind="danger" label="Release" onPress={release} />
            </Row>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ═════════════════════════════ HATCHERY ═════════════════════════════
function Hatchery() {
  const { data, update, theme, now } = useStore();
  const g = data.game;
  const [reveal, setReveal] = useState<{ type: PetType; name: string } | null>(null);

  const buy = (eggId: string) => update(d => {
    const egg = EGG_TYPES.find(e => e.id === eggId)!;
    if (d.game.incubating.length >= MAX_INCUBATING) return `Incubator is full (max ${MAX_INCUBATING} eggs)`;
    if (d.game.pets.length + d.game.incubating.length >= MAX_PETS) return `You can have up to ${MAX_PETS} pets`;
    if (!spend(d.game, egg.price, `Bought ${egg.name}`)) return `Not enough coins — you need ${egg.price} 🪙`;
    d.game.incubating.push({ id: uid(), eggId, startTime: Date.now(), duration: egg.minutes * 60000 });
    return `🥚 ${egg.name} is incubating!`;
  });
  const skip = (id: string) => update(d => {
    const inc = d.game.incubating.find(i => i.id === id); if (!inc) return;
    const cost = skipCost(inc);
    if (!spend(d.game, cost, 'Speed up hatching')) return `Not enough coins (need ${cost} 🪙)`;
    inc.startTime = Date.now() - inc.duration;
  });
  const hatch = (id: string) => {
    const inc = g.incubating.find(i => i.id === id);
    if (!inc || hatchProgress(inc) < 1) return;
    const type = rollPet(inc.eggId);
    update(d => {
      d.game.incubating = d.game.incubating.filter(i => i.id !== id);
      d.game.pets.push({ id: d.game.nextPetId++, typeId: type.id, name: type.name, level: 1, xp: 0, hunger: 80, happiness: 85, health: 100, hatchedAt: new Date().toISOString() });
    });
    setReveal({ type, name: type.name });
  };

  return (
    <>
      <Card>
        <Title>Egg shop</Title>
        <Sub>Rarer eggs take longer to hatch but can hold more powerful creatures.</Sub>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {EGG_TYPES.map(e => {
            const top = e.rarities[e.rarities.length - 1];
            const afford = g.coins >= e.price;
            return (
              <Pressable key={e.id} onPress={() => buy(e.id)} style={{ width: '47%', flexGrow: 1, backgroundColor: theme.cardAlt, borderRadius: 18, padding: 12, alignItems: 'center', gap: 4, opacity: afford ? 1 : 0.6 }}>
                <EggArt eggId={e.id} size={54} />
                <Text style={{ color: theme.text, fontWeight: '800' }}>{e.name}</Text>
                <Text style={{ color: theme.textSoft, fontSize: 12 }}>⏱ {e.minutes >= 60 ? `${e.minutes / 60} h` : `${e.minutes} min`}</Text>
                <Text style={{ color: RARITY_COLORS[top], fontSize: 12, fontWeight: '800' }}>up to {top}</Text>
                <View style={{ backgroundColor: theme.gold, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 }}>
                  <Text style={{ color: theme.goldText, fontWeight: '900' }}>🪙 {e.price}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Title>Incubator ({g.incubating.length}/{MAX_INCUBATING})</Title>
        {g.incubating.length === 0 && <Empty>No eggs incubating. Buy one above!</Empty>}
        {g.incubating.map(inc => {
          const egg = EGG_TYPES.find(e => e.id === inc.eggId) ?? EGG_TYPES[0];
          const p = hatchProgress(inc, now);
          const remaining = Math.max(0, Math.ceil((inc.startTime + inc.duration - now) / 1000));
          const h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
          const ready = p >= 1;
          return (
            <View key={inc.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.cardAlt, borderRadius: 18, padding: 12 }}>
              <Wobble active={ready}><EggArt eggId={inc.eggId} size={46} progress={p} /></Wobble>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{egg.name}</Text>
                <Progress value={p} color={ready ? theme.gold : theme.chartIncome} />
                <Text style={{ color: theme.textSoft, fontSize: 12 }}>{ready ? 'Ready to hatch!' : `${h ? `${h}h ` : ''}${m}m ${s}s left`}</Text>
              </View>
              {ready ? <Btn kind="gold" small label="Hatch!" onPress={() => hatch(inc.id)} /> : <Btn kind="secondary" small label={`Skip ${skipCost(inc, now)}🪙`} onPress={() => skip(inc.id)} />}
            </View>
          );
        })}
      </Card>
      <HatchReveal reveal={reveal} onClose={() => setReveal(null)} />
    </>
  );
}

function Wobble({ active, children }: { active: boolean; children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(a, { toValue: -1, duration: 240, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.delay(900),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, a]);
  return <Animated.View style={{ transform: [{ rotate: a.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] }) }] }}>{children}</Animated.View>;
}

function HatchReveal({ reveal, onClose }: { reveal: { type: PetType; name: string } | null; onClose: () => void }) {
  const { theme } = useStore();
  const [taps, setTaps] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (reveal) { setTaps(0); pop.setValue(0); } }, [reveal, pop]);
  if (!reveal) return null;
  const opened = taps >= 3;
  const tap = () => {
    if (opened) return;
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 120, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    const n = taps + 1;
    setTaps(n);
    if (n >= 3) Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={tap} style={{ flex: 1, backgroundColor: 'rgba(13,7,32,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        {!opened ? (
          <>
            <Animated.View style={{ transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) }] }}>
              <EggArt eggId="speckled" size={120} progress={0.4 + taps * 0.25} />
            </Animated.View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>Your egg is hatching!</Text>
            <Text style={{ color: '#b9acd9' }}>Tap {3 - taps} more {3 - taps === 1 ? 'time' : 'times'}…</Text>
          </>
        ) : (
          <>
            <Confetti />
            <Animated.View style={{ transform: [{ scale: pop }] }}><PetArt typeId={reveal.type.id} size={180} moving /></Animated.View>
            <Text style={{ color: '#ffe08a', fontSize: 32, fontWeight: '900' }}>New pet!</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{reveal.name}</Text>
            <Text style={{ color: RARITY_COLORS[reveal.type.rarity], fontWeight: '800' }}>{reveal.type.rarity} · {reveal.type.element}</Text>
            <Btn kind="gold" label="Add to family!" onPress={onClose} style={{ marginTop: 10, paddingHorizontal: 28 }} />
          </>
        )}
      </Pressable>
    </Modal>
  );
}

function Confetti() {
  const pieces = useRef(Array.from({ length: 36 }, (_, i) => ({
    v: new Animated.Value(0), x: (Math.random() - 0.5) * 340, y: -(Math.random() * 300 + 120), color: ['#ff6b6b', '#ffd700', '#a29bfe', '#4ecdc4', '#55efc4', '#fd79a8'][i % 6], size: 6 + Math.random() * 6,
  }))).current;
  useEffect(() => {
    Animated.stagger(10, pieces.map(p => Animated.timing(p.v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start();
  }, [pieces]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: '45%', left: '50%' }}>
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color,
          opacity: p.v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
            { translateY: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.y, p.y + 260] }) },
          ],
        }} />
      ))}
    </View>
  );
}

// ═════════════════════════════ SHOP ═════════════════════════════
function Shop() {
  const { data, update, theme } = useStore();
  const buy = (id: string) => update(d => {
    const it = SHOP_ITEMS.find(i => i.id === id)!;
    if (!spend(d.game, it.price, `Bought ${it.name}`)) return `Not enough coins — you need ${it.price} 🪙`;
    d.game.inventory[id] = (d.game.inventory[id] ?? 0) + 1;
    return `${it.emoji} ${it.name} added to your bag. Use it from a pet's page!`;
  });
  return (
    <Card>
      <Title>Item shop</Title>
      <Sub>Items go into your bag 🎒 — open any pet to use them.</Sub>
      {SHOP_ITEMS.map(it => (
        <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.cardAlt, borderRadius: 18, padding: 12 }}>
          <Text style={{ fontSize: 32 }}>{it.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{it.name}</Text>
            <Text style={{ color: theme.textSoft, fontSize: 13 }}>{it.desc}{data.game.inventory[it.id] ? ` · you have ${data.game.inventory[it.id]}` : ''}</Text>
          </View>
          <Btn kind="gold" small label={`🪙 ${it.price}`} onPress={() => buy(it.id)} disabled={data.game.coins < it.price} />
        </View>
      ))}
    </Card>
  );
}

// ═════════════════════════════ WALLET ═════════════════════════════
function Wallet() {
  const { data, theme } = useStore();
  const g = data.game;
  const ways = [
    ['📝', 'Log an expense, income or upcoming item', `+${coinsForLog(0)} to +60 (₪50 → ${coinsForLog(50)}, ₪500 → ${coinsForLog(500)})`],
    ['🔥', 'Log something every day', 'streak bonus up to +35'],
    ['🎯', 'Save toward a goal', `+1 per ₪1 (₪100 → ${coinsForSaving(100)})`],
    ['⭐', 'Complete the daily challenge', '+25 to +120'],
    ['🏆', 'Finish a period under your fun budget', '+100 or more'],
    ['🎉', 'Reach a savings goal', `+${COINS.goalCompleted}`],
  ];
  return (
    <>
      <Card>
        <Row><Stat tone="yellow" label="Coins now" value={`🪙 ${g.coins}`} /><Stat tone="purple" label="Coins earned total" value={`${g.totalEarned}`} /></Row>
        <Row><Stat tone="green" label="Entries logged" value={`📝 ${g.totalLogged}`} /><Stat tone="pink" label="Best streak" value={`🔥 ${g.streak.best} ${g.streak.best === 1 ? 'day' : 'days'}`} /></Row>
      </Card>
      <Card>
        <Title>How to earn coins</Title>
        <Sub>Every time you log something you earn coins: 5, plus 1 for every ₪50. Your pets also get {COINS.logXp} XP.</Sub>
        {ways.map(([icon, what, amount]) => (
          <Row key={what}>
            <Text style={{ fontSize: 22, width: 30 }}>{icon}</Text>
            <Text style={{ flex: 1, color: theme.text, fontWeight: '700' }}>{what}</Text>
            <Text style={{ color: theme.textSoft, fontSize: 12, fontWeight: '700', maxWidth: 130, textAlign: 'right' }}>{amount}</Text>
          </Row>
        ))}
      </Card>
      <Card>
        <Title>Coin history</Title>
        {g.coinLog.length === 0 && <Empty>No coin activity yet.</Empty>}
        {g.coinLog.slice(0, 30).map(tx => (
          <Row key={tx.id} style={{ paddingVertical: 4 }}>
            <View style={{ width: 30, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: tx.type === 'earn' ? theme.goodBg : theme.badBg }}>
              <Text style={{ color: tx.type === 'earn' ? theme.good : theme.bad, fontWeight: '900' }}>{tx.type === 'earn' ? '↑' : '↓'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }} numberOfLines={1}>{tx.reason}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12 }}>{shortDate(tx.date)}</Text>
            </View>
            <Text style={{ color: tx.type === 'earn' ? theme.good : theme.bad, fontWeight: '900', fontSize: 16 }}>{tx.type === 'earn' ? '+' : '−'}{tx.amount}</Text>
          </Row>
        ))}
      </Card>
    </>
  );
}
