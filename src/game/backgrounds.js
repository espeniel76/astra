// 전투 맵 배경. Canvas 2D로 챕터마다 한 번 그려 Phaser 텍스처로 쓴다(720×1060).
// 움직이는 것(구름·반딧불·먼지)은 addAmbient 가 따로 스프라이트로 띄운다. 깜빡임 없이 천천히.
import { makeRng } from '../core/rng.js';

export const BG_W = 720, BG_H = 1060;
const HORIZON = 360; // 땅이 시작하는 높이(적은 y=470에 선다)

function grad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}
function radial(ctx, x, y, r, c0, c1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
}
// 부드러운 능선: 점들을 지나는 곡선 아래를 채운다
function ridge(ctx, pts, bottom, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], bottom);
  ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.lineTo(last[0], bottom);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}
const wave = (rng, x0, x1, step, y, amp) => {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) pts.push([x, y + (rng() - 0.5) * amp * 2]);
  return pts;
};
function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

// ── 소품 ──
function roundTree(ctx, x, y, s, leaf, dark) {
  ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 5 * s, y - 34 * s, 10 * s, 36 * s);
  for (const [dx, dy, r, c] of [[0, -62, 30, dark], [-20, -48, 22, dark], [20, -50, 22, dark], [-6, -68, 24, leaf], [14, -58, 18, leaf], [-18, -54, 16, leaf]]) {
    ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.92, c);
  }
  ellipse(ctx, x - 10 * s, y - 76 * s, 9 * s, 6 * s, 'rgba(255,255,255,0.18)');
}
function pine(ctx, x, y, s, c) {
  ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x - 4 * s, y - 20 * s, 8 * s, 22 * s);
  ctx.fillStyle = c;
  for (let i = 0; i < 3; i++) {
    const w = (34 - i * 8) * s, top = y - (40 + i * 26) * s;
    ctx.beginPath(); ctx.moveTo(x, top - 26 * s); ctx.lineTo(x - w, top + 24 * s); ctx.lineTo(x + w, top + 24 * s); ctx.closePath(); ctx.fill();
  }
}
function tuft(ctx, x, y, s, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round';
  for (const a of [-0.5, -0.2, 0.1, 0.4]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + a * 10 * s, y - 8 * s, x + a * 16 * s, y - 15 * s); ctx.stroke(); }
}
function flower(ctx, x, y, c) {
  ctx.strokeStyle = '#3f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 9); ctx.stroke();
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; ellipse(ctx, x + Math.cos(a) * 3.6, y - 11 + Math.sin(a) * 3.6, 3, 3, c); }
  ellipse(ctx, x, y - 11, 2.2, 2.2, '#ffd84a');
}
function rock(ctx, x, y, s, c) {
  ctx.beginPath(); ctx.moveTo(x - 18 * s, y); ctx.quadraticCurveTo(x - 20 * s, y - 16 * s, x - 4 * s, y - 20 * s);
  ctx.quadraticCurveTo(x + 16 * s, y - 20 * s, x + 20 * s, y); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  ellipse(ctx, x - 5 * s, y - 13 * s, 6 * s, 3 * s, 'rgba(255,255,255,0.18)');
}
function mushroom(ctx, x, y, s) {
  ctx.fillStyle = '#f0e4c8'; ctx.fillRect(x - 3 * s, y - 12 * s, 6 * s, 12 * s);
  ctx.beginPath(); ctx.ellipse(x, y - 12 * s, 11 * s, 8 * s, 0, Math.PI, 0); ctx.fillStyle = '#d84a4a'; ctx.fill();
  ellipse(ctx, x - 4 * s, y - 16 * s, 2 * s, 2 * s, '#fff'); ellipse(ctx, x + 4 * s, y - 14 * s, 1.6 * s, 1.6 * s, '#fff');
}
function crystal(ctx, x, y, s, c) {
  ctx.fillStyle = radial(ctx, x, y - 20 * s, 60 * s, c.replace('1)', '0.35)'), c.replace('1)', '0)'));
  ctx.fillRect(x - 60 * s, y - 80 * s, 120 * s, 120 * s);
  for (const [dx, h, w] of [[-10, 44, 9], [4, 62, 11], [16, 36, 8]]) {
    ctx.beginPath(); ctx.moveTo(x + dx * s - w * s, y); ctx.lineTo(x + dx * s, y - h * s); ctx.lineTo(x + dx * s + w * s, y); ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + dx * s - w * s * 0.3, y - 4 * s); ctx.lineTo(x + dx * s, y - h * s + 6 * s); ctx.lineTo(x + dx * s, y - 4 * s); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
  }
}

