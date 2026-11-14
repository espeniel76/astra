// 턴제 전투 엔진(화면 없음). 화면(BattleScene)은 step()이 돌려주는 이벤트를 차례로 재생한다.
// 행동 순서: 모든 유닛의 행동 게이지가 속도만큼 차오르고, 1000이 먼저 넘은 유닛이 행동한다.
import { HERO } from '../data/heroes.js';
import { MONSTERS, monStats, MON_GROWTH, MON_BASE } from '../data/monsters.js';
import { STAGE } from '../data/stages.js';
import { heroStats } from './progress.js';
import { makeRng } from './rng.js';
import { runFx } from './skills.js';

export const DISABLE = new Set(['stun', 'freeze', 'sleep', 'stone', 'bind']);
export const BAD = new Set(['stun', 'freeze', 'sleep', 'stone', 'bind', 'charm', 'poison', 'burn', 'bleed', 'slow', 'vuln', 'defDown', 'doom']);
const DOT = new Set(['poison', 'burn', 'bleed']);
const GAUGE = 1000;

const statusOf = (u, k) => u.statuses.find(s => s.k === k);
const hasDisable = u => u.statuses.some(s => DISABLE.has(s.k));

function makeUnit(b, side, slot, o) {
  return {
    uid: b.nextUid++, side, slot, gauge: 0, alive: true, statuses: [], shield: 0, queued: false,
    passiveUsed: false, splitDone: false, ...o, maxHp: o.hp,
  };
}

function heroUnit(b, slot, { id, level = 1, dupes = 0 }) {
  const h = HERO[id];
  const st = heroStats(id, level, dupes);
  return makeUnit(b, 'ally', slot, {
    id, name: h.name, star: h.star, role: h.role, ...st,
    skill: h.skill, cdMax: h.skill.cd, cd: 1, passive: h.passive,
  });
}

export { MON_GROWTH, MON_BASE };

export function monsterUnit(b, slot, { mon, lv }) {
  const m = MONSTERS[mon];
  return makeUnit(b, 'foe', slot, {
    id: mon, name: m.name, boss: m.boss, lv,
    ...monStats(mon, lv),
    mskill: m.skill, cdMax: m.skill?.cd || 0, cd: m.skill?.cd || 0,
  });
}

export function createBattle({ team = [], stageId = null, foes = null, seed = Date.now() }) {
  const b = { units: [], rng: makeRng(seed), result: null, goldMul: 1, kills: 0, nextUid: 1, turn: 0, stageId, anyAllyDied: false };
  team.forEach((t, i) => { if (t && HERO[t.id]) b.units.push(heroUnit(b, i, t)); });
  const list = foes || STAGE[stageId]?.foes || [];
  list.forEach((f, i) => b.units.push(monsterUnit(b, i, f)));
  // 최후의 심판자: 전투가 시작되면 적 전체에 선고(방어 -30%, 전투 내내)
  const judge = b.units.find(u => u.side === 'ally' && u.passive?.k === 'sentence');
  if (judge) for (const f of b.units.filter(u => u.side === 'foe')) f.statuses.push({ k: 'defDown', turns: 999, v: judge.passive.v });
  b.attack = (src, tgt, mult, ev, opts) => attack(b, src, tgt, mult, ev, opts);
  b.hurt = (src, tgt, amount, ev, opts) => hurt(b, src, tgt, amount, ev, opts);
  checkEnd(b);
  return b;
}

export const alive = (b, side) => b.units.filter(u => u.alive && u.side === side);
export const enemiesOf = (b, u) => alive(b, u.side === 'ally' ? 'foe' : 'ally');
export const friendsOf = (b, u) => alive(b, u.side);

// 기본 공격·'one' 스킬 대상: 도발한 적이 있으면 그쪽, 아니면 맨 앞(slot이 가장 작은) 적
export function pickOne(b, u, pool = enemiesOf(b, u)) {
  if (!pool.length) return null;
  const taunt = pool.filter(x => statusOf(x, 'taunt'));
  const list = taunt.length ? taunt : pool;
  return list.reduce((a, x) => (x.slot < a.slot ? x : a));
}

const effSpd = u => u.spd * (1 - (statusOf(u, 'slow')?.v || 0));

