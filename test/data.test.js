import { describe, it, expect } from 'vitest';
import { HEROES, HERO, STAR_COLOR } from '../src/data/heroes.js';
import { MONSTERS } from '../src/data/monsters.js';
import { STAGES, STAGE, CHAPTERS } from '../src/data/stages.js';

describe('영웅 데이터', () => {
  it('영웅은 43명이고 별 분포가 정해진 대로다', () => {
    expect(HEROES.length).toBe(43);
    const by = {};
    for (const h of HEROES) by[h.star] = (by[h.star] || 0) + 1;
    expect(by).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 22, 7: 1 });
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
  it('★7은 영원한 황금의 수호신이다', () => {
    expect(HEROES.filter(h => h.star === 7).map(h => h.id)).toEqual(['guardian']);
  });
  it('별 색은 ★1~★7 모두 있다', () => {
    for (let s = 1; s <= 7; s++) expect(STAR_COLOR[s]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('스테이지 데이터', () => {
  it('스테이지 30개, 보스 3개', () => {
    expect(STAGES.length).toBe(30);
    expect(STAGES.filter(s => s.boss).map(s => s.id)).toEqual(['1-10', '2-10', '3-10']);
    expect(CHAPTERS.map(c => c.name)).toEqual(['초원', '숲', '동굴']);
  });
  it('첫 클리어 다이아 합은 7050', () => {
    expect(STAGES.reduce((t, s) => t + s.firstDia, 0)).toBe(27 * 150 + 3 * 1000);
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