// ── 챕터별 배경 ──
function meadow(ctx, rng) {
  ctx.fillStyle = grad(ctx, 0, HORIZON, [[0, '#6cc4f5'], [0.7, '#bfe8fb'], [1, '#e8f8ff']]);
  ctx.fillRect(0, 0, BG_W, HORIZON + 40);
  ctx.fillStyle = radial(ctx, 590, 130, 160, 'rgba(255,248,200,0.9)', 'rgba(255,248,200,0)'); ctx.fillRect(400, 0, 320, 320);
  ellipse(ctx, 590, 130, 42, 42, '#fff6c8');
  // 먼 산(눈 덮인 봉우리)
  ridge(ctx, [[0, 300], [90, 230], [180, 285], [290, 205], [400, 280], [520, 225], [640, 290], [720, 250]], HORIZON + 20, '#9bb6d8');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const [x, y] of [[90, 230], [290, 205], [520, 225]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 22); ctx.lineTo(x + 22, y + 22); ctx.closePath(); ctx.fill(); }
  ridge(ctx, wave(rng, 0, 720, 120, 315, 18), HORIZON + 40, '#84c46a');
  for (let i = 0; i < 7; i++) roundTree(ctx, 30 + i * 110 + rng() * 40, 335 + rng() * 10, 0.55, '#5fae4a', '#3f8a3a');
  ridge(ctx, wave(rng, 0, 720, 90, HORIZON, 12), BG_H, '#7fcf5f');
  // 땅: 아래로 갈수록 진하게
  ctx.fillStyle = grad(ctx, HORIZON, BG_H, [[0, '#8fd86a'], [0.5, '#6cbf4e'], [1, '#4f9e3a']]);
  ctx.fillRect(0, HORIZON + 10, BG_W, BG_H);
  // 흙길: 아래 가운데에서 언덕 쪽으로
  ctx.beginPath();
  ctx.moveTo(250, BG_H); ctx.bezierCurveTo(300, 820, 420, 640, 380, HORIZON + 20);
  ctx.lineTo(410, HORIZON + 20); ctx.bezierCurveTo(470, 640, 420, 820, 500, BG_H); ctx.closePath();
  ctx.fillStyle = '#d9b77a'; ctx.fill();
  ctx.strokeStyle = 'rgba(140,100,50,0.35)'; ctx.lineWidth = 4; ctx.stroke();
  // 싸우는 자리: 살짝 밝은 풀밭
  ellipse(ctx, 360, 478, 330, 62, 'rgba(255,255,255,0.10)');
  ellipse(ctx, 360, 890, 340, 70, 'rgba(255,255,255,0.10)');
  // 울타리
  ctx.fillStyle = '#a0784a';
  for (const side of [0, 1]) {
    const x0 = side ? 600 : 10;
    for (let i = 0; i < 4; i++) ctx.fillRect(x0 + i * 30, 560 + i * 4, 7, 44);
    ctx.fillRect(x0 - 4, 572, 120, 6); ctx.fillRect(x0 - 4, 590, 120, 6);
  }
  // 덤불·바위·꽃·풀
  for (const [x, y, s] of [[40, 700, 1.1], [690, 720, 1], [20, 1010, 1.3], [700, 1000, 1.2]]) {
    for (const [dx, dy, r] of [[0, 0, 26], [-22, 6, 18], [22, 6, 18]]) ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.8, '#3f8a3a');
    ellipse(ctx, x - 6 * s, y - 8 * s, 10 * s, 6 * s, 'rgba(255,255,255,0.15)');
  }
  for (const [x, y, s] of [[110, 640, 1], [640, 960, 1.3], [560, 420, 0.7]]) rock(ctx, x, y, s, '#a7a39a');
  const fc = ['#ffffff', '#ff9ad0', '#ffe066', '#b9a6ff'];
  for (let i = 0; i < 60; i++) {
    const x = rng() * BG_W, y = HORIZON + 30 + rng() * (BG_H - HORIZON - 30);
    if (Math.abs(x - 360) < 60 && y > 500) continue;
    if (i % 3 === 0) flower(ctx, x, y, fc[i % 4]); else tuft(ctx, x, y, 0.8 + rng() * 0.6, '#3f8a3a');
  }
}

function forest(ctx, rng) {
  ctx.fillStyle = grad(ctx, 0, BG_H, [[0, '#1d3b2c'], [0.35, '#2e5a3a'], [0.36, '#2a4e2e'], [1, '#1f3a22']]);
  ctx.fillRect(0, 0, BG_W, BG_H);
  // 나무 실루엣 3겹(멀수록 흐리게)
  const layers = [['#3e6e4e', 0.55, 290], ['#2f5a3c', 0.8, 330], ['#22452c', 1.05, 370]];
  for (const [c, s, y] of layers) for (let i = 0; i < 9; i++) pine(ctx, i * 90 + rng() * 40 - 10, y + rng() * 20, s, c);
  // 빛줄기(가만히 있음)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const x of [140, 330, 560]) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 230, BG_H * 0.75); ctx.lineTo(x + 120, BG_H * 0.75); ctx.closePath();
    ctx.fillStyle = grad(ctx, 0, BG_H * 0.75, [[0, 'rgba(255,240,180,0.16)'], [1, 'rgba(255,240,180,0)']]); ctx.fill();
  }
  ctx.restore();
  // 땅
  ctx.fillStyle = grad(ctx, HORIZON, BG_H, [[0, '#3f6a32'], [1, '#2a4a22']]);
  ridge(ctx, wave(rng, 0, 720, 80, HORIZON + 20, 10), BG_H, ctx.fillStyle);
  ellipse(ctx, 360, 478, 330, 60, 'rgba(160,220,120,0.12)');
  ellipse(ctx, 360, 890, 340, 70, 'rgba(160,220,120,0.12)');
  // 이끼 낀 통나무
  for (const [x, y, w] of [[90, 640, 150], [560, 1000, 170]]) {
    ctx.fillStyle = '#5a3e26'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 18, w, 30, 15); ctx.fill();
    ellipse(ctx, x + w / 2 - 6, y - 3, 10, 14, '#c9a46a'); ellipse(ctx, x + w / 2 - 6, y - 3, 5, 7, '#8a6436');
    ellipse(ctx, x - 20, y - 18, 40, 8, '#5f9a3a');
  }
  for (const [x, y, s] of [[640, 620, 1.2], [60, 900, 1], [170, 1030, 1.3], [520, 700, 0.8]]) mushroom(ctx, x, y, s);
  // 고사리
  for (let i = 0; i < 26; i++) {
    const x = rng() * BG_W, y = HORIZON + 50 + rng() * (BG_H - HORIZON - 50);
    if (Math.abs(x - 360) < 80) continue;
    tuft(ctx, x, y, 1 + rng(), '#4f8a3a');
  }
}

function cave(ctx, rng) {
  ctx.fillStyle = grad(ctx, 0, BG_H, [[0, '#120e1c'], [0.4, '#2a2238'], [1, '#1e1828']]);
  ctx.fillRect(0, 0, BG_W, BG_H);
  // 바위벽 겹
  ridge(ctx, wave(rng, 0, 720, 70, 250, 40), BG_H, '#2e2640');
  ridge(ctx, wave(rng, 0, 720, 60, 320, 30), BG_H, '#3a3150');
  // 종유석
  ctx.fillStyle = '#4a4060';
  for (let i = 0; i < 16; i++) {
    const x = i * 48 + rng() * 20, h = 40 + rng() * 90, w = 12 + rng() * 14;
    ctx.beginPath(); ctx.moveTo(x - w, 0); ctx.lineTo(x, h); ctx.lineTo(x + w, 0); ctx.closePath(); ctx.fill();
  }
  // 바닥
  ctx.fillStyle = grad(ctx, HORIZON, BG_H, [[0, '#4a4258'], [1, '#2e2838']]);
  ridge(ctx, wave(rng, 0, 720, 90, HORIZON + 10, 14), BG_H, ctx.fillStyle);
  ellipse(ctx, 360, 478, 330, 60, 'rgba(180,160,255,0.08)');
  ellipse(ctx, 360, 890, 340, 70, 'rgba(180,160,255,0.08)');
  // 석순과 돌
  for (const [x, y] of [[60, 600], [680, 650], [40, 980], [690, 1020]]) {
    ctx.fillStyle = '#5a5070'; ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x, y - 70); ctx.lineTo(x + 18, y); ctx.closePath(); ctx.fill();
  }
  for (const [x, y, s] of [[150, 700, 1.1], [600, 560, 0.9], [520, 1010, 1.3]]) rock(ctx, x, y, s, '#635a78');
  // 은은히 빛나는 수정(가만히 있음)
  crystal(ctx, 90, 470, 1, 'rgba(110,220,255,1)');
  crystal(ctx, 640, 520, 1.2, 'rgba(190,130,255,1)');
  crystal(ctx, 620, 960, 0.9, 'rgba(110,220,255,1)');
  crystal(ctx, 110, 860, 0.8, 'rgba(190,130,255,1)');
  // 물웅덩이
  ellipse(ctx, 250, 1010, 90, 18, 'rgba(120,160,255,0.25)');
  ellipse(ctx, 230, 1006, 40, 5, 'rgba(255,255,255,0.18)');
}

