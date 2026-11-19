import type { GameState, Pet, Rarity } from './types';
import { clamp, todayStr, toLocalDateStr, uid } from './utils';

// ── Catalogue ────────────────────────────────────────────────────────────────
export type PetType = { id: string; name: string; rarity: Rarity; baseColor: string; accent: string; element: string };

export const PET_TYPES: PetType[] = [
  { id: 'fluffox',    name: 'Fluffox',    rarity: 'common', baseColor: '#ff9f43', accent: '#ffeaa7', element: 'fire' },
  { id: 'aqueel',     name: 'Aqueel',     rarity: 'common', baseColor: '#74b9ff', accent: '#dfe6e9', element: 'water' },
  { id: 'leafkin',    name: 'Leafkin',    rarity: 'common', baseColor: '#55efc4', accent: '#81ecec', element: 'nature' },
  { id: 'stonepup',   name: 'Stonepup',   rarity: 'rare',   baseColor: '#b2bec3', accent: '#636e72', element: 'earth' },
  { id: 'sparkle',    name: 'Sparkle',    rarity: 'rare',   baseColor: '#fd79a8', accent: '#fdcfe8', element: 'light' },
  { id: 'shadowfin',  name: 'Shadowfin',  rarity: 'rare',   baseColor: '#6c5ce7', accent: '#a29bfe', element: 'shadow' },
  { id: 'crystalon',  name: 'Crystalon',  rarity: 'epic',   baseColor: '#00cec9', accent: '#81ecec', element: 'ice' },
  { id: 'emberwing',  name: 'Emberwing',  rarity: 'epic',   baseColor: '#e17055', accent: '#fab1a0', element: 'fire' },
  { id: 'voidwalker', name: 'Voidwalker', rarity: 'legend', baseColor: '#4b4f63', accent: '#dfe6e9', element: 'void' },
  { id: 'solaris',    name: 'Solaris',    rarity: 'legend', baseColor: '#fdcb6e', accent: '#fff3c4', element: 'cosmic' },
];

export type EggType = { id: string; name: string; price: number; minutes: number; rarities: Rarity[]; color: string; spots: string; accent: string };

export const EGG_TYPES: EggType[] = [
  { id: 'plain',    name: 'Plain Egg',    price: 60,  minutes: 10,  rarities: ['common', 'common', 'common', 'rare'], color: '#dfe6e9', spots: '#b2bec3', accent: '#636e72' },
  { id: 'speckled', name: 'Speckled Egg', price: 180, minutes: 45,  rarities: ['common', 'rare', 'rare', 'epic'],     color: '#ffeaa7', spots: '#fdcb6e', accent: '#e17055' },
  { id: 'cosmic',   name: 'Cosmic Egg',   price: 450, minutes: 120, rarities: ['rare', 'epic', 'epic', 'legend'],     color: '#3d3a5c', spots: '#6c5ce7', accent: '#a29bfe' },
  { id: 'golden',   name: 'Golden Egg',   price: 900, minutes: 360, rarities: ['epic', 'legend', 'legend'],           color: '#fdcb6e', spots: '#ffd700', accent: '#e8a800' },
];

export type ShopItem = { id: string; name: string; emoji: string; desc: string; price: number; effect: { hunger?: number; happy?: number; health?: number; xp?: number } };

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'berry',   name: 'Star Berry',     emoji: '🫐', desc: '+30 hunger',             price: 20,  effect: { hunger: 30 } },
  { id: 'feast',   name: 'Royal Feast',    emoji: '🍱', desc: 'Fills hunger completely', price: 60,  effect: { hunger: 100 } },
  { id: 'toy',     name: 'Jingle Orb',     emoji: '🔮', desc: '+25 happiness',           price: 30,  effect: { happy: 25 } },
  { id: 'crystal', name: 'XP Crystal',     emoji: '💎', desc: '+50 XP instantly',        price: 80,  effect: { xp: 50 } },
  { id: 'tonic',   name: 'Vitality Tonic', emoji: '🧪', desc: 'Full health restore',     price: 100, effect: { health: 100 } },
  { id: 'dust',    name: 'Love Dust',      emoji: '✨', desc: '+40 happiness & health',  price: 120, effect: { happy: 40, health: 40 } },
];