export function nextActor(b) {
  const live = b.units.filter(u => u.alive);
  if (!live.length) return null;
  let ready = live.filter(u => u.gauge >= GAUGE);
  if (!ready.length) {
    const t = Math.min(...live.map(u => Math.ceil((GAUGE - u.gauge) / Math.max(1, effSpd(u)))));
    for (const u of live) u.gauge += effSpd(u) * t;
    ready = live.filter(u => u.gauge >= GAUGE);
  }
  ready.sort((x, y) => y.gauge - x.gauge || (x.side === y.side ? x.slot - y.slot : x.side === 'ally' ? -1 : 1));
  return ready[0];
}

export function queueSkill(b, uid) {
  const u = b.units.find(x => x.uid === uid);
  if (!u || !u.alive || u.side !== 'ally' || b.result) return false;
  if (u.queued) return true;
  if (u.cd !== 0) return false;
  u.queued = true;
  return true;
}

// 피해 계산 후 적용. mult = 공격력 배수.
export function attack(b, src, tgt, mult, ev, opts = {}) {
  if (!tgt || !tgt.alive) return 0;
  const evade = statusOf(tgt, 'evade');
  if (evade && !opts.noCounter && b.rng() < evade.v) {
    ev.push({ type: 'miss', from: src.uid, to: tgt.uid });
    if (src.alive) attack(b, tgt, src, 1, ev, { noCounter: true });
    return 0;
  }
  let atk = src.atk * (1 + (statusOf(src, 'atkUp')?.v || 0));
  const def = opts.ignoreDef ? 0 : tgt.def * (1 - (statusOf(tgt, 'defDown')?.v || 0));
  let d = atk * mult * (100 / (100 + def)) * (0.95 + b.rng() * 0.1);
  if (opts.noCrit) d = atk * mult * (100 / (100 + def));
  let crit = false;
  const sure = statusOf(src, 'crit');
  if (sure) { crit = true; d *= 2; src.statuses = src.statuses.filter(s => s !== sure); }
  else if (!opts.noCrit && b.rng() < 0.1) { crit = true; d *= 1.5; }
  d *= 1 + (statusOf(tgt, 'vuln')?.v || 0);
  if (statusOf(tgt, 'stone')) d *= 0.5;
  const sleep = statusOf(tgt, 'sleep');
  d = Math.max(1, Math.round(d));
  if (sleep) { d *= 3; tgt.statuses = tgt.statuses.filter(s => s !== sleep); ev.push({ type: 'wake', to: tgt.uid }); }
  const dealt = hurt(b, src, tgt, d, ev, { crit });
  const refl = statusOf(tgt, 'reflect');
  if (refl && !opts.noCounter && src.alive && src.side !== tgt.side && dealt > 0) {
    hurt(b, tgt, src, Math.max(1, Math.round(dealt * refl.v)), ev, { reflect: true });
  }
  return dealt;
}

// 실제로 체력을 깎는다(보호막 먼저). 쓰러짐·부활·분열·전염 처리도 여기서.
export function hurt(b, src, tgt, amount, ev, opts = {}) {
  if (!tgt.alive) return 0;
  let d = amount;
  if (tgt.side === 'ally' && alive(b, 'ally').some(u => u.passive?.k === 'guardian')) {
    d = Math.max(1, Math.round(d * (1 - alive(b, 'ally').find(u => u.passive?.k === 'guardian').passive.guard)));
  }
  let absorbed = 0;
  if (tgt.shield > 0) { absorbed = Math.min(tgt.shield, d); tgt.shield -= absorbed; }
  const real = d - absorbed;
  tgt.hp = Math.max(0, tgt.hp - real);
  ev.push({ type: 'damage', from: src?.uid, to: tgt.uid, amount: d, absorbed, crit: !!opts.crit, dot: opts.dot, reflect: !!opts.reflect });
  if (tgt.hp <= 0) die(b, tgt, ev);
  else afterHit(b, tgt, ev);
  if (tgt.side === 'ally') guardianCheck(b, ev);
  return d;
}

function afterHit(b, u, ev) {
  const sk = u.mskill;
  if (sk?.k === 'split' && !u.splitDone && u.hp <= u.maxHp * sk.at) {
    u.splitDone = true;
    for (let i = 0; i < sk.count; i++) {
      if (alive(b, 'foe').length >= 3) break;
      const used = new Set(alive(b, 'foe').map(x => x.slot));
      const slot = [0, 1, 2].find(s => !used.has(s));
      const m = monsterUnit(b, slot, { mon: sk.mon, lv: u.lv });
      const judge = alive(b, 'ally').find(x => x.passive?.k === 'sentence');
      if (judge) m.statuses.push({ k: 'defDown', turns: 999, v: judge.passive.v });
      b.units.push(m);
      ev.push({ type: 'summon', from: u.uid, to: m.uid, name: sk.name });
    }
  }
}