// ── 4~15챕터 ──
// 공통 뼈대: 하늘 → 먼 풍경(far) → 땅 → 싸우는 자리 밝게 → 가까운 소품(near)
function scene(ctx, rng, o) {
  ctx.fillStyle = grad(ctx, 0, HORIZON + 40, o.sky); ctx.fillRect(0, 0, BG_W, HORIZON + 40);
  o.far?.(ctx, rng);
  ctx.fillStyle = grad(ctx, HORIZON, BG_H, o.ground);
  ridge(ctx, wave(rng, 0, 720, 90, HORIZON + 10, o.bump ?? 12), BG_H, ctx.fillStyle);
  o.floor?.(ctx, rng);
  ellipse(ctx, 360, 478, 330, 60, o.spot);
  ellipse(ctx, 360, 890, 340, 70, o.spot);
  o.near?.(ctx, rng);
}
const sides = (rng, n, fn) => {
  for (let i = 0; i < n; i++) {
    const x = i % 2 ? 610 + rng() * 100 : 10 + rng() * 100, y = HORIZON + 160 + (i / n) * (BG_H - HORIZON - 160) + rng() * 40;
    fn(x, y, i);
  }
};
function sun(ctx, x, y, r, c) {
  ctx.fillStyle = radial(ctx, x, y, r * 4, c.replace('1)', '0.55)'), c.replace('1)', '0)'));
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  ellipse(ctx, x, y, r, r, c);
}
function starsky(ctx, rng, n, y1) {
  for (let i = 0; i < n; i++) ellipse(ctx, rng() * BG_W, rng() * y1, 0.6 + rng() * 1.4, 0.6 + rng() * 1.4, `rgba(255,255,255,${0.3 + rng() * 0.6})`);
}
function cactus(ctx, x, y, s) {
  ctx.fillStyle = '#4f8a3a';
  ctx.beginPath(); ctx.roundRect(x - 9 * s, y - 70 * s, 18 * s, 70 * s, 9 * s); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x - 30 * s, y - 50 * s, 12 * s, 28 * s, 6 * s); ctx.fill();
  ctx.fillRect(x - 30 * s, y - 28 * s, 24 * s, 9 * s);
  ctx.beginPath(); ctx.roundRect(x + 18 * s, y - 60 * s, 12 * s, 30 * s, 6 * s); ctx.fill();
  ctx.fillRect(x + 6 * s, y - 36 * s, 24 * s, 9 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x - 5 * s, y - 64 * s, 3 * s, 58 * s);
}
function deadTree(ctx, x, y, s, c) {
  ctx.strokeStyle = c; ctx.lineCap = 'round';
  const br = (x0, y0, a, len, w, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (d > 0) { br(x1, y1, a - 0.5, len * 0.7, w * 0.65, d - 1); br(x1, y1, a + 0.45, len * 0.65, w * 0.65, d - 1); }
  };
  br(x, y, -Math.PI / 2, 60 * s, 12 * s, 3);
}
function column(ctx, x, y, s, h, c, broken) {
  ctx.fillStyle = c; ctx.fillRect(x - 14 * s, y - h * s, 28 * s, h * s);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let k = -8; k <= 8; k += 8) ctx.fillRect(x + k * s - 1.5 * s, y - h * s, 3 * s, h * s);
  ctx.fillStyle = c; ctx.fillRect(x - 20 * s, y - 8 * s, 40 * s, 8 * s);
  if (broken) {
    ctx.beginPath(); ctx.moveTo(x - 14 * s, y - h * s); ctx.lineTo(x - 4 * s, y - (h + 12) * s); ctx.lineTo(x + 6 * s, y - (h + 4) * s); ctx.lineTo(x + 14 * s, y - (h + 14) * s); ctx.lineTo(x + 14 * s, y - h * s); ctx.fill();
  } else ctx.fillRect(x - 20 * s, y - (h + 8) * s, 40 * s, 8 * s);
}
function tomb(ctx, x, y, s, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 16 * s, y); ctx.lineTo(x - 16 * s, y - 30 * s);
  ctx.arc(x, y - 30 * s, 16 * s, Math.PI, 0); ctx.lineTo(x + 16 * s, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 8 * s, y - 32 * s, 16 * s, 3 * s); ctx.fillRect(x - 8 * s, y - 24 * s, 16 * s, 3 * s);
  ellipse(ctx, x, y, 22 * s, 5 * s, 'rgba(0,0,0,0.25)');
}
function cloudPuff(ctx, x, y, s, c) {
  for (const [dx, dy, r] of [[0, 0, 34], [-34, 8, 24], [34, 8, 26], [-14, -16, 24], [18, -14, 22]]) ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.8, c);
}
function palm(ctx, x, y, s) {
  ctx.strokeStyle = '#8a6438'; ctx.lineWidth = 10 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10 * s, y - 60 * s, x + 30 * s, y - 120 * s); ctx.stroke();
  const tx = x + 30 * s, ty = y - 120 * s;
  ctx.fillStyle = '#3f9a4a';
  for (const a of [-2.8, -2.2, -1.5, -0.9, -0.3, 0.3]) {
    ctx.beginPath(); ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a - 0.3) * 50 * s, ty + Math.sin(a - 0.3) * 50 * s - 10 * s, tx + Math.cos(a) * 70 * s, ty + Math.sin(a) * 40 * s + 24 * s);
    ctx.quadraticCurveTo(tx + Math.cos(a + 0.2) * 40 * s, ty + Math.sin(a + 0.2) * 30 * s, tx, ty); ctx.fill();
  }
  ellipse(ctx, tx - 4 * s, ty + 6 * s, 6 * s, 6 * s, '#6a4a2a'); ellipse(ctx, tx + 6 * s, ty + 8 * s, 6 * s, 6 * s, '#6a4a2a');
}

