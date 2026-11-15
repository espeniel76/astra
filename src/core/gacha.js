// 소환(뽑기). 확률은 쿠키런 킹덤 수준으로 낮고, 화면에 그대로 공개한다.
// - 천장: ★6 이상이 299번 연속 안 나오면 300번째는 ★6 이상 확정. save.pity = ★6 이상 없이 지나간 횟수.
//   확정까지 남은 횟수 = PITY - save.pity.
// - 10+1 소환에는 ★4 이상이 1명 이상 꼭 들어간다.
// - 처음 시작 선물: ★4 확정 소환권(save.tickets.star4).
import { HEROES } from '../data/heroes.js';
import { DUPE_MAX } from './progress.js';

// ★8 = 근원(아스트라 한 명): 0.001%(10만 번에 1번). ★1에서 0.001%를 덜어 합 100%
export const RATES = { 1: 44.999, 2: 34, 3: 15, 4: 5, 5: 0.85, 6: 0.12, 7: 0.03, 8: 0.001 };
export const PITY = 300;
export const COST = { 1: 100, 11: 1000 };
// +5 이후에 또 겹치면 별에 따라 골드로 바꿔 준다
export const OVERFLOW_GOLD = [0, 100, 200, 400, 800, 1500, 5000, 10000, 30000];

const BY_STAR = {};
for (const h of HEROES) (BY_STAR[h.star] ||= []).push(h.id);

// minStar 보다 낮은 별은 빼고, 남은 별끼리는 공개 확률의 비율대로 뽑는다
export function rollStar(rng, minStar = 1) {
  const min = minStar === true ? 6 : Math.max(1, minStar || 1);
  const stars = [8, 7, 6, 5, 4, 3, 2, 1].filter(s => s >= min);
  const total = stars.reduce((t, s) => t + RATES[s], 0);
  let x = rng() * total;
  for (const s of stars) {
    if (x < RATES[s]) return s;
    x -= RATES[s];
  }
  return stars[stars.length - 1];
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

function pickHero(save, star, rng) {
  const pool = BY_STAR[star];
  const id = pool[Math.floor(rng() * pool.length)];
  return { id, star, ...addOwnedHero(save, id) };
}

export function summon(save, count, rng) {
  const cost = COST[count];
  if (!cost || save.diamonds < cost) return { ok: false, reason: 'dia' };
  save.diamonds -= cost;
  const results = [];
  for (let i = 0; i < count; i++) {
    let min = 1;
    if (save.pity >= PITY - 1) min = 6;
    else if (count === 11 && i === count - 1 && !results.some(r => r.star >= 4)) min = 4;
    const star = rollStar(rng, min);
    save.pity = star >= 6 ? 0 : save.pity + 1;
    results.push(pickHero(save, star, rng));
  }
  return { ok: true, results };
}

// ★4 확정 소환권: 다이아와 천장에는 영향 없음
export function useTicket(save, rng) {
  if (!save.tickets || save.tickets.star4 < 1) return { ok: false, reason: 'ticket' };
  save.tickets.star4 -= 1;
  return { ok: true, results: [pickHero(save, 4, rng)] };
}
