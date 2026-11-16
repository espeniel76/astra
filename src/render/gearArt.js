// 장비 그림(무기·갑옷·장신구 × 일반~전설). 100×100 칸에 그린다.
// 등급이 오를수록 재료가 바뀐다: 일반 쇠·가죽 → 고급 강철 → 희귀 푸른 강철+보석 → 영웅 보랏빛 수정 → 전설 황금+불꽃 빛.
// 바탕 칸은 등급 색. 영웅·전설은 은은한 빛(가만히 있음, 번쩍임 없음).
import { GRADES } from '../data/gear.js';
import { SCREEN_RES } from './portrait.js';

const OUT = '#1c1424';
const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
const rg = (ctx, x, y, r, stops) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
function fillOut(ctx, fill, lw = 2.4, out = OUT) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = out; ctx.lineJoin = 'round'; ctx.stroke(); }
function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); }
function gem(ctx, x, y, r, c, light = '#ffffff') {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); fillOut(ctx, rg(ctx, x - r * 0.3, y - r * 0.3, r * 1.4, [[0, light], [0.35, c], [1, shade(c)]]), 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fill();
}
const shade = c => { const n = parseInt(c.slice(1), 16); const f = v => Math.max(0, Math.round(v * 0.55)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

// 등급별 재료 색: [밝은, 가운데, 어두운], 보석, 장식
const MAT = [
  null,
  { metal: ['#e8ecf0', '#a8b0b8', '#5a626a'], leather: ['#b8885a', '#8a5a32', '#5a3a1e'], gem: null, trim: '#8a6a4a' },
  { metal: ['#f0fff4', '#9fd0b0', '#3f7a5a'], leather: ['#9a7a5a', '#6a5038', '#3a2a1e'], gem: '#55d468', trim: '#c9d3de' },
  { metal: ['#f0f8ff', '#8ab8f0', '#2a5a9a'], leather: ['#5a6a8a', '#3a4a6a', '#1e2a42'], gem: '#5a9dff', trim: '#e8ecf0' },
  { metal: ['#fff0ff', '#c89af0', '#5a2a8a'], leather: ['#5a3a6a', '#3a2248', '#1e1028'], gem: '#d08aff', trim: '#ffd84a' },
  { metal: ['#fffbe0', '#ffd23a', '#a8660a'], leather: ['#8a2a1a', '#5a1a10', '#2e0e08'], gem: '#ff7a2a', trim: '#fff3c0' },
];

function sword(ctx, g) {
  const m = MAT[g];
  ctx.save(); ctx.translate(50, 50); ctx.rotate(-Math.PI / 4);
  // 전설: 칼날 둘레 불꽃 빛
  if (g === 5) { ctx.fillStyle = rg(ctx, 0, -14, 40, [[0, 'rgba(255,190,60,0.7)'], [1, 'rgba(255,140,30,0)']]); ctx.fillRect(-40, -56, 80, 80); }
  if (g === 4) { ctx.fillStyle = rg(ctx, 0, -14, 34, [[0, 'rgba(208,138,255,0.55)'], [1, 'rgba(208,138,255,0)']]); ctx.fillRect(-36, -50, 72, 72); }
  // 칼날(등급이 오를수록 넓고 화려하게)
  const w = 6 + g * 0.8, len = 40 + g * 1.5;
  poly(ctx, g >= 4
    ? [[-w, 8], [-w - 2, -len * 0.4], [-w * 0.6, -len * 0.75], [0, -len], [w * 0.6, -len * 0.75], [w + 2, -len * 0.4], [w, 8]]
    : [[-w, 8], [-w, -len + 10], [0, -len], [w, -len + 10], [w, 8]]);
  fillOut(ctx, lg(ctx, -w, 0, w, 0, [[0, m.metal[0]], [0.48, m.metal[1]], [0.52, m.metal[2]], [1, m.metal[1]]]));
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-w * 0.45, 4); ctx.lineTo(-w * 0.45, -len + 14); ctx.stroke();
  if (g >= 3) { ctx.strokeStyle = shade(m.metal[1]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -len + 12); ctx.stroke(); }
  // 가드
  if (g === 5) { // 황금 날개 가드
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(sx * 22, 14, sx * 26, -2); ctx.quadraticCurveTo(sx * 16, 6, sx * 4, 6); ctx.closePath(); fillOut(ctx, lg(ctx, 0, 0, sx * 26, 0, [[0, m.metal[0]], [1, m.metal[1]]]), 2); }
  } else {
    const gw = 13 + g * 2;
    ctx.beginPath(); ctx.roundRect(-gw, 6, gw * 2, 7, 3.5); fillOut(ctx, lg(ctx, 0, 6, 0, 13, [[0, m.trim], [1, shade(m.trim)]]), 2);
  }
  if (m.gem) gem(ctx, 0, 10, 4 + (g >= 4 ? 1 : 0), m.gem);
  // 손잡이 + 폼멜
  ctx.beginPath(); ctx.roundRect(-3.5, 13, 7, 18, 3); fillOut(ctx, m.leather[1], 2);
  ctx.strokeStyle = m.leather[0]; ctx.lineWidth = 1.4; for (let y = 16; y < 30; y += 4) { ctx.beginPath(); ctx.moveTo(-3.5, y); ctx.lineTo(3.5, y + 2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 34, 5, 0, Math.PI * 2); fillOut(ctx, lg(ctx, -5, 29, 5, 39, [[0, m.trim], [1, shade(m.trim)]]), 2);
  ctx.restore();
}

function armor(ctx, g) {
  const m = MAT[g];
  ctx.save(); ctx.translate(50, 52);
  if (g >= 4) { ctx.fillStyle = rg(ctx, 0, 0, 44, [[0, g === 5 ? 'rgba(255,200,80,0.6)' : 'rgba(208,138,255,0.5)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-46, -46, 92, 92); }
  if (g === 5) { // 등 뒤 황금 날개
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(sx * (26 + k * 3), -14 + k * 7, 13 - k, 5, sx * (0.5 - k * 0.15), 0, Math.PI * 2); fillOut(ctx, k % 2 ? m.metal[0] : m.metal[1], 1.4); }
    }
  }
  const body = g === 1 ? m.leather : m.metal;
  // 몸판
  ctx.beginPath();
  ctx.moveTo(-22, -26); ctx.quadraticCurveTo(-10, -20, -8, -28); ctx.lineTo(8, -28); ctx.quadraticCurveTo(10, -20, 22, -26);
  ctx.lineTo(26, -10); ctx.lineTo(20, -6); ctx.quadraticCurveTo(22, 14, 16, 28); ctx.quadraticCurveTo(0, 34, -16, 28); ctx.quadraticCurveTo(-22, 14, -20, -6); ctx.lineTo(-26, -10); ctx.closePath();
  fillOut(ctx, lg(ctx, -24, -28, 24, 30, [[0, body[0]], [0.5, body[1]], [1, body[2]]]));
  // 가슴 가운데 선과 판 이음새
  ctx.strokeStyle = shade(body[1]); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 30); ctx.stroke();
  for (const y of [4, 15]) { ctx.beginPath(); ctx.moveTo(-18, y); ctx.quadraticCurveTo(0, y + 5, 18, y); ctx.stroke(); }
  // 어깨받이
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 22, -20, 9, 7, sx * 0.4, 0, Math.PI * 2); fillOut(ctx, lg(ctx, 0, -27, 0, -13, [[0, (g === 1 ? m.leather : m.metal)[0]], [1, (g === 1 ? m.leather : m.metal)[2]]]), 2); }
  // 장식: 리벳(고급), 테두리(희귀↑), 가슴 보석(희귀↑)
  if (g >= 2) { ctx.fillStyle = m.trim; for (const [x, y] of [[-14, -18], [14, -18], [-15, 22], [15, 22]]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill(); } }
  if (g >= 3) { ctx.strokeStyle = m.trim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -27); ctx.lineTo(-6, -18); ctx.lineTo(6, -18); ctx.lineTo(8, -27); ctx.stroke(); }
  if (m.gem) gem(ctx, 0, -6, g >= 4 ? 6 : 5, m.gem);
  ctx.restore();
}

