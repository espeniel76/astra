import { describe, it, expect } from 'vitest';
import { defaultSave, loadSave, writeSave, exportCode, importCode, SAVE_KEY } from '../src/core/save.js';

const mem = (init = {}) => {
  const m = { ...init };
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m };
};

describe('저장', () => {
  it('처음이면 기본값(다이아 3000)', () => {
    const s = loadSave(mem());
    expect(s.diamonds).toBe(3000);
    expect(s.team).toEqual([null, null, null]);
    expect(s.settings.flash).toBe(false);
  });
  it('깨진 저장은 기본값', () => {
    expect(loadSave(mem({ [SAVE_KEY]: '{망가진' })).diamonds).toBe(3000);
    expect(loadSave(mem({ [SAVE_KEY]: '42' })).diamonds).toBe(3000);
  });
  it('모자란 필드는 기본값으로 채운다', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 1, diamonds: 50 }) }));
    expect(s.diamonds).toBe(50);
    expect(s.gold).toBe(0);
    expect(s.daily.progress.battle).toBe(0);
    expect(s.settings.sound).toBe(true);
  });
  it('모르는 영웅·스테이지는 버리고 팀에서도 뺀다', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ heroes: { nope: { level: 3, dupes: 0 }, slinger: { level: 2, dupes: 1 } }, team: ['nope', 'slinger', null], cleared: ['1-1', '9-9'] }) }));
    expect(Object.keys(s.heroes)).toEqual(['slinger']);
    expect(s.team).toEqual([null, 'slinger', null]);
    expect(s.cleared).toEqual(['1-1']);
  });
  it('쓰고 다시 읽으면 같다', () => {
    const st = mem(), s = defaultSave();
    s.gold = 777;
    writeSave(s, st);
    expect(loadSave(st).gold).toBe(777);
  });
  it('저장소가 없어도(사파리 사생활 보호) 멈추지 않는다', () => {
    const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
    expect(loadSave(bad).diamonds).toBe(3000);
    expect(() => writeSave(defaultSave(), bad)).not.toThrow();
  });
});

describe('저장 코드', () => {
  it('내보내고 불러오면 같다(한글 포함)', () => {
    const s = defaultSave();
    s.heroes.executioner = { level: 7, dupes: 2 };
    s.team = ['executioner', null, null];
    s.daily.date = '2026-11-14';
    const code = exportCode(s);
    expect(code.startsWith('ASTRA1-')).toBe(true);
    expect(importCode(`  ${code}\n`)).toEqual(s);
  });
  it('엉뚱한 코드는 null', () => {
    expect(importCode('아무거나')).toBe(null);
    expect(importCode('ASTRA1-@@@')).toBe(null);
    expect(importCode('')).toBe(null);
    expect(importCode('ASTRA1-' + btoa('[1,2]'))).toBe(null);
  });
});

describe('테스트판 코드', () => {
  it('테스트판에서 만든 코드는 진짜 게임에서 불러올 수 없다', () => {
    const code = exportCode(defaultSave(), true);
    expect(code.startsWith('ASTRATEST1-')).toBe(true);
    expect(importCode(code)).toBe(null);
    expect(importCode(code, true)).not.toBe(null);
  });
});

describe('v2 저장', () => {
  it('새 저장에는 ★4 확정 소환권 1장, 별 기록은 비어 있다', () => {
    const s = defaultSave();
    expect(s.tickets.star4).toBe(1);
    expect(s.stars).toEqual({});
    expect(s.starChests).toEqual([]);
  });
  it('옛 v1 저장: 레벨은 별 최대로, 깬 스테이지는 별 1개, 소환권은 없음', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 1, heroes: { slinger: { level: 30, dupes: 0 } }, cleared: ['1-1', '1-2'], pity: 49 }) }));
    expect(s.heroes.slinger.level).toBe(10);
    expect(s.stars).toEqual({ '1-1': 1, '1-2': 1 });
    expect(s.tickets.star4).toBe(0);
    expect(s.pity).toBe(49);
  });
  it('별 기록은 0~3으로 고친다', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 2, stars: { '1-1': 9, '1-2': -1, '9-9': 3 }, tickets: { star4: 2 } }) }));
    expect(s.stars).toEqual({ '1-1': 3 });
    expect(s.cleared).toEqual(['1-1']);
    expect(s.tickets.star4).toBe(2);
  });
});

describe('v2 별 상자 저장', () => {
  it('받은 별 상자는 다시 불러와도 받은 걸로 남는다', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 2, starChests: ['1-10', '2-20', 'x'] }) }));
    expect(s.starChests).toEqual(['1-10', '2-20']);
  });
  it('천장 카운트는 299를 넘지 않는다', () => {
    expect(loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 2, pity: 900 }) })).pity).toBe(299);
  });
});

describe('각성 저장', () => {
  it('각성은 ★7 +5일 때만 남고, 레벨 상한도 60', () => {
    const s = loadSave(mem({ [SAVE_KEY]: JSON.stringify({ version: 2, heroes: { guardian: { level: 58, dupes: 5, awakened: true }, judge: { level: 3, dupes: 2, awakened: true }, slinger: { level: 3, dupes: 5, awakened: true } } }) }));
    expect(s.heroes.guardian).toEqual({ level: 58, dupes: 5, awakened: true });
    expect(s.heroes.judge.awakened).toBe(undefined);
    expect(s.heroes.slinger.awakened).toBe(undefined);
  });
});
