import { describe, it, expect } from 'vitest';
import { createBattle, step, queueSkill, runBattle, nextActor, act } from '../src/core/battle.js';
import { STAGES } from '../src/data/stages.js';

const team = (...ids) => ids.map(id => (id ? { id, level: 1, dupes: 0 } : null));
const allies = b => b.units.filter(u => u.side === 'ally');
const foes = b => b.units.filter(u => u.side === 'foe');

describe('전투 기본', () => {
  it('같은 시드·같은 팀이면 결과가 같다', () => {
    const a = runBattle({ team: team('slinger', 'herbalist', 'woodcutter'), stageId: '1-5', seed: 7 }, { auto: true });
    const b = runBattle({ team: team('slinger', 'herbalist', 'woodcutter'), stageId: '1-5', seed: 7 }, { auto: true });
    expect(a.result).toBe(b.result);
    expect(a.steps).toBe(b.steps);
  });
  it('속도가 빠른 유닛이 먼저 행동한다', () => {
    const b = createBattle({ team: team('woodcutter'), foes: [{ mon: 'bee', lv: 1 }], seed: 1 });
    expect(nextActor(b).id).toBe('bee'); // 왕벌 125 > 나무꾼 100
  });
  it('아군이 0명이면 멈추지 않고 바로 패배', () => {
    const b = createBattle({ team: team(null, null, null), stageId: '1-1', seed: 1 });
    expect(b.result).toBe('lose');
    expect(step(b, { auto: true })).toEqual([]);
  });
  it('1명 팀도 싸울 수 있다', () => {
    const r = runBattle({ team: team('executioner'), stageId: '1-1', seed: 3 }, { auto: true });
    expect(['win', 'lose']).toContain(r.result);
  });
  it('몬스터는 스테이지 레벨만큼 세진다', () => {
    const b1 = createBattle({ team: team('slinger'), foes: [{ mon: 'slime', lv: 1 }], seed: 1 });
    const b11 = createBattle({ team: team('slinger'), foes: [{ mon: 'slime', lv: 11 }], seed: 1 });
    expect(foes(b11)[0].maxHp).toBe(Math.round(foes(b1)[0].maxHp * 1.03 ** 10));
  });
});

describe('스킬 예약', () => {
  it('스킬 버튼을 두 번 눌러도 스킬은 한 번만 나가고 쿨타임이 찬다', () => {
    const b = createBattle({ team: team('woodcutter'), foes: [{ mon: 'golem', lv: 1 }], seed: 2 });
    const me = allies(b)[0];
    me.cd = 0;
    expect(queueSkill(b, me.uid)).toBe(true);
    expect(queueSkill(b, me.uid)).toBe(true);
    const ev = act(b, me, { auto: false });
    expect(ev.filter(e => e.type === 'skill').length).toBe(1);
    expect(me.cd).toBe(me.cdMax);
    expect(me.queued).toBe(false);
  });
  it('쿨타임 중에는 예약되지 않는다', () => {
    const b = createBattle({ team: team('woodcutter'), foes: [{ mon: 'golem', lv: 1 }], seed: 2 });
    const me = allies(b)[0];
    me.cd = 2;
    expect(queueSkill(b, me.uid)).toBe(false);
  });
  it('기절한 영웅은 차례를 넘기고, 쿨타임 0과 예약은 그대로 남는다', () => {
    const b = createBattle({ team: team('woodcutter'), foes: [{ mon: 'golem', lv: 1 }], seed: 2 });
    const me = allies(b)[0];
    me.cd = 0;
    queueSkill(b, me.uid);
    me.statuses.push({ k: 'stun', turns: 1, v: 0 });
    const ev = act(b, me, { auto: false });
    expect(ev.some(e => e.type === 'skip')).toBe(true);
    expect(ev.some(e => e.type === 'skill')).toBe(false);
    expect(me.cd).toBe(0);
    expect(me.queued).toBe(true);
  });
  it('쓰러진 영웅은 예약할 수 없다', () => {
    const b = createBattle({ team: team('woodcutter'), foes: [{ mon: 'golem', lv: 1 }], seed: 2 });
    const me = allies(b)[0];
    me.cd = 0; me.alive = false; me.hp = 0;
    expect(queueSkill(b, me.uid)).toBe(false);
  });
});

