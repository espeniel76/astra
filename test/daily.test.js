import { describe, it, expect } from 'vitest';
import { MISSIONS, REWARD, dayKey, ensureToday, bump, claim, claimable } from '../src/core/daily.js';
import { defaultSave } from '../src/core/save.js';

const d1 = new Date(2026, 10, 14, 20, 0), d1late = new Date(2026, 10, 14, 23, 59), d2 = new Date(2026, 10, 15, 0, 1);

describe('일일 미션', () => {
  it('미션 3개, 보상 100', () => {
    expect(MISSIONS.map(m => [m.id, m.goal])).toEqual([['battle', 5], ['summon', 1], ['levelup', 1]]);
    expect(REWARD).toBe(100);
    expect(dayKey(d1)).toBe('2026-11-14');
  });
  it('전투 5번 하면 받을 수 있고, 한 번만 받는다', () => {
    const s = defaultSave();
    for (let i = 0; i < 5; i++) bump(s, 'battle', 1, d1);
    expect(claimable(s, d1)).toBe(1);
    expect(claim(s, 'battle', d1)).toBe(true);
    expect(s.diamonds).toBe(3100);
    expect(claim(s, 'battle', d1late)).toBe(false);
    expect(s.diamonds).toBe(3100);
  });
  it('4번만 하면 못 받는다', () => {
    const s = defaultSave();
    for (let i = 0; i < 4; i++) bump(s, 'battle', 1, d1);
    expect(claim(s, 'battle', d1)).toBe(false);
  });
  it('자정이 지나면 새로 시작한다', () => {
    const s = defaultSave();
    for (let i = 0; i < 5; i++) bump(s, 'battle', 1, d1);
    claim(s, 'battle', d1);
    ensureToday(s, d2);
    expect(s.daily.progress.battle).toBe(0);
    expect(s.daily.claimed).toEqual([]);
    for (let i = 0; i < 5; i++) bump(s, 'battle', 1, d2);
    expect(claim(s, 'battle', d2)).toBe(true);
  });
});
