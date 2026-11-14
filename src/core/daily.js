// 일일 미션: 하루(현지 시간 자정 기준)에 3개, 각각 100다이아.
export const MISSIONS = [
  { id: 'battle', goal: 5, text: '전투 5번 하기' },
  { id: 'summon', goal: 1, text: '소환 1번 하기' },
  { id: 'levelup', goal: 1, text: '영웅 레벨업 1번 하기' },
];
export const REWARD = 100;

const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function ensureToday(save, now = new Date()) {
  const k = dayKey(now);
  if (save.daily.date !== k) save.daily = { date: k, progress: { battle: 0, summon: 0, levelup: 0 }, claimed: [] };
}

export function bump(save, id, n = 1, now = new Date()) {
  ensureToday(save, now);
  save.daily.progress[id] = (save.daily.progress[id] || 0) + n;
}

const done = (save, m) => save.daily.progress[m.id] >= m.goal && !save.daily.claimed.includes(m.id);

export function claimable(save, now = new Date()) {
  ensureToday(save, now);
  return MISSIONS.filter(m => done(save, m)).length;
}

export function claim(save, id, now = new Date()) {
  ensureToday(save, now);
  const m = MISSIONS.find(x => x.id === id);
  if (!m || !done(save, m)) return false;
  save.daily.claimed.push(id);
  save.diamonds += REWARD;
  return true;
}
