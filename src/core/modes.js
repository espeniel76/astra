// 도전 모드(아들 요청, 2026-11-16): 무한의 탑 · 요일 던전 · 친구 대전.
// 각 모드는 전투 설명(spec)을 만들어 BattleScene 에 넘기고, 이기면 여기 win… 함수로 보상을 준다.
// spec = { kind, title, bg, foes | foeTeam, back(돌아갈 화면), …모드별 값 }
import { CHAPTERS, recFor } from '../data/stages.js';
import { HERO } from '../data/heroes.js';
import { SLOT_IDS, MAX_GRADE } from '../data/gear.js';
import { dayKey } from './daily.js';
import { dropGear } from './gear.js';
import { maxLevel, DUPE_MAX, power } from './progress.js';

// ── 무한의 탑: 층마다 조금씩 세지는 끝없는 탑. 한 층씩 올라가고, 처음 깬 층만 보상 ──
export const towerLv = f => 6 + f * 2;
export function towerFloor(f) {
  const c = CHAPTERS[(f - 1) % CHAPTERS.length]; // 15층마다 초원부터 다시(대신 더 세다)
  const lv = towerLv(f), boss = f % 10 === 0;
  const foes = boss
    ? [{ mon: c.foes[0], lv }, { mon: c.boss, lv }, { mon: c.foes[1], lv }]
    : [0, 1, 2].map(k => ({ mon: c.foes[(f + k) % 3], lv }));
  const reward = {
    gold: 200 + 40 * f,
    dia: boss ? 150 : f % 5 === 0 ? 50 : 0,
    gear: f % 5 === 0 ? Math.min(MAX_GRADE, 1 + Math.floor(f / 12)) : 0, // 5층마다 장비(높은 층일수록 좋은 등급까지)
  };
  return { floor: f, boss, lv, foes, bg: c.bg, rec: recFor(foes), reward };
}
export function towerSpec(f) {
  const t = towerFloor(f);
  return { kind: 'tower', title: `무한의 탑 ${f}층${t.boss ? ' 보스' : ''}`, bg: t.bg, foes: t.foes, back: 'tower', floor: f };
}
// 이긴 층이 '다음 층'이면 기록을 올리고 보상. 아니면 null
export function winTower(save, f, rng) {
  if (f !== save.tower.best + 1) return null;
  const { reward } = towerFloor(f);
  save.tower.best = f;
  save.gold += reward.gold;
  save.diamonds += reward.dia;
  const gear = reward.gear ? dropGear(save, rng, reward.gear, 1) : [];
  return { gold: reward.gold, dia: reward.dia, gear };
}

// ── 요일 던전: 요일마다 열리는 던전, 하루 3번(이겼을 때만 1번 줄어듦) ──
// 요일: 0 일 · 1 월 · 2 화 · 3 수 · 4 목 · 5 금 · 6 토. 일요일은 모두 열림
export const DUNGEONS = {
  gold: { name: '황금 동굴', emoji: '🪙', bg: 'desert', foes: ['sandslime', 'scorpion'], boss: 'scorpionqueen', days: [1, 4, 0], desc: '골드를 잔뜩 얻어요' },
  dia: { name: '수정 광산', emoji: '💎', bg: 'crystal', foes: ['crystalbat', 'crystalspider'], boss: 'crystalcolossus', days: [2, 5, 0], desc: '다이아를 얻어요' },
  gear: { name: '별빛 제단', emoji: '🎁', bg: 'void', foes: ['voidslime', 'voidbat'], boss: 'voideye', days: [3, 6, 0], desc: '장비를 얻어요' },
};
export const DUNGEON_IDS = Object.keys(DUNGEONS);
export const DIFFS = [{ name: '쉬움', lv: 8 }, { name: '보통', lv: 40 }, { name: '어려움', lv: 95 }];
export const DUNGEON_TRIES = 3;
// 보상: 골드·다이아는 양, 장비는 [가장 높은 등급, 개수]
export const DUNGEON_REWARD = { gold: [3000, 9000, 25000], dia: [40, 100, 220], gear: [[2, 1], [3, 2], [5, 3]] };
const DAY_NAME = ['일', '월', '화', '수', '목', '금', '토'];
export const openDays = key => DUNGEONS[key].days.filter(d => d !== 0).map(d => DAY_NAME[d]).join('·') + '·일';

