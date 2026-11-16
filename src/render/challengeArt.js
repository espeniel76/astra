// 도전 화면 그림: 무한의 탑 · 요일 던전 입구 셋 · 친구 대전 경기장. Canvas 2D, 화면 밀도만큼 촘촘하게.
import { SCREEN_RES } from './portrait.js';

const lg = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
const rg = (ctx, x, y, r, stops) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; };
const OUT = '#141022';
function fillOut(ctx, fill, lw = 2.5, out = OUT) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = out; ctx.lineJoin = 'round'; ctx.stroke(); }
function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); }
let seed = 1;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
function stars(ctx, w, h, n) { for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 0.6 + rnd() * 1.4, 0, Math.PI * 2); ctx.fill(); } }
function ridge(ctx, w, base, pts, fill) { ctx.beginPath(); ctx.moveTo(0, base); for (const [x, y] of pts) ctx.lineTo(x * w, y); ctx.lineTo(w, base); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }

// ── 무한의 탑(360×300): 밤하늘, 구름 위로 끝없이 솟은 돌탑, 꼭대기의 빛 ──
function tower(ctx, w, h, { floor = 1 } = {}) {
  seed = 11;
  ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#0a0820'], [0.6, '#2a2058'], [1, '#4a3a7a']]); ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h * 0.7, 70);
  ctx.fillStyle = rg(ctx, w / 2, 20, 120, [[0, 'rgba(255,240,180,0.55)'], [1, 'rgba(255,240,180,0)']]); ctx.fillRect(0, 0, w, 160);
  ridge(ctx, w, h, [[0, h * 0.82], [0.15, h * 0.7], [0.3, h * 0.78], [0.5, h * 0.66], [0.7, h * 0.76], [0.85, h * 0.68], [1, h * 0.8]], '#1e1840');
  const cx = w / 2;
  // 탑: 아래가 넓고 위로 갈수록 좁아지는 층들(위쪽은 하늘로 사라짐)
  const segs = 7;
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const y0 = h - 18 - t0 * (h - 40), y1 = h - 18 - t1 * (h - 40);
    const w0 = 64 - t0 * 34, w1 = 64 - t1 * 34;
    poly(ctx, [[cx - w0, y0], [cx + w0, y0], [cx + w1, y1], [cx - w1, y1]]);
    fillOut(ctx, lg(ctx, cx - w0, 0, cx + w0, 0, [[0, '#6a6488'], [0.45, '#b8b0d0'], [1, '#4a4468']]), 2);
    // 층마다 띠와 불 켜진 창
    ctx.fillStyle = 'rgba(40,30,70,0.55)'; ctx.fillRect(cx - w1 - 2, y1 - 2, (w1 + 2) * 2, 5);
    const win = Math.max(2, Math.round(w1 / 14));
    for (let k = 0; k < win; k++) {
      const x = cx - w1 + ((k + 0.5) * (w1 * 2)) / win, y = (y0 + y1) / 2;
      ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.roundRect(x - 3, y - 6, 6, 11, [3, 3, 0, 0]); ctx.fill();
      ctx.fillStyle = rg(ctx, x, y, 10, [[0, 'rgba(255,211,106,0.5)'], [1, 'rgba(255,211,106,0)']]); ctx.fillRect(x - 10, y - 10, 20, 20);
    }
  }
  // 구름이 탑 허리를 감싼다
  for (const [x, y, r] of [[cx - 80, h * 0.45, 30], [cx - 50, h * 0.43, 24], [cx + 70, h * 0.4, 28], [cx + 100, h * 0.42, 20], [cx + 40, h * 0.44, 22], [cx - 110, h * 0.46, 18]]) {
    ctx.fillStyle = 'rgba(200,190,240,0.75)'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  }
  // 꼭대기: 빛기둥과 별
  ctx.fillStyle = lg(ctx, 0, 0, 0, 80, [[0, 'rgba(255,246,200,0)'], [1, 'rgba(255,246,200,0.55)']]);
  poly(ctx, [[cx - 10, 0], [cx + 10, 0], [cx + 26, 70], [cx - 26, 70]]); ctx.fill();
  // 아래 문 + 깃발
  ctx.beginPath(); ctx.roundRect(cx - 14, h - 46, 28, 28, [14, 14, 0, 0]); fillOut(ctx, '#2a1a3a', 2);
  ctx.fillStyle = rg(ctx, cx, h - 30, 22, [[0, 'rgba(255,200,100,0.6)'], [1, 'rgba(255,200,100,0)']]); ctx.fillRect(cx - 22, h - 52, 44, 40);
  for (const sx of [-1, 1]) {
    const x = cx + sx * 74; ctx.fillStyle = '#3a3050'; ctx.fillRect(x - 1.5, h - 80, 3, 62);
    poly(ctx, [[x, h - 80], [x + sx * 26, h - 72], [x, h - 62]]); fillOut(ctx, '#7a4aa8', 1.5);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, h - 18, w, 18);
  void floor;
}