function desert(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#5fb4ec'], [0.7, '#bfe4f4'], [1, '#fbe8c0']],
    ground: [[0, '#f2d394'], [0.5, '#e6bd72'], [1, '#c99a52']],
    spot: 'rgba(255,255,255,0.12)',
    far: ctx => {
      sun(ctx, 560, 110, 40, 'rgba(255,246,200,1)');
      ctx.fillStyle = '#d8b680';
      for (const [x, w] of [[160, 120], [290, 80]]) { ctx.beginPath(); ctx.moveTo(x - w, 330); ctx.lineTo(x, 330 - w * 0.9); ctx.lineTo(x + w, 330); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (const [x, w] of [[160, 120], [290, 80]]) { ctx.beginPath(); ctx.moveTo(x, 330 - w * 0.9); ctx.lineTo(x + w, 330); ctx.lineTo(x, 330); ctx.closePath(); ctx.fill(); }
      ridge(ctx, wave(rng, 0, 720, 140, 330, 20), HORIZON + 40, '#e8c482');
    },
    floor: ctx => {
      ctx.strokeStyle = 'rgba(160,110,50,0.25)'; ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        const x = rng() * BG_W, y = HORIZON + 40 + rng() * (BG_H - HORIZON - 40);
        ctx.beginPath(); ctx.moveTo(x - 50, y); ctx.quadraticCurveTo(x, y - 10, x + 50, y); ctx.stroke();
      }
    },
    near: ctx => {
      cactus(ctx, 70, 650, 1.1); cactus(ctx, 660, 600, 0.9); cactus(ctx, 640, 1010, 1.3);
      for (const [x, y, s] of [[120, 1000, 1.2], [600, 720, 0.8], [40, 820, 0.9]]) rock(ctx, x, y, s, '#b88a58');
      // 동물 뼈
      ctx.fillStyle = '#f4ecdc';
      ellipse(ctx, 200, 1030, 16, 12, '#f4ecdc'); ctx.fillRect(214, 1026, 40, 6); ellipse(ctx, 258, 1029, 6, 6, '#f4ecdc');
    },
  });
}

function snow(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#8fb8e0'], [0.7, '#d4e6f4'], [1, '#f2f8fc']],
    ground: [[0, '#f6fafe'], [0.6, '#e2ecf6'], [1, '#c8d8ea']],
    spot: 'rgba(160,200,255,0.12)',
    far: ctx => {
      ridge(ctx, [[0, 280], [110, 170], [230, 260], [360, 150], [500, 250], [620, 180], [720, 260]], HORIZON + 40, '#a8bcd8');
      ctx.fillStyle = '#ffffff';
      for (const [x, y] of [[110, 170], [360, 150], [620, 180]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 36, y + 40); ctx.lineTo(x - 10, y + 32); ctx.lineTo(x + 6, y + 44); ctx.lineTo(x + 36, y + 40); ctx.closePath(); ctx.fill(); }
      ridge(ctx, wave(rng, 0, 720, 110, 320, 16), HORIZON + 40, '#dfe9f4');
      for (let i = 0; i < 9; i++) { const x = i * 85 + rng() * 30, y = 340 + rng() * 10; pine(ctx, x, y, 0.5, '#4a6a6a'); ellipse(ctx, x, y - 40, 10, 4, '#fff'); }
    },
    near: ctx => {
      for (const [x, y, s] of [[60, 640, 1], [670, 700, 1.1], [40, 1000, 1.3]]) {
        pine(ctx, x, y, s, '#3e5e5a');
        for (let i = 0; i < 3; i++) ellipse(ctx, x, y - (36 + i * 26) * s, (26 - i * 6) * s, 6 * s, '#ffffff');
      }
      // 얼음 바위
      for (const [x, y, s] of [[620, 990, 1.2], [140, 760, 0.8]]) crystal(ctx, x, y, s, 'rgba(160,220,255,1)');
      for (let i = 0; i < 20; i++) { const x = rng() * BG_W, y = HORIZON + 40 + rng() * 640; ellipse(ctx, x, y, 30 + rng() * 30, 6, 'rgba(255,255,255,0.6)'); }
    },
  });
}

function swamp(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#3a4a40'], [0.7, '#6a7a5e'], [1, '#8a9a70']],
    ground: [[0, '#5a6a3a'], [1, '#2e3a22']],
    spot: 'rgba(200,240,150,0.08)',
    far: ctx => {
      for (let i = 0; i < 7; i++) deadTree(ctx, 30 + i * 110 + rng() * 30, 360, 0.9 + rng() * 0.4, '#2e3a30');
      ctx.fillStyle = 'rgba(180,200,160,0.25)'; ctx.fillRect(0, 300, BG_W, 70);
    },
    floor: ctx => {
      for (const [x, y, rx, ry] of [[120, 640, 110, 26], [600, 760, 120, 28], [300, 1000, 150, 30]]) {
        ellipse(ctx, x, y, rx, ry, '#2a4038'); ellipse(ctx, x, y - 2, rx - 10, ry - 6, '#3a5a4a');
        ellipse(ctx, x - rx * 0.3, y - 6, rx * 0.3, 3, 'rgba(255,255,255,0.15)');
        for (let k = 0; k < 3; k++) {
          const lx = x + (rng() - 0.5) * rx * 1.4, ly = y + (rng() - 0.5) * ry;
          ctx.fillStyle = '#5a9a3a'; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, 10, 0.4, Math.PI * 2 - 0.1); ctx.closePath(); ctx.fill();
        }
      }
    },
    near: ctx => {
      // 갈대
      ctx.lineCap = 'round';
      sides(rng, 10, (x, y) => {
        for (let k = 0; k < 5; k++) {
          const dx = (k - 2) * 6, h = 50 + rng() * 40;
          ctx.strokeStyle = '#6a7a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.quadraticCurveTo(x + dx + 4, y - h / 2, x + dx + 8, y - h); ctx.stroke();
          if (k % 2) ellipse(ctx, x + dx + 8, y - h, 4, 10, '#6a4a2a');
        }
      });
      deadTree(ctx, 680, 1050, 1.6, '#3a3428');
    },
  });
}

