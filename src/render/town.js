// 로비의 살아 있는 마을. 건물이 곧 메뉴이고, 가진 영웅들이 천천히 걸어 다닌다.
// startTown(canvas, opts) → stop(). 깜빡임 없음: 밝기 변화는 3초 주기로만.
import { heroCanvas } from './portrait.js';
import { makeRng } from '../core/rng.js';
import { drawBuilding } from './buildings.js';

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

// ── 건물들(그림은 buildings.js) ──
const draw = (ctx, b, t) => drawBuilding(ctx, b.key, b.x, b.y, t, b.s);
const BUILDINGS = [
  { key: 'summon', name: '별의 탑', x: 360, y: 455, s: 0.9, w: 150, h: 390, draw },
  { key: 'heroes', name: '영웅의 집', x: 140, y: 548, s: 1, w: 230, h: 240, draw },
  { key: 'adventure', name: '모험의 문', x: 595, y: 525, s: 0.85, w: 190, h: 215, draw },
  { key: 'team', name: '훈련장', x: 165, y: 775, s: 0.85, w: 200, h: 140, draw },
  { key: 'missions', name: '게시판', x: 565, y: 775, s: 0.85, w: 140, h: 165, draw },
];

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