// ── 요일 던전 입구(360×120) ──
function goldCave(ctx, w, h) {
  seed = 21;
  ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#ffb86a'], [0.55, '#ffe0a0'], [1, '#e8b870']]); ctx.fillRect(0, 0, w, h);
  ridge(ctx, w, h, [[0, h * 0.7], [0.2, h * 0.55], [0.4, h * 0.65], [0.6, h * 0.5], [0.8, h * 0.62], [1, h * 0.55]], '#e0a868');
  // 바위 절벽과 동굴 입구
  poly(ctx, [[w * 0.45, h], [w * 0.5, h * 0.18], [w * 0.68, h * 0.08], [w * 0.9, h * 0.2], [w, h * 0.35], [w, h]]);
  fillOut(ctx, lg(ctx, 0, 0, 0, h, [[0, '#c8823a'], [1, '#7a4a1a']]), 2.5, '#4a2a0a');
  ctx.beginPath(); ctx.moveTo(w * 0.58, h); ctx.quadraticCurveTo(w * 0.6, h * 0.35, w * 0.72, h * 0.32); ctx.quadraticCurveTo(w * 0.86, h * 0.35, w * 0.88, h); ctx.closePath();
  ctx.fillStyle = rg(ctx, w * 0.73, h * 0.8, 70, [[0, '#fff3b0'], [0.4, '#ffc23a'], [1, '#3a1e04']]); ctx.fill();
  // 쏟아져 나온 금화 더미
  for (let i = 0; i < 26; i++) {
    const x = w * 0.6 + rnd() * w * 0.32, y = h - 6 - rnd() * 22 * (1 - Math.abs(x / w - 0.74) * 3);
    ctx.beginPath(); ctx.ellipse(x, y, 6, 3.4, 0, 0, Math.PI * 2); fillOut(ctx, rnd() < 0.5 ? '#ffd23a' : '#ffe680', 1.2, '#8a5a08');
  }
  // 선인장
  ctx.fillStyle = '#4f8a3a'; ctx.beginPath(); ctx.roundRect(w * 0.14, h * 0.45, 12, h * 0.55, 6); ctx.fill(); ctx.beginPath(); ctx.roundRect(w * 0.14 - 14, h * 0.58, 10, 20, 5); ctx.fill(); ctx.fillRect(w * 0.14 - 14, h * 0.72, 16, 6);
}
function crystalMine(ctx, w, h) {
  seed = 31;
  ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#0e1a30'], [1, '#26304c']]); ctx.fillRect(0, 0, w, h);
  ridge(ctx, w, h, [[0, h * 0.4], [0.25, h * 0.25], [0.5, h * 0.35], [0.75, h * 0.2], [1, h * 0.32]], '#1a2440');
  // 광산 입구: 나무 기둥 틀 + 레일
  const x0 = w * 0.52, x1 = w * 0.82;
  ctx.beginPath(); ctx.roundRect(x0, h * 0.28, x1 - x0, h * 0.72, [30, 30, 0, 0]); ctx.fillStyle = rg(ctx, (x0 + x1) / 2, h, 80, [[0, '#9ae8ff'], [0.35, '#2a5a8a'], [1, '#050a14']]); ctx.fill();
  for (const x of [x0 - 4, x1 - 6]) { ctx.beginPath(); ctx.rect(x, h * 0.28, 10, h * 0.72); fillOut(ctx, '#7a5432', 2, '#3a2410'); }
  ctx.beginPath(); ctx.rect(x0 - 10, h * 0.24, x1 - x0 + 20, 11); fillOut(ctx, '#8a6038', 2, '#3a2410');
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.6, h * 0.62); ctx.lineTo(w * 0.42, h); ctx.moveTo(w * 0.74, h * 0.62); ctx.lineTo(w * 0.9, h); ctx.stroke();
  // 수정 무리
  const cr = (x, y, s, c) => {
    ctx.fillStyle = rg(ctx, x, y - 20 * s, 44 * s, [[0, c.replace('1)', '0.45)')], [1, c.replace('1)', '0)')]]); ctx.fillRect(x - 44 * s, y - 64 * s, 88 * s, 88 * s);
    for (const [dx, hh, ww] of [[-9, 32, 7], [3, 46, 9], [14, 26, 6]]) { poly(ctx, [[x + dx * s - ww * s, y], [x + dx * s, y - hh * s], [x + dx * s + ww * s, y]]); fillOut(ctx, c, 1.6, '#1a1a40'); }
  };
  cr(w * 0.18, h, 1.2, 'rgba(110,220,255,1)'); cr(w * 0.36, h * 0.95, 0.8, 'rgba(190,130,255,1)'); cr(w * 0.95, h, 1, 'rgba(110,220,255,1)');
}
function starAltar(ctx, w, h) {
  seed = 41;
  ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#06041a'], [1, '#2a1a50']]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = rg(ctx, w * 0.3, h * 0.3, 120, [[0, 'rgba(140,80,220,0.35)'], [1, 'rgba(140,80,220,0)']]); ctx.fillRect(0, 0, w, h);
  stars(ctx, w, h, 60);
  // 떠 있는 제단: 둥근 돌판 + 기둥 둘 + 위에 빛나는 상자
  const cx = w * 0.7, cy = h * 0.82;
  ctx.beginPath(); ctx.ellipse(cx, cy, 70, 16, 0, 0, Math.PI * 2); fillOut(ctx, lg(ctx, 0, cy - 16, 0, cy + 16, [[0, '#8a7ab8'], [1, '#3a2a68']]), 2);
  poly(ctx, [[cx - 60, cy + 4], [cx + 60, cy + 4], [cx + 30, cy + 34], [cx - 30, cy + 34]]); fillOut(ctx, '#2a2048', 2);
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.rect(cx + sx * 50 - 6, cy - 54, 12, 52); fillOut(ctx, lg(ctx, cx + sx * 50 - 6, 0, cx + sx * 50 + 6, 0, [[0, '#b8b0d8'], [1, '#6a6090']]), 1.8); }
  ctx.fillStyle = rg(ctx, cx, cy - 34, 50, [[0, 'rgba(255,230,140,0.8)'], [1, 'rgba(255,200,80,0)']]); ctx.fillRect(cx - 50, cy - 84, 100, 100);
  ctx.beginPath(); ctx.roundRect(cx - 16, cy - 40, 32, 24, 5); fillOut(ctx, lg(ctx, 0, cy - 40, 0, cy - 16, [[0, '#ffe680'], [1, '#c8861a']]), 2, '#5a3000');
  ctx.fillStyle = '#7a3a10'; ctx.fillRect(cx - 16, cy - 31, 32, 4); ctx.fillRect(cx - 2, cy - 40, 4, 24);
  // 위의 큰 별
  const sy = h * 0.22, pts = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 6 : 15; pts.push([cx + Math.cos(a) * r, sy + Math.sin(a) * r]); }
  ctx.fillStyle = rg(ctx, cx, sy, 34, [[0, 'rgba(255,240,180,0.7)'], [1, 'rgba(255,240,180,0)']]); ctx.fillRect(cx - 34, sy - 34, 68, 68);
  poly(ctx, pts); fillOut(ctx, '#fff3b0', 1.6, '#8a6410');
}