function volcano(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#1e0c0c'], [0.6, '#5a1e12'], [1, '#a8441a']],
    ground: [[0, '#4a302a'], [1, '#1e1412']],
    spot: 'rgba(255,140,60,0.08)',
    far: ctx => {
      ctx.fillStyle = '#2a1612';
      ctx.beginPath(); ctx.moveTo(140, 380); ctx.lineTo(310, 150); ctx.lineTo(410, 150); ctx.lineTo(580, 380); ctx.closePath(); ctx.fill();
      ctx.fillStyle = radial(ctx, 360, 150, 140, 'rgba(255,150,60,0.6)', 'rgba(255,150,60,0)'); ctx.fillRect(220, 10, 280, 280);
      ellipse(ctx, 360, 152, 50, 8, '#ff8a2a');
      // 흘러내리는 용암 줄기(가만히)
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (const [x0, x1] of [[340, 290], [380, 430]]) { ctx.beginPath(); ctx.moveTo(x0, 156); ctx.quadraticCurveTo((x0 + x1) / 2 + 10, 250, x1, 360); ctx.stroke(); }
      ridge(ctx, wave(rng, 0, 720, 100, 340, 20), HORIZON + 40, '#3a2420');
    },
    floor: ctx => {
      // 땅 사이로 빛나는 용암 강
      // 구불구불 흐르는 용암 줄기(가장자리는 식어서 어둡고, 가운데는 밝게)
      for (const [x0, y0, c1x, c1y, c2x, c2y, x1, y1] of [[-20, 600, 120, 590, 60, 760, 160, 800], [740, 900, 600, 930, 680, 1010, 540, 1080]]) {
        const path = () => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x1, y1); };
        ctx.lineCap = 'round';
        for (const [w, c] of [[44, 'rgba(255,90,20,0.25)'], [30, '#5a1e10'], [22, '#ff6a1a'], [10, '#ffb040'], [3, '#fff0a0']]) { path(); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(); }
      }
      ctx.strokeStyle = 'rgba(255,120,40,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const x = rng() * BG_W, y = HORIZON + 60 + rng() * 600; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + rng() * 20, y + rng() * 14 - 7); ctx.lineTo(x + 40, y + rng() * 20 - 10); ctx.stroke(); }
    },
    near: ctx => {
      for (const [x, y, s] of [[640, 660, 1.2], [80, 900, 1], [600, 1020, 1.4], [400, 1040, 0.8]]) rock(ctx, x, y, s, '#3a2622');
      crystal(ctx, 680, 560, 0.7, 'rgba(255,120,40,1)');
    },
  });
}

function coast(ctx, rng) {
  const shore = () => { ctx.beginPath(); ctx.moveTo(0, HORIZON + 26); for (let x = 0; x < 720; x += 40) ctx.quadraticCurveTo(x + 20, HORIZON + 34 + (x % 80 ? 6 : -4), x + 40, HORIZON + 26); };
  scene(ctx, rng, {
    sky: [[0, '#4fb0ec'], [0.8, '#a8dcf6'], [1, '#e0f4fc']],
    ground: [[0, '#f6e4b6'], [1, '#e2c68a']],
    spot: 'rgba(255,255,255,0.14)',
    bump: 6,
    far: ctx => {
      sun(ctx, 140, 110, 36, 'rgba(255,250,210,1)');
      ctx.fillStyle = grad(ctx, 300, HORIZON + 30, [[0, '#2f8ac8'], [1, '#5fc4e0']]); ctx.fillRect(0, 300, BG_W, 80);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const x = rng() * BG_W, y = 310 + rng() * 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y); ctx.stroke(); }
      ridge(ctx, [[480, 300], [560, 270], [640, 285], [720, 300]], 302, '#6a9ab8');
    },
    floor: ctx => {
      // 밀려오는 물결 가장자리
      shore(); ctx.lineTo(720, HORIZON - 10); ctx.lineTo(0, HORIZON - 10); ctx.closePath(); ctx.fillStyle = 'rgba(120,210,235,0.6)'; ctx.fill();
      shore(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
    },
    near: ctx => {
      palm(ctx, 50, 700, 1.1); palm(ctx, 650, 1040, 1.3);
      // 조개·불가사리
      for (let i = 0; i < 10; i++) {
        const x = rng() * BG_W, y = HORIZON + 80 + rng() * 600; if (Math.abs(x - 360) < 120) continue;
        if (i % 2) { ctx.fillStyle = '#ff9a6a'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 4 : 11; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
        else { ctx.fillStyle = '#fff0e0'; ctx.beginPath(); ctx.arc(x, y, 9, Math.PI, 0); ctx.closePath(); ctx.fill(); }
      }
      for (const [x, y, s] of [[640, 640, 1], [110, 1010, 1.2]]) rock(ctx, x, y, s, '#9a948a');
    },
  });
}

function ruins(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#7aa4c8'], [0.7, '#d8d0c0'], [1, '#f0e2c4']],
    ground: [[0, '#c8b894'], [1, '#8a7e62']],
    spot: 'rgba(255,255,255,0.1)',
    far: ctx => {
      ridge(ctx, wave(rng, 0, 720, 120, 300, 20), HORIZON + 40, '#a4a890');
      // 무너진 아치와 기둥들
      ctx.fillStyle = '#b8b0a0';
      ctx.fillRect(420, 210, 30, 140); ctx.fillRect(560, 210, 30, 140);
      ctx.beginPath(); ctx.arc(505, 214, 85, Math.PI, 0); ctx.lineTo(560, 214); ctx.arc(505, 214, 55, 0, Math.PI, true); ctx.closePath(); ctx.fill();
      for (const [x, h, b] of [[80, 120, 0], [150, 80, 1], [250, 100, 1], [660, 70, 1]]) column(ctx, x, 350, 0.8, h, '#c4bcaa', b);
    },
    floor: ctx => {
      // 깨진 돌바닥 타일
      ctx.strokeStyle = 'rgba(80,70,50,0.25)'; ctx.lineWidth = 2;
      for (let r = 0; r < 9; r++) {
        const y = HORIZON + 40 + r * 75;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke();
        for (let x = (r % 2) * 60; x < BG_W; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 75); ctx.stroke(); }
      }
    },
    near: ctx => {
      column(ctx, 50, 700, 1.2, 150, '#d0c8b4', 1); column(ctx, 670, 640, 1.1, 110, '#d0c8b4', 1);
      // 쓰러진 기둥 조각
      ctx.fillStyle = '#c4bcaa'; ctx.beginPath(); ctx.roundRect(520, 990, 150, 34, 8); ctx.fill(); ellipse(ctx, 670, 1007, 10, 17, '#a89e88');
      // 덩굴
      ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 3;
      for (const x of [40, 60, 660]) { ctx.beginPath(); ctx.moveTo(x, 520); for (let k = 0; k < 6; k++) ctx.lineTo(x + (k % 2 ? 8 : -8), 540 + k * 24); ctx.stroke(); }
      for (let i = 0; i < 16; i++) { const x = rng() * BG_W, y = HORIZON + 60 + rng() * 620; if (Math.abs(x - 360) > 90) tuft(ctx, x, y, 0.9, '#6a8a3a'); }
    },
  });
}

