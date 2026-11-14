// 밸런스 시뮬레이션: 하루에 전투 N번 하는 플레이어가 며칠 만에 어디까지 깨는지.
// 목표(설계 §8.3): 하루에 1챕터 정도, 3일이면 3챕터. 사용: node scripts/sim.mjs [하루전투수=25] [시드수=20]
import { defaultSave } from '../src/core/save.js';
import { summon } from '../src/core/gacha.js';
import { levelUp, levelCost } from '../src/core/progress.js';
import { runBattle } from '../src/core/battle.js';
import { STAGES } from '../src/data/stages.js';
import { HERO } from '../src/data/heroes.js';
import { makeRng } from '../src/core/rng.js';

const PER_DAY = +(process.argv[2] || 25), SEEDS = +(process.argv[3] || 20), DAYS = 5;

function pickTeam(s) {
  const owned = Object.keys(s.heroes).sort((a, b) => HERO[b].star - HERO[a].star || s.heroes[b].dupes - s.heroes[a].dupes);
  return owned.slice(0, 3);
}
function spend(s, rng) {
  while (s.diamonds >= 1000) summon(s, 11, rng);
  while (s.diamonds >= 100) summon(s, 1, rng);
  const team = pickTeam(s);
  for (;;) {
    const low = team.map(id => [id, s.heroes[id].level]).sort((a, b) => a[1] - b[1])[0];
    if (!low || s.gold < levelCost(low[1]) || !levelUp(s, low[0]).ok) break;
  }
  return team;
}

const rows = [];
for (let seed = 1; seed <= SEEDS; seed++) {
  const rng = makeRng(seed * 7919), s = defaultSave();
  const dayEnd = [];
  let next = 0, sixes = 0;
  for (let day = 1; day <= DAYS; day++) {
    if (day > 1) s.diamonds += 300; // 일일 미션
    for (let i = 0; i < PER_DAY; i++) {
      const team = spend(s, rng);
      const st = STAGES[Math.min(next, STAGES.length - 1)];
      const tryNew = next < STAGES.length;
      const target = tryNew ? st : STAGES[STAGES.length - 1];
      const r = runBattle({ team: team.map(id => ({ id, ...s.heroes[id] })), stageId: target.id, seed: seed * 100 + day * 1000 + i }, { auto: true });
      if (r.result === 'win') {
        s.gold += Math.round(target.gold * r.battle.goldMul);
        if (tryNew) { s.diamonds += target.firstDia; next++; }
      } else if (next > 0) {
        // 진 다음엔 깬 곳에서 골드 모으기
        const farm = STAGES[next - 1];
        const r2 = runBattle({ team: team.map(id => ({ id, ...s.heroes[id] })), stageId: farm.id, seed: seed + i * 31 + day }, { auto: true });
        if (r2.result === 'win') s.gold += Math.round(farm.gold * r2.battle.goldMul);
        i++;
      }
    }
    dayEnd.push(next);
  }
  sixes = Object.keys(s.heroes).filter(id => HERO[id].star >= 6).length;
  rows.push({ seed, dayEnd, sixes, team: pickTeam(s).map(id => `${HERO[id].name}★${HERO[id].star}Lv${s.heroes[id].level}`).join(', ') });
}
const avg = d => (rows.reduce((t, r) => t + r.dayEnd[d], 0) / rows.length).toFixed(1);
console.log(`하루 전투 ${PER_DAY}번, ${SEEDS}명`);
for (let d = 0; d < DAYS; d++) console.log(`${d + 1}일째 끝: 평균 ${avg(d)} 스테이지 깸 (분포 ${rows.map(r => r.dayEnd[d]).join(' ')})`);
console.log(`3일째 끝 3챕터 다 깬 비율: ${rows.filter(r => r.dayEnd[2] >= 30).length}/${rows.length}`);
console.log(`★6 이상 보유(5일): 평균 ${(rows.reduce((t, r) => t + r.sixes, 0) / rows.length).toFixed(1)}`);
console.log('예시 팀:', rows[0].team);
