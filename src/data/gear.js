// 영웅 장비(아들 요청, 2026-11-16): 영웅마다 무기·갑옷·장신구 세 칸.
// 장비는 "칸 + 등급"만 있다(같은 등급 같은 칸은 똑같은 물건). 가방에는 개수로 쌓인다: save.gear['weapon-3'] = 2
// 등급이 높을수록 세다. 무기 = 공격력, 갑옷 = 체력·방어, 장신구 = 모든 능력치 조금.
export const SLOTS = {
  weapon: { name: '무기', icon: '⚔️', desc: '공격력' },
  armor: { name: '갑옷', icon: '🛡️', desc: '체력·방어' },
  acc: { name: '장신구', icon: '💍', desc: '체력·공격·방어' },
};
export const SLOT_IDS = Object.keys(SLOTS);

export const GRADES = [
  null,
  { name: '일반', color: '#b8c2cc' },
  { name: '고급', color: '#55d468' },
  { name: '희귀', color: '#5a9dff' },
  { name: '영웅', color: '#b56dff' },
  { name: '전설', color: '#ffa33a' },
];
export const MAX_GRADE = 5;

// 등급별 올라가는 비율(0.10 = +10%)
export const BONUS = {
  weapon: [0, 0.05, 0.1, 0.16, 0.24, 0.35],
  armor: [0, 0.05, 0.1, 0.16, 0.24, 0.35],
  acc: [0, 0.03, 0.06, 0.1, 0.15, 0.22],
};

export const gearKey = (slot, grade) => `${slot}-${grade}`;
export const gearName = (slot, grade) => `${GRADES[grade].name} ${SLOTS[slot].name}`;
export const bonusText = (slot, grade) => `${SLOTS[slot].desc} +${Math.round(BONUS[slot][grade] * 100)}%`;

// 영웅이 낀 장비(gear = { weapon: 3, armor: 0, acc: 2 })로 능력치 배수
export function gearMult(gear = {}) {
  const g = s => BONUS[s][gear?.[s] || 0] || 0;
  const acc = g('acc');
  return { atk: 1 + g('weapon') + acc, hp: 1 + g('armor') + acc, def: 1 + g('armor') + acc };
}

// 장비 하나 뽑기. top = 나올 수 있는 가장 높은 등급(1~5). 높은 등급일수록 드물다.
export function rollGear(rng, top) {
  const t = Math.max(1, Math.min(MAX_GRADE, top));
  const weights = [];
  for (let g = 1; g <= t; g++) weights.push(g === t ? 1 : 2 ** (t - g)); // 맨 위 1 : 그 아래 2 : 4 : …
  // 맨 위 등급은 너무 드물지 않게 조금 더
  weights[t - 1] += t > 1 ? 1 : 0;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total, grade = 1;
  for (let g = 1; g <= t; g++) { r -= weights[g - 1]; if (r < 0) { grade = g; break; } }
  const slot = SLOT_IDS[Math.floor(rng() * SLOT_IDS.length)];
  return { slot, grade };
}
