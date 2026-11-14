// 스테이지 30개: 챕터마다 10개, 10번째가 보스.
export const CHAPTERS = [
  { n: 1, name: '초원', bg: 'meadow', foes: ['slime', 'rat', 'bee'], boss: 'kingslime' },
  { n: 2, name: '숲', bg: 'forest', foes: ['goblin', 'wolf', 'mushroom'], boss: 'goblinchief' },
  { n: 3, name: '동굴', bg: 'cave', foes: ['bat', 'golem', 'spider'], boss: 'rockgiant' },
];

// 스테이지 n에 나오는 적 구성(챕터의 졸개 3종 a,b,c 기준). 처음엔 1~2마리, 갈수록 3마리.
const WAVES = [
  ['a'], ['a', 'a'], ['a', 'b'], ['b', 'a', 'a'], ['a', 'c'],
  ['b', 'b', 'a'], ['c', 'a', 'b'], ['c', 'c', 'a'], ['b', 'c', 'b'],
];

export const STAGES = [];
for (const c of CHAPTERS) {
  for (let n = 1; n <= 10; n++) {
    const lv = (c.n - 1) * 10 + n;
    const boss = n === 10;
    const pick = { a: c.foes[0], b: c.foes[1], c: c.foes[2] };
    const foes = boss
      ? [{ mon: c.foes[0], lv }, { mon: c.boss, lv }, { mon: c.foes[1], lv }]
      : WAVES[n - 1].map(k => ({ mon: pick[k], lv }));
    STAGES.push({ id: `${c.n}-${n}`, chapter: c.n, n, lv, boss, foes, gold: 60 + 25 * (lv - 1), firstDia: boss ? 1000 : 150 });
  }
}
export const STAGE = Object.fromEntries(STAGES.map(s => [s.id, s]));