export type Challenge = { title: string; desc: string; reward: number };
export const DAILY_CHALLENGES: Challenge[] = [
  { title: 'Coffee Skip',      desc: 'Make coffee at home instead of buying one',      reward: 30 },
  { title: 'Lunch From Home',  desc: 'Eat lunch at home instead of eating out',        reward: 50 },
  { title: 'No Impulse Buys',  desc: "Don't buy anything non-essential today",         reward: 80 },
  { title: 'Subscription Check', desc: 'Review your subscriptions and cancel one you don\'t use', reward: 120 },
  { title: 'Pack a Snack',     desc: 'Bring snacks from home instead of buying',       reward: 25 },
  { title: 'Window Shop Only', desc: 'Browse if you like — but buy nothing',           reward: 40 },
  { title: 'Log Everything',   desc: 'Log every expense you make today',               reward: 40 },
  { title: 'Use What You Have', desc: 'Craft or cook with supplies you already own',   reward: 45 },
  { title: 'Cart Cooldown',    desc: 'Leave an online cart for 24 hours before buying', reward: 35 },
  { title: 'Free Fun',         desc: 'Do something fun today that costs nothing',      reward: 50 },
];

export const RARITY_COLORS: Record<Rarity, string> = { common: '#55efc4', rare: '#74b9ff', epic: '#a29bfe', legend: '#ffd700' };

export const MAX_PETS = 8;
export const MAX_INCUBATING = 3;
export const PET_ACTIONS = {
  feed: { cost: 10, label: 'Feed' },
  play: { cost: 5, label: 'Play' },
  heal: { cost: 20, label: 'Heal' },
};

// Coin rules ─────────────────────────────────────────────────────────────────
export const COINS = {
  welcome: 150,
  perLog: 3,
  maxLogRewardsPerDay: 10,
  goalCompleted: 250,
};
export function coinsForSaving(amount: number) { return clamp(Math.round(amount), 5, 500); }
export function coinsForResisting(amount: number) { return clamp(Math.round(amount * 2), 5, 600); }
export function coinsForPeriodBonus(funLeft: number) { return 100 + clamp(Math.round(funLeft / 2), 0, 300); }

