import { describe, it, expect } from 'vitest';
import { STAGES, STAGE } from '../src/data/stages.js';
import { MONSTERS } from '../src/data/monsters.js';
import { starsFor, recordStars, chestState, claimChest } from '../src/core/stars.js';
import { defaultSave } from '../src/core/save.js';

describe('새 적은 조금씩', () => {
  it('챕터 졸개 a는 1부터, b는 4부터, c는 7부터 나온다', () => {
    for (const ch of [1, 2, 3]) {
      const st = STAGES.filter(s => s.chapter === ch);
      const firstSeen = {};
      for (const s of st) for (const f of s.foes) firstSeen[f.mon] ??= s.n;
      const [a, b, c] = [st[0].foes[0].mon, st[3].foes.find(f => f.mon !== st[0].foes[0].mon).mon, st[6].newFoe];
      expect(firstSeen[a]).toBe(1);
      expect(firstSeen[b]).toBe(4);
      expect(firstSeen[c]).toBe(7);
    }
  });
  it('새로운 적 표시', () => {
    expect(STAGE['1-1'].newFoe).toBe('slime');
    expect(STAGE['1-2'].newFoe).toBe(undefined);
    expect(STAGE['1-4'].newFoe).toBe('rat');
    expect(STAGE['1-7'].newFoe).toBe('bee');
    expect(STAGE['1-10'].newFoe).toBe('kingslime');
    for (const m of Object.values(MONSTERS)) expect(m.desc, m.id).toBeTruthy();
  });
  it('모든 스테이지에 추천 전투력과 행동 한도가 있다', () => {
    for (const s of STAGES) { expect(s.rec).toBeGreaterThan(0); expect(s.limit).toBe(10 + s.foes.length * 4 + (s.boss ? 10 : 0)); }
    expect(STAGE['3-10'].rec).toBeGreaterThan(STAGE['1-1'].rec);
  });
});

describe('별 3개', () => {
  const st = STAGE['1-3'];
  const b = (result, died, turn) => ({ result, anyAllyDied: died, turn });
  it('조건별 별', () => {
    expect(starsFor(b('lose', false, 5), st)).toBe(0);
    expect(starsFor(b('win', true, 5), st)).toBe(1);
    expect(starsFor(b('win', false, st.limit + 1), st)).toBe(2);
    expect(starsFor(b('win', false, st.limit), st)).toBe(3);
  });
  it('기록은 최고값을 유지하고 깬 목록도 맞춘다', () => {
    const s = defaultSave();
    expect(recordStars(s, '1-1', 3).first).toBe(true);
    expect(recordStars(s, '1-1', 1).first).toBe(false);
    expect(s.stars['1-1']).toBe(3);
    expect(s.cleared).toEqual(['1-1']);
    recordStars(s, '1-2', 0);
    expect(s.cleared).toEqual(['1-1']);
  });
  it('챕터 별 상자 10/20/30 → 100/200/300, 한 번만', () => {
    const s = defaultSave();
    for (let n = 1; n <= 4; n++) recordStars(s, `1-${n}`, 3);
    const cs = chestState(s, 1);
    expect(cs.map(c => [c.need, c.dia])).toEqual([[10, 100], [20, 200], [30, 300]]);
    expect(cs[0].ready).toBe(true);
    expect(cs[1].ready).toBe(false);
    const d = s.diamonds;
    expect(claimChest(s, 1, 10)).toBe(true);
    expect(s.diamonds).toBe(d + 100);
    expect(claimChest(s, 1, 10)).toBe(false);
    expect(claimChest(s, 1, 20)).toBe(false);
  });
});