function crystalCave(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#0c1424'], [0.6, '#1a2440'], [1, '#26304c']],
    ground: [[0, '#34405c'], [1, '#1c2238']],
    spot: 'rgba(140,220,255,0.10)',
    far: ctx => {
      ridge(ctx, wave(rng, 0, 720, 70, 260, 40), HORIZON + 40, '#202a44');
      ctx.fillStyle = '#2c3654';
      for (let i = 0; i < 14; i++) { const x = i * 54 + rng() * 20, h = 40 + rng() * 90, w = 12 + rng() * 12; ctx.beginPath(); ctx.moveTo(x - w, 0); ctx.lineTo(x, h); ctx.lineTo(x + w, 0); ctx.closePath(); ctx.fill(); }
      for (let i = 0; i < 6; i++) crystal(ctx, 40 + i * 130 + rng() * 40, 340, 0.6, i % 2 ? 'rgba(120,230,255,1)' : 'rgba(200,150,255,1)');
    },
    near: ctx => {
      crystal(ctx, 70, 640, 1.5, 'rgba(120,230,255,1)');
      crystal(ctx, 660, 600, 1.3, 'rgba(200,150,255,1)');
      crystal(ctx, 640, 1010, 1.6, 'rgba(120,230,255,1)');
      crystal(ctx, 90, 1020, 1.2, 'rgba(255,170,230,1)');
      crystal(ctx, 560, 760, 0.7, 'rgba(200,150,255,1)');
      for (let i = 0; i < 30; i++) ellipse(ctx, rng() * BG_W, HORIZON + 40 + rng() * 660, 2, 2, 'rgba(180,240,255,0.5)');
    },
  });
}

function graveyard(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#0e1222'], [0.7, '#262c44'], [1, '#3a4058']],
    ground: [[0, '#38423a'], [1, '#1c2420']],
    spot: 'rgba(200,220,255,0.07)',
    far: ctx => {
      starsky(ctx, rng, 60, 300);
      sun(ctx, 560, 110, 34, 'rgba(240,240,220,1)');
      ellipse(ctx, 548, 100, 7, 6, 'rgba(0,0,0,0.08)'); ellipse(ctx, 572, 122, 5, 4, 'rgba(0,0,0,0.08)');
      ridge(ctx, wave(rng, 0, 720, 120, 320, 16), HORIZON + 40, '#1e2430');
      for (let i = 0; i < 5; i++) deadTree(ctx, 60 + i * 160 + rng() * 40, 345, 0.8, '#161a24');
      // 철창 울타리
      ctx.fillStyle = '#141820';
      for (let x = 0; x < BG_W; x += 18) { ctx.fillRect(x, 330, 4, 40); ctx.beginPath(); ctx.moveTo(x - 3, 332); ctx.lineTo(x + 2, 322); ctx.lineTo(x + 7, 332); ctx.fill(); }
      ctx.fillRect(0, 344, BG_W, 4);
    },
    near: ctx => {
      for (const [x, y, s] of [[60, 620, 1], [140, 700, 0.8], [650, 640, 1.1], [600, 980, 1.3], [80, 990, 1.2], [690, 800, 0.9]]) tomb(ctx, x, y, s, '#6a6e7a');
      // 십자 묘비
      ctx.fillStyle = '#5a5e6a'; ctx.fillRect(196, 990, 10, 50); ctx.fillRect(184, 1004, 34, 9);
      // 낮게 깔린 안개
      for (let i = 0; i < 8; i++) ellipse(ctx, rng() * BG_W, HORIZON + 80 + rng() * 620, 120 + rng() * 80, 14, 'rgba(200,210,230,0.08)');
    },
  });
}

function skyIsland(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#4aa6f0'], [0.7, '#9ad4fa'], [1, '#d8f0ff']],
    ground: [[0, '#ffffff'], [0.6, '#eef4fc'], [1, '#d0e0f4']],
    spot: 'rgba(160,200,255,0.12)',
    bump: 20,
    far: ctx => {
      sun(ctx, 600, 90, 34, 'rgba(255,252,220,1)');
      // 떠 있는 섬들
      for (const [x, y, s] of [[140, 180, 1], [480, 240, 0.7], [640, 300, 0.5]]) {
        ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.moveTo(x - 70 * s, y); ctx.lineTo(x + 70 * s, y); ctx.lineTo(x + 10 * s, y + 70 * s); ctx.lineTo(x - 20 * s, y + 50 * s); ctx.closePath(); ctx.fill();
        ellipse(ctx, x, y, 72 * s, 12 * s, '#6cbf4e');
        roundTree(ctx, x - 20 * s, y + 2, 0.5 * s, '#5fae4a', '#3f8a3a');
        ctx.strokeStyle = 'rgba(160,220,255,0.7)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x + 40 * s, y + 4); ctx.lineTo(x + 40 * s, y + 90 * s); ctx.stroke();
      }
      for (let i = 0; i < 8; i++) cloudPuff(ctx, i * 100 + rng() * 40, 350 + rng() * 10, 0.9, '#f4f8ff');
    },
    near: ctx => {
      for (const [x, y, s] of [[40, 640, 1.4], [690, 600, 1.2], [60, 1010, 1.6], [680, 990, 1.5]]) cloudPuff(ctx, x, y, s, 'rgba(255,255,255,0.95)');
      // 깃털
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 6; i++) { const x = rng() * BG_W, y = HORIZON + 80 + rng() * 600; ctx.beginPath(); ctx.ellipse(x, y, 4, 12, rng(), 0, Math.PI * 2); ctx.fill(); }
    },
  });
}