describe('영웅 능력', () => {
  it('처형인: 체력 30% 이하 일반 적은 즉사', () => {
    const b = createBattle({ team: team('executioner'), foes: [{ mon: 'golem', lv: 30 }], seed: 4 });
    const me = allies(b)[0], g = foes(b)[0];
    g.hp = Math.floor(g.maxHp * 0.3);
    me.cd = 0; queueSkill(b, me.uid);
    act(b, me, { auto: false });
    expect(g.alive).toBe(false);
  });
  it('처형인: 보스는 즉사하지 않고 최대 체력 15%를 더 잃는다', () => {
    const b = createBattle({ team: team('executioner'), foes: [{ mon: 'rockgiant', lv: 30 }], seed: 4 });
    const me = allies(b)[0], g = foes(b)[0];
    g.hp = Math.floor(g.maxHp * 0.3);
    const before = g.hp;
    me.cd = 0; queueSkill(b, me.uid);
    act(b, me, { auto: false });
    expect(g.alive).toBe(true);
    expect(before - g.hp).toBeGreaterThanOrEqual(Math.floor(g.maxHp * 0.15));
  });
  it('도발한 아군이 있으면 적은 그 아군을 때린다', () => {
    const b = createBattle({ team: team('slinger', 'herbalist', 'shieldboy'), foes: [{ mon: 'rat', lv: 1 }], seed: 5 });
    const tank = allies(b)[2];
    tank.statuses.push({ k: 'taunt', turns: 3, v: 0 });
    const rat = foes(b)[0];
    const ev = act(b, rat, { auto: true });
    const hit = ev.find(e => e.type === 'damage');
    expect(hit.to).toBe(tank.uid);
  });
  it('불사조 기사: 처음 쓰러진 아군을 40%로 한 번만 되살린다', () => {
    const b = createBattle({ team: team('slinger', 'phoenix'), foes: [{ mon: 'golem', lv: 30 }], seed: 6 });
    const s = allies(b)[0];
    const ev = [];
    b.hurt(b.units.find(u => u.side === 'foe'), s, 1e9, ev);
    expect(s.alive).toBe(true);
    expect(s.hp).toBe(Math.round(s.maxHp * 0.4));
    expect(ev.some(e => e.type === 'revive')).toBe(true);
    b.hurt(b.units.find(u => u.side === 'foe'), s, 1e9, ev);
    expect(s.alive).toBe(false);
  });
  it('잠든 적을 처음 때리면 3배 피해를 주고 깨운다', () => {
    const mk = () => createBattle({ team: team('slinger'), foes: [{ mon: 'golem', lv: 1 }], seed: 8 });
    const a = mk(), z = mk();
    foes(z)[0].statuses.push({ k: 'sleep', turns: 2, v: 0 });
    const ea = [], ez = [];
    a.attack(allies(a)[0], foes(a)[0], 1, ea, { noCrit: true });
    z.attack(allies(z)[0], foes(z)[0], 1, ez, { noCrit: true });
    const da = ea.find(e => e.type === 'damage').amount, dz = ez.find(e => e.type === 'damage').amount;
    expect(dz).toBe(da * 3);
    expect(foes(z)[0].statuses.some(s => s.k === 'sleep')).toBe(false);
  });
  it('킹 슬라임은 체력이 절반 아래로 내려가면 슬라임 2마리를 부른다', () => {
    const b = createBattle({ team: team('slinger'), foes: [{ mon: 'kingslime', lv: 10 }], seed: 9 });
    const k = foes(b)[0], ev = [];
    b.hurt(allies(b)[0], k, Math.ceil(k.maxHp * 0.6), ev);
    expect(ev.some(e => e.type === 'summon')).toBe(true);
    expect(foes(b).filter(u => u.alive).length).toBe(3);
  });
});

describe('모든 스테이지', () => {
  it('★6 3명 자동 전투는 2000스텝 안에 끝난다', () => {
    for (const s of STAGES) {
      const r = runBattle({ team: team('gravity', 'mirror', 'dream'), stageId: s.id, seed: 11 }, { auto: true, maxSteps: 2000 });
      expect(r.result, s.id).not.toBe(null);
    }
  });
  it('모든 영웅의 스킬이 오류 없이 나간다', async () => {
    const { HEROES } = await import('../src/data/heroes.js');
    for (const h of HEROES) {
      const b = createBattle({ team: team(h.id, 'slinger', 'herbalist'), stageId: '3-10', seed: 12 });
      const me = allies(b)[0];
      me.cd = 0; queueSkill(b, me.uid);
      expect(() => act(b, me, { auto: false }), h.id).not.toThrow();
    }
  });
});

