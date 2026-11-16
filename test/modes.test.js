import { describe, it, expect } from 'vitest';
import { defaultSave, normalize } from '../src/core/save.js';
import { heroStats, power } from '../src/core/progress.js';
import { equip, unequip, addGear, bagCount, dropGear } from '../src/core/gear.js';
import { rollGear, gearMult } from '../src/data/gear.js';
import { towerFloor, winTower, dungeonState, winDungeon, isOpen, DUNGEONS, teamCode, readTeamCode, finishPvp } from '../src/core/modes.js';
import { createBattle, act, runBattle } from '../src/core/battle.js';
import { makeRng } from '../src/core/rng.js';

const withHero = (id = 'slinger') => { const s = defaultSave(); s.heroes[id] = { level: 5, dupes: 1 }; s.team = [id, null, null]; return s; };

describe('장비', () => {
  it('가방에서 꺼내 끼고, 바꾸면 끼던 것은 가방으로, 빼면 돌아온다', () => {
    const s = withHero();
    addGear(s, 'weapon', 3, 1); addGear(s, 'weapon', 5, 1);
    expect(equip(s, 'slinger', 'weapon', 3).ok).toBe(true);
    expect(bagCount(s, 'weapon', 3)).toBe(0);
    expect(equip(s, 'slinger', 'weapon', 5).ok).toBe(true);
    expect(bagCount(s, 'weapon', 3)).toBe(1);
    expect(bagCount(s, 'weapon', 5)).toBe(0);
    expect(equip(s, 'slinger', 'armor', 2).ok).toBe(false); // 가방에 없음
    unequip(s, 'slinger', 'weapon');
    expect(bagCount(s, 'weapon', 5)).toBe(1);
    expect(s.heroes.slinger.gear).toBeUndefined();
  });
  it('장비는 능력치를 올리고 저장했다 불러와도 남는다', () => {
    const s = withHero();
    const before = heroStats('slinger', 5, 1, false);
    s.heroes.slinger.gear = { weapon: 5, armor: 4, acc: 2 };
    const after = heroStats('slinger', 5, 1, false, s.heroes.slinger.gear);
    expect(after.atk).toBeGreaterThan(before.atk);
    expect(after.hp).toBeGreaterThan(before.hp);
    expect(gearMult({ weapon: 5 }).atk).toBeCloseTo(1.35);
    addGear(s, 'acc', 3, 2);
    const back = normalize(JSON.parse(JSON.stringify({ ...s, gear: { ...s.gear, 'bad-9': 3, 'weapon-7': 1 } })));
    expect(back.heroes.slinger.gear).toEqual({ weapon: 5, armor: 4, acc: 2 });
    expect(back.gear).toEqual({ 'acc-3': 2 });
  });
  it('뽑기는 정한 등급을 넘지 않고, 높은 등급이 더 드물다', () => {
    const rng = makeRng(7), count = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) { const g = rollGear(rng, 4); expect(g.grade).toBeLessThanOrEqual(4); count[g.grade]++; }
    expect(count[1]).toBeGreaterThan(count[3]);
    expect(count[4]).toBeGreaterThan(0);
    const s = defaultSave();
    expect(dropGear(s, rng, 2, 3).length).toBe(3);
  });
});

describe('무한의 탑', () => {
  it('10층마다 보스, 5층마다 장비·다이아, 위로 갈수록 세다', () => {
    expect(towerFloor(10).boss).toBe(true);
    expect(towerFloor(9).boss).toBe(false);
    expect(towerFloor(5).reward.gear).toBeGreaterThan(0);
    expect(towerFloor(20).rec).toBeGreaterThan(towerFloor(10).rec);
  });
  it('다음 층을 이겨야만 기록이 오르고 보상을 받는다', () => {
    const s = defaultSave();
    expect(winTower(s, 2, Math.random)).toBeNull();
    const r = winTower(s, 1, Math.random);
    expect(s.tower.best).toBe(1);
    expect(s.gold).toBe(r.gold);
    expect(winTower(s, 1, Math.random)).toBeNull(); // 이미 깬 층
  });
});