function die(b, u, ev) {
  if (u.side === 'ally') {
    const ph = alive(b, 'ally').find(x => x.passive?.k === 'phoenix' && !x.passiveUsed && x !== u)
      || (u.passive?.k === 'phoenix' && !u.passiveUsed ? u : null);
    if (ph) {
      ph.passiveUsed = true;
      u.hp = Math.round(u.maxHp * ph.passive.hp);
      u.statuses = u.statuses.filter(s => !BAD.has(s.k));
      ev.push({ type: 'revive', from: ph.uid, to: u.uid, amount: u.hp });
      return;
    }
  }
  u.alive = false;
  u.hp = 0;
  if (u.side === 'ally') b.anyAllyDied = true;
  u.queued = false;
  ev.push({ type: 'death', to: u.uid });
  if (u.side === 'foe') {
    b.kills += 1;
    // 별을 삼킨 자: 적이 쓰러질 때마다 공격력이 오른다(최대 max번)
    for (const d of alive(b, 'ally').filter(x => x.passive?.k === 'devour')) {
      d.devour = d.devour || 0;
      if (d.devour >= d.passive.max) continue;
      d.devour += 1;
      d.atk = Math.round(d.atk * (1 + d.passive.v));
      ev.push({ type: 'passive', from: d.uid, name: `별 삼키기 ${d.devour}` });
    }
    const pl = u.statuses.find(s => s.k === 'poison' && s.spread);
    if (pl) {
      const others = alive(b, 'foe');
      if (others.length) {
        const n = others[Math.floor(b.rng() * others.length)];
        n.statuses = n.statuses.filter(s => s.k !== 'poison');
        n.statuses.push({ ...pl, turns: 3 });
        ev.push({ type: 'status', to: n.uid, k: 'poison', turns: 3 });
      }
    }
  }
}

function guardianCheck(b, ev) {
  const g = alive(b, 'ally').find(u => u.passive?.k === 'guardian' && !u.passiveUsed);
  if (!g) return;
  const all = alive(b, 'ally');
  const ratio = all.reduce((t, u) => t + u.hp, 0) / all.reduce((t, u) => t + u.maxHp, 0);
  if (ratio > g.passive.at) return;
  g.passiveUsed = true;
  ev.push({ type: 'passive', from: g.uid, name: '황금 결계' });
  for (const u of all) heal(b, g, u, Math.round(u.maxHp * g.passive.heal), ev);
}

export function heal(b, src, tgt, amount, ev) {
  if (!tgt.alive) return 0;
  const h = Math.min(tgt.maxHp - tgt.hp, Math.round(amount));
  tgt.hp += h;
  ev.push({ type: 'heal', from: src?.uid, to: tgt.uid, amount: h });
  return h;
}

function checkEnd(b) {
  if (b.result) return;
  if (!alive(b, 'ally').length) b.result = 'lose';
  else if (!alive(b, 'foe').length) b.result = 'win';
}

// 행동 시작: 독·화상·출혈과 죽음의 선고
function startOfTurn(b, u, ev) {
  for (const s of [...u.statuses]) {
    if (!u.alive) break;
    if (DOT.has(s.k)) hurt(b, null, u, Math.max(1, s.amt || 1), ev, { dot: s.k });
    if (s.k === 'doom') {
      s.turns -= 1;
      if (s.turns <= 0) {
        u.statuses = u.statuses.filter(x => x !== s);
        ev.push({ type: 'doom', to: u.uid });
        hurt(b, null, u, Math.max(1, Math.round(u.hp * s.v)), ev);
      }
    }
  }
}

