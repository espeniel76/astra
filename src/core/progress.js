// 영웅 육성: 레벨업(골드, 실패 없음)과 겹치기(같은 영웅이 또 나오면 +10%).
// 별마다 최대 레벨이 달라서, 낮은 별은 아무리 키워도 높은 별을 못 따라온다.
// ★7 각성(큰 별 하나 = ★8): 같은 ★7을 +5까지 겹치면 각성할 수 있다. 능력치 2배, 최대 레벨 60.
import { HERO, STAR_MULT } from '../data/heroes.js';

export { STAR_MULT };
export const MAX_LEVEL_BY_STAR = [0, 10, 15, 20, 25, 30, 40, 50, 70];
export const AWAKEN_MAX_LEVEL = 60;
export const MAX_LEVEL = 70; // 근원(★8)
export const maxLevel = (id, awakened = false) => (awakened ? AWAKEN_MAX_LEVEL : MAX_LEVEL_BY_STAR[HERO[id].star]);
export const DUPE_MAX = 5;

export function heroStats(id, level = 1, dupes = 0, awakened = false) {
  const b = HERO[id].base;
  const m = (1 + 0.08 * (level - 1)) * (1 + 0.1 * dupes) * (awakened ? 2 : 1);
  return { hp: Math.round(b.hp * m), atk: Math.round(b.atk * m), def: Math.round(b.def * m), spd: b.spd };
}

export const levelCost = level => Math.round(100 * 1.15 ** (level - 1));

export function levelUp(save, id) {
  const h = save.heroes[id];
  if (!h) return { ok: false, reason: 'none' };
  if (h.level >= maxLevel(id, h.awakened)) return { ok: false, reason: 'max' };
  const cost = levelCost(h.level);
  if (save.gold < cost) return { ok: false, reason: 'gold' };
  save.gold -= cost;
  h.level += 1;
  return { ok: true };
}

export function awaken(save, id) {
  const h = save.heroes[id];
  if (!h) return { ok: false, reason: 'none' };
  if (HERO[id].star !== 7) return { ok: false, reason: 'star' };
  if (h.awakened) return { ok: false, reason: 'done' };
  if (h.dupes < DUPE_MAX) return { ok: false, reason: 'dupes' };
  h.awakened = true;
  return { ok: true };
}

// 전투력: 한눈에 보는 세기 숫자
export function power(id, level = 1, dupes = 0, awakened = false) {
  const s = heroStats(id, level, dupes, awakened);
  return Math.round(s.hp * 0.2 + s.atk * 3 + s.def * 2);
}

export function teamPower(save) {
  return save.team.reduce((t, id) => {
    const h = id && save.heroes[id];
    return t + (h ? power(id, h.level, h.dupes, h.awakened) : 0);
  }, 0);
}

// 관리자(src/core/admin.js): 모든 영웅을 가장 세게 — 최대 레벨, 겹치기 +5, ★7은 각성까지(아들 요청, 2026-11-15)
// 새 영웅이 생겨도 관리자 기기에서 게임을 켜면 다시 불러서 그 영웅도 들어온다.
export function maxAllHeroes(save) {
  for (const id of Object.keys(HERO)) {
    const awakened = HERO[id].star === 7;
    save.heroes[id] = { level: maxLevel(id, awakened), dupes: DUPE_MAX };
    if (awakened) save.heroes[id].awakened = true;
  }
}
