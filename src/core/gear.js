// 장비 끼기·빼기·얻기. 장비 정의는 src/data/gear.js.
import { HERO } from '../data/heroes.js';
import { SLOTS, MAX_GRADE, gearKey, rollGear } from '../data/gear.js';

export const bagCount = (save, slot, grade) => save.gear?.[gearKey(slot, grade)] || 0;

export function addGear(save, slot, grade, n = 1) {
  save.gear ||= {};
  const k = gearKey(slot, grade);
  save.gear[k] = (save.gear[k] || 0) + n;
  if (save.gear[k] <= 0) delete save.gear[k];
}

// 가방에서 꺼내 낀다. 끼고 있던 것은 가방으로 돌아간다.
export function equip(save, id, slot, grade) {
  const h = save.heroes[id];
  if (!h || !HERO[id] || !SLOTS[slot]) return { ok: false, reason: 'none' };
  if (!(grade >= 1 && grade <= MAX_GRADE) || bagCount(save, slot, grade) < 1) return { ok: false, reason: 'bag' };
  h.gear ||= {};
  if (h.gear[slot] === grade) return { ok: true };
  if (h.gear[slot]) addGear(save, slot, h.gear[slot], 1);
  addGear(save, slot, grade, -1);
  h.gear[slot] = grade;
  return { ok: true };
}

export function unequip(save, id, slot) {
  const h = save.heroes[id];
  if (!h?.gear?.[slot]) return { ok: false };
  addGear(save, slot, h.gear[slot], 1);
  delete h.gear[slot];
  if (!Object.keys(h.gear).length) delete h.gear;
  return { ok: true };
}

// 장비 n개 얻기(top = 가장 높은 등급). 얻은 목록을 돌려준다
export function dropGear(save, rng, top, n = 1) {
  const got = [];
  for (let i = 0; i < n; i++) {
    const g = rollGear(rng, top);
    addGear(save, g.slot, g.grade, 1);
    got.push(g);
  }
  return got;
}