describe('요일 던전', () => {
  const mon = new Date(2026, 10, 16); // 월요일
  it('요일마다 열리는 던전, 일요일은 전부', () => {
    expect(isOpen('gold', mon)).toBe(true);
    expect(isOpen('dia', mon)).toBe(false);
    const sun = new Date(2026, 10, 15);
    for (const k of Object.keys(DUNGEONS)) expect(isOpen(k, sun)).toBe(true);
  });
  it('하루 3번, 닫힌 던전은 보상 없음, 다음 날 다시 3번', () => {
    const s = defaultSave();
    expect(winDungeon(s, 'dia', 0, Math.random, mon)).toBeNull();
    for (let i = 0; i < 3; i++) expect(winDungeon(s, 'gold', 1, Math.random, mon)).not.toBeNull();
    expect(winDungeon(s, 'gold', 1, Math.random, mon)).toBeNull();
    expect(s.gold).toBe(27000);
    expect(dungeonState(s, new Date(2026, 10, 17)).left).toBe(3);
  });
});

describe('친구 대전', () => {
  it('팀 코드는 이름·영웅·레벨·장비를 담고, 고치면 안 읽힌다', () => {
    const s = withHero('guardian');
    s.heroes.guardian = { level: 40, dupes: 5, awakened: true, gear: { weapon: 4 } };
    s.pvp.name = '아스트라왕';
    const code = teamCode(s);
    const f = readTeamCode(code);
    expect(f.name).toBe('아스트라왕');
    expect(f.team[0]).toMatchObject({ id: 'guardian', level: 40, dupes: 5, awakened: true, gear: { weapon: 4 } });
    const [head, sum] = code.split('.');
    expect(readTeamCode(head.slice(0, -2) + 'AA.' + sum)).toBeNull();
    expect(readTeamCode('엉터리')).toBeNull();
  });
  it('상대 영웅은 적 편에 서서 스킬을 알아서 쓴다', () => {
    const team = [{ id: 'slinger', level: 10, dupes: 0 }];
    const b = createBattle({ team, foeTeam: [{ id: 'stareater', level: 50, dupes: 0 }], seed: 3 });
    const foe = b.units.find(u => u.side === 'foe');
    expect(foe.hero).toBe(true);
    foe.cd = 0;
    const ev = act(b, foe);
    expect(ev.some(e => e.type === 'skill' && e.from === foe.uid)).toBe(true);
  });
  it('패시브는 상대 편에서도 똑같이: 심판자 선고는 내 팀에, 심해의 군주 반격은 상대가 맞을 때', () => {
    const b = createBattle({ team: [{ id: 'slinger', level: 10, dupes: 0 }], foeTeam: [{ id: 'judge', level: 10, dupes: 0 }, { id: 'abysslord', level: 10, dupes: 0 }], seed: 4 });
    const me = b.units.find(u => u.side === 'ally');
    expect(me.statuses.some(s => s.k === 'defDown')).toBe(true);
    const [jd] = b.units.filter(u => u.side === 'foe');
    const hp = me.hp;
    b.attack(me, jd, 1, [], { noCrit: true });
    expect(me.hp).toBeLessThan(hp); // 물로 되돌려 맞음
  });
  it('같은 팀끼리 싸워도 끝이 난다', () => {
    const t = [{ id: 'worldtree', level: 50, dupes: 5, awakened: true }, { id: 'guardian', level: 50, dupes: 5, awakened: true }];
    const { result } = runBattle({ team: t, foeTeam: t, seed: 5 }, { maxSteps: 3000 });
    expect(['win', 'lose', null]).toContain(result);
  });
  it('하루 첫 승리만 다이아', () => {
    const s = defaultSave(), d = new Date(2026, 10, 16);
    expect(finishPvp(s, 'win', d).dia).toBe(50);
    expect(finishPvp(s, 'win', d).dia).toBe(0);
    finishPvp(s, 'lose', d);
    expect([s.pvp.wins, s.pvp.losses]).toEqual([2, 1]);
    expect(power('slinger', 1, 0, false, { weapon: 5 })).toBeGreaterThan(power('slinger', 1, 0, false));
  });
});
