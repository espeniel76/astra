// 로비의 살아 있는 마을. 건물이 곧 메뉴이고, 가진 영웅들이 천천히 걸어 다닌다.
// startTown(canvas, opts) → stop(). 깜빡임 없음: 밝기 변화는 3초 주기로만.
import { heroCanvas } from './portrait.js';
import { makeRng } from '../core/rng.js';

export const TW = 720, TH = 840;

function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function poly(ctx, pts, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function grad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; }

// ── 가만히 있는 배경(한 번만 그림) ──
function drawStatic(ctx) {
  const rng = makeRng(42);
  ctx.fillStyle = grad(ctx, 0, 330, [[0, '#4aa8ec'], [1, '#bfe6fb']]);
  ctx.fillRect(0, 0, TW, 340);
  // 먼 산과 언덕
  poly(ctx, [[0, 300], [110, 200], [210, 270], [330, 170], [450, 260], [560, 190], [720, 280], [720, 340], [0, 340]], '#8fb0d8');
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [x, y] of [[110, 200], [330, 170], [560, 190]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 20, y + 20); ctx.lineTo(x + 20, y + 20); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#7cc45e';
  ctx.beginPath(); ctx.moveTo(0, 330); ctx.quadraticCurveTo(180, 270, 360, 310); ctx.quadraticCurveTo(540, 350, 720, 290); ctx.lineTo(720, TH); ctx.lineTo(0, TH); ctx.closePath(); ctx.fill();
  ctx.fillStyle = grad(ctx, 320, TH, [[0, '#8fd86a'], [1, '#5fae48']]);
  ctx.beginPath(); ctx.moveTo(0, 380); ctx.quadraticCurveTo(360, 330, 720, 380); ctx.lineTo(720, TH); ctx.lineTo(0, TH); ctx.closePath(); ctx.fill();
  // 광장 길(둥근 돌길)
  ellipse(ctx, 360, 600, 300, 110, '#e3c98f');
  ellipse(ctx, 360, 600, 270, 92, '#ecd7a6');
  ctx.fillStyle = 'rgba(160,120,70,0.25)';
  for (let i = 0; i < 70; i++) { const a = rng() * Math.PI * 2, r = rng(); ellipse(ctx, 360 + Math.cos(a) * 270 * r, 600 + Math.sin(a) * 90 * r, 8, 4, 'rgba(170,130,80,0.22)'); }
  // 길이 산 쪽(모험의 문)으로 이어짐
  ctx.fillStyle = '#e3c98f';
  ctx.beginPath(); ctx.moveTo(560, 520); ctx.quadraticCurveTo(620, 470, 640, 420); ctx.lineTo(680, 425); ctx.quadraticCurveTo(660, 490, 600, 540); ctx.closePath(); ctx.fill();
  // 나무와 꽃
  for (const [x, y, s] of [[40, 400, 1], [690, 360, 0.8], [30, 800, 1.1], [700, 810, 1], [250, 360, 0.6], [470, 350, 0.55]]) {
    ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 6 * s, y - 30 * s, 12 * s, 32 * s);
    for (const [dx, dy, r, c] of [[0, -60, 32, '#3f8a3a'], [-20, -46, 22, '#3f8a3a'], [20, -48, 22, '#3f8a3a'], [-6, -66, 24, '#5fae4a'], [14, -56, 18, '#5fae4a']]) ellipse(ctx, x + dx * s, y + dy * s, r * s, r * s * 0.9, c);
  }
  const fc = ['#ffffff', '#ff9ad0', '#ffe066', '#b9a6ff'];
  for (let i = 0; i < 40; i++) {
    const x = rng() * TW, y = 400 + rng() * 430;
    if (((x - 360) / 300) ** 2 + ((y - 600) / 110) ** 2 < 1.1) continue;
    ellipse(ctx, x, y, 3.4, 3.4, fc[i % 4]); ellipse(ctx, x, y, 1.4, 1.4, '#ffd84a');
  }
}

