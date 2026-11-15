// ★7 애니메이션 소품 그림(창·검·별 조각·깃털·꽃잎·세계수). Canvas 2D로 한 번 그려 Phaser 텍스처로 쓴다.
// 건물 그림(buildings.js)과 같은 결: 진한 테두리 + 그라데이션 + 하이라이트.

const OUT = '#2e2236';
function path(ctx, pts) { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); }
function fillOut(ctx, fill, lw = 3, out = OUT) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = out; ctx.lineJoin = 'round'; ctx.stroke(); }
function lg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => g.addColorStop(t, c)); return g; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// 황금 창(위가 창끝). 64×300
function spear(ctx) {
  const cx = 32;
  // 자루: 금색 원통 + 감은 띠
  rr(ctx, cx - 6, 92, 12, 200, 6); fillOut(ctx, lg(ctx, cx - 6, 0, cx + 6, 0, [[0, '#fff3c0'], [0.45, '#e8b923'], [1, '#8a6410']]), 2.5, '#5a3a00');
  for (let y = 120; y < 280; y += 26) { ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 6, y); ctx.lineTo(cx + 6, y + 8); ctx.stroke(); }
  // 날개 달린 받침
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(cx, 96); ctx.quadraticCurveTo(cx + s * 30, 92, cx + s * 30, 70); ctx.quadraticCurveTo(cx + s * 18, 84, cx + s * 6, 82); ctx.closePath();
    fillOut(ctx, lg(ctx, cx, 70, cx + s * 30, 96, [[0, '#fff6c8'], [1, '#c8961a']]), 2.5, '#6a4a00');
  }
  // 창끝(마름모 칼날, 가운데 홈)
  path(ctx, [[cx, 2], [cx + 15, 52], [cx, 88], [cx - 15, 52]]);
  fillOut(ctx, lg(ctx, cx - 15, 0, cx + 15, 0, [[0, '#ffffff'], [0.5, '#ffe9a0'], [1, '#c8961a']]), 2.5, '#6a4a00');
  ctx.strokeStyle = 'rgba(138,100,16,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, 80); ctx.stroke();
  // 보석
  ctx.beginPath(); ctx.arc(cx, 86, 7, 0, Math.PI * 2); fillOut(ctx, '#7fd8ff', 2, '#2a5a8a');
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(cx - 2, 84, 2.2, 0, Math.PI * 2); ctx.fill();
}

// 은빛 장검(아래가 칼끝). 80×320
function sword(ctx) {
  const cx = 40;
  // 칼날(가운데 홈 + 양쪽 빛)
  path(ctx, [[cx - 11, 96], [cx + 11, 96], [cx + 11, 280], [cx, 316], [cx - 11, 280]]);
  fillOut(ctx, lg(ctx, cx - 11, 0, cx + 11, 0, [[0, '#ffffff'], [0.48, '#d7dde2'], [0.52, '#a8b4c0'], [1, '#e8ecf0']]), 2.5, '#2a2e33');
  ctx.strokeStyle = 'rgba(80,90,100,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 104); ctx.lineTo(cx, 276); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - 7, 100); ctx.lineTo(cx - 7, 278); ctx.stroke();
  // 가드(양쪽으로 휜 막대 + 가운데 보석)
  ctx.beginPath(); ctx.moveTo(cx - 36, 78); ctx.quadraticCurveTo(cx, 98, cx + 36, 78); ctx.lineTo(cx + 34, 90); ctx.quadraticCurveTo(cx, 108, cx - 34, 90); ctx.closePath();
  fillOut(ctx, lg(ctx, 0, 78, 0, 108, [[0, '#5a5f68'], [1, '#141418']]), 2.5, '#000000');
  ctx.beginPath(); ctx.arc(cx, 93, 7, 0, Math.PI * 2); fillOut(ctx, '#f4f4f4', 2, '#141418');
  // 손잡이(감은 끈) + 폼멜
  rr(ctx, cx - 7, 24, 14, 58, 4); fillOut(ctx, '#141418', 2.5, '#000000');
  ctx.strokeStyle = '#5a5f68'; ctx.lineWidth = 2;
  for (let y = 30; y < 80; y += 8) { ctx.beginPath(); ctx.moveTo(cx - 7, y); ctx.lineTo(cx + 7, y + 5); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, 16, 11, 0, Math.PI * 2); fillOut(ctx, lg(ctx, cx - 11, 5, cx + 11, 27, [[0, '#ffffff'], [1, '#8a8f99']]), 2.5, '#141418');
}

