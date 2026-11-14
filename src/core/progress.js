// 영웅 육성: 레벨업(골드, 실패 없음)과 겹치기(같은 영웅이 또 나오면 +10%).
import { HERO } from '../data/heroes.js';

export const MAX_LEVEL = 30;
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
  if (h.level >= MAX_LEVEL) return { ok: false, reason: 'max' };
  const cost = levelCost(h.level);
  if (save.gold < cost) return { ok: false, reason: 'gold' };
  save.gold -= cost;
  h.level += 1;
  return { ok: true };
}