// ── 건물들 ──
const BUILDINGS = [
  { key: 'summon', name: '별의 탑', x: 360, y: 455, w: 150, h: 330, draw: tower },
  { key: 'heroes', name: '영웅의 집', x: 150, y: 540, w: 210, h: 200, draw: house },
  { key: 'adventure', name: '모험의 문', x: 590, y: 520, w: 190, h: 210, draw: gate },
  { key: 'team', name: '훈련장', x: 165, y: 770, w: 200, h: 130, draw: training },
  { key: 'missions', name: '게시판', x: 560, y: 770, w: 140, h: 140, draw: board },
];

function tower(ctx, b, t) {
  const { x, y } = b;
  ellipse(ctx, x, y + 4, 80, 18, 'rgba(0,0,0,0.18)');
  poly(ctx, [[x - 58, y], [x - 44, y - 230], [x + 44, y - 230], [x + 58, y]], '#e8e2f6', '#8a7ab0');
  for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(138,122,176,0.35)'; ctx.fillRect(x - 54 + i * 3, y - 40 - i * 46, 108 - i * 6, 4); }
  rr(ctx, x - 20, y - 70, 40, 70, [20, 20, 0, 0], '#5a3e8a', '#3a2a5a');
  for (const wy of [y - 130, y - 190]) rr(ctx, x - 12, wy, 24, 30, [12, 12, 2, 2], '#ffe9a0', '#8a7ab0');
  poly(ctx, [[x - 62, y - 228], [x, y - 310], [x + 62, y - 228]], '#6a4ab0', '#3a2a5a');
  // 꼭대기 별: 3초 주기로 천천히 밝아졌다 어두워짐
  const glow = 0.45 + 0.25 * Math.sin(t / 3000 * Math.PI * 2);
  const g = ctx.createRadialGradient(x, y - 330, 0, x, y - 330, 70);
  g.addColorStop(0, `rgba(255,224,102,${glow})`); g.addColorStop(1, 'rgba(255,224,102,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 70, y - 400, 140, 140);
  const pts = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5 + t / 6000, r = k % 2 ? 9 : 22; pts.push([x + Math.cos(a) * r, y - 330 + Math.sin(a) * r]); }
  poly(ctx, pts, '#ffe066', '#c9a24a');
}
function house(ctx, b) {
  const { x, y } = b;
  ellipse(ctx, x, y + 4, 100, 16, 'rgba(0,0,0,0.18)');
  rr(ctx, x - 80, y - 110, 160, 110, 6, '#f6e6c8', '#a08060');
  poly(ctx, [[x - 100, y - 104], [x, y - 190], [x + 100, y - 104]], '#d8504a', '#8a2a2a');
  rr(ctx, x - 20, y - 60, 40, 60, [20, 20, 0, 0], '#8a5a32', '#5a3a1e');
  for (const wx of [x - 58, x + 34]) { rr(ctx, wx, y - 90, 26, 26, 4, '#bfe6fb', '#a08060'); ctx.fillStyle = '#a08060'; ctx.fillRect(wx + 12, y - 90, 2, 26); }
  rr(ctx, x + 40, y - 190, 20, 44, 2, '#a07a5a', '#5a3a1e');
  // 깃발(영웅 문장)
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y - 135, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8504a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', x, y - 129);
}
function gate(ctx, b, t) {
  const { x, y } = b;
  ellipse(ctx, x, y + 4, 95, 16, 'rgba(0,0,0,0.18)');
  rr(ctx, x - 85, y - 170, 44, 170, 6, '#b8b0a4', '#6a6258');
  rr(ctx, x + 41, y - 170, 44, 170, 6, '#b8b0a4', '#6a6258');
  ctx.beginPath(); ctx.moveTo(x - 85, y - 150); ctx.quadraticCurveTo(x, y - 250, x + 85, y - 150); ctx.lineTo(x + 85, y - 120); ctx.quadraticCurveTo(x, y - 210, x - 85, y - 120); ctx.closePath();
  ctx.fillStyle = '#b8b0a4'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#6a6258'; ctx.stroke();
  // 문 안: 저 멀리 모험의 세계(살짝 빛남)
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - 41, y); ctx.lineTo(x - 41, y - 120); ctx.quadraticCurveTo(x, y - 190, x + 41, y - 120); ctx.lineTo(x + 41, y); ctx.closePath(); ctx.clip();
  ctx.fillStyle = grad(ctx, y - 180, y, [[0, '#6cc4f5'], [0.6, '#bfe6fb'], [0.61, '#7fcf5f'], [1, '#4f9e3a']]); ctx.fillRect(x - 41, y - 190, 82, 190);
  ctx.restore();
  // 깃발이 바람에 천천히
  const sway = Math.sin(t / 1600) * 4;
  for (const fx of [x - 63, x + 63]) {
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(fx - 2, y - 230, 4, 62);
    poly(ctx, [[fx + 2, y - 228], [fx + 34 + sway, y - 218], [fx + 2, y - 206]], '#4a7cff', '#2a4aa0');
  }
}
function training(ctx, b) {
  const { x, y } = b;
  ellipse(ctx, x, y - 40, 100, 40, '#c9a46a');
  ctx.fillStyle = '#8a6436';
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 100 + i * 40, y - 30, 6, 34);
  ctx.fillRect(x - 102, y - 22, 208, 6);
  // 허수아비 과녁
  ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 4, y - 110, 8, 70); ctx.fillRect(x - 30, y - 92, 60, 7);
  ellipse(ctx, x, y - 120, 22, 22, '#e8d8a8');
  for (const [r, c] of [[16, '#d84a4a'], [10, '#ffffff'], [5, '#d84a4a']]) ellipse(ctx, x, y - 120, r, r, c);
  // 무기 걸이
  ctx.fillStyle = '#c9d3de'; ctx.fillRect(x + 50, y - 100, 4, 50); ctx.fillRect(x + 62, y - 104, 4, 54);
}
function board(ctx, b) {
  const { x, y } = b;
  ctx.fillStyle = '#6b4a2e'; ctx.fillRect(x - 50, y - 100, 8, 100); ctx.fillRect(x + 42, y - 100, 8, 100);
  rr(ctx, x - 62, y - 130, 124, 80, 6, '#c9946a', '#6b4a2e');
  for (const [px, py, c] of [[x - 44, y - 118, '#fff6d8'], [x - 6, y - 122, '#e8f4ff'], [x + 18, y - 104, '#ffe0e8']]) {
    rr(ctx, px, py, 30, 36, 2, c, null); ctx.fillStyle = '#d84a4a'; ctx.beginPath(); ctx.arc(px + 15, py + 3, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function label(ctx, b, badge) {
  ctx.font = 'bold 22px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(b.name).width + 26;
  rr(ctx, b.x - w / 2, b.y + 8, w, 34, 17, 'rgba(20,24,48,0.82)', 'rgba(255,255,255,0.6)');
  ctx.fillStyle = '#ffffff'; ctx.fillText(b.name, b.x, b.y + 26);
  if (badge) {
    ellipse(ctx, b.x + w / 2 - 2, b.y + 8, 15, 15, '#ff4d4d');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('!', b.x + w / 2 - 2, b.y + 9);
  }
}

function bubble(ctx, x, y, str, t) {
  const bob = Math.sin(t / 500) * 6;
  ctx.font = 'bold 24px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  const w = ctx.measureText(str).width + 30;
  const rect = { x0: x - w / 2, x1: x + w / 2, y0: y - 64, y1: y + 10 };
  ctx.save(); ctx.translate(0, bob);
  rr(ctx, x - w / 2, y - 58, w, 46, 14, '#ffffff', '#ffd36a');
  poly(ctx, [[x - 12, y - 13], [x + 12, y - 13], [x, y + 4]], '#ffffff');
  ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y - 35);
  ctx.restore();
  return rect;
}

export function startTown(canvas, { heroes = [], badges = {}, hint = null, onBuilding, onHero }) {
  canvas.width = TW; canvas.height = TH;
  const ctx = canvas.getContext('2d');
  const bg = document.createElement('canvas');
  bg.width = TW; bg.height = TH;
  drawStatic(bg.getContext('2d'));
  const rng = makeRng(7);
  const clouds = [0, 1, 2].map(i => ({ x: rng() * TW, y: 40 + i * 50, s: 0.7 + rng() * 0.6, v: 6 + rng() * 6 }));
  // 걸어 다니는 영웅(광장 타원 안)
  const walkers = heroes.slice(0, 6).map((id, i) => {
    const a = (i / Math.max(1, heroes.length)) * Math.PI * 2;
    return { id, img: heroCanvas(id, 110), x: 360 + Math.cos(a) * 200, y: 600 + Math.sin(a) * 60, tx: 0, ty: 0, wait: 500 + i * 400, dir: 1, phase: rng() * 6 };
  });
  const pickTarget = w => { const a = rng() * Math.PI * 2, r = 0.3 + rng() * 0.7; w.tx = 360 + Math.cos(a) * 240 * r; w.ty = 600 + Math.sin(a) * 75 * r; };
  walkers.forEach(pickTarget);

  let raf = 0, last = performance.now(), alive = true, hintRect = null;
  const frame = now => {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(50, now - last); last = now;
    if (!canvas.isConnected) { stop(); return; }
    if (document.hidden || canvas.closest('[hidden]')) return;
    ctx.drawImage(bg, 0, 0);
    for (const c of clouds) {
      c.x += (c.v * dt) / 1000; if (c.x > TW + 120) c.x = -160;
      for (const [dx, dy, r] of [[0, 0, 26], [28, -10, 32], [60, 0, 24], [30, 10, 30]]) ellipse(ctx, c.x + dx * c.s, c.y + dy * c.s, r * c.s, r * c.s * 0.8, 'rgba(255,255,255,0.9)');
    }
    // 뒤쪽 건물 → 영웅 → 앞쪽 건물 순서로 그려 겹침이 자연스럽게
    const items = [
      ...BUILDINGS.map(b => ({ z: b.y, draw: () => { b.draw(ctx, b, now); label(ctx, b, badges[b.key]); } })),
      ...walkers.map(w => ({ z: w.y, draw: () => drawWalker(w, now) })),
    ].sort((a, b) => a.z - b.z);
    for (const w of walkers) stepWalker(w, dt);
    for (const it of items) it.draw();
    if (hint) {
      const b = BUILDINGS.find(x => x.key === hint.building);
      if (b) hintRect = bubble(ctx, b.x, b.key === 'summon' ? b.y - 150 : b.y - b.h + 10, hint.text, now);
    }
  };
  function stepWalker(w, dt) {
    if (w.wait > 0) { w.wait -= dt; return; }
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    if (d < 4) { w.wait = 1200 + rng() * 2500; pickTarget(w); return; }
    const sp = (38 * dt) / 1000;
    w.x += (dx / d) * sp; w.y += (dy / d) * sp;
    if (Math.abs(dx) > 2) w.dir = dx > 0 ? 1 : -1;
    w.phase += dt / 140;
  }
  function drawWalker(w, now) {
    const moving = w.wait <= 0;
    const bob = moving ? Math.abs(Math.sin(w.phase)) * -6 : Math.sin(now / 700 + w.x) * -1.5;
    ctx.save();
    ellipse(ctx, w.x, w.y, 24, 7, 'rgba(0,0,0,0.18)');
    ctx.translate(w.x, w.y + bob);
    ctx.scale(w.dir, 1);
    ctx.drawImage(w.img, -55, -95, 110, 110);
    ctx.restore();
  }
  raf = requestAnimationFrame(frame);

  const toLocal = e => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * TW, y: ((e.clientY - r.top) / r.height) * TH };
  };
  const onClick = e => {
    const p = toLocal(e);
    // 안내 말풍선을 누르면 그 건물로
    if (hintRect && p.x > hintRect.x0 && p.x < hintRect.x1 && p.y > hintRect.y0 && p.y < hintRect.y1) return onBuilding?.(hint.building);
    // 영웅 먼저(앞에 있으니까)
    const w = [...walkers].sort((a, b) => b.y - a.y).find(w => Math.abs(p.x - w.x) < 34 && p.y < w.y + 10 && p.y > w.y - 80);
    if (w) return onHero?.(w.id);
    const b = [...BUILDINGS].sort((a, c) => c.y - a.y).find(b => p.x > b.x - b.w / 2 - 10 && p.x < b.x + b.w / 2 + 10 && p.y > b.y - b.h - 40 && p.y < b.y + 46);
    if (b) onBuilding?.(b.key);
  };
  canvas.addEventListener('click', onClick);

  function stop() {
    alive = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('click', onClick);
  }
  return stop;
}
