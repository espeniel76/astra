// 몬스터. 능력치는 레벨 1 기준이고 스테이지 레벨에 따라 1.11^(lv-1) 배가 된다(src/core/battle.js).
// look.kind 로 그림 모양을 고른다(src/render/monsters.js).
const M = (id, name, hp, atk, def, spd, look, more = {}) => ({ id, name, hp, atk, def, spd, look, boss: false, skill: null, ...more });

export const MONSTERS = Object.fromEntries([
  // 초원
  M('slime', '슬라임', 150, 18, 4, 90, { kind: 'slime', body: '#5fd068' }),
  M('rat', '들쥐', 110, 22, 3, 115, { kind: 'rat', body: '#9a8f86' }),
  M('bee', '왕벌', 95, 26, 2, 125, { kind: 'bee', body: '#f2c53a' }),
  M('kingslime', '킹 슬라임', 480, 28, 8, 80, { kind: 'slime', body: '#3fb04a', crown: true, s: 1.7 },
    { boss: true, skill: { k: 'split', at: 0.5, mon: 'slime', count: 2, name: '분열' } }),
  // 숲
  M('goblin', '고블린', 170, 26, 6, 105, { kind: 'goblin', body: '#7ab04a' }),
  M('wolf', '회색 늑대', 150, 30, 5, 125, { kind: 'wolf', body: '#8a8f99' }),
  M('mushroom', '독버섯', 200, 18, 8, 85, { kind: 'mushroom', body: '#d84a4a' },
    { skill: { k: 'poison', cd: 3, v: 0.5, turns: 2, name: '독 포자' } }),
  M('goblinchief', '고블린 족장', 620, 30, 10, 95, { kind: 'goblin', body: '#5a9a3a', crown: true, s: 1.7 },
    { boss: true, skill: { k: 'rally', cd: 4, v: 0.25, turns: 2, name: '돌격 명령' } }),
  // 동굴
  M('bat', '동굴 박쥐', 140, 30, 4, 135, { kind: 'bat', body: '#5a4a6a' }),
  M('golem', '돌 골렘', 320, 26, 16, 70, { kind: 'golem', body: '#8a8478' }),
  M('spider', '동굴 거미', 180, 32, 6, 110, { kind: 'spider', body: '#3a2a3a' },
    { skill: { k: 'web', cd: 3, turns: 1, name: '거미줄' } }),
  M('rockgiant', '바위 거인', 820, 34, 16, 75, { kind: 'golem', body: '#6a645a', crown: true, s: 1.9 },
    { boss: true, skill: { k: 'quake', cd: 3, mult: 1.2, name: '지진' } }),
].map(m => [m.id, m]));
