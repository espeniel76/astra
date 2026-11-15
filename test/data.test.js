import { describe, it, expect } from 'vitest';
import { HEROES, HERO, STAR_COLOR } from '../src/data/heroes.js';
import { MONSTERS } from '../src/data/monsters.js';
import { STAGES, STAGE, CHAPTERS } from '../src/data/stages.js';

describe('영웅 데이터', () => {
  it('영웅은 82명이고 별 분포가 정해진 대로다', () => {
    expect(HEROES.length).toBe(82);
    const by = {};
    for (const h of HEROES) by[h.star] = (by[h.star] || 0) + 1;
    expect(by).toEqual({ 1: 10, 2: 10, 3: 10, 4: 10, 5: 11, 6: 21, 7: 9, 8: 1 });
    expect(HEROES.find(h => h.star === 8).id).toBe('astra');
  });
  it('자력술사는 ★5지만 좀비 생존자 영웅 모습 그대로', () => {
    expect(HERO.magnetist.star).toBe(5);
    expect(HERO.magnetist.hero).toBe(true);
  });
  it('id는 겹치지 않는다', () => {
    expect(new Set(HEROES.map(h => h.id)).size).toBe(HEROES.length);
    expect(Object.keys(HERO).length).toBe(HEROES.length);
  });
  it('모든 스킬은 쿨타임이 1 이상이고 효과가 하나 이상이다', () => {
    for (const h of HEROES) {
      expect(h.skill.cd, h.id).toBeGreaterThanOrEqual(1);
      expect(h.skill.fx.length, h.id).toBeGreaterThanOrEqual(1);
      expect(h.skill.name && h.skill.desc, h.id).toBeTruthy();
    }
  });
  it('★7은 아홉 명', () => {
    expect(HEROES.filter(h => h.star === 7).map(h => h.id)).toEqual(['guardian', 'stareater', 'judge', 'abysslord', 'worldtree', 'dragonemperor', 'phoenixqueen', 'chronos', 'thundergod']);
  });
  it('별 색은 ★1~★7 모두 있다', () => {
    for (let s = 1; s <= 7; s++) expect(STAR_COLOR[s]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('스테이지 데이터', () => {
  it('15챕터, 스테이지 150개, 보스 15개', () => {
    expect(STAGES.length).toBe(150);
    expect(STAGES.filter(s => s.boss).map(s => s.id)).toEqual(CHAPTERS.map(c => `${c.n}-10`));
    expect(CHAPTERS.map(c => c.name)).toEqual(['초원', '숲', '동굴', '사막', '설원', '늪지', '화산', '해안', '유적', '수정 동굴', '묘지', '하늘 섬', '어둠의 성', '별의 공허', '천공']);
  });
  it('첫 클리어 다이아 합', () => {
    expect(STAGES.reduce((t, s) => t + s.firstDia, 0)).toBe(135 * 150 + 15 * 1000);
  });
  it('깰 때마다 다이아 조금(보통 10, 보스 30)', () => {
    for (const s of STAGES) expect(s.dia).toBe(s.boss ? 30 : 10);
  });
  it('챕터마다 몬스터가 겹치지 않고, 보스는 boss 표시', () => {
    const all = CHAPTERS.flatMap(c => [...c.foes, c.boss]);
    expect(new Set(all).size).toBe(all.length);
    for (const c of CHAPTERS) {
      expect(MONSTERS[c.boss].boss).toBe(true);
      for (const m of c.foes) expect(MONSTERS[m].boss).toBe(false);
    }
  });
  it('모든 적은 몬스터 목록에 있고 한 스테이지 최대 3마리', () => {
    for (const s of STAGES) {
      expect(s.foes.length).toBeGreaterThanOrEqual(1);
      expect(s.foes.length).toBeLessThanOrEqual(3);
      for (const f of s.foes) expect(MONSTERS[f.mon], `${s.id} ${f.mon}`).toBeTruthy();
    }
    expect(STAGE['1-1'].chapter).toBe(1);
  });
});