describe('자기에게 건 상태', () => {
  it('2턴 도발은 시전 직후에도 2턴이 남아 있다', () => {
    const b = createBattle({ team: team('shieldboy'), foes: [{ mon: 'golem', lv: 1 }], seed: 21 });
    const me = allies(b)[0];
    me.cd = 0; queueSkill(b, me.uid);
    act(b, me, { auto: false });
    expect(me.statuses.find(s => s.k === 'taunt')?.turns).toBe(2);
    act(b, me, { auto: false });
    expect(me.statuses.find(s => s.k === 'taunt')?.turns).toBe(1);
  });
});

describe('별 조건 기록', () => {
  it('아군이 진짜 쓰러지면 anyAllyDied, 부활하면 아님', () => {
    const b = createBattle({ team: team('slinger', 'phoenix'), foes: [{ mon: 'golem', lv: 1 }], seed: 6 });
    const ev = [];
    b.hurt(foes(b)[0], allies(b)[0], 1e9, ev);
    expect(b.anyAllyDied).toBe(false);
    b.hurt(foes(b)[0], allies(b)[0], 1e9, ev);
    expect(b.anyAllyDied).toBe(true);
  });
});

describe('혈월 사냥꾼', () => {
  it('쓰러뜨리면 다음 적을 또 쏜다(최대 3번)', () => {
    const b = createBattle({ team: team('bloodmoon'), foes: [{ mon: 'slime', lv: 1 }, { mon: 'slime', lv: 1 }, { mon: 'slime', lv: 1 }], seed: 30 });
    for (const f of foes(b)) f.hp = 1;
    const me = allies(b)[0];
    me.cd = 0; queueSkill(b, me.uid);
    act(b, me, { auto: false });
    expect(foes(b).filter(f => f.alive).length).toBe(0);
  });
  it('못 쓰러뜨리면 한 번만 쏜다', () => {
    const b = createBattle({ team: team('bloodmoon'), foes: [{ mon: 'golem', lv: 30 }, { mon: 'golem', lv: 30 }], seed: 31 });
    const me = allies(b)[0];
    me.cd = 0; queueSkill(b, me.uid);
    const ev = act(b, me, { auto: false });
    expect(ev.filter(e => e.type === 'damage' && e.from === me.uid).length).toBe(1);
  });
});

describe('별을 삼킨 자', () => {
  it('적이 쓰러질 때마다 공격력이 15%씩, 최대 5번까지 오른다', () => {
    const b = createBattle({ team: team('stareater'), foes: Array.from({ length: 3 }, () => ({ mon: 'slime', lv: 1 })), seed: 40 });
    const me = allies(b)[0];
    const base = me.atk;
    const ev = [];
    b.hurt(me, foes(b)[0], 1e9, ev);
    expect(me.atk).toBe(Math.round(base * 1.15));
    expect(ev.some(e => e.type === 'passive')).toBe(true);
    me.devour = 5;
    const before = me.atk;
    b.hurt(me, foes(b)[1], 1e9, ev);
    expect(me.atk).toBe(before);
  });
});

describe('최후의 심판자', () => {
  it('전투가 시작되면 적 전체의 방어가 30% 깎인다(선고)', () => {
    const b = createBattle({ team: team('judge'), foes: [{ mon: 'golem', lv: 1 }, { mon: 'rockgiant', lv: 30 }], seed: 50 });
    for (const f of foes(b)) expect(f.statuses.find(s => s.k === 'defDown')?.v).toBe(0.3);
  });
  it('최후의 판결: 체력이 절반 이하인 적은 2배 피해', () => {
    const mk = () => createBattle({ team: team('judge'), foes: [{ mon: 'golem', lv: 30 }], seed: 51 });
    const a = mk(), z = mk();
    foes(z)[0].hp = Math.floor(foes(z)[0].maxHp * 0.5);
    for (const b of [a, z]) { const me = allies(b)[0]; me.cd = 0; queueSkill(b, me.uid); }
    const da = act(a, allies(a)[0], { auto: false }).find(e => e.type === 'damage').amount;
    const dz = act(z, allies(z)[0], { auto: false }).find(e => e.type === 'damage').amount;
    expect(dz / da).toBeGreaterThan(1.7);
  });
});

describe('심해의 군주', () => {
  it('아군이 맞으면 받은 피해의 25%를 때린 적에게 되돌린다', () => {
    const b = createBattle({ team: team('slinger', 'abysslord'), foes: [{ mon: 'golem', lv: 1 }], seed: 60 });
    const g = foes(b)[0], before = g.hp, ev = [];
    const dealt = b.attack(g, allies(b)[0], 1, ev, { noCrit: true });
    expect(before - g.hp).toBe(Math.max(1, Math.round(dealt * 0.25)));
  });
});

