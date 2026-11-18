import { describe, it, expect } from 'vitest';
import { defaultSave, normalize } from '../src/core/save.js';
import { loginToday, claimLogin, LOGIN_REWARDS } from '../src/core/attendance.js';
import { achvState, achvClaimable, claimAchv } from '../src/core/achievements.js';
import { summon } from '../src/core/gacha.js';
import { makeRng } from '../src/core/rng.js';

const day = n => new Date(2026, 10, 1 + n, 12);

describe('출석 체크', () => {
  it('하루 한 번, 7일 차례대로, 7일째 다음은 1일째부터', () => {
    const s = defaultSave();
    expect(loginToday(s, day(0))).toBe(0);
    expect(claimLogin(s, Math.random, day(0)).day).toBe(0);
    expect(s.diamonds).toBe(3000 + 100);
    expect(claimLogin(s, Math.random, day(0))).toBeNull(); // 같은 날 또는 안 됨
    for (let i = 1; i < 7; i++) expect(claimLogin(s, Math.random, day(i)).day).toBe(i);
    expect(s.tickets.star4).toBe(2); // 처음 선물 1 + 7일째 1
    expect(loginToday(s, day(7))).toBe(0);
    expect(s.login.total).toBe(7);
  });
  it('하루 빠져도 처음으로 돌아가지 않는다, 4일째는 장비', () => {
    const s = defaultSave();
    for (const d of [0, 2, 5]) claimLogin(s, Math.random, day(d)); // 띄엄띄엄
    expect(loginToday(s, day(9))).toBe(3);
    const r = claimLogin(s, makeRng(3), day(9));
    expect(r.got[0].kind).toBe('gear');
    expect(r.got[0].grade).toBeLessThanOrEqual(LOGIN_REWARDS[3][0].top);
    expect(Object.values(s.gear).reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('저장했다 불러와도 그대로', () => {
    const s = defaultSave();
    claimLogin(s, Math.random, day(0));
    const back = normalize(JSON.parse(JSON.stringify(s)));
    expect(back.login).toEqual(s.login);
  });
});

describe('업적', () => {
  it('목표에 닿으면 한 번만 받는다', () => {
    const s = defaultSave();
    expect(achvClaimable(s)).toBe(0);
    s.cleared = ['1-10'];
    expect(achvState(s).find(a => a.id === 'st1').done).toBe(true);
    expect(claimAchv(s, 'st3')).toBeNull();
    const before = s.diamonds;
    expect(claimAchv(s, 'st1')).not.toBeNull();
    expect(s.diamonds).toBe(before + 200);
    expect(claimAchv(s, 'st1')).toBeNull();
  });
  it('소환 횟수를 센다(10+1은 11번)', () => {
    const s = defaultSave();
    s.diamonds = 100000;
    summon(s, 11, makeRng(1));
    expect(s.stats.summons).toBe(11);
    expect(achvState(s).find(a => a.id === 'sum10').done).toBe(true);
    const back = normalize(JSON.parse(JSON.stringify({ ...s, achv: ['sum10', 'nope'] })));
    expect(back.achv).toEqual(['sum10']);
    expect(back.stats.summons).toBe(11);
  });
});
