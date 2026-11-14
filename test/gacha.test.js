import { describe, it, expect } from 'vitest';
import { RATES, PITY, COST, rollStar, summon, addOwnedHero } from '../src/core/gacha.js';
import { makeRng } from '../src/core/rng.js';
import { HERO } from '../src/data/heroes.js';

const mkSave = (diamonds, pity = 0) => ({ diamonds, gold: 0, pity, heroes: {} });

describe('소환 규칙', () => {
  it('확률·천장·가격은 설계대로', () => {
    expect(RATES).toEqual({ 1: 45, 2: 34, 3: 15, 4: 5, 5: 0.85, 6: 0.12, 7: 0.03 });
    expect(PITY).toBe(300);
    expect(COST).toEqual({ 1: 100, 11: 1000 });
  });
  it('다이아가 모자라면 소환이 안 되고 다이아는 그대로', () => {
    const s = mkSave(99);
    expect(summon(s, 1, makeRng(1))).toEqual({ ok: false, reason: 'dia' });
    expect(s.diamonds).toBe(99);
    const t = mkSave(999);
    expect(summon(t, 11, makeRng(1)).ok).toBe(false);
    expect(t.diamonds).toBe(999);
  });
  it('rollStar 분포가 공개 확률과 맞다', () => {
    const r = makeRng(12345), n = 200000, c = {};
    for (let i = 0; i < n; i++) { const s = rollStar(r, false); c[s] = (c[s] || 0) + 1; }
    for (const s of [1, 2, 3, 4, 5, 6, 7]) expect(Math.abs((c[s] || 0) / n * 100 - RATES[s])).toBeLessThan(0.3);
  });
  it('forceHigh면 항상 ★6 이상', () => {
    const r = makeRng(3);
    for (let i = 0; i < 1000; i++) expect(rollStar(r, 6)).toBeGreaterThanOrEqual(6);
  });
  it('★6 이상 없이 299번 지나면 300번째는 ★6 이상이고 pity는 0', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = mkSave(100, 299);
      const res = summon(s, 1, makeRng(seed));
      expect(res.results[0].star).toBeGreaterThanOrEqual(6);
      expect(s.pity).toBe(0);
    }
  });
  it('어떤 시드든 ★6 미만이 300번 연속 나오지 않는다', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = mkSave(1e9), r = makeRng(seed);
      let run = 0, worst = 0;
      for (let i = 0; i < 3000; i++) {
        const st = summon(s, 1, r).results[0].star;
        run = st >= 6 ? 0 : run + 1;
        worst = Math.max(worst, run);
      }
      expect(worst).toBeLessThanOrEqual(PITY - 1);
    }
  });
  it('10+1 소환은 11명, 다이아 1000 차감, 결과 영웅은 보유 목록에 들어간다', () => {
    const s = mkSave(1000);
    const res = summon(s, 11, makeRng(9));
    expect(res.ok).toBe(true);
    expect(res.results.length).toBe(11);
    expect(s.diamonds).toBe(0);
    for (const x of res.results) {
      expect(HERO[x.id].star).toBe(x.star);
      expect(s.heroes[x.id]).toBeTruthy();
    }
  });
});

describe('겹치기', () => {
  it('같은 영웅 7번: 처음 NEW, 겹침 최대 5, 넘치면 골드', () => {
    const s = mkSave(0);
    const r = [];
    for (let i = 0; i < 7; i++) r.push(addOwnedHero(s, 'executioner'));
    expect(r[0]).toMatchObject({ isNew: true, dupes: 0, overflowGold: 0 });
    expect(r[5]).toMatchObject({ isNew: false, dupes: 5, overflowGold: 0 });
    expect(r[6]).toMatchObject({ isNew: false, dupes: 5, overflowGold: 5000 });
    expect(s.heroes.executioner.dupes).toBe(5);
    expect(s.gold).toBe(5000);
  });
});

describe('천장 경계', () => {
  it('pity 298은 아직 확정이 아니다', () => {
    let forcedEvery = true;
    for (let seed = 1; seed <= 200; seed++) {
      const s = mkSave(100, 298);
      if (summon(s, 1, makeRng(seed)).results[0].star < 6) forcedEvery = false;
    }
    expect(forcedEvery).toBe(false);
  });
});

import { useTicket } from '../src/core/gacha.js';

describe('v2 소환', () => {
  it('10+1에는 ★4 이상이 꼭 1명 이상 있다', () => {
    const r = makeRng(77);
    for (let i = 0; i < 1000; i++) {
      const s = mkSave(1000);
      const res = summon(s, 11, r);
      expect(res.results.length).toBe(11);
      expect(res.results.some(x => x.star >= 4)).toBe(true);
      expect(s.diamonds).toBe(0);
    }
  });
  it('천장과 ★4 보장이 같은 묶음에 겹쳐도 11명, 다이아 1000', () => {
    const s = mkSave(1000, 295);
    const res = summon(s, 11, makeRng(5));
    expect(res.results.length).toBe(11);
    expect(res.results.some(x => x.star >= 6)).toBe(true);
    expect(s.diamonds).toBe(0);
  });
  it('★4 확정 소환권: ★4 한 명, 다이아·천장은 그대로', () => {
    const s = { ...mkSave(0, 10), tickets: { star4: 1 } };
    const res = useTicket(s, makeRng(3));
    expect(res.ok).toBe(true);
    expect(res.results[0].star).toBe(4);
    expect(s.tickets.star4).toBe(0);
    expect(s.diamonds).toBe(0);
    expect(s.pity).toBe(10);
    expect(useTicket(s, makeRng(3))).toEqual({ ok: false, reason: 'ticket' });
  });
});
