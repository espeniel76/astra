// 몬스터. 능력치는 레벨 1 기준이고 스테이지 레벨에 따라 monGrowth(lv) 배가 된다(src/core/battle.js).
// look.kind 로 그림 모양을 고른다(src/render/monsters.js).
const M = (id, name, hp, atk, def, spd, look, more = {}) => ({ id, name, hp, atk, def, spd, look, boss: false, skill: null, desc: DESC[id], ...more });

const DESC = {
  slime: '말랑말랑한 첫 상대. 약해요!',
  rat: '빨라서 먼저 때려요.',
  bee: '몸은 약하지만 아프게 쏘아요.',
  kingslime: '보스! 체력이 절반이 되면 슬라임 둘로 갈라져요.',
  goblin: '몽둥이를 든 숲의 말썽꾼.',
  wolf: '아주 빠르고 세게 물어요.',
  mushroom: '독 포자를 뿌려요. 독은 매 턴 아파요.',
  goblinchief: '보스! 돌격 명령으로 졸개들을 세게 만들어요.',
  bat: '동굴에서 가장 빨라요.',
  golem: '느리지만 엄청 단단해요.',
  spider: '거미줄로 영웅을 묶어요.',
  rockgiant: '보스! 지진으로 영웅 모두를 때려요.',
};