// 행동 끝: 아기 용, 상태 시간 줄이기, 쿨타임
// fresh: 이번 행동 전부터 있던 상태들. 이번 행동에서 새로 건 상태는 이번엔 줄지 않는다(2턴 도발이 2턴 가게).
function endOfTurn(b, u, ev, usedSkill, before) {
  const dr = statusOf(u, 'dragon');
  if (dr && u.alive) {
    const pool = enemiesOf(b, u);
    if (pool.length) { ev.push({ type: 'pet', from: u.uid, k: 'dragon' }); attack(b, u, pool[Math.floor(b.rng() * pool.length)], dr.v, ev); }
  }
  for (const s of u.statuses) if (s.k !== 'doom' && before.has(s)) s.turns -= 1;
  u.statuses = u.statuses.filter(s => s.k === 'doom' || s.turns > 0);
  if (!usedSkill && u.cd > 0) u.cd -= 1;
}

function basicAttack(b, u, ev) {
  const charm = statusOf(u, 'charm');
  const pool = charm ? friendsOf(b, u).filter(x => x !== u) : enemiesOf(b, u);
  if (!pool.length) return;
  const tgt = charm ? pool[Math.floor(b.rng() * pool.length)] : pickOne(b, u, pool);
  const echo = statusOf(u, 'echo');
  const times = echo ? 2 : 1;
  if (echo) u.statuses = u.statuses.filter(s => s !== echo);
  for (let i = 0; i < times; i++) {
    const t = tgt.alive ? tgt : pickOne(b, u, charm ? friendsOf(b, u).filter(x => x !== u) : enemiesOf(b, u));
    if (!t) break;
    ev.push({ type: 'attack', from: u.uid, to: t.uid });
    attack(b, u, t, 1, ev);
  }
}

function monsterSkill(b, u, ev) {
  const sk = u.mskill;
  ev.push({ type: 'skill', from: u.uid, name: sk.name });
  const allies = alive(b, 'ally');
  if (sk.k === 'poison') {
    const t = pickOne(b, u);
    attack(b, u, t, 1, ev);
    if (t?.alive) addStatus(t, { k: 'poison', turns: sk.turns, v: sk.v, amt: Math.round(u.atk * sk.v) }, ev);
  } else if (sk.k === 'rally') {
    for (const f of alive(b, 'foe')) addStatus(f, { k: 'atkUp', turns: sk.turns, v: sk.v }, ev);
  } else if (sk.k === 'web') {
    const t = allies[Math.floor(b.rng() * allies.length)];
    if (t) addStatus(t, { k: 'bind', turns: sk.turns, v: 0 }, ev);
  } else if (sk.k === 'quake') {
    for (const t of allies) attack(b, u, t, sk.mult, ev);
  }
}

export function addStatus(u, s, ev) {
  u.statuses = u.statuses.filter(x => x.k !== s.k);
  u.statuses.push(s);
  ev.push({ type: 'status', to: u.uid, k: s.k, turns: s.turns });
}

export function act(b, u, { auto = false } = {}) {
  const ev = [];
  if (b.result || !u.alive) return ev;
  b.turn += 1;
  ev.push({ type: 'turn', from: u.uid });
  startOfTurn(b, u, ev);
  if (!u.alive) { checkEnd(b); return ev; }
  const before = new Set(u.statuses);
  let usedSkill = false;
  if (hasDisable(u)) {
    ev.push({ type: 'skip', from: u.uid, k: u.statuses.find(s => DISABLE.has(s.k)).k });
  } else if (u.side === 'ally' && u.cd === 0 && (u.queued || auto) && !statusOf(u, 'charm')) {
    ev.push({ type: 'skill', from: u.uid, name: u.skill.name });
    runFx(b, u, u.skill.fx, ev);
    u.cd = u.cdMax;
    u.queued = false;
    usedSkill = true;
  } else if (u.side === 'foe' && u.mskill?.cd && u.cd === 0 && !statusOf(u, 'charm')) {
    monsterSkill(b, u, ev);
    u.cd = u.cdMax;
    usedSkill = true;
  } else {
    basicAttack(b, u, ev);
  }
  if (u.alive) endOfTurn(b, u, ev, usedSkill, before);
  checkEnd(b);
  if (b.result) ev.push({ type: 'end', result: b.result });
  return ev;
}

export function step(b, opts = {}) {
  if (b.result) return [];
  const u = nextActor(b);
  if (!u) { checkEnd(b); return []; }
  u.gauge -= GAUGE;
  return act(b, u, opts);
}

export function runBattle(opts, { auto = true, maxSteps = 2000 } = {}) {
  const b = createBattle(opts);
  let steps = 0;
  while (!b.result && steps < maxSteps) { step(b, { auto }); steps++; }
  return { result: b.result, steps, battle: b };
}