function darkcastle(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#120e1e'], [0.7, '#2e2440'], [1, '#463a58']],
    ground: [[0, '#4a4458'], [1, '#221e2c']],
    spot: 'rgba(200,170,255,0.08)',
    far: ctx => {
      starsky(ctx, rng, 40, 200);
      // 성 실루엣(창문에 노란 불빛)
      ctx.fillStyle = '#1a1424';
      ctx.fillRect(200, 200, 320, 170);
      for (const [x, w, h] of [[180, 60, 220], [470, 70, 250], [320, 80, 290]]) {
        ctx.fillRect(x, 370 - h, w, h);
        ctx.beginPath(); ctx.moveTo(x - 8, 370 - h); ctx.lineTo(x + w / 2, 370 - h - 60); ctx.lineTo(x + w + 8, 370 - h); ctx.closePath(); ctx.fill();
      }
      for (let x = 200; x < 520; x += 24) ctx.fillRect(x, 188, 14, 14);
      ctx.fillStyle = '#ffd36a';
      for (const [x, y] of [[205, 200], [500, 170], [350, 130], [270, 260], [420, 240], [360, 300]]) { ctx.beginPath(); ctx.roundRect(x, y, 10, 16, [5, 5, 0, 0]); ctx.fill(); }
      // 보라 깃발
      ctx.fillStyle = '#7a4aa8';
      for (const [x, y] of [[210, 120], [505, 90]]) { ctx.fillRect(x, y - 30, 3, 34); ctx.beginPath(); ctx.moveTo(x + 3, y - 30); ctx.lineTo(x + 30, y - 22); ctx.lineTo(x + 3, y - 14); ctx.fill(); }
      ridge(ctx, wave(rng, 0, 720, 100, 350, 10), HORIZON + 40, '#2a2436');
    },
    floor: ctx => {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
      for (let r = 0; r < 9; r++) {
        const y = HORIZON + 40 + r * 75;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke();
        for (let x = (r % 2) * 50; x < BG_W; x += 100) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 75); ctx.stroke(); }
      }
      // 보라 융단 길
      ctx.fillStyle = 'rgba(110,60,150,0.55)'; ctx.beginPath(); ctx.moveTo(300, BG_H); ctx.lineTo(340, HORIZON + 20); ctx.lineTo(380, HORIZON + 20); ctx.lineTo(420, BG_H); ctx.closePath(); ctx.fill();
    },
    near: ctx => {
      // 횃불(불꽃은 가만히, 은은한 빛)
      for (const [x, y] of [[50, 620], [670, 620], [50, 960], [670, 960]]) {
        ctx.fillStyle = '#3a3040'; ctx.fillRect(x - 8, y - 70, 16, 70);
        ctx.fillStyle = radial(ctx, x, y - 86, 70, 'rgba(255,190,80,0.35)', 'rgba(255,190,80,0)'); ctx.fillRect(x - 70, y - 156, 140, 140);
        ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(x - 10, y - 72); ctx.quadraticCurveTo(x - 6, y - 96, x, y - 104); ctx.quadraticCurveTo(x + 6, y - 96, x + 10, y - 72); ctx.closePath(); ctx.fill();
        ellipse(ctx, x, y - 80, 4, 8, '#fff2b0');
      }
    },
  });
}

function voidSpace(ctx, rng) {
  ctx.fillStyle = grad(ctx, 0, BG_H, [[0, '#06041a'], [0.5, '#140c30'], [1, '#08061a']]); ctx.fillRect(0, 0, BG_W, BG_H);
  // 성운
  for (const [x, y, r, c] of [[160, 160, 220, 'rgba(140,80,220,0.25)'], [560, 260, 200, 'rgba(60,160,220,0.18)'], [400, 700, 300, 'rgba(180,80,200,0.10)']]) {
    ctx.fillStyle = radial(ctx, x, y, r, c, c.replace(/[\d.]+\)$/, '0)')); ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  starsky(ctx, rng, 180, BG_H);
  sun(ctx, 590, 120, 22, 'rgba(255,220,160,1)');
  // 떠 있는 바위 발판 두 개(적 자리, 우리 자리)
  for (const [y, w] of [[478, 330], [890, 340]]) {
    ctx.fillStyle = '#2a2048'; ctx.beginPath(); ctx.ellipse(360, y, w, 60, 0, 0, Math.PI); ctx.lineTo(360 - w * 0.6, y + 120); ctx.lineTo(360 + w * 0.6, y + 120); ctx.closePath(); ctx.fill();
    ellipse(ctx, 360, y, w, 60, '#3e3068');
    ellipse(ctx, 360, y - 4, w - 20, 48, '#4a3a7a');
    for (let i = 0; i < 16; i++) ellipse(ctx, 360 + (rng() - 0.5) * w * 1.6, y + (rng() - 0.5) * 70, 1.6, 1.6, 'rgba(220,200,255,0.7)');
  }
  for (const [x, y, s] of [[80, 650, 1], [640, 700, 0.8], [600, 220, 0.5]]) {
    ctx.fillStyle = '#2e2450'; ctx.beginPath(); ctx.moveTo(x - 30 * s, y); ctx.lineTo(x - 10 * s, y - 24 * s); ctx.lineTo(x + 26 * s, y - 16 * s); ctx.lineTo(x + 34 * s, y + 8 * s); ctx.lineTo(x, y + 30 * s); ctx.closePath(); ctx.fill();
  }
}

function heaven(ctx, rng) {
  scene(ctx, rng, {
    sky: [[0, '#f8d88a'], [0.6, '#fff0c8'], [1, '#fffaf0']],
    ground: [[0, '#fffdf6'], [0.6, '#fbf0d8'], [1, '#ecd8b0']],
    spot: 'rgba(255,220,120,0.14)',
    bump: 18,
    far: ctx => {
      // 빛줄기
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const x of [80, 260, 460, 620]) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 120, 380); ctx.lineTo(x + 30, 380); ctx.closePath();
        ctx.fillStyle = grad(ctx, 0, 380, [[0, 'rgba(255,250,220,0.35)'], [1, 'rgba(255,250,220,0)']]); ctx.fill();
      }
      ctx.restore();
      // 금빛 문과 기둥
      ctx.fillStyle = '#f4e4b0';
      ctx.fillRect(290, 170, 20, 190); ctx.fillRect(410, 170, 20, 190);
      ctx.strokeStyle = '#d8b050'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(360, 180, 60, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = radial(ctx, 360, 260, 70, 'rgba(255,255,230,0.9)', 'rgba(255,255,230,0)'); ctx.fillRect(290, 190, 140, 140);
      for (const x of [120, 600]) column(ctx, x, 350, 0.9, 140, '#f6eccc', 0);
      for (let i = 0; i < 8; i++) cloudPuff(ctx, i * 100 + rng() * 40, 360 + rng() * 10, 0.9, '#fffaf0');
    },
    near: ctx => {
      for (const [x, y, s] of [[40, 640, 1.4], [690, 610, 1.2], [60, 1010, 1.6], [680, 990, 1.5]]) cloudPuff(ctx, x, y, s, 'rgba(255,255,255,0.95)');
      column(ctx, 70, 860, 1.1, 130, '#f6eccc', 1); column(ctx, 660, 840, 1, 110, '#f6eccc', 1);
      for (let i = 0; i < 24; i++) ellipse(ctx, rng() * BG_W, HORIZON + 40 + rng() * 660, 2, 2, 'rgba(255,210,100,0.6)');
    },
  });
}

