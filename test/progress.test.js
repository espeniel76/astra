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
    expect(levelCost(2)).toBe(115);
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
    const s = mkSave(1e9, { slinger: { level: 10, dupes: 0 } });
    expect(levelUp(s, 'slinger')).toEqual({ ok: false, reason: 'max' });
    expect(MAX_LEVEL).toBe(70); // 근원(0.001%) 최대 레벨
    expect(DUPE_MAX).toBe(5);
  });
  it('없는 영웅은 레벨업 불가', () => {
    expect(levelUp(mkSave(1e9, {}), 'slinger').ok).toBe(false);
  });
});

import { STAR_MULT, MAX_LEVEL_BY_STAR, maxLevel, power, teamPower } from '../src/core/progress.js';
import { HEROES } from '../src/data/heroes.js';

describe('v2: 높은 별은 진짜 세다', () => {
  const byStarRole = (star, role) => HEROES.find(h => h.star === star && h.role === role);
  it('별 배율과 최대 레벨', () => {
    expect(STAR_MULT.slice(1)).toEqual([1, 1.3, 1.7, 2.2, 2.9, 8.7, 17.4, 34.8]);
    expect(MAX_LEVEL_BY_STAR.slice(1)).toEqual([10, 15, 20, 25, 30, 40, 50, 70]);
    expect(maxLevel('slinger')).toBe(10);
    expect(maxLevel('guardian')).toBe(50);
  });
  it('★6은 같은 역할 ★5의 3배, ★7은 ★6 탱커의 2배', () => {
    const a5 = heroStats(byStarRole(5, 'dps').id).atk, a6 = heroStats(byStarRole(6, 'dps').id).atk;
    expect(Math.abs(a6 - 3 * a5)).toBeLessThanOrEqual(2);
    const t6 = heroStats(byStarRole(6, 'tank').id).hp, t7 = heroStats('guardian').hp;
    expect(Math.abs(t7 - 2 * t6)).toBeLessThanOrEqual(2);
  });
  it('꽉 채운 ★1도 막 뽑은 ★6보다 약하다', () => {
    for (const one of HEROES.filter(h => h.star === 1)) for (const six of HEROES.filter(h => h.star === 6)) {
      expect(heroStats(one.id, maxLevel(one.id), 5).atk).toBeLessThan(heroStats(six.id, 1, 0).atk);
    }
  });
  it('레벨업은 별마다 최대 레벨에서 멈춘다', () => {
    const s = mkSave(1e9, { slinger: { level: 10, dupes: 0 } });
    expect(levelUp(s, 'slinger')).toEqual({ ok: false, reason: 'max' });
  });
  it('전투력', () => {
    const st = heroStats('executioner', 3, 1);
    expect(power('executioner', 3, 1)).toBe(Math.round(st.hp * 0.2 + st.atk * 3 + st.def * 2));
    const s = mkSave(0, { slinger: { level: 2, dupes: 0 }, herbalist: { level: 1, dupes: 0 } });
    s.team = ['slinger', null, 'herbalist'];
    expect(teamPower(s)).toBe(power('slinger', 2, 0) + power('herbalist', 1, 0));
  });
});

import { awaken } from '../src/core/progress.js';

describe('★7 각성(큰 별 ★8)', () => {
  it('같은 ★7을 +5까지 겹쳐야 각성할 수 있다', () => {
    const s = mkSave(0, { guardian: { level: 1, dupes: 4 }, executioner: { level: 1, dupes: 5 } });
    expect(awaken(s, 'guardian')).toEqual({ ok: false, reason: 'dupes' });
    expect(awaken(s, 'executioner')).toEqual({ ok: false, reason: 'star' });
    s.heroes.guardian.dupes = 5;
    expect(awaken(s, 'guardian')).toEqual({ ok: true });
    expect(s.heroes.guardian.awakened).toBe(true);
    expect(awaken(s, 'guardian')).toEqual({ ok: false, reason: 'done' });
  });
  it('각성하면 능력치 2배, 최대 레벨 60', () => {
    const a = heroStats('guardian', 10, 5), b = heroStats('guardian', 10, 5, true);
    expect(Math.abs(b.atk - a.atk * 2)).toBeLessThanOrEqual(1);
    expect(maxLevel('guardian')).toBe(50);
    expect(maxLevel('guardian', true)).toBe(60);
    const s = mkSave(1e12, { guardian: { level: 50, dupes: 5, awakened: true } });
    expect(levelUp(s, 'guardian')).toEqual({ ok: true });
  });
});

describe('관리자 풀강', () => {
  it('모든 영웅이 최대 레벨·겹치기 +5, ★7은 각성(Lv60)', async () => {
    const { maxAllHeroes, maxLevel } = await import('../src/core/progress.js');
    const { HEROES } = await import('../src/data/heroes.js');
    const { defaultSave, normalize } = await import('../src/core/save.js');
    const s = defaultSave();
    maxAllHeroes(s);
    expect(Object.keys(s.heroes).length).toBe(HEROES.length);
    for (const h of HEROES) {
      const o = s.heroes[h.id];
      expect(o.dupes).toBe(5);
      expect(!!o.awakened).toBe(h.star === 7);
      expect(o.level).toBe(maxLevel(h.id, h.star === 7));
    }
    if (normalize) expect(normalize(JSON.parse(JSON.stringify(s))).heroes).toEqual(s.heroes); // 저장했다 불러와도 그대로
  });
});
