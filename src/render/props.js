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
export const TREE_TIPS = [[160, 360], [570, 330], [110, 520], [620, 500], [210, 640], [520, 620], [360, 180], [260, 250], [470, 240]];
function trunk(ctx) {
  const cx = 360, b = TREE.base;
  // 뿌리
  for (const [dx, len] of [[-1, 120], [1, 130], [-1, 70], [1, 80]]) {
    ctx.beginPath(); ctx.moveTo(cx + dx * 30, b - 30); ctx.quadraticCurveTo(cx + dx * (len * 0.6), b - 10, cx + dx * len, b + 6);
    ctx.lineTo(cx + dx * (len - 14), b + 10); ctx.quadraticCurveTo(cx + dx * (len * 0.5), b, cx + dx * 10, b - 6); ctx.closePath();
    fillOut(ctx, '#6b4a2e', 3, '#3a2412');
  }
  // 가지(줄기에서 잎 덩어리까지)
  ctx.lineCap = 'round';
  for (const [x, y] of TREE_TIPS) {
    const sy = Math.min(b - 160, y + 140);
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 22 - (b - y) / 60;
    ctx.beginPath(); ctx.moveTo(cx, sy); ctx.quadraticCurveTo((cx + x) / 2, sy - 30, x, y); ctx.stroke();
    ctx.strokeStyle = '#7a5232'; ctx.lineWidth = 16 - (b - y) / 60;
    ctx.beginPath(); ctx.moveTo(cx, sy); ctx.quadraticCurveTo((cx + x) / 2, sy - 30, x, y); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // 줄기(아래가 넓고 위로 가늘어짐) + 나무껍질 결
  path(ctx, [[cx - 62, b], [cx - 26, 300], [cx - 10, 150], [cx + 10, 150], [cx + 26, 300], [cx + 62, b]]);
  fillOut(ctx, lg(ctx, cx - 62, 0, cx + 62, 0, [[0, '#9a6a3a'], [0.45, '#7a5232'], [1, '#4a3018']]), 4, '#2a1808');
  ctx.strokeStyle = 'rgba(42,24,8,0.5)'; ctx.lineWidth = 3;
  for (const dx of [-30, -10, 14, 34]) { ctx.beginPath(); ctx.moveTo(cx + dx, b - 20); ctx.quadraticCurveTo(cx + dx * 0.6 + 6, 600, cx + dx * 0.3, 260); ctx.stroke(); }
  // 줄기 가운데 빛나는 금빛 무늬
  ctx.strokeStyle = 'rgba(255,216,74,0.8)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx, b - 60); ctx.quadraticCurveTo(cx - 10, 700, cx + 6, 560); ctx.quadraticCurveTo(cx + 14, 460, cx - 4, 380); ctx.stroke();
}
function canopy(ctx) {
  for (const [x, y] of TREE_TIPS) {
    for (const [dx, dy, r, c] of [[0, 0, 70, '#2f6f2a'], [-34, 16, 48, '#2f6f2a'], [36, 14, 50, '#2f6f2a'], [-10, -14, 54, '#4f9e3a'], [22, -4, 40, '#5fae4a'], [-22, -26, 32, '#8fd86a'], [10, -34, 24, '#a8e88a']]) {
      ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r, r * 0.86, 0, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
    }
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,50,16,0.5)';
    ctx.beginPath(); ctx.ellipse(x, y + 6, 76, 62, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  }
}

const DEFS = {
  spear: [64, 300, spear], sword: [80, 320, sword], shard: [80, 80, shard], feather: [32, 64, feather], petal: [28, 20, petal],
  treeTrunk: [TREE.w, TREE.h, trunk], treeCanopy: [TREE.w, TREE.h, canopy],
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