export function dungeonState(save, now = new Date()) {
  const k = dayKey(now);
  if (save.dungeon.date !== k) save.dungeon = { date: k, left: DUNGEON_TRIES };
  return save.dungeon;
}
export const isOpen = (key, now = new Date()) => DUNGEONS[key].days.includes(now.getDay());
export function dungeonFoes(key, d) {
  const D = DUNGEONS[key], lv = DIFFS[d].lv;
  return [{ mon: D.foes[0], lv }, { mon: D.boss, lv }, { mon: D.foes[1], lv }];
}
export const dungeonRec = (key, d) => recFor(dungeonFoes(key, d));
export function rewardText(key, d) {
  const r = DUNGEON_REWARD[key][d];
  return key === 'gold' ? `🪙 ${r.toLocaleString('ko-KR')}` : key === 'dia' ? `💎 ${r}` : `🎁 장비 ${r[1]}개`;
}
export function dungeonSpec(key, d) {
  return { kind: 'dungeon', title: `${DUNGEONS[key].name} · ${DIFFS[d].name}`, bg: DUNGEONS[key].bg, foes: dungeonFoes(key, d), back: 'dungeon', key, diff: d };
}
export function winDungeon(save, key, d, rng, now = new Date()) {
  const st = dungeonState(save, now);
  if (st.left < 1 || !isOpen(key, now)) return null;
  st.left -= 1;
  const r = DUNGEON_REWARD[key][d];
  if (key === 'gold') { save.gold += r; return { gold: r, dia: 0, gear: [] }; }
  if (key === 'dia') { save.diamonds += r; return { gold: 0, dia: r, gear: [] }; }
  return { gold: 0, dia: 0, gear: dropGear(save, rng, r[0], r[1]) };
}

// ── 친구 대전: 내 팀을 '팀 코드'로 만들어 주고받는다(서버 없음). 상대 팀은 컴퓨터가 대신 싸운다 ──
const VS = 'ASTRAVS1-';
export const PVP_WIN_DIA = 50; // 하루 첫 승리 보상
const enc = str => { let bin = ''; for (const b of new TextEncoder().encode(str)) bin += String.fromCharCode(b); return btoa(bin); };
const dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)));
// 코드를 손으로 고쳐 세게 만드는 것을 막는 간단한 확인 숫자
const check = str => { let h = 2166136261; for (const ch of `astra|${str}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };

export function teamCode(save) {
  const t = save.team.filter(id => id && save.heroes[id]).map(id => {
    const h = save.heroes[id], g = h.gear || {};
    return [id, h.level, h.dupes, h.awakened ? 1 : 0, g.weapon || 0, g.armor || 0, g.acc || 0];
  });
  const body = JSON.stringify({ n: save.pvp.name || '모험가', t });
  return `${VS}${enc(body)}.${check(body)}`;
}

const clampInt = (v, lo, hi) => (Number.isInteger(v) ? Math.min(hi, Math.max(lo, v)) : lo);
// 친구 팀 코드 읽기 → { name, team: [{ id, level, dupes, awakened, gear }] } (틀리면 null)
export function readTeamCode(code) {
  const c = String(code || '').replace(/\s+/g, '');
  if (!c.startsWith(VS)) return null;
  const [b64, sum] = c.slice(VS.length).split('.');
  try {
    const body = dec(b64);
    if (check(body) !== sum) return null;
    const raw = JSON.parse(body);
    if (!Array.isArray(raw.t) || !raw.t.length || raw.t.length > 3) return null;
    const seen = new Set();
    const team = [];
    for (const row of raw.t) {
      if (!Array.isArray(row) || !HERO[row[0]] || seen.has(row[0])) return null;
      const [id, lv, du, aw, ...g] = row;
      seen.add(id);
      const awakened = aw === 1 && HERO[id].star === 7 && du >= DUPE_MAX;
      const gear = {};
      SLOT_IDS.forEach((k, i) => { const v = clampInt(g[i], 0, MAX_GRADE); if (v) gear[k] = v; });
      team.push({ id, level: clampInt(lv, 1, maxLevel(id, awakened)), dupes: clampInt(du, 0, DUPE_MAX), awakened, gear });
    }
    return { name: typeof raw.n === 'string' && raw.n.trim() ? raw.n.slice(0, 10) : '모험가', team };
  } catch {
    return null;
  }
}
export const friendPower = friend => friend.team.reduce((t, x) => t + power(x.id, x.level, x.dupes, x.awakened, x.gear), 0);

export function pvpSpec(friend) {
  return { kind: 'pvp', title: `친구 대전 · ${friend.name}`, bg: 'ruins', foeTeam: friend.team, back: 'pvp', friend };
}
// 대전 결과 기록. 하루 첫 승리면 다이아
export function finishPvp(save, result, now = new Date()) {
  if (result === 'win') {
    save.pvp.wins += 1;
    const k = dayKey(now);
    if (save.pvp.lastWin !== k) { save.pvp.lastWin = k; save.diamonds += PVP_WIN_DIA; return { dia: PVP_WIN_DIA }; }
    return { dia: 0 };
  }
  if (result === 'lose') save.pvp.losses += 1;
  return { dia: 0 };
}
