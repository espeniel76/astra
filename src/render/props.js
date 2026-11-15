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
export const TREE_TIPS = [[360, 140], [230, 200], [490, 190], [140, 300], [580, 290], [280, 330], [440, 320], [100, 410], [620, 400]];
// 세계수 줄기: 넓게 퍼진 뿌리 → 굵은 줄기 → 위에서 네 갈래로 갈라져 잎 덩어리 속으로 들어간다
function trunk(ctx) {
  const cx = 360, b = TREE.base;
  const bark = lg(ctx, cx - 110, 0, cx + 110, 0, [[0, '#a8784a'], [0.4, '#7a5232'], [1, '#3e2814']]);
  // 뿌리(땅 위로 드러난 굵은 뿌리)
  for (const [s, len, h] of [[-1, 230, 46], [1, 240, 50], [-1, 150, 30], [1, 160, 32]]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 40, b - h * 2.2);
    ctx.bezierCurveTo(cx + s * 80, b - h, cx + s * len * 0.6, b - 8, cx + s * len, b + 6);
    ctx.lineTo(cx + s * (len - 30), b + 10);
    ctx.bezierCurveTo(cx + s * len * 0.5, b + 2, cx + s * 60, b - 4, cx + s * 20, b);
    ctx.closePath();
    fillOut(ctx, bark, 4, '#2a1808');
  }
  // 위쪽 큰 가지 네 갈래(잎 덩어리 속으로)
  for (const [ex, ey, w] of [[150, 300, 34], [570, 290, 34], [270, 200, 30], [460, 190, 30]]) {
    ctx.beginPath();
    ctx.moveTo(cx - w, 470); ctx.quadraticCurveTo((cx + ex) / 2 - w / 2, (470 + ey) / 2 + 30, ex - w / 3, ey);
    ctx.lineTo(ex + w / 3, ey - 6); ctx.quadraticCurveTo((cx + ex) / 2 + w / 2, (470 + ey) / 2 + 20, cx + w, 470);
    ctx.closePath();
    fillOut(ctx, bark, 4, '#2a1808');
  }
  // 굵은 줄기(아래가 넓게 퍼짐)
  ctx.beginPath();
  ctx.moveTo(cx - 120, b);
  ctx.bezierCurveTo(cx - 70, b - 60, cx - 64, 640, cx - 56, 450);
  ctx.lineTo(cx + 56, 450);
  ctx.bezierCurveTo(cx + 64, 640, cx + 70, b - 60, cx + 120, b);
  ctx.closePath();
  fillOut(ctx, bark, 5, '#2a1808');
  // 나무껍질 결
  ctx.strokeStyle = 'rgba(42,24,8,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const dx of [-60, -30, 4, 34, 62]) {
    ctx.beginPath(); ctx.moveTo(cx + dx * 1.4, b - 10); ctx.bezierCurveTo(cx + dx, 760, cx + dx * 0.8, 620, cx + dx * 0.7, 470); ctx.stroke();
  }
  // 옹이 구멍과 빛나는 금빛 무늬(세계수의 힘)
  ctx.beginPath(); ctx.ellipse(cx + 26, 640, 16, 24, 0, 0, Math.PI * 2); fillOut(ctx, '#2a1808', 3, '#1a0e04');
  ctx.strokeStyle = 'rgba(255,224,102,0.9)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx - 20, b - 40); ctx.bezierCurveTo(cx - 40, 760, cx + 10, 700, cx - 8, 600); ctx.bezierCurveTo(cx - 24, 540, cx + 10, 500, cx, 460); ctx.stroke();
  ctx.lineCap = 'butt';
}
// 잎: 하나로 이어진 커다란 둥근 수관(아래는 진하게, 위는 밝게) + 빛 반점
function canopy(ctx) {
  const cx = 360, cy = 280;
  const blobs = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    blobs.push([cx + Math.cos(a) * 270, cy + Math.sin(a) * 150, 95]);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    blobs.push([cx + Math.cos(a) * 150, cy + Math.sin(a) * 80, 110]);
  }
  blobs.push([cx, cy, 160]);
  const layer = (dy, color, shrink) => {
    ctx.fillStyle = color;
    for (const [x, y, r] of blobs) { ctx.beginPath(); ctx.arc(x, y + dy, r - shrink, 0, Math.PI * 2); ctx.fill(); }
  };
  // 테두리처럼 보이게 한 겹 더 크게 진한 색
  layer(6, '#16340f', -5);
  layer(8, '#24521a', 0);
  layer(-6, '#3a7a2a', 14);
  // 잎 뭉치 결: 작은 덩어리를 겹쳐 울퉁불퉁하게(아래는 어둡게, 위는 밝게)
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * 280 * d, y = cy + Math.sin(a) * 160 * d - 10;
    const up = (cy + 160 - y) / 320; // 위로 갈수록 1
    const r = 22 + rnd() * 20;
    ctx.fillStyle = up > 0.75 ? '#8fd86a' : up > 0.5 ? '#6cbf4e' : up > 0.3 ? '#4f9e3a' : '#3a7a2a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(20,52,15,0.35)';
    ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.35, r * 0.7, 0, Math.PI * 0.9); ctx.fill();
  }
  // 반짝이는 금빛 잎(가만히 있음)
  ctx.fillStyle = 'rgba(255,224,102,0.85)';
  for (const [x, y] of [[cx - 200, cy + 40], [cx + 210, cy + 60], [cx - 60, cy - 60], [cx + 90, cy + 10], [cx - 120, cy + 110], [cx + 140, cy - 60]]) {
    ctx.beginPath(); ctx.ellipse(x, y, 7, 4, 0.6, 0, Math.PI * 2); ctx.fill();
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