// 보랏빛 별 조각(면이 나뉜 수정 별). 80×80
function shard(ctx) {
  const c = 40, pts = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 15 : 36; pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]); }
  const glow = ctx.createRadialGradient(c, c, 4, c, c, 40); glow.addColorStop(0, 'rgba(216,176,255,0.6)'); glow.addColorStop(1, 'rgba(216,176,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 80, 80);
  path(ctx, pts); fillOut(ctx, '#e8d8ff', 2.5, '#4a1a8a');
  // 면: 가운데에서 각 꼭짓점으로 밝고 어두운 삼각형
  for (let k = 0; k < 10; k++) {
    const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % 10];
    ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.closePath();
    ctx.fillStyle = k % 2 ? 'rgba(176,106,255,0.45)' : 'rgba(255,255,255,0.35)'; ctx.fill();
  }
  path(ctx, pts); ctx.lineWidth = 2.5; ctx.strokeStyle = '#4a1a8a'; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(c - 6, c - 8, 3.5, 0, Math.PI * 2); ctx.fill();
}

// 깃털 32×64, 꽃잎 28×20
function feather(ctx) {
  ctx.beginPath(); ctx.moveTo(16, 2); ctx.quadraticCurveTo(30, 22, 18, 58); ctx.lineTo(14, 58); ctx.quadraticCurveTo(2, 22, 16, 2); ctx.closePath();
  fillOut(ctx, lg(ctx, 0, 0, 32, 0, [[0, '#ffffff'], [1, '#fff3c0']]), 1.5, '#c8961a');
  ctx.strokeStyle = '#c8961a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(16, 63); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,150,26,0.4)'; ctx.lineWidth = 1;
  for (let y = 14; y < 54; y += 7) { ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(8, y - 5); ctx.moveTo(16, y); ctx.lineTo(24, y - 5); ctx.stroke(); }
}
function petal(ctx) {
  ctx.beginPath(); ctx.moveTo(2, 10); ctx.quadraticCurveTo(10, -2, 26, 8); ctx.quadraticCurveTo(14, 20, 2, 10); ctx.closePath();
  fillOut(ctx, lg(ctx, 0, 0, 28, 0, [[0, '#ffe0f0'], [1, '#ff9ad0']]), 1.2, '#c85a98');
}

