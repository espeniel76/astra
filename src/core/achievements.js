// 업적(2026-11-18): 한 번 이루면 한 번 받는 큰 목표들. 진행도는 저장에서 바로 계산한다(따로 세는 건 save.stats).
import { HEROES } from '../data/heroes.js';
import { STAGES } from '../data/stages.js';
import { SLOT_IDS } from '../data/gear.js';

const cleared = id => s => (s.cleared.includes(id) ? 1 : 0);
const totalStars = s => Object.values(s.stars).reduce((t, n) => t + n, 0);
const ownedCount = s => Object.keys(s.heroes).length;
const hasLegend = s => (Object.keys(s.gear).some(k => k.endsWith('-5')) || Object.values(s.heroes).some(h => SLOT_IDS.some(k => h.gear?.[k] === 5)) ? 1 : 0);
const awakenedAny = s => (Object.values(s.heroes).some(h => h.awakened) ? 1 : 0);
const D = n => ({ kind: 'dia', n });
const T = n => ({ kind: 'ticket', n });

// group: 화면에서 묶는 이름. goal 에 닿으면 받을 수 있다.
export const ACHIEVEMENTS = [
  { id: 'st1', group: '모험', name: '초원 정복', desc: '1-10 보스 물리치기', goal: 1, get: cleared('1-10'), reward: [D(200)] },
  { id: 'st3', group: '모험', name: '동굴 정복', desc: '3-10 보스 물리치기', goal: 1, get: cleared('3-10'), reward: [D(300)] },
  { id: 'st5', group: '모험', name: '설원 정복', desc: '5-10 보스 물리치기', goal: 1, get: cleared('5-10'), reward: [D(400)] },
  { id: 'st8', group: '모험', name: '해안 정복', desc: '8-10 보스 물리치기', goal: 1, get: cleared('8-10'), reward: [D(500)] },
  { id: 'st11', group: '모험', name: '묘지 정복', desc: '11-10 보스 물리치기', goal: 1, get: cleared('11-10'), reward: [D(700)] },
  { id: 'st15', group: '모험', name: '천공 정복', desc: '15-10 마지막 보스 물리치기', goal: 1, get: cleared('15-10'), reward: [T(1), D(1000)] },
  { id: 'star30', group: '별', name: '별 모으기', desc: '모험에서 별 30개', goal: 30, get: totalStars, reward: [D(150)] },
  { id: 'star120', group: '별', name: '별 수집가', desc: '모험에서 별 120개', goal: 120, get: totalStars, reward: [D(300)] },
  { id: 'star300', group: '별', name: '별빛 모험가', desc: '모험에서 별 300개', goal: 300, get: totalStars, reward: [D(600)] },
  { id: 'starAll', group: '별', name: '모든 별', desc: `모험의 별 ${STAGES.length * 3}개 전부`, goal: STAGES.length * 3, get: totalStars, reward: [T(1), D(1000)] },
  { id: 'hero10', group: '영웅', name: '동료 열 명', desc: '영웅 10명 모으기', goal: 10, get: ownedCount, reward: [D(150)] },
  { id: 'hero30', group: '영웅', name: '든든한 부대', desc: '영웅 30명 모으기', goal: 30, get: ownedCount, reward: [D(300)] },
  { id: 'hero50', group: '영웅', name: '영웅의 군단', desc: '영웅 50명 모으기', goal: 50, get: ownedCount, reward: [D(600)] },
  { id: 'heroAll', group: '영웅', name: '모든 별의 친구', desc: `영웅 ${HEROES.length}명 전부 모으기`, goal: HEROES.length, get: ownedCount, reward: [T(2)] },
  { id: 'awaken', group: '영웅', name: '각성', desc: '★7 영웅 각성하기', goal: 1, get: awakenedAny, reward: [D(500)] },
  { id: 'sum10', group: '소환', name: '첫 소환들', desc: '소환 10번', goal: 10, get: s => s.stats.summons, reward: [D(100)] },
  { id: 'sum100', group: '소환', name: '별을 부르는 자', desc: '소환 100번', goal: 100, get: s => s.stats.summons, reward: [D(300)] },
  { id: 'sum500', group: '소환', name: '소환의 달인', desc: '소환 500번', goal: 500, get: s => s.stats.summons, reward: [T(1)] },
  { id: 'tw10', group: '도전', name: '탑 10층', desc: '무한의 탑 10층', goal: 10, get: s => s.tower.best, reward: [D(200)] },
  { id: 'tw30', group: '도전', name: '탑 30층', desc: '무한의 탑 30층', goal: 30, get: s => s.tower.best, reward: [D(400)] },
  { id: 'tw50', group: '도전', name: '탑 50층', desc: '무한의 탑 50층', goal: 50, get: s => s.tower.best, reward: [D(800)] },
  { id: 'tw100', group: '도전', name: '구름 위의 탑', desc: '무한의 탑 100층', goal: 100, get: s => s.tower.best, reward: [T(1), D(1000)] },
  { id: 'pvp1', group: '도전', name: '첫 승리', desc: '친구 대전 1번 이기기', goal: 1, get: s => s.pvp.wins, reward: [D(100)] },
  { id: 'pvp10', group: '도전', name: '대전의 강자', desc: '친구 대전 10번 이기기', goal: 10, get: s => s.pvp.wins, reward: [D(300)] },
  { id: 'win100', group: '도전', name: '백 번의 승리', desc: '전투 100번 이기기', goal: 100, get: s => s.stats.wins, reward: [D(300)] },
  { id: 'legend', group: '장비', name: '전설의 장비', desc: '전설 장비 얻기', goal: 1, get: hasLegend, reward: [D(300)] },
];
export const ACHV = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

export function achvState(save) {
  return ACHIEVEMENTS.map(a => {
    const cur = Math.min(a.goal, a.get(save) || 0);
    const claimed = save.achv.includes(a.id);
    return { ...a, cur, done: cur >= a.goal, claimed };
  });
}
export const achvClaimable = save => achvState(save).filter(a => a.done && !a.claimed).length;

export function claimAchv(save, id) {
  const a = ACHV[id];
  if (!a || save.achv.includes(id) || (a.get(save) || 0) < a.goal) return null;
  save.achv.push(id);
  for (const r of a.reward) {
    if (r.kind === 'dia') save.diamonds += r.n;
    else if (r.kind === 'ticket') save.tickets.star4 += r.n;
  }
  return a.reward;
}

// 세는 기록(소환 횟수·승리 횟수)
export function countStat(save, key, n = 1) {
  save.stats ||= {};
  save.stats[key] = (save.stats[key] || 0) + n;
}
