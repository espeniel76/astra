// 영웅 스킬 효과(fx) 실행. 효과 모양은 src/data/heroes.js 참고.
import { attack, heal, addStatus, pickOne, enemiesOf, friendsOf, BAD, alive } from './battle.js';

const rand = (b, list) => list[Math.floor(b.rng() * list.length)];

function targetsFor(b, u, target) {
  const foes = enemiesOf(b, u), mine = friendsOf(b, u);
  switch (target) {
    case 'self': return [u];
    case 'allies': return mine;
    case 'all': return foes;
    case 'one': { const t = pickOne(b, u, foes); return t ? [t] : []; }
    case 'random': return foes.length ? [rand(b, foes)] : [];
    case 'lowest': return foes.length ? [foes.reduce((a, x) => (x.hp / x.maxHp < a.hp / a.maxHp ? x : a))] : [];
    case 'highest': return foes.length ? [foes.reduce((a, x) => (x.hp > a.hp ? x : a))] : [];
    case 'lowestAlly': return mine.length ? [mine.reduce((a, x) => (x.hp / x.maxHp < a.hp / a.maxHp ? x : a))] : [];
    case 'lastHit': return b.lastHit?.alive ? [b.lastHit] : [];
    default: return [];
  }
}

function hitOne(b, u, t, mult, ev, opts) {
  if (!t?.alive) return 0;
  b.lastHit = t;
  return attack(b, u, t, mult, ev, opts);
}

