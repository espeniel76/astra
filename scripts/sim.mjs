// 밸런스 시뮬레이션(v2): 하루에 전투 N번 하는 플레이어가 며칠 만에 어디까지 깨는지.
// 목표: ★1~★5 팀으로도 하루 15전이면 3일 안에 3챕터. ★6 이상은 자랑거리.
// 사용: node scripts/sim.mjs [하루전투수=15] [시드수=20] [no6]   (no6 = ★6 이상을 팀에 안 씀)
import { defaultSave } from '../src/core/save.js';
import { summon, useTicket } from '../src/core/gacha.js';
import { levelUp, levelCost, teamPower } from '../src/core/progress.js';
import { runBattle } from '../src/core/battle.js';
import { recordStars, claimChest, CHESTS } from '../src/core/stars.js';
import { starsFor } from '../src/core/stars.js';
import { STAGES } from '../src/data/stages.js';
import { HERO } from '../src/data/heroes.js';
import { makeRng } from '../src/core/rng.js';

const PER_DAY = +(process.argv[2] || 15), SEEDS = +(process.argv[3] || 20), NO6 = process.argv[4] === 'no6', DAYS = 5;

function pickTeam(s) {
  return Object.keys(s.heroes).filter(id => !NO6 || HERO[id].star < 6)
    .sort((a, b) => HERO[b].star - HERO[a].star || s.heroes[b].dupes - s.heroes[a].dupes).slice(0, 3);
}
function spend(s, rng) {
  while (s.tickets.star4 > 0) useTicket(s, rng);
  while (s.diamonds >= 1000) summon(s, 11, rng);
  while (s.diamonds >= 100) summon(s, 1, rng);
  s.team = [...pickTeam(s), null, null, null].slice(0, 3);
  for (;;) {
    const ids = s.team.filter(Boolean);
    const low = ids.map(id => [id, s.heroes[id].level]).sort((a, b) => a[1] - b[1]).find(([id]) => levelUp({ ...s, heroes: { [id]: { ...s.heroes[id] } }, gold: s.gold }, id).ok);
    if (!low || !levelUp(s, low[0]).ok) break;
  }
}
const fight = (s, st, seed) => runBattle({ team: s.team.map(id => (id ? { id, ...s.heroes[id] } : null)), stageId: st.id, seed }, { auto: true });

const rows = [], ratio = [];
for (let seed = 1; seed <= SEEDS; seed++) {
  const rng = makeRng(seed * 7919), s = defaultSave();
  const dayEnd = [];
  let next = 0;
  for (let day = 1; day <= DAYS; day++) {
    if (day > 1) s.diamonds += 300;
    for (let i = 0; i < PER_DAY; i++) {
      spend(s, rng);
      for (const ch of [1, 2, 3]) for (const c of CHESTS) claimChest(s, ch, c.need);
      const tryNew = next < STAGES.length;
      const st = tryNew ? STAGES[next] : STAGES[STAGES.length - 1];
      const p = teamPower(s);
      const r = fight(s, st, seed * 100 + day * 1000 + i);
      if (tryNew) ratio.push([p / st.rec, r.result === 'win']);
      if (r.result === 'win') {
        s.gold += Math.round(st.gold * r.battle.goldMul);
        const { first } = recordStars(s, st.id, starsFor(r.battle, st));
        if (first && tryNew) { s.diamonds += st.firstDia; next++; }
      } else if (next > 0) {
        const farm = STAGES[next - 1];
        const r2 = fight(s, farm, seed + i * 31 + day);
        if (r2.result === 'win') s.gold += Math.round(farm.gold * r2.battle.goldMul);
        i++;
      }
    }
    dayEnd.push(next);
  }
  const sixes = Object.keys(s.heroes).filter(id => HERO[id].star >= 6).length;
  rows.push({ dayEnd, sixes, team: s.team.filter(Boolean).map(id => `${HERO[id].name}★${HERO[id].star}Lv${s.heroes[id].level}`).join(', ') });
}
const avg = d => (rows.reduce((t, r) => t + r.dayEnd[d], 0) / rows.length).toFixed(1);
console.log(`하루 전투 ${PER_DAY}번, ${SEEDS}명${NO6 ? ', ★6 이상 안 씀' : ''}`);
for (let d = 0; d < DAYS; d++) console.log(`${d + 1}일째 끝: 평균 ${avg(d)} (분포 ${rows.map(r => r.dayEnd[d]).join(' ')})`);
console.log(`3일째 끝 3챕터 다 깬 사람: ${rows.filter(r => r.dayEnd[2] >= 30).length}/${rows.length}`);
console.log(`★6 이상 가진 사람(5일): ${rows.filter(r => r.sixes > 0).length}/${rows.length}`);
// 추천 전투력 맞추기: 전투력/추천 비율 구간별 승률
const bins = [0.6, 0.8, 1.0, 1.2, 1.5, 2, 3, 99];
let lo = 0;
const line = [];
for (const hi of bins) {
  const xs = ratio.filter(([r]) => r >= lo && r < hi);
  if (xs.length) line.push(`${lo}~${hi}: ${Math.round((xs.filter(x => x[1]).length / xs.length) * 100)}% (${xs.length})`);
  lo = hi;
}
console.log('전투력/추천 → 승률:', line.join(' | '));
console.log('예시 팀:', rows[0].team);
