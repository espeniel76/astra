// 영웅·몬스터 초상화 캔버스. DOM 화면과 Phaser 텍스처가 같이 쓴다.
import { drawPerson, hex } from './blob.js';
import { HERO } from '../data/heroes.js';
import { drawMonster } from './monsters.js';

export function heroLook(id, aim = -0.25) {
  const h = HERO[id];
  const L = h.look;
  return {
    hero: h.hero ? id : null, outfit: h.hero,
    shirt: hex(L.shirt), pants: '#3a3f4a', skin: '#f2c79a', hair: '#4a3020',
    hat: L.hat, hatStyle: L.hatStyle || 'cap', gun: L.gun, glow: L.glow,
    sparkle: h.star >= 6, aim,
  };
}

// (x, y) = 발밑, s = 배율(1이면 몸 지름 약 42px)
export function drawHero(ctx, x, y, s, id, opts = {}) {
  drawPerson(ctx, x, y, s, { ...heroLook(id, opts.aim ?? -0.25), ...opts });
}

// 화면(DOM) 초상화는 기기 화면 밀도(devicePixelRatio)만큼 촘촘하게 그려서 선명하게 한다.
// 그림 좌표는 그대로 px 기준이고, 캔버스 실제 크기만 px × res.
export const SCREEN_RES = Math.min(3, Math.max(1, Math.ceil(globalThis.devicePixelRatio || 1)));

const cache = new Map();
function cached(key, px, res, draw) {
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = Math.round(px * res);
    const ctx = c.getContext('2d');
    ctx.scale(res, res);
    draw(ctx);
    cache.set(key, c);
  }
  return c;
}
function copy(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

function heroSrc(id, px, silhouette, res) {
  return cached(`h:${id}:${px}:${silhouette}:${res}`, px, res, ctx => {
    drawHero(ctx, px / 2, px * 0.86, px / 100, id);
    if (silhouette) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#1a1e2c';
      ctx.fillRect(0, 0, px, px);
    }
  });
}
// 큰 보스가 그림 칸(100 기준, 발밑 86) 밖으로 잘리지 않게: 한 번 그려 보고 넘치면 그만큼 줄인다
const fitCache = new Map();
function monFit(id) {
  if (fitCache.has(id)) return fitCache.get(id);
  const N = 400, fx = 200, fy = 300;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  drawMonster(ctx, fx, fy, 1, id);
  const d = ctx.getImageData(0, 0, N, N).data;
  let left = N, right = 0, top = N;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (d[(y * N + x) * 4 + 3] < 90) continue; // 은은한 빛은 빼고 몸만
    if (x < left) left = x; if (x > right) right = x; if (y < top) top = y;
  }
  const half = Math.max(fx - left, right - fx, 1), up = Math.max(fy - top, 1);
  const k = Math.min(1, 48 / half, 83 / up);
  fitCache.set(id, k);
  return k;
}
const monSrc = (id, px, res) => cached(`m:${id}:${px}:${res}`, px, res, ctx => drawMonster(ctx, px / 2, px * 0.86, (px / 100) * monFit(id), id));

// 정사각형 초상화(복사본). 발은 아래쪽 86%. 캔버스 크기는 px × 화면 밀도(CSS로 크기를 정해 쓴다).
export const heroCanvas = (id, px = 120, { silhouette = false } = {}) => copy(heroSrc(id, px, silhouette, SCREEN_RES));
export const monsterCanvas = (id, px = 120) => copy(monSrc(id, px, SCREEN_RES));
// Phaser 텍스처용 원본(정확히 px 크기)
export const heroSource = (id, px) => heroSrc(id, px, false, 1);
export const monsterSource = (id, px) => monSrc(id, px, 1);
