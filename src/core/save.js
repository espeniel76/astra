// 저장: 브라우저 localStorage. 서버가 없으니 저장 코드(내보내기/불러오기)로 백업하고 다른 폰으로 옮긴다.
// 나중에 서버(대전)로 옮기기 쉽게 단순한 JSON 모양을 유지한다.
import { HERO } from '../data/heroes.js';
import { STAGE } from '../data/stages.js';
import { MAX_LEVEL, DUPE_MAX } from './progress.js';

export const VERSION = 1;
const TEST = typeof location !== 'undefined' && /[?&]test\b/.test(location.search);
export const SAVE_KEY = TEST ? 'astra.save.test' : 'astra.save';
// 테스트판(?test) 코드는 진짜 게임에 못 들어오게 머리말을 다르게 한다
const codePrefix = test => (test ? 'ASTRATEST1-' : 'ASTRA1-');

export function defaultSave() {
  return {
    version: VERSION,
    diamonds: 3000,
    gold: 0,
    heroes: {},
    team: [null, null, null],
    cleared: [],
    pity: 0,
    daily: { date: '', progress: { battle: 0, summon: 0, levelup: 0 }, claimed: [] },
    settings: { flash: false, sound: true, auto: false, speed: 1 },
    tips: {},
  };
}

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const num = (v, d, min = 0, max = Infinity) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : d);

// 무엇이 들어와도 올바른 저장 모양으로 고친다
export function normalize(raw) {
  const d = defaultSave();
  if (!isObj(raw)) return d;
  const s = d;
  s.diamonds = num(raw.diamonds, d.diamonds);
  s.gold = num(raw.gold, d.gold);
  s.pity = num(raw.pity, 0, 0, 1000);
  if (isObj(raw.heroes)) {
    for (const [id, h] of Object.entries(raw.heroes)) {
      if (!HERO[id] || !isObj(h)) continue;
      s.heroes[id] = { level: num(h.level, 1, 1, MAX_LEVEL), dupes: num(h.dupes, 0, 0, DUPE_MAX) };
    }
  }
  if (Array.isArray(raw.team)) {
    const seen = new Set();
    s.team = [0, 1, 2].map(i => {
      const id = raw.team[i];
      if (typeof id !== 'string' || !s.heroes[id] || seen.has(id)) return null;
      seen.add(id);
      return id;
    });
  }
  if (Array.isArray(raw.cleared)) s.cleared = [...new Set(raw.cleared.filter(id => STAGE[id]))];
  if (isObj(raw.daily)) {
    s.daily.date = typeof raw.daily.date === 'string' ? raw.daily.date : '';
    if (isObj(raw.daily.progress)) for (const k of Object.keys(s.daily.progress)) s.daily.progress[k] = num(raw.daily.progress[k], 0);
    if (Array.isArray(raw.daily.claimed)) s.daily.claimed = raw.daily.claimed.filter(k => k in s.daily.progress);
  }
  if (isObj(raw.settings)) {
    for (const k of ['flash', 'sound', 'auto']) if (typeof raw.settings[k] === 'boolean') s.settings[k] = raw.settings[k];
    if (raw.settings.speed === 1 || raw.settings.speed === 2) s.settings.speed = raw.settings.speed;
  }
  if (isObj(raw.tips)) for (const [k, v] of Object.entries(raw.tips)) if (v === true) s.tips[k] = true;
  return s;
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const txt = storage?.getItem(SAVE_KEY);
    return txt ? normalize(JSON.parse(txt)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* 저장소를 못 쓰는 브라우저: 이번 판만 유지 */ }
}

export function exportCode(save, test = TEST) {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return codePrefix(test) + btoa(bin);
}

export function importCode(code, test = TEST) {
  const c = String(code || '').replace(/\s+/g, '');
  const prefix = codePrefix(test);
  if (!c.startsWith(prefix)) return null;
  try {
    const bin = atob(c.slice(prefix.length));
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0))));
    if (!isObj(raw) || raw.version !== VERSION) return null;
    return normalize(raw);
  } catch {
    return null;
  }
}