export function todaysChallenge(date = new Date()) {
  const idx = (date.getDate() + date.getMonth() * 3) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

// ── State helpers (mutate a draft) ───────────────────────────────────────────
export function defaultGame(): GameState {
  return {
    coins: 0, totalEarned: 0, resistanceXP: 0, totalResisted: 0,
    pets: [], incubating: [], inventory: {}, coinLog: [],
    lastChallengeDay: null,
    streak: { count: 0, lastDay: null, best: 0 },
    logRewards: { day: null, count: 0 },
    nextPetId: 1, welcomeGiven: false, lastDecayAt: Date.now(),
  };
}

function pushLog(g: GameState, type: 'earn' | 'spend', amount: number, reason: string) {
  g.coinLog.unshift({ id: uid(), type, amount, reason, date: new Date().toISOString() });
  if (g.coinLog.length > 80) g.coinLog.length = 80;
}

export function earn(g: GameState, amount: number, reason: string) {
  if (amount <= 0) return 0;
  g.coins += amount;
  g.totalEarned += amount;
  pushLog(g, 'earn', amount, reason);
  return amount;
}

export function spend(g: GameState, amount: number, reason: string) {
  if (g.coins < amount) return false;
  g.coins -= amount;
  pushLog(g, 'spend', amount, reason);
  return true;
}

/**
 * Reward the habit of logging. Returns coins earned (0 once the daily cap is hit)
 * and updates the daily streak.
 */
export function rewardLogging(g: GameState) {
  const today = todayStr();
  let coins = 0;
  const messages: string[] = [];
  // streak
  if (g.streak.lastDay !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    g.streak.count = g.streak.lastDay === toLocalDateStr(y) ? g.streak.count + 1 : 1;
    g.streak.lastDay = today;
    g.streak.best = Math.max(g.streak.best, g.streak.count);
    if (g.streak.count > 1) {
      const bonus = Math.min(g.streak.count, 7) * 5;
      coins += earn(g, bonus, `${g.streak.count}-day logging streak`);
      messages.push(`🔥 ${g.streak.count}-day streak! +${bonus}`);
    }
  }
  if (g.logRewards.day !== today) g.logRewards = { day: today, count: 0 };
  if (g.logRewards.count < COINS.maxLogRewardsPerDay) {
    g.logRewards.count += 1;
    coins += earn(g, COINS.perLog, 'Logged an entry');
  }
  return { coins, messages };
}

export function giveAllPetsXp(g: GameState, xp: number) {
  const ups: string[] = [];
  g.pets.forEach(p => { p.xp += xp; const up = checkLevelUp(g, p); if (up) ups.push(up); });
  return ups;
}

export function checkLevelUp(g: GameState, pet: Pet): string | null {
  let msg: string | null = null;
  while (pet.xp >= xpForNext(pet.level)) {
    pet.xp -= xpForNext(pet.level);
    pet.level += 1;
    earn(g, pet.level * 10, `${pet.name} reached level ${pet.level}`);
    msg = `${pet.name} leveled up to ${pet.level}! 🎉`;
  }
  return msg;
}

export function xpForNext(level: number) { return level * 100; }

/** Evolution stage 1-3, shown in the pet art. */
export function evolutionStage(level: number) { return level >= 10 ? 3 : level >= 5 ? 2 : 1; }

export function getMood(pet: Pet): 'happy' | 'ok' | 'sad' {
  const avg = (pet.hunger + pet.happiness + pet.health) / 3;
  if (avg >= 65) return 'happy';
  if (avg >= 35) return 'ok';
  return 'sad';
}

/** Pets slowly get hungry and bored over real time (also while the app is closed). */
export function applyDecay(g: GameState, now = Date.now()) {
  const hours = (now - (g.lastDecayAt || now)) / 3600000;
  if (hours <= 0) { g.lastDecayAt = now; return; }
  g.pets.forEach(p => {
    p.hunger = clamp(p.hunger - 3 * hours, 0, 100);
    p.happiness = clamp(p.happiness - 2 * hours, 0, 100);
    if (p.hunger < 25) p.health = clamp(p.health - 2 * hours, 0, 100);
  });
  g.lastDecayAt = now;
}

export function hatchProgress(inc: { startTime: number; duration: number }, now = Date.now()) {
  return clamp((now - inc.startTime) / inc.duration, 0, 1);
}

export function skipCost(inc: { startTime: number; duration: number }, now = Date.now()) {
  const remainingMin = Math.max(0, (inc.startTime + inc.duration - now) / 60000);
  return Math.max(5, Math.ceil(remainingMin * 2));
}

export function rollPet(eggId: string): PetType {
  const egg = EGG_TYPES.find(e => e.id === eggId) ?? EGG_TYPES[0];
  const rarity = egg.rarities[Math.floor(Math.random() * egg.rarities.length)];
  const candidates = PET_TYPES.filter(p => p.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function petType(id: string) { return PET_TYPES.find(t => t.id === id) ?? PET_TYPES[0]; }

export function applyItem(g: GameState, pet: Pet, item: ShopItem) {
  const e = item.effect;
  if (e.hunger) pet.hunger = clamp(pet.hunger + e.hunger, 0, 100);
  if (e.happy) pet.happiness = clamp(pet.happiness + e.happy, 0, 100);
  if (e.health) pet.health = clamp(pet.health + e.health, 0, 100);
  if (e.xp) pet.xp += e.xp;
  return checkLevelUp(g, pet);
}

export function resistanceLevel(xp: number) {
  const level = Math.floor(xp / 500) + 1;
  return { level, progress: (xp % 500) / 500, score: Math.floor(xp / 10) };
}
