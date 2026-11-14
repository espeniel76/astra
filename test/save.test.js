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