// 세계수: 줄기·가지·뿌리(720×900, 바닥이 y=880) / 잎사귀 덩어리(따로)
export const TREE = { w: 720, h: 900, base: 880 };
export const TREE_TIPS = [[360, 110], [210, 170], [510, 160], [110, 270], [610, 260], [270, 300], [450, 290], [60, 390], [660, 380], [360, 230]];
// 세계수 줄기: 세 가닥이 서로 꼬이며 올라가는 아주 굵은 줄기 + 땅 위로 넓게 뻗은 뿌리
function strand(ctx, k, front) {
  const cx = 360, b = TREE.base, top = 380;
  const phase = (k / 3) * Math.PI * 2;
  const left = [], right = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, y = b - (b - top) * t;
    const x = cx + (k - 1) * 46 * (1 - t * 0.5) + Math.sin(t * Math.PI * 2.2 + phase) * 34 * (1 - t * 0.2);
    const w = 92 * (1 - t * 0.45) + (t < 0.12 ? (0.12 - t) * 360 : 0); // 아래는 넓게 퍼짐
    left.push([x - w / 2, y]); right.push([x + w / 2, y]);
  }
  ctx.beginPath();
  ctx.moveTo(...left[0]);
  for (const p of left.slice(1)) ctx.lineTo(...p);
  for (const p of right.reverse()) ctx.lineTo(...p);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0);
  if (front) { g.addColorStop(0, '#b8885a'); g.addColorStop(0.5, '#8a5e38'); g.addColorStop(1, '#4e321a'); }
  else { g.addColorStop(0, '#7a5232'); g.addColorStop(0.5, '#5a3a20'); g.addColorStop(1, '#2e1c0c'); }
  fillOut(ctx, g, 5, '#1e1006');
  // 껍질 결(가닥을 따라 흐르는 선)
  ctx.save(); ctx.clip();
  ctx.strokeStyle = front ? 'rgba(60,36,16,0.45)' : 'rgba(20,10,4,0.45)'; ctx.lineWidth = 3;
  for (let j = -2; j <= 2; j++) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, y = b - (b - top) * t;
      const x = cx + (k - 1) * 46 * (1 - t * 0.5) + Math.sin(t * Math.PI * 2.2 + phase) * 34 * (1 - t * 0.2) + j * 12 * (1 - t * 0.4);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function trunk(ctx) {
  const cx = 360, b = TREE.base;
  // 뿌리: 땅을 따라 멀리 뻗는 굵은 뿌리 여섯 갈래(끝으로 갈수록 가늘어짐)
  ctx.lineCap = 'round';
  for (const [s, len, lift, w] of [[-1, 340, 30, 46], [1, 340, 34, 48], [-1, 230, 18, 36], [1, 240, 20, 36], [-1, 140, 8, 30], [1, 150, 10, 30]]) {
    for (const [lw, c] of [[w + 8, '#1e1006'], [w, '#6b4a2e'], [w * 0.45, '#8a6440']]) {
      ctx.strokeStyle = c; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(cx + s * 40, b - 60);
      ctx.bezierCurveTo(cx + s * 110, b - lift - 20, cx + s * len * 0.6, b - lift, cx + s * len, b + 4);
      ctx.stroke();
    }
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,224,102,0.75)'; // 뿌리를 따라 흐르는 금빛
    ctx.beginPath(); ctx.moveTo(cx + s * 60, b - 52); ctx.bezierCurveTo(cx + s * 120, b - lift - 14, cx + s * len * 0.6, b - lift + 4, cx + s * (len - 30), b);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // 꼬인 세 가닥(뒤 → 앞)
  strand(ctx, 0, false); strand(ctx, 2, false); strand(ctx, 1, true);
  // 위에서 갈라지는 큰 가지들(수관 속으로)
  for (const [ex, ey, w] of [[110, 300, 30], [610, 290, 30], [230, 190, 28], [490, 180, 28], [360, 150, 34]]) {
    ctx.beginPath();
    ctx.moveTo(cx - w, 420); ctx.quadraticCurveTo((cx + ex) / 2 - w / 2, (420 + ey) / 2 + 30, ex - w / 3, ey);
    ctx.lineTo(ex + w / 3, ey - 6); ctx.quadraticCurveTo((cx + ex) / 2 + w / 2, (420 + ey) / 2 + 20, cx + w, 420);
    ctx.closePath();
    fillOut(ctx, lg(ctx, cx - 100, 0, cx + 100, 0, [[0, '#9a6a3a'], [0.5, '#7a5232'], [1, '#4a3018']]), 4, '#1e1006');
  }
  // 줄기 가운데를 타고 오르는 금빛 무늬(세계수의 힘)
  ctx.strokeStyle = 'rgba(255,224,102,0.95)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, y = b - 40 - (b - 420) * t;
    const x = cx + Math.sin(t * Math.PI * 3) * 22;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
}
// 잎: 동그라미가 아니라 진짜 잎사귀 수백 장을 겹쳐 만든 커다란 수관.
// 뒤(아래·어두움)에서 앞(위·밝음) 순서로 그려 입체감을 낸다.
function canopy(ctx) {
  const cx = 360, cy = 250, RX = 320, RY = 190;
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  // 1) 그늘진 바탕 덩어리(가장자리는 잎으로 덮이므로 안쪽만)
  ctx.fillStyle = '#123010';
  ctx.beginPath(); ctx.ellipse(cx, cy + 10, RX - 30, RY - 24, 0, 0, Math.PI * 2); ctx.fill();
  // 2) 잎사귀
  const leaves = [];
  for (let i = 0; i < 1100; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6);
    const x = cx + Math.cos(a) * RX * d, y = cy + Math.sin(a) * RY * d;
    leaves.push({ x, y, a: rnd() * Math.PI * 2, len: 16 + rnd() * 10, v: rnd() });
  }
  leaves.sort((p, q) => q.y - p.y || p.x - q.x); // 아래(뒤)부터
  const PAL = ['#1e4a16', '#2a5e1e', '#357026', '#43852e', '#559a38', '#6db248', '#88c85a', '#a6dc74'];
  for (const L of leaves) {
    const up = 1 - (L.y - (cy - RY)) / (2 * RY); // 위쪽일수록 1
    const edge = Math.hypot((L.x - cx) / RX, (L.y - cy) / RY); // 가장자리일수록 1
    let idx = Math.round(up * 5 + L.v * 2.4 - edge * 1.2);
    idx = Math.max(0, Math.min(PAL.length - 1, idx));
    ctx.save();
    ctx.translate(L.x, L.y); ctx.rotate(L.a);
    ctx.beginPath();
    ctx.moveTo(-L.len / 2, 0);
    ctx.quadraticCurveTo(0, -L.len * 0.36, L.len / 2, 0);
    ctx.quadraticCurveTo(0, L.len * 0.36, -L.len / 2, 0);
    ctx.closePath();
    ctx.fillStyle = PAL[idx]; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(10,30,8,0.55)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-L.len / 2 + 2, 0); ctx.lineTo(L.len / 2 - 2, 0); ctx.stroke();
    ctx.restore();
  }
  // 3) 위쪽에 부드러운 빛(햇살이 닿는 느낌)
  const g = ctx.createRadialGradient(cx - 60, cy - 120, 10, cx - 60, cy - 120, 260);
  g.addColorStop(0, 'rgba(255,250,200,0.28)'); g.addColorStop(1, 'rgba(255,250,200,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, RX + 10, RY + 10, 0, 0, Math.PI * 2); ctx.fill();
  // 4) 금빛으로 빛나는 잎(가만히 있음)
  for (let i = 0; i < 22; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    ctx.save(); ctx.translate(cx + Math.cos(a) * 290 * d, cy + Math.sin(a) * 170 * d); ctx.rotate(rnd() * 3);
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(0, -5, 9, 0); ctx.quadraticCurveTo(0, 5, -9, 0); ctx.closePath();
    ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.strokeStyle = '#c8961a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

// ── ★7 애니메이션 배경 소품(2026-11-15 다시 보기) ──
let pseed = 3;
const prnd = () => ((pseed = (pseed * 9301 + 49297) % 233280) / 233280);
const softBlob = (ctx, x, y, r, rgba) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba); g.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
};

