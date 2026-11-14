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

const DRAW = { meadow, forest, cave };

export function bgTexture(scene, kind) {
  const key = `bg:${kind}`;
  if (!scene.textures.exists(key)) {
    const c = document.createElement('canvas');
    c.width = BG_W; c.height = BG_H;
    DRAW[kind](c.getContext('2d'), makeRng(kind.length * 977));
    scene.textures.addCanvas(key, c);
  }
  return key;
}

function cloudTexture(scene) {
  if (scene.textures.exists('cloud')) return 'cloud';
  const c = document.createElement('canvas');
  c.width = 220; c.height = 90;
  const ctx = c.getContext('2d');
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
export function addAmbient(scene, kind) {
  if (kind === 'meadow') {
    const key = cloudTexture(scene);
    // 구름은 오른쪽으로 천천히 흘러가고, 화면을 벗어나면 왼쪽 밖에서 다시 들어온다
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const cl = scene.add.image(-200 + i * 260, 60 + (i % 2) * 70 + i * 12, key).setScale(0.8 + (i % 3) * 0.25).setAlpha(0.95);
      clouds.push({ cl, v: 9 + i * 2 });
    }
    const move = (t, dt) => { for (const c of clouds) { c.cl.x += (c.v * dt) / 1000; if (c.cl.x > 900) c.cl.x = -260; } };
    scene.events.on('update', move);
    scene.events.once('shutdown', () => scene.events.off('update', move));
    return;
  }
  const key = dotTexture(scene);
  const n = kind === 'forest' ? 14 : 18;
  const tint = kind === 'forest' ? 0xfff07a : 0xcfc6ff;
  const rnd = makeRng(kind === 'forest' ? 5 : 9);
  for (let i = 0; i < n; i++) {
    const d = scene.add.image(rnd() * 720, 380 + rnd() * 640, key).setTint(tint)
      .setScale(kind === 'forest' ? 0.45 : 0.22).setAlpha(0.5).setBlendMode('ADD');
    scene.tweens.add({ targets: d, x: d.x + (rnd() - 0.5) * 160, y: d.y - 40 - rnd() * 80, duration: 6000 + rnd() * 5000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: d, alpha: 0.2, duration: 2600 + rnd() * 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
}