describe('세계수의 여왕', () => {
  it('재생: 자기 차례가 시작될 때마다 회복한다', () => {
    const b = createBattle({ team: team('slinger', 'worldtree'), foes: [{ mon: 'golem', lv: 1 }], seed: 61 });
    const s = allies(b)[0];
    s.hp = 10;
    s.statuses.push({ k: 'regen', turns: 3, v: 0.6, amt: 50 });
    act(b, s, { auto: false });
    expect(s.hp).toBeGreaterThanOrEqual(60);
  });
  it('전투마다 한 번, 아군이 쓰러지면 쓰러진 아군 전부를 되살린다', () => {
    const b = createBattle({ team: team('slinger', 'herbalist', 'worldtree'), foes: [{ mon: 'golem', lv: 30 }], seed: 62 });
    const [a, h] = allies(b), g = foes(b)[0], ev = [];
    h.alive = false; h.hp = 0; // 먼저 쓰러져 있던 아군
    b.hurt(g, a, 1e9, ev);
    expect(a.alive).toBe(true);
    expect(h.alive).toBe(true);
    expect(h.hp).toBe(Math.round(h.maxHp * 0.4));
    b.hurt(g, a, 1e9, ev);
    expect(a.alive).toBe(false);
  });
});

describe('용의 황제', () => {
  it('받는 피해 -25%, 체력이 처음 절반 아래가 되면 아군 전체 공격력 +30%', () => {
    const b = createBattle({ team: team('slinger', 'dragonemperor'), foes: [{ mon: 'golem', lv: 1 }], seed: 70 });
    const [s, d] = allies(b), g = foes(b)[0], ev = [];
    const hp = d.hp;
    b.hurt(g, d, 100, ev);
    expect(hp - d.hp).toBe(75);
    b.hurt(g, d, Math.ceil(d.maxHp * 0.7 / 0.75), ev);
    expect(ev.some(e => e.type === 'passive' && e.name === '용의 포효')).toBe(true);
    for (const a of [s, d]) expect(a.statuses.find(x => x.k === 'atkUp')?.v).toBe(0.3);
  });
});

describe('불사조 여제', () => {
  it('스킬로 쓰러진 아군 하나를 60%로 되살린다', () => {
    const b = createBattle({ team: team('slinger', 'herbalist', 'phoenixqueen'), foes: [{ mon: 'golem', lv: 30 }], seed: 71 });
    const [s, h, p] = allies(b);
    s.alive = false; s.hp = 0; h.alive = false; h.hp = 0;
    p.cd = 0; p.queued = true;
    act(b, p);
    expect([s, h].filter(x => x.alive).length).toBe(1);
    const back = [s, h].find(x => x.alive);
    expect(back.hp).toBe(Math.round(back.maxHp * 0.6));
  });
  it('전투마다 한 번, 쓰러지는 아군을 체력 가득 되살린다', () => {
    const b = createBattle({ team: team('slinger', 'phoenixqueen'), foes: [{ mon: 'golem', lv: 30 }], seed: 72 });
    const [s] = allies(b), g = foes(b)[0], ev = [];
    b.hurt(g, s, 1e9, ev);
    expect(s.alive).toBe(true);
    expect(s.hp).toBe(s.maxHp);
  });
});

describe('시간의 지배자', () => {
  it('전투가 시작되면 아군 속도 +20%, 스킬은 적을 멈추고 아군이 바로 다시 움직인다', () => {
    const plain = createBattle({ team: team('slinger'), foes: [{ mon: 'golem', lv: 1 }], seed: 73 });
    const b = createBattle({ team: team('slinger', 'chronos'), foes: [{ mon: 'golem', lv: 30 }, { mon: 'golem', lv: 30 }], seed: 73 });
    const [s, c] = allies(b);
    expect(s.spd).toBe(Math.round(allies(plain)[0].spd * 1.2));
    c.cd = 0; c.queued = true;
    act(b, c);
    for (const f of foes(b)) expect(f.statuses.some(x => x.k === 'timestop')).toBe(true);
    expect(nextActor(b).side).toBe('ally');
    const f = foes(b)[0];
    const ev = act(b, f);
    expect(ev.some(e => e.type === 'skip')).toBe(true);
    expect(f.statuses.some(x => x.k === 'timestop')).toBe(false);
  });
});
