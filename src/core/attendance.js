// 출석 체크(2026-11-18): 하루에 한 번, 7일 보상을 차례로 받는다. 7일째 다음 날은 1일째부터 다시.
// 하루 빠져도 처음으로 돌아가지 않는다(다음에 들어온 날 이어서 받음) — 12살 친구들이 부담 없게.
import { dayKey } from './daily.js';
import { dropGear } from './gear.js';

// kind: dia·gold·gear(가장 높은 등급)·ticket(★4 소환권)
export const LOGIN_REWARDS = [
  [{ kind: 'dia', n: 100 }],
  [{ kind: 'gold', n: 3000 }],
  [{ kind: 'dia', n: 150 }],
  [{ kind: 'gear', top: 3 }],
  [{ kind: 'dia', n: 200 }],
  [{ kind: 'gold', n: 10000 }],
  [{ kind: 'ticket', n: 1 }, { kind: 'dia', n: 300 }],
];

// 오늘 받을 수 있으면 몇 번째 날(0~6)인지, 이미 받았으면 null
export function loginToday(save, now = new Date()) {
  return save.login.last === dayKey(now) ? null : save.login.day % 7;
}

// 받기: 준 보상 목록(장비는 { kind:'gear', slot, grade })을 돌려준다. 오늘 이미 받았으면 null
export function claimLogin(save, rng = Math.random, now = new Date()) {
  const d = loginToday(save, now);
  if (d === null) return null;
  const got = [];
  for (const r of LOGIN_REWARDS[d]) {
    if (r.kind === 'dia') save.diamonds += r.n;
    else if (r.kind === 'gold') save.gold += r.n;
    else if (r.kind === 'ticket') save.tickets.star4 += r.n;
    if (r.kind === 'gear') got.push(...dropGear(save, rng, r.top, 1).map(g => ({ kind: 'gear', ...g })));
    else got.push({ ...r });
  }
  save.login.last = dayKey(now);
  save.login.day = (save.login.day + 1) % 7;
  save.login.total += 1;
  return { day: d, got };
}