const DRAW = {
  meadow, forest, cave, desert, snow, swamp, volcano, coast, ruins,
  crystal: crystalCave, graveyard, sky: skyIsland, darkcastle, void: voidSpace, heaven,
};
// 전투 화면 바깥(PC 넓은 화면 여백) 색
export const BACKDROP = {
  meadow: '#6cc4f5', forest: '#1d3b2c', cave: '#120e1c', desert: '#5fb4ec', snow: '#8fb8e0', swamp: '#3a4a40',
  volcano: '#1e0c0c', coast: '#4fb0ec', ruins: '#7aa4c8', crystal: '#0c1424', graveyard: '#0e1222', sky: '#4aa6f0',
  darkcastle: '#120e1e', void: '#06041a', heaven: '#f8d88a',
};

export function bgTexture(scene, kind) {
  const key = `bg:${kind}`;
  if (!scene.textures.exists(key)) {
    const c = document.createElement('canvas');
    // 2배로 촘촘하게(BattleScene 이 0.5배로 표시)
    c.width = BG_W * 2; c.height = BG_H * 2;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2);
    DRAW[kind](ctx, makeRng(kind.length * 977));
    scene.textures.addCanvas(key, c);
  }
  return key;
}

function cloudTexture(scene) {
  if (scene.textures.exists('cloud')) return 'cloud';
  const c = document.createElement('canvas');
  c.width = 440; c.height = 180;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  for (const [x, y, r] of [[60, 58, 30], [100, 40, 38], [145, 52, 32], [180, 62, 22], [30, 66, 18]]) ellipse(ctx, x, y, r, r * 0.85, 'rgba(255,255,255,0.95)');
  ellipse(ctx, 110, 72, 95, 16, 'rgba(220,235,250,0.9)');
  scene.textures.addCanvas('cloud', c);
  return 'cloud';
}
function dotTexture(scene) {
  if (scene.textures.exists('glowdot')) return 'glowdot';
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = radial(ctx, 16, 16, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  ctx.fillRect(0, 0, 32, 32);
  scene.textures.addCanvas('glowdot', c);
  return 'glowdot';
}

// 천천히 움직이는 것들. 밝기 변화는 2초 이상 주기로만(깜빡임 없음).
const CLOUDY = { meadow: 1, coast: 1, sky: 1 };
// 계속 흘러가는 알갱이: 눈은 내리고, 불티·빛가루는 올라간다(화면 밖으로 나가면 반대편에서 다시)
const FLOW = {
  snow: { n: 40, tint: 0xffffff, scale: [0.12, 0.3], vy: [30, 60], vx: [-12, 12], alpha: 0.9, add: false },
  volcano: { n: 26, tint: 0xff9a3a, scale: [0.1, 0.22], vy: [-50, -25], vx: [-8, 8], alpha: 0.8, add: true },
  heaven: { n: 22, tint: 0xffd56a, scale: [0.15, 0.3], vy: [-22, -10], vx: [-5, 5], alpha: 0.7, add: false },
  desert: { n: 14, tint: 0xfff0c8, scale: [0.1, 0.2], vy: [-4, 4], vx: [25, 50], alpha: 0.6, add: false },
};
// 제자리 근처를 맴도는 빛 알갱이
const DOTS = {
  forest: [14, 0xfff07a, 0.45], cave: [18, 0xcfc6ff, 0.22], swamp: [16, 0xc8f07a, 0.4], ruins: [12, 0xfff0c8, 0.2],
  crystal: [22, 0x9ae8ff, 0.25], graveyard: [10, 0xc8d8ff, 0.6], darkcastle: [14, 0xc8a0ff, 0.25], void: [24, 0xffffff, 0.14],
};

function onUpdate(scene, fn) {
  scene.events.on('update', fn);
  scene.events.once('shutdown', () => scene.events.off('update', fn));
}

export function addAmbient(scene, kind) {
  if (CLOUDY[kind]) {
    const key = cloudTexture(scene);
    // 구름은 오른쪽으로 천천히 흘러가고, 화면을 벗어나면 왼쪽 밖에서 다시 들어온다
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const cl = scene.add.image(-200 + i * 260, 60 + (i % 2) * 70 + i * 12, key).setScale((0.8 + (i % 3) * 0.25) / 2).setAlpha(kind === 'sky' ? 0.8 : 0.95);
      clouds.push({ cl, v: 9 + i * 2 });
    }
    onUpdate(scene, (t, dt) => { for (const c of clouds) { c.cl.x += (c.v * dt) / 1000; if (c.cl.x > 900) c.cl.x = -260; } });
    return;
  }
  const key = dotTexture(scene);
  const rnd = makeRng(kind.length * 31 + 7);
  const r = ([a, b]) => a + rnd() * (b - a);
  const f = FLOW[kind];
  if (f) {
    const ps = [];
    for (let i = 0; i < f.n; i++) {
      const d = scene.add.image(rnd() * 720, rnd() * 1060, key).setTint(f.tint).setScale(r(f.scale)).setAlpha(f.alpha);
      if (f.add) d.setBlendMode('ADD');
      ps.push({ d, vx: r(f.vx), vy: r(f.vy) });
    }
    onUpdate(scene, (t, dt) => {
      const k = dt / 1000;
      for (const p of ps) {
        p.d.x += p.vx * k; p.d.y += p.vy * k;
        if (p.d.y > 1080) p.d.y = -20; else if (p.d.y < -20) p.d.y = 1080;
        if (p.d.x > 740) p.d.x = -20; else if (p.d.x < -20) p.d.x = 740;
      }
    });
    return;
  }
  const [n, tint, scale] = DOTS[kind] || DOTS.cave;
  const top = kind === 'void' ? 0 : 380;
  for (let i = 0; i < n; i++) {
    const d = scene.add.image(rnd() * 720, top + rnd() * (1020 - top), key).setTint(tint)
      .setScale(scale).setAlpha(0.5).setBlendMode('ADD');
    scene.tweens.add({ targets: d, x: d.x + (rnd() - 0.5) * 160, y: d.y - 40 - rnd() * 80, duration: 6000 + rnd() * 5000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: d, alpha: 0.2, duration: 2600 + rnd() * 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