// 금빛 구름 덩어리(오른쪽이 안쪽 가장자리). 420×700
function cloudBank(ctx) {
  pseed = 21;
  for (let i = 0; i < 46; i++) {
    const x = 60 + prnd() * 300 + (i % 3) * 20, y = 30 + prnd() * 640, r = 60 + prnd() * 70;
    softBlob(ctx, x, y, r * 1.15, 'rgba(200,150,40,0.55)');
  }
  for (let i = 0; i < 60; i++) {
    const x = 40 + prnd() * 330, y = 30 + prnd() * 640, r = 40 + prnd() * 60;
    ctx.fillStyle = ['#fff6d8', '#ffeaa8', '#ffe08a', '#f7d27a'][i % 4];
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // 안쪽 가장자리 빛
  const g = ctx.createLinearGradient(260, 0, 420, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.7)');
  ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = g; ctx.fillRect(0, 0, 420, 700); ctx.globalCompositeOperation = 'source-over';
}

// 수호신 뒤의 거대한 황금 후광(룬이 새겨진 고리). 560×560
function halo(ctx) {
  const c = 280;
  softBlob(ctx, c, c, 280, 'rgba(255,240,180,0.55)');
  for (const [r, w, col] of [[230, 14, '#c8961a'], [230, 9, '#ffe066'], [200, 4, '#fff6c8'], [168, 6, '#e8b923']]) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
  }
  // 룬 눈금과 작은 별
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.save(); ctx.translate(c + Math.cos(a) * 215, c + Math.sin(a) * 215); ctx.rotate(a);
    ctx.fillStyle = '#8a6410'; ctx.fillRect(-2, -8, 4, 16);
    if (i % 3 === 0) { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  for (let i = 0; i < 8; i++) { // 바깥으로 뻗는 빛 가시
    const a = (i / 8) * Math.PI * 2;
    ctx.save(); ctx.translate(c, c); ctx.rotate(a);
    const g = ctx.createLinearGradient(240, 0, 280, 0); g.addColorStop(0, 'rgba(255,240,170,0.9)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(236, -10); ctx.lineTo(280, 0); ctx.lineTo(236, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// 성운(보라·파랑 구름 + 별). 720×1280
function nebula(ctx) {
  pseed = 33;
  ctx.fillStyle = '#04030c'; ctx.fillRect(0, 0, 720, 1280);
  for (let i = 0; i < 26; i++) {
    const x = prnd() * 720, y = prnd() * 1280, r = 120 + prnd() * 220;
    softBlob(ctx, x, y, r, ['rgba(120,60,200,0.22)', 'rgba(60,80,200,0.18)', 'rgba(200,80,160,0.14)'][i % 3]);
  }
  for (let i = 0; i < 260; i++) {
    const x = prnd() * 720, y = prnd() * 1280, r = prnd() < 0.08 ? 2.4 : 0.8 + prnd();
    ctx.fillStyle = prnd() < 0.2 ? '#d8c0ff' : '#ffffff'; ctx.globalAlpha = 0.4 + prnd() * 0.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// 블랙홀 강착 원반(납작한 빛의 고리 + 흐르는 줄무늬). 720×300, 가운데가 블랙홀
function accretion(ctx) {
  pseed = 47;
  const cx = 360, cy = 150;
  // 납작한 타원 모양으로 은은하게(캔버스 밖으로 넘치지 않게)
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42);
  softBlob(ctx, 0, 0, 340, 'rgba(176,106,255,0.35)');
  ctx.restore();
  for (let i = 0; i < 160; i++) {
    const rx = 110 + prnd() * 230, ry = rx * 0.3, a0 = prnd() * Math.PI * 2, len = 0.3 + prnd() * 0.9;
    const t = (rx - 110) / 230;
    ctx.strokeStyle = t < 0.25 ? 'rgba(255,240,255,0.9)' : t < 0.55 ? 'rgba(214,150,255,0.75)' : 'rgba(130,70,220,0.5)';
    ctx.lineWidth = 1.5 + prnd() * 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, a0 + len); ctx.stroke();
  }
}

// 정의의 저울(은빛, 거대한 실루엣). 600×520
function scales(ctx) {
  const cx = 300;
  const steel = lg(ctx, 0, 0, 600, 0, [[0, '#ffffff'], [0.5, '#c9d0d8'], [1, '#7a828c']]);
  rr(ctx, cx - 12, 60, 24, 400, 10); fillOut(ctx, steel, 4, '#1a1c20'); // 기둥
  path(ctx, [[cx - 90, 500], [cx + 90, 500], [cx + 50, 450], [cx - 50, 450]]); fillOut(ctx, steel, 4, '#1a1c20'); // 받침
  rr(ctx, cx - 260, 92, 520, 18, 9); fillOut(ctx, steel, 4, '#1a1c20'); // 가로대
  ctx.beginPath(); ctx.arc(cx, 70, 26, 0, Math.PI * 2); fillOut(ctx, steel, 4, '#1a1c20');
  for (const s of [-1, 1]) {
    const px = cx + s * 240;
    ctx.strokeStyle = '#3a3f45'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, 108); ctx.lineTo(px - 60, 300); ctx.moveTo(px, 108); ctx.lineTo(px + 60, 300); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, 300, 80, 22, 0, 0, Math.PI); fillOut(ctx, steel, 4, '#1a1c20'); // 접시
  }
}

// 바다 밑 실루엣(해초·산호). 720×360
function seabed(ctx) {
  pseed = 61;
  ctx.fillStyle = '#021014';
  ctx.beginPath(); ctx.moveTo(0, 360);
  for (let x = 0; x <= 720; x += 40) ctx.lineTo(x, 300 + Math.sin(x / 70) * 20 + prnd() * 14);
  ctx.lineTo(720, 360); ctx.closePath(); ctx.fill();
  ctx.lineCap = 'round';
  for (let i = 0; i < 22; i++) { // 해초
    const x = prnd() * 720, h = 120 + prnd() * 180;
    ctx.strokeStyle = prnd() < 0.5 ? '#06343a' : '#0a2a26'; ctx.lineWidth = 8 + prnd() * 8;
    ctx.beginPath(); ctx.moveTo(x, 330);
    ctx.bezierCurveTo(x + 30, 330 - h * 0.3, x - 30, 330 - h * 0.6, x + 10, 330 - h); ctx.stroke();
  }
  for (let i = 0; i < 8; i++) { // 산호 가지
    const x = 40 + prnd() * 640;
    ctx.strokeStyle = '#0a3a40'; ctx.lineWidth = 10;
    for (const [dx, h] of [[0, 90], [-24, 60], [22, 70]]) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + dx, 330 - h); ctx.stroke(); }
  }
  ctx.lineCap = 'butt';
}

