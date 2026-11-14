// 영웅 육성: 레벨업(골드, 실패 없음)과 겹치기(같은 영웅이 또 나오면 +10%).
// 별마다 최대 레벨이 달라서, 낮은 별은 아무리 키워도 높은 별을 못 따라온다.
import { HERO, STAR_MULT } from '../data/heroes.js';

export { STAR_MULT };
export const MAX_LEVEL_BY_STAR = [0, 10, 15, 20, 25, 30, 40, 50];
export const MAX_LEVEL = 50;
export const maxLevel = id => MAX_LEVEL_BY_STAR[HERO[id].star];
export const DUPE_MAX = 5;

export function heroStats(id, level = 1, dupes = 0) {
  const b = HERO[id].base;
  const m = (1 + 0.08 * (level - 1)) * (1 + 0.1 * dupes);
  return { hp: Math.round(b.hp * m), atk: Math.round(b.atk * m), def: Math.round(b.def * m), spd: b.spd };
}

export const levelCost = level => Math.round(100 * 1.15 ** (level - 1));

export function levelUp(save, id) {
  const h = save.heroes[id];
  if (!h) return { ok: false, reason: 'none' };
  if (h.level >= maxLevel(id)) return { ok: false, reason: 'max' };
  const cost = levelCost(h.level);
  if (save.gold < cost) return { ok: false, reason: 'gold' };
  save.gold -= cost;
  h.level += 1;
  return { ok: true };
}

// 전투력: 한눈에 보는 세기 숫자
export function power(id, level = 1, dupes = 0) {
  const s = heroStats(id, level, dupes);
  return Math.round(s.hp * 0.2 + s.atk * 3 + s.def * 2);
}

export function teamPower(save) {
  return save.team.reduce((t, id) => t + (id && save.heroes[id] ? power(id, save.heroes[id].level, save.heroes[id].dupes) : 0), 0);
}
