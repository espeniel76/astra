// 스테이지 30개: 챕터마다 10개, 10번째가 보스.
// 새 적은 조금씩: 챕터 졸개 a는 1번부터, b는 4번부터, c는 7번부터, 보스는 10번.
import { monStats } from './monsters.js';

export const CHAPTERS = [
  { n: 1, name: '초원', bg: 'meadow', foes: ['slime', 'rat', 'bee'], boss: 'kingslime' },
  { n: 2, name: '숲', bg: 'forest', foes: ['goblin', 'wolf', 'mushroom'], boss: 'goblinchief' },
  { n: 3, name: '동굴', bg: 'cave', foes: ['bat', 'golem', 'spider'], boss: 'rockgiant' },
];

const WAVES = [
  ['a'], ['a', 'a'], ['a', 'a', 'a'], ['b', 'a'], ['a', 'b', 'a'],
  ['b', 'b', 'a'], ['c', 'a'], ['c', 'b', 'a'], ['b', 'c', 'c'],
];

// 추천 전투력 = 적 전투력 합 × REC_K (추천 전투력 팀이면 대략 80% 이김, scripts/sim.mjs 로 맞춤)
export const REC_K = 0.95;
const foePower = f => { const s = monStats(f.mon, f.lv); return s.hp * 0.2 + s.atk * 3 + s.def * 2; };

export const STAGES = [];
for (const c of CHAPTERS) {
  for (let n = 1; n <= 10; n++) {
    const lv = (c.n - 1) * 10 + n;
    const boss = n === 10;
    const pick = { a: c.foes[0], b: c.foes[1], c: c.foes[2] };
    const foes = boss
      ? [{ mon: c.foes[0], lv }, { mon: c.boss, lv }, { mon: c.foes[1], lv }]
      : WAVES[n - 1].map(k => ({ mon: pick[k], lv }));
    const newFoe = { 1: c.foes[0], 4: c.foes[1], 7: c.foes[2], 10: c.boss }[n];
    STAGES.push({
      id: `${c.n}-${n}`, chapter: c.n, n, lv, boss, foes, newFoe,
      gold: 60 + 25 * (lv - 1), firstDia: boss ? 1000 : 150,
      rec: Math.round(foes.reduce((t, f) => t + foePower(f), 0) * REC_K),
      limit: 10 + foes.length * 4 + (boss ? 10 : 0),
    });
  }
}
export const STAGE = Object.fromEntries(STAGES.map(s => [s.id, s]));
