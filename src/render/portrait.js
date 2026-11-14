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

const cache = new Map();
function cached(key, px, draw) {
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = px;
    draw(c.getContext('2d'));
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

const heroKey = (id, px, sil) => `h:${id}:${px}:${sil}`;
function heroSrc(id, px, silhouette) {
  return cached(heroKey(id, px, silhouette), px, ctx => {
    drawHero(ctx, px / 2, px * 0.86, px / 100, id);
    if (silhouette) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#1a1e2c';
      ctx.fillRect(0, 0, px, px);
    }
  });
}
const monSrc = (id, px) => cached(`m:${id}:${px}`, px, ctx => drawMonster(ctx, px / 2, px * 0.86, px / 100, id));

// 정사각형 초상화(복사본). 발은 아래쪽 86%.
export const heroCanvas = (id, px = 120, { silhouette = false } = {}) => copy(heroSrc(id, px, silhouette));
export const monsterCanvas = (id, px = 120) => copy(monSrc(id, px));
// Phaser 텍스처용 원본
export const heroSource = (id, px) => heroSrc(id, px, false);
export const monsterSource = (id, px) => monSrc(id, px);
