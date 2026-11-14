// 소환(뽑기). 확률은 화면에 그대로 공개하고, ★6 이상이 50번 연속 안 나오면 다음(51번째) 1번은 ★6 이상 확정.
// save.pity = ★6 이상 없이 지나간 횟수. 확정까지 남은 횟수 = PITY + 1 - save.pity.
import { HEROES } from '../data/heroes.js';
import { DUPE_MAX } from './progress.js';

export const RATES = { 1: 40, 2: 28, 3: 18, 4: 9, 5: 4, 6: 0.9, 7: 0.1 };
export const PITY = 50;
export const COST = { 1: 100, 11: 1000 };
// +5 이후에 또 겹치면 별에 따라 골드로 바꿔 준다
export const OVERFLOW_GOLD = [0, 100, 200, 400, 800, 1500, 5000, 10000];

const BY_STAR = {};
for (const h of HEROES) (BY_STAR[h.star] ||= []).push(h.id);

export function rollStar(rng, forceHigh = false) {
  if (forceHigh) return rng() < RATES[7] / (RATES[6] + RATES[7]) ? 7 : 6;
  let x = rng() * 100;
  for (const s of [7, 6, 5, 4, 3, 2, 1]) {
    if (x < RATES[s]) return s;
    x -= RATES[s];
  }
  return 1;
}

export function addOwnedHero(save, id) {
  const h = save.heroes[id];
  if (!h) {
    save.heroes[id] = { level: 1, dupes: 0 };
    return { isNew: true, dupes: 0, overflowGold: 0 };
  }
  if (h.dupes < DUPE_MAX) {
    h.dupes += 1;
    return { isNew: false, dupes: h.dupes, overflowGold: 0 };
  }
  const star = HEROES.find(x => x.id === id).star;
  const gold = OVERFLOW_GOLD[star];
  save.gold += gold;
  return { isNew: false, dupes: h.dupes, overflowGold: gold };
}

export function summon(save, count, rng) {
  const cost = COST[count];
  if (!cost || save.diamonds < cost) return { ok: false, reason: 'dia' };
  save.diamonds -= cost;
  const results = [];
  for (let i = 0; i < count; i++) {
    const star = rollStar(rng, save.pity >= PITY);
    save.pity = star >= 6 ? 0 : save.pity + 1;
    const pool = BY_STAR[star];
    const id = pool[Math.floor(rng() * pool.length)];
    results.push({ id, star, ...addOwnedHero(save, id) });
  }
  return { ok: true, results };
}
