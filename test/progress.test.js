import { describe, it, expect } from 'vitest';
import { heroStats, levelCost, levelUp, MAX_LEVEL, DUPE_MAX } from '../src/core/progress.js';
import { HERO } from '../src/data/heroes.js';

const mkSave = (gold, heroes) => ({ gold, diamonds: 0, heroes });

describe('능력치', () => {
  const b = HERO.executioner.base;
  it('1레벨 겹침 0은 기본 능력치', () => {
    expect(heroStats('executioner', 1, 0)).toEqual(b);
  });
  it('레벨마다 8%씩 오른다', () => {
    expect(heroStats('executioner', 11, 0).atk).toBe(Math.round(b.atk * 1.8));
  });
  it('겹칠 때마다 10%씩 오른다', () => {
    expect(heroStats('executioner', 1, 5).hp).toBe(Math.round(b.hp * 1.5));
  });
  it('속도는 레벨·겹침과 상관없다', () => {
    expect(heroStats('executioner', 30, 5).spd).toBe(b.spd);
  });
});

describe('레벨업', () => {
  it('비용 곡선', () => {
    expect(levelCost(1)).toBe(100);
    expect(levelCost(2)).toBe(118);
  });
  it('골드가 모자라면 안 되고 골드도 그대로', () => {
    const s = mkSave(99, { slinger: { level: 1, dupes: 0 } });
    expect(levelUp(s, 'slinger')).toEqual({ ok: false, reason: 'gold' });
    expect(s.gold).toBe(99);
    expect(s.heroes.slinger.level).toBe(1);
  });
  it('골드가 있으면 반드시 오른다', () => {
    const s = mkSave(100, { slinger: { level: 1, dupes: 0 } });
    expect(levelUp(s, 'slinger')).toEqual({ ok: true });
    expect(s.gold).toBe(0);
    expect(s.heroes.slinger.level).toBe(2);
  });
  it('최대 레벨이면 더 안 오른다', () => {
    const s = mkSave(1e9, { slinger: { level: MAX_LEVEL, dupes: 0 } });
    expect(levelUp(s, 'slinger')).toEqual({ ok: false, reason: 'max' });
    expect(MAX_LEVEL).toBe(30);
    expect(DUPE_MAX).toBe(5);
  });
  it('없는 영웅은 레벨업 불가', () => {
    expect(levelUp(mkSave(1e9, {}), 'slinger').ok).toBe(false);
  });
});