const FX = {
  dmg(b, u, f, ev) {
    const hits = f.hits || 1;
    if (f.target === 'all') {
      for (let i = 0; i < hits; i++) for (const t of enemiesOf(b, u)) hitOne(b, u, t, f.mult, ev, { ignoreDef: f.ignoreDef });
      return;
    }
    for (let i = 0; i < hits; i++) {
      const [t] = targetsFor(b, u, f.target);
      if (!t) break;
      hitOne(b, u, t, f.mult * (1 + (f.grow || 0) * i), ev, { ignoreDef: f.ignoreDef });
    }
  },
  heal(b, u, f, ev) {
    const list = f.target === 'lowest' ? targetsFor(b, u, 'lowestAlly') : friendsOf(b, u);
    for (const t of list) heal(b, u, t, u.atk * f.mult, ev);
  },
  shield(b, u, f, ev) {
    for (const t of targetsFor(b, u, f.target)) {
      t.shield = Math.min(t.maxHp, t.shield + Math.round(u.atk * f.mult));
      ev.push({ type: 'shield', from: u.uid, to: t.uid, amount: t.shield });
    }
  },
  status(b, u, f, ev) {
    for (const t of targetsFor(b, u, f.target)) {
      if (f.chance != null && b.rng() >= f.chance) continue;
      if (t.boss && (f.k === 'charm' || f.k === 'stone')) { ev.push({ type: 'resist', to: t.uid, k: f.k }); continue; }
      addStatus(t, { k: f.k, turns: f.turns, v: f.v, amt: Math.round(u.atk * (f.v || 0)), spread: !!f.spread }, ev);
    }
  },
  execute(b, u, f, ev) {
    const [t] = targetsFor(b, u, 'one');
    if (!t) return;
    b.lastHit = t;
    if (t.hp <= t.maxHp * f.threshold) {
      ev.push({ type: 'execute', from: u.uid, to: t.uid });
      b.hurt(u, t, t.boss ? Math.round(t.maxHp * f.bossPct) : t.hp, ev);
    } else hitOne(b, u, t, f.mult, ev);
  },
  dice(b, u, f, ev) {
    const roll = 1 + Math.floor(b.rng() * 6);
    ev.push({ type: 'dice', from: u.uid, amount: roll });
    const [t] = targetsFor(b, u, 'one');
    hitOne(b, u, t, roll === 6 ? 6 : 0.5 * roll, ev);
  },
  pact(b, u, f, ev) {
    const mine = alive(b, u.side);
    const ratio = mine.reduce((s, x) => s + x.hp, 0) / mine.reduce((s, x) => s + x.maxHp, 0);
    const [t] = targetsFor(b, u, 'one');
    hitOne(b, u, t, f.mult * (1 + (f.max - 1) * (1 - ratio)), ev);
  },
  souls(b, u, f, ev) {
    const m = f.base + f.per * b.kills;
    for (const t of enemiesOf(b, u)) hitOne(b, u, t, m, ev);
  },
  gauge(b, u, f, ev) {
    for (const t of targetsFor(b, u, f.target)) {
      if (f.chance != null && b.rng() >= f.chance) continue;
      t.gauge = Math.max(0, t.gauge + f.v);
      ev.push({ type: 'gauge', to: t.uid, amount: f.v });
    }
  },
  doom(b, u, f, ev) {
    const list = [...enemiesOf(b, u)].sort((x, y) => y.hp - x.hp).slice(0, f.count);
    for (const t of list) addStatus(t, { k: 'doom', turns: f.turns, v: t.boss ? f.bossPct : f.pct }, ev);
  },
  goldMul(b, u, f, ev) {
    b.goldMul = Math.max(b.goldMul, f.v);
    ev.push({ type: 'gold', from: u.uid, amount: f.v });
  },
  cleanse(b, u, f, ev) {
    for (const t of friendsOf(b, u)) {
      const before = t.statuses.length;
      t.statuses = t.statuses.filter(s => !BAD.has(s.k));
      if (t.statuses.length !== before) ev.push({ type: 'cleanse', to: t.uid });
    }
  },
  // 판결: 적 전체를 때리고, 체력이 below 이하인 적은 bonus 배
  verdict(b, u, f, ev) {
    for (const t of enemiesOf(b, u)) hitOne(b, u, t, f.mult * (t.hp <= t.maxHp * f.below ? f.bonus : 1), ev);
  },
  // 사냥: 가장 약한 적을 쏘고, 쓰러뜨리면 다음 가장 약한 적을 또 쏜다(최대 max번)
  hunt(b, u, f, ev) {
    for (let i = 0; i < f.max; i++) {
      const [t] = targetsFor(b, u, 'lowest');
      if (!t) break;
      hitOne(b, u, t, f.mult, ev);
      if (t.alive) break;
    }
  },
  // 되살리기: 쓰러진 아군을 count명까지 체력 hp 비율로
  revive(b, u, f, ev) {
    const dead = b.units.filter(x => x.side === u.side && !x.alive);
    for (const x of dead.slice(0, f.count || 1)) {
      x.alive = true;
      x.hp = Math.max(1, Math.round(x.maxHp * f.hp));
      x.statuses = [];
      x.gauge = 0;
      ev.push({ type: 'revive', from: u.uid, to: x.uid, amount: x.hp });
    }
  },
  // 연쇄 번개: 무작위 적을 때리고, 다른 적에게 튀며 jumps번(튈 때마다 decay배). 맞은 적은 stun 확률로 1턴 기절(보스는 버팀)
  chain(b, u, f, ev) {
    let last = null, m = f.mult;
    for (let i = 0; i < f.jumps; i++) {
      const foes = enemiesOf(b, u);
      if (!foes.length) break;
      const pool = foes.length > 1 ? foes.filter(x => x !== last) : foes;
      const t = rand(b, pool);
      hitOne(b, u, t, m, ev);
      if (t.alive && f.stun && b.rng() < f.stun) {
        if (t.boss) ev.push({ type: 'resist', to: t.uid, k: 'stun' });
        else addStatus(t, { k: 'stun', turns: 1, v: 0 }, ev);
      }
      last = t;
      m *= f.decay;
    }
  },
  rage(b, u, f, ev) {
    const [t] = targetsFor(b, u, 'one');
    const lost = 1 - u.hp / u.maxHp;
    const d = hitOne(b, u, t, f.base + f.per * lost, ev);
    if (d > 0) heal(b, u, u, d * f.lifesteal, ev);
  },
};

export function runFx(b, caster, fx, ev) {
  b.lastHit = null;
  for (const f of fx) {
    if (!caster.alive && f.target !== 'allies') break;
    const run = FX[f.t];
    if (!run) throw new Error(`모르는 효과: ${f.t}`);
    run(b, caster, f, ev);
    if (!alive(b, 'foe').length || !alive(b, 'ally').length) break;
  }
}