// 4~15챕터 몬스터(아들 요청 "15챕터까지", 2026-11-15). 챕터마다 졸개 a(보통)·b(빠름)·c(단단하거나 기술)·보스.
const P = { a: [160, 24, 5, 95], b: [130, 30, 4, 125], c: [250, 25, 12, 82], boss: [900, 34, 14, 85] };
const C = (id, name, role, look, desc, more = {}) => {
  DESC[id] = desc;
  const [hp, atk, def, spd] = P[role];
  return M(id, name, hp, atk, def, spd, look, role === 'boss' ? { boss: true, ...more } : more);
};
const MORE = [
  // 4 사막
  C('sandslime', '모래 슬라임', 'a', { kind: 'slime', body: '#e8c070' }, '모래 속에 숨어 있다 튀어나와요.'),
  C('scorpion', '사막 전갈', 'b', { kind: 'scorpion', body: '#c88a3a' }, '꼬리 독침이 아주 아파요.'),
  C('mummy', '미라', 'c', { kind: 'mummy', body: '#e8dcc0' }, '붕대로 영웅을 꽁꽁 묶어요.', { skill: { k: 'web', cd: 3, turns: 1, name: '붕대 감기' } }),
  C('scorpionqueen', '전갈 여왕', 'boss', { kind: 'scorpion', body: '#a8602a', crown: true, s: 1.8 }, '보스! 모래 폭풍으로 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.2, name: '모래 폭풍' } }),
  // 5 설원
  C('snowslime', '눈 슬라임', 'a', { kind: 'slime', body: '#e8f4ff', deco: 'ice' }, '차갑고 말랑해요.'),
  C('icewolf', '얼음 늑대', 'b', { kind: 'wolf', body: '#b8d8f0', deco: 'ice' }, '눈보라처럼 빨라요.'),
  C('yeti', '설인', 'c', { kind: 'golem', body: '#f0f4f8' }, '두꺼운 털 때문에 엄청 단단해요.'),
  C('yetiking', '설인 왕', 'boss', { kind: 'golem', body: '#dce8f2', deco: 'ice', crown: true, s: 1.9 }, '보스! 눈사태로 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.25, name: '눈사태' } }),
  // 6 늪지
  C('swampfrog', '독 개구리', 'a', { kind: 'frog', body: '#6aa84a' }, '혀에 독이 묻어 있어요.', { skill: { k: 'poison', cd: 3, v: 0.5, turns: 2, name: '독 혀' } }),
  C('swamprat', '늪쥐', 'b', { kind: 'rat', body: '#6a7a4a' }, '진흙 속을 쏜살같이 달려요.'),
  C('bogshroom', '늪 버섯', 'c', { kind: 'mushroom', body: '#9a5ac8' }, '보랏빛 독 포자를 뿌려요.', { skill: { k: 'poison', cd: 3, v: 0.6, turns: 2, name: '늪 포자' } }),
  C('frogking', '두꺼비 대왕', 'boss', { kind: 'frog', body: '#4a7a2a', crown: true, s: 1.9 }, '보스! 체력이 절반이 되면 독 개구리 둘을 불러요.', { skill: { k: 'split', at: 0.5, mon: 'swampfrog', count: 2, name: '개구리 부르기' } }),
  // 7 화산
  C('lavaslime', '용암 슬라임', 'a', { kind: 'slime', body: '#ff7a2a', deco: 'flame' }, '만지면 뜨거워요!'),
  C('firebat', '불 박쥐', 'b', { kind: 'bat', body: '#c83a2a', deco: 'flame' }, '불꽃 날개로 빠르게 날아요.'),
  C('lavagolem', '용암 골렘', 'c', { kind: 'golem', body: '#6a2a1a', deco: 'flame' }, '식은 용암으로 된 단단한 몸.'),
  C('firegiant', '화염 거인', 'boss', { kind: 'golem', body: '#8a2a10', deco: 'flame', crown: true, s: 2 }, '보스! 분화로 영웅 모두를 태워요.', { skill: { k: 'quake', cd: 3, mult: 1.3, name: '분화' } }),
  // 8 해안
  C('crab', '바닷게', 'a', { kind: 'crab', body: '#e05a3a' }, '집게로 꽉 집어요.'),
  C('seaslime', '바다 슬라임', 'b', { kind: 'slime', body: '#3fb8d0' }, '파도를 타고 빠르게 다가와요.'),
  C('jelly', '해파리', 'c', { kind: 'jelly', body: '#b8a8ff' }, '촉수로 영웅을 마비시켜요.', { skill: { k: 'web', cd: 3, turns: 1, name: '촉수 쏘기' } }),
  C('kingcrab', '대왕 게', 'boss', { kind: 'crab', body: '#c83a2a', crown: true, s: 1.9 }, '보스! 졸개들을 더 세게 만들어요.', { skill: { k: 'rally', cd: 4, v: 0.3, turns: 2, name: '집게 신호' } }),
  // 9 유적
  C('skeleton', '해골 병사', 'a', { kind: 'skeleton', body: '#ece6d8' }, '오래된 유적을 지키는 병사.'),
  C('ghost', '유령', 'b', { kind: 'ghost', body: '#c8d8ff' }, '스르륵 빠르게 움직여요.'),
  C('stonegolem', '석상', 'c', { kind: 'golem', body: '#a8a49a' }, '돌로 된 수호자. 아주 단단해요.'),
  C('ancientknight', '고대 기사', 'boss', { kind: 'skeleton', body: '#8a7a4a', crown: true, s: 1.9 }, '보스! 진격 명령으로 졸개들을 세게 만들어요.', { skill: { k: 'rally', cd: 4, v: 0.3, turns: 2, name: '진격 명령' } }),
  // 10 수정 동굴
  C('crystalbat', '수정 박쥐', 'a', { kind: 'bat', body: '#8a6ac8', deco: 'crystal' }, '수정처럼 반짝이는 박쥐.'),
  C('crystalspider', '수정 거미', 'b', { kind: 'spider', body: '#6a4a9a', deco: 'crystal' }, '수정 거미줄로 묶어요.', { skill: { k: 'web', cd: 3, turns: 1, name: '수정 거미줄' } }),
  C('crystalgolem', '수정 골렘', 'c', { kind: 'golem', body: '#b8a8e8', deco: 'crystal' }, '빛나는 수정 몸. 엄청 단단해요.'),
  C('crystalcolossus', '수정 거상', 'boss', { kind: 'golem', body: '#9a7ad8', deco: 'crystal', crown: true, s: 2 }, '보스! 수정 파편으로 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.3, name: '수정 파편' } }),
  // 11 묘지
  C('wraith', '망령', 'a', { kind: 'ghost', body: '#9aa8b8' }, '차가운 숨결을 내뿜어요.'),
  C('gravebat', '묘지 박쥐', 'b', { kind: 'bat', body: '#3a3a4a' }, '어둠 속에서 갑자기 나타나요.'),
  C('boneknight', '뼈 기사', 'c', { kind: 'skeleton', body: '#5a6a8a' }, '투구를 쓴 해골 기사.'),
  C('lichlord', '망령 군주', 'boss', { kind: 'ghost', body: '#6a5a9a', crown: true, s: 2 }, '보스! 체력이 절반이 되면 망령 둘을 불러요.', { skill: { k: 'split', at: 0.5, mon: 'wraith', count: 2, name: '망령 부르기' } }),
  // 12 하늘 섬
  C('cloudslime', '구름 슬라임', 'a', { kind: 'slime', body: '#f4f8ff' }, '폭신폭신한 구름 덩어리.'),
  C('harpy', '하피', 'b', { kind: 'bird', body: '#c8a8e8' }, '날카로운 발톱으로 빠르게 공격해요.'),
  C('windwisp', '바람 정령', 'c', { kind: 'ghost', body: '#d8f4ff' }, '바람으로 영웅을 묶어 버려요.', { skill: { k: 'web', cd: 3, turns: 1, name: '회오리' } }),
  C('griffin', '폭풍 그리폰', 'boss', { kind: 'bird', body: '#c8a050', crown: true, s: 2 }, '보스! 폭풍으로 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.3, name: '폭풍' } }),
  // 13 어둠의 성
  C('shadowgoblin', '그림자 고블린', 'a', { kind: 'goblin', body: '#3a3a5a' }, '그림자 속에 숨어 있어요.'),
  C('darkwolf', '어둠 늑대', 'b', { kind: 'wolf', body: '#2a2a3a' }, '어둠 속에서 눈만 빛나요.'),
  C('blackknight', '흑기사', 'c', { kind: 'skeleton', body: '#2a2a3a' }, '검은 갑옷의 해골 기사.', { skill: { k: 'rally', cd: 4, v: 0.25, turns: 2, name: '어둠의 함성' } }),
  C('darklord', '어둠의 군주', 'boss', { kind: 'skeleton', body: '#4a2a6a', crown: true, s: 2 }, '보스! 졸개들을 크게 강하게 만들어요.', { skill: { k: 'rally', cd: 3, v: 0.35, turns: 2, name: '군주의 명령' } }),
  // 14 별의 공허
  C('voidslime', '공허 슬라임', 'a', { kind: 'slime', body: '#4a2a8a', deco: 'stars' }, '몸속에 별이 떠 있어요.'),
  C('voidbat', '공허 박쥐', 'b', { kind: 'bat', body: '#2a1a4a', deco: 'stars' }, '별빛 사이를 날아요.'),
  C('stargolem', '별 골렘', 'c', { kind: 'golem', body: '#3a2a6a', deco: 'stars' }, '부서진 별로 만들어진 몸.'),
  C('voideye', '공허의 눈', 'boss', { kind: 'ghost', body: '#2a1a4a', deco: 'stars', crown: true, s: 2.2 }, '보스! 공허의 파동으로 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.35, name: '공허의 파동' } }),
  // 15 천공(마지막)
  C('lightwisp', '빛의 정령', 'a', { kind: 'ghost', body: '#fff3c0', deco: 'halo' }, '따뜻하지만 강한 빛.'),
  C('lightbird', '빛의 새', 'b', { kind: 'bird', body: '#ffe9a0', deco: 'halo' }, '빛처럼 빠르게 날아요.'),
  C('angelgolem', '천사 골렘', 'c', { kind: 'golem', body: '#f4f0e0', deco: 'halo' }, '하늘을 지키는 거대한 수호자.'),
  C('fallenstar', '타락한 별의 용', 'boss', { kind: 'dragon', body: '#3a2a5a', deco: 'stars', crown: true, s: 2.2 }, '마지막 보스! 별똥별을 떨어뜨려 영웅 모두를 때려요.', { skill: { k: 'quake', cd: 3, mult: 1.4, name: '별똥별 낙하' } }),
];

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
  ...MORE,
].map(m => [m.id, m]));

// 몬스터 세기: 레벨마다 MON_GROWTH 배, 전체 세기 MON_BASE (밸런스: node scripts/sim.mjs)
export const MON_GROWTH = 1.03;
export const MON_BASE = 3.4;
// 4챕터(레벨 31)부터는 레벨마다 1.02배로 천천히: 15챕터 보스도 ★6~★7 팀이면 깰 수 있게
export const MON_GROWTH_LATE = 1.02;
export const LATE_FROM = 30;
export const monGrowth = lv => (lv <= LATE_FROM
  ? MON_GROWTH ** (lv - 1)
  : MON_GROWTH ** (LATE_FROM - 1) * MON_GROWTH_LATE ** (lv - LATE_FROM));
export function monStats(mon, lv) {
  const m = MONSTERS[mon];
  const k = monGrowth(lv);
  return { hp: Math.round(m.hp * k * MON_BASE), atk: Math.round(m.atk * k * MON_BASE), def: Math.round(m.def * k), spd: m.spd };
}