// ── 친구 대전 경기장(360×140): 돌 경기장 벽, 깃발, 엇갈린 두 검 + VS ──
function arena(ctx, w, h) {
  seed = 51;
  ctx.fillStyle = lg(ctx, 0, 0, 0, h, [[0, '#ff9a6a'], [0.5, '#ffd0a0'], [1, '#e8c890']]); ctx.fillRect(0, 0, w, h);
  // 경기장 벽(아치 줄)
  ctx.fillStyle = '#b8a888'; ctx.fillRect(0, h * 0.32, w, h * 0.42);
  ctx.fillStyle = '#9a8a6a'; ctx.fillRect(0, h * 0.32, w, 6);
  for (let i = 0; i < 9; i++) {
    const x = 10 + i * (w / 9);
    ctx.beginPath(); ctx.roundRect(x, h * 0.42, w / 9 - 16, h * 0.32, [14, 14, 0, 0]); ctx.fillStyle = '#5a4a3a'; ctx.fill();
  }
  for (let i = 0; i < 6; i++) { // 깃발(보라·금)
    const x = 26 + i * (w / 6);
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x, h * 0.08, 2.5, h * 0.26);
    poly(ctx, [[x + 2, h * 0.08], [x + 22, h * 0.13], [x + 2, h * 0.19]]); fillOut(ctx, i % 2 ? '#ffd23a' : '#7a4aa8', 1.2);
  }
  ctx.fillStyle = lg(ctx, 0, h * 0.74, 0, h, [[0, '#d8b880'], [1, '#b89058']]); ctx.fillRect(0, h * 0.74, w, h * 0.26);
  // 엇갈린 두 검
  const cx = w / 2, cy = h * 0.55;
  for (const sx of [-1, 1]) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(sx * 0.7);
    poly(ctx, [[-5, 30], [-5, -38], [0, -48], [5, -38], [5, 30]]); fillOut(ctx, lg(ctx, -5, 0, 5, 0, [[0, '#ffffff'], [1, '#9aa6b2']]), 2);
    ctx.beginPath(); ctx.roundRect(-16, 28, 32, 7, 3); fillOut(ctx, '#ffd23a', 2, '#5a3a00');
    ctx.beginPath(); ctx.roundRect(-3.5, 35, 7, 16, 3); fillOut(ctx, '#5a3a22', 2);
    ctx.restore();
  }
  ctx.fillStyle = rg(ctx, cx, cy, 60, [[0, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(cx - 60, cy - 60, 120, 120);
  ctx.font = '900 34px "Malgun Gothic", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 7; ctx.strokeStyle = '#3a1a08'; ctx.strokeText('VS', cx, cy + 4);
  ctx.fillStyle = lg(ctx, 0, cy - 16, 0, cy + 20, [[0, '#fff3b0'], [1, '#ff9a2a']]); ctx.fillText('VS', cx, cy + 4);
}

const DRAW = { tower, gold: goldCave, dia: crystalMine, gear: starAltar, arena };

// 그림 캔버스(CSS 크기 w×h, 화면 밀도만큼 촘촘하게)
export function challengeArt(kind, w, h, opts = {}) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * SCREEN_RES); c.height = Math.round(h * SCREEN_RES);
  c.style.width = '100%'; c.style.aspectRatio = `${w} / ${h}`; c.style.display = 'block';
  const ctx = c.getContext('2d');
  ctx.scale(SCREEN_RES, SCREEN_RES);
  DRAW[kind](ctx, w, h, opts);
  return c;
}