// 거대한 바다 괴물의 그림자(눈이 뜨기 전에 지나감). 900×260
function leviathan(ctx) {
  ctx.fillStyle = 'rgba(2,20,24,0.85)';
  ctx.beginPath();
  ctx.moveTo(20, 140);
  ctx.bezierCurveTo(160, 40, 520, 30, 760, 110);
  ctx.bezierCurveTo(820, 130, 880, 90, 890, 60);
  ctx.bezierCurveTo(880, 120, 860, 170, 760, 170);
  ctx.bezierCurveTo(520, 230, 160, 220, 20, 140);
  ctx.closePath(); ctx.fill();
  for (const x of [240, 420, 600]) { // 지느러미
    ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 80, 62); ctx.closePath(); ctx.fill();
  }
}

const DEFS = {
  spear: [64, 300, spear], sword: [80, 320, sword], shard: [80, 80, shard], feather: [32, 64, feather], petal: [28, 20, petal],
  treeTrunk: [TREE.w, TREE.h, trunk], treeCanopy: [TREE.w, TREE.h, canopy],
  cloudBank: [420, 700, cloudBank], halo: [560, 560, halo], nebula: [720, 1280, nebula], accretion: [720, 300, accretion],
  scales: [600, 520, scales], seabed: [720, 360, seabed], leviathan: [900, 260, leviathan],
};

export function propTex(scene, name) {
  const key = `prop:${name}`;
  if (!scene.textures.exists(key)) {
    const [w, h, draw] = DEFS[name];
    const c = document.createElement('canvas');
    // 2배로 촘촘하게(표시할 때 0.5배)
    c.width = w * 2; c.height = h * 2;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2);
    draw(ctx);
    scene.textures.addCanvas(key, c);
  }
  return key;
}