function accessory(ctx, g) {
  const m = MAT[g];
  ctx.save(); ctx.translate(50, 50);
  if (g >= 4) { ctx.fillStyle = rg(ctx, 0, 6, 40, [[0, g === 5 ? 'rgba(255,190,70,0.65)' : 'rgba(208,138,255,0.5)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-44, -40, 88, 88); }
  if (g <= 3) {
    // 반지: 굵은 고리 + 위에 보석(일반은 보석 대신 무늬)
    const ring = g === 1 ? ['#e8c08a', '#b8803a', '#6a4012'] : g === 2 ? ['#ffffff', '#c9d3de', '#6a727a'] : ['#fff6c8', '#e8b923', '#8a6410'];
    ctx.beginPath(); ctx.ellipse(0, 10, 24, 22, 0, 0, Math.PI * 2); ctx.ellipse(0, 10, 15, 13, 0, 0, Math.PI * 2, true);
    fillOut(ctx, lg(ctx, -24, -12, 24, 32, [[0, ring[0]], [0.5, ring[1]], [1, ring[2]]]));
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 10, 20, 18, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    // 보석 받침
    poly(ctx, [[-10, -10], [10, -10], [6, -2], [-6, -2]]); fillOut(ctx, ring[1], 2);
    if (m.gem) {
      poly(ctx, [[-9, -12], [0, -24], [9, -12], [0, -4]]);
      fillOut(ctx, lg(ctx, -9, -24, 9, -4, [[0, '#ffffff'], [0.4, m.gem], [1, shade(m.gem)]]), 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(0, -21); ctx.lineTo(1, -15); ctx.closePath(); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); fillOut(ctx, ring[0], 2); }
  } else {
    // 목걸이: 사슬 + 큰 펜던트(영웅 = 보랏빛 수정, 전설 = 불타는 별)
    ctx.strokeStyle = m.trim; ctx.lineWidth = 2.4;
    for (let k = 0; k < 9; k++) { const a = Math.PI * (1.15 + k * 0.0875); ctx.beginPath(); ctx.ellipse(Math.cos(a) * 30, -6 + Math.sin(a) * 26, 3.2, 2.2, a, 0, Math.PI * 2); ctx.stroke(); }
    if (g === 4) {
      poly(ctx, [[0, -10], [14, 6], [0, 34], [-14, 6]]);
      fillOut(ctx, lg(ctx, -14, -10, 14, 34, [[0, '#ffffff'], [0.35, m.gem], [1, shade(m.gem)]]));
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 34); ctx.moveTo(-14, 6); ctx.lineTo(14, 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); fillOut(ctx, m.trim, 1.6);
    } else {
      const pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 8 : 19; pts.push([Math.cos(a) * r, 12 + Math.sin(a) * r]); }
      poly(ctx, pts); fillOut(ctx, lg(ctx, -19, -7, 19, 31, [[0, '#fffbe0'], [0.5, '#ffd23a'], [1, '#c8761a']]), 2.4, '#5a2a00');
      gem(ctx, 0, 12, 6, m.gem, '#fff3c0');
    }
  }
  ctx.restore();
}

const DRAW = { weapon: sword, armor, acc: accessory };

// 칸 하나: 등급 색 바탕 + 장비 그림. box = 바탕을 칠할지
export function drawGear(ctx, slot, grade, { box = true } = {}) {
  const c = GRADES[grade].color;
  if (box) {
    ctx.beginPath(); ctx.roundRect(3, 3, 94, 94, 16);
    ctx.fillStyle = lg(ctx, 0, 0, 0, 100, [[0, c], [1, '#141830']]); ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = rg(ctx, 50, 44, 50, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = c; ctx.stroke();
  }
  DRAW[slot](ctx, grade);
}

const cache = new Map();
function source(slot, grade, px, res) {
  const key = `${slot}-${grade}-${px}-${res}`;
  if (!cache.has(key)) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = Math.round(px * res);
    const ctx = cv.getContext('2d');
    ctx.scale((px * res) / 100, (px * res) / 100);
    drawGear(ctx, slot, grade);
    cache.set(key, cv);
  }
  return cache.get(key);
}
// DOM용(복사본, CSS로 크기 지정) / Phaser 텍스처용 원본
export function gearCanvas(slot, grade, px = 72) {
  const src = source(slot, grade, px, SCREEN_RES);
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  c.style.width = c.style.height = `${px}px`;
  return c;
}
export const gearSource = (slot, grade, px) => source(slot, grade, px, 1);
