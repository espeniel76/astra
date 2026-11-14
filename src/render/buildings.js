// 마을 건물 그림(로비). 빛은 왼쪽 위에서. 진한 테두리 + 그라데이션 + 벽돌·기와 같은 결로 입체감을 준다.
// 가만히 있는 부분은 한 번만 그려 캐시하고(buildingSprite), 움직이는 부분(별·연기·횃불)은 매 프레임 그린다(buildingFx).
// 좌표: (0, 0) = 건물 바닥 가운데, 위쪽이 음수.

const OUT = '#2e2236';

function rgb(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(c, amt) {
  const f = v => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `#${rgb(c).map(v => f(v).toString(16).padStart(2, '0')).join('')}`;
}
function hgrad(ctx, x0, x1, c) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(c, 0.28)); g.addColorStop(0.45, c); g.addColorStop(1, shade(c, -0.32));
  return g;
}
function vgrad(ctx, y0, y1, c) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(c, 0.22)); g.addColorStop(1, shade(c, -0.18));
  return g;
}
function path(ctx, pts) { ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath(); }
function fillOut(ctx, fill, lw = 3, out = OUT) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = out; ctx.lineJoin = 'round'; ctx.stroke(); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function line(ctx, x0, y0, x1, y1, c, w = 2) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function shadow(ctx, rx, ry = rx * 0.22) {
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, rx);
  g.addColorStop(0, 'rgba(0,0,0,0.30)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.scale(1, ry / rx); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// 둥근 윗부분 창문(안쪽이 따뜻하게 빛남)
function archWindow(ctx, x, y, w, h, frame = '#6b4a2e') {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + w / 2); ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y); ctx.closePath();
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#ffb84a');
  fillOut(ctx, g, 3, frame);
  line(ctx, x, y - h + 2, x, y, frame, 2);
  line(ctx, x - w / 2, y - h * 0.45, x + w / 2, y - h * 0.45, frame, 2);
}
// 별 모양
function starPath(ctx, x, y, r1, r2, rot = 0, n = 5) {
  ctx.beginPath();
  for (let k = 0; k < n * 2; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / n + rot, r = k % 2 ? r2 : r1;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
// 기와/비늘 줄: 영역 안에 반원 줄을 깔아 지붕 결을 만든다
function scales(ctx, clipFn, x0, x1, y0, y1, c, size = 14) {
  ctx.save(); clipFn(); ctx.clip();
  for (let row = 0, y = y0; y < y1; y += size * 0.8, row++) {
    for (let x = x0 + (row % 2 ? size / 2 : 0); x < x1 + size; x += size) {
      ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI);
      ctx.strokeStyle = shade(c, -0.35); ctx.lineWidth = 1.6; ctx.stroke();
    }
  }
  ctx.restore();
}

// ── 별의 탑(소환) ──
function tower(ctx) {
  shadow(ctx, 95);
  // 돌계단 받침
  rrect(ctx, -78, -22, 156, 24, 10); fillOut(ctx, vgrad(ctx, -22, 2, '#c9c1b4'));
  rrect(ctx, -62, -36, 124, 18, 8); fillOut(ctx, vgrad(ctx, -36, -18, '#d6cfc4'));
  // 원통 몸체(아래가 살짝 넓음)
  const body = () => path(ctx, [[-54, -34], [-46, -238], [46, -238], [54, -34]]);
  body(); fillOut(ctx, hgrad(ctx, -54, 54, '#d9d0f0'));
  // 돌 줄(원통이라 살짝 휘어진 선) + 엇갈린 이음매
  ctx.save(); body(); ctx.clip();
  for (let i = 0, y = -60; y > -236; y -= 26, i++) {
    ctx.strokeStyle = 'rgba(80,60,120,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, y, 56, 6, 0, 0, Math.PI); ctx.stroke();
    for (const x of i % 2 ? [-30, 6, 38] : [-14, 22]) line(ctx, x, y + 4, x, y + 26, 'rgba(80,60,120,0.25)', 2);
  }
  ctx.restore();
  // 문(아치, 금테)
  ctx.beginPath(); ctx.moveTo(-24, -34); ctx.lineTo(-24, -86); ctx.arc(0, -86, 24, Math.PI, 0); ctx.lineTo(24, -34); ctx.closePath();
  fillOut(ctx, vgrad(ctx, -110, -34, '#6a3e9a'), 4, '#c9a24a');
  line(ctx, 0, -108, 0, -36, 'rgba(0,0,0,0.35)', 2);
  for (const x of [-7, 7]) { ctx.beginPath(); ctx.arc(x, -66, 2.6, 0, Math.PI * 2); ctx.fillStyle = '#ffd84a'; ctx.fill(); }
  // 창문 둘
  archWindow(ctx, -20, -146, 20, 34, '#5a3e8a');
  archWindow(ctx, 22, -196, 20, 34, '#5a3e8a');
  // 발코니 띠 + 성가퀴
  rrect(ctx, -64, -252, 128, 18, 6); fillOut(ctx, vgrad(ctx, -252, -234, '#bdb2dc'));
  for (let x = -60; x < 60; x += 24) { rrect(ctx, x, -268, 16, 18, 3); fillOut(ctx, hgrad(ctx, x, x + 16, '#cfc5ea'), 2.5); }
  // 깃발 두 개(발코니에 늘어뜨림)
  for (const fx of [-42, 42]) {
    path(ctx, [[fx - 11, -234], [fx + 11, -234], [fx + 11, -196], [fx, -186], [fx - 11, -196]]);
    fillOut(ctx, vgrad(ctx, -234, -186, '#6a4ab0'), 2.5);
    starPath(ctx, fx, -212, 6, 2.6); ctx.fillStyle = '#ffd84a'; ctx.fill();
  }
  // 윗층 + 원뿔 지붕(비늘 기와)
  const roof = () => path(ctx, [[-66, -270], [0, -372], [66, -270]]);
  roof(); fillOut(ctx, hgrad(ctx, -66, 66, '#7a52c8'));
  scales(ctx, roof, -66, 66, -360, -270, '#7a52c8', 16);
  ctx.beginPath(); ctx.ellipse(0, -270, 68, 9, 0, 0, Math.PI); fillOut(ctx, '#5a3a9a', 2.5);
  // 꼭대기 장대
  line(ctx, 0, -372, 0, -392, '#c9a24a', 5);
}
function towerFx(ctx, t) {
  // 꼭대기 별: 3초 주기로 천천히 밝아졌다 어두워짐 + 아주 천천히 돎(깜빡임 없음)
  const glow = 0.45 + 0.2 * Math.sin((t / 3000) * Math.PI * 2);
  const g = ctx.createRadialGradient(0, -410, 0, 0, -410, 80);
  g.addColorStop(0, `rgba(255,224,102,${glow})`); g.addColorStop(1, 'rgba(255,224,102,0)');
  ctx.fillStyle = g; ctx.fillRect(-80, -490, 160, 160);
  starPath(ctx, 0, -410, 24, 10, t / 8000);
  fillOut(ctx, '#ffe066', 3, '#b07a10');
  starPath(ctx, -4, -414, 8, 3.4, t / 8000);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
}

// ── 영웅의 집 ── 탑·문처럼 정면에서 본 모습(좌우 대칭)
function house(ctx) {
  shadow(ctx, 125);
  // 굴뚝(지붕 뒤)
  rrect(ctx, 44, -232, 24, 60, 3); fillOut(ctx, hgrad(ctx, 44, 68, '#a8826a'));
  for (const y of [-218, -202, -186]) line(ctx, 46, y, 66, y, 'rgba(60,40,30,0.35)', 1.5);
  rrect(ctx, 40, -240, 32, 10, 3); fillOut(ctx, '#8a6a4a', 2.5);
  // 벽(흰 회벽 + 나무 기둥)
  rrect(ctx, -84, -124, 168, 120, 4); fillOut(ctx, vgrad(ctx, -124, -4, '#f6ead2'));
  ctx.fillStyle = '#8a5a32';
  for (const x of [-84, -30, 24, 78]) ctx.fillRect(x, -124, 6, 120);
  ctx.fillRect(-84, -68, 168, 6);
  // 돌 기초
  rrect(ctx, -92, -14, 184, 16, 5); fillOut(ctx, vgrad(ctx, -14, 2, '#a8a094'));
  for (const x of [-60, -20, 20, 60]) line(ctx, x, -12, x, 0, 'rgba(60,50,40,0.35)', 1.5);
  // 지붕(양쪽으로 넉넉히 내민 처마 + 기와)
  const roof = () => path(ctx, [[-110, -116], [0, -216], [110, -116], [94, -104], [0, -180], [-94, -104]]);
  roof(); fillOut(ctx, hgrad(ctx, -108, 108, '#e05a48'));
  scales(ctx, roof, -108, 108, -212, -106, '#e05a48', 16);
  // 박공 벽 + 둥근 다락 창(별 문양)
  path(ctx, [[-84, -122], [0, -178], [84, -122]]); fillOut(ctx, vgrad(ctx, -178, -122, '#efe0c2'), 2.5);
  ctx.beginPath(); ctx.arc(0, -142, 14, 0, Math.PI * 2); fillOut(ctx, '#ffd98a', 3, '#8a5a32');
  starPath(ctx, 0, -142, 8, 3.4); ctx.fillStyle = '#d0503e'; ctx.fill();
  // 지붕 꼭대기 장식
  line(ctx, 0, -214, 0, -232, '#5a3a1e', 3);
  path(ctx, [[0, -232], [18, -226], [0, -220]]); fillOut(ctx, '#4a7cff', 2);
  // 가운데 문(둥근 윗부분) + 돌계단
  ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-18, -46); ctx.arc(0, -46, 18, Math.PI, 0); ctx.lineTo(18, -6); ctx.closePath();
  fillOut(ctx, vgrad(ctx, -64, -6, '#8a5a32'));
  for (const y of [-48, -34, -20]) line(ctx, -16, y, 16, y, 'rgba(0,0,0,0.25)', 1.5);
  ctx.beginPath(); ctx.arc(10, -26, 2.4, 0, Math.PI * 2); ctx.fillStyle = '#ffd84a'; ctx.fill();
  rrect(ctx, -26, -6, 52, 8, 3); fillOut(ctx, '#bdb5a8', 2);
  // 양쪽 창문 + 덧문 + 꽃 상자
  for (const cx of [-55, 55]) {
    rrect(ctx, cx - 14, -104, 28, 28, 3); fillOut(ctx, '#ffd98a', 3, '#8a5a32');
    line(ctx, cx, -104, cx, -76, '#8a5a32', 2); line(ctx, cx - 14, -90, cx + 14, -90, '#8a5a32', 2);
    rrect(ctx, cx - 21, -106, 7, 32, 2); fillOut(ctx, '#4a7cc0', 2);
    rrect(ctx, cx + 14, -106, 7, 32, 2); fillOut(ctx, '#4a7cc0', 2);
    rrect(ctx, cx - 18, -76, 36, 9, 2); fillOut(ctx, '#8a5a32', 2);
    for (const [dx, c] of [[-12, '#ff7aa8'], [-4, '#ffe066'], [4, '#ff7aa8'], [12, '#b9a6ff']]) { ctx.beginPath(); ctx.arc(cx + dx, -79, 3.8, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  }
  // 아래쪽 창(작은 둥근 창) 대신 벽 등불 둘
  for (const cx of [-32, 32]) { rrect(ctx, cx - 5, -52, 10, 13, 3); fillOut(ctx, '#ffd98a', 2, '#5a3a1e'); }
  // 영웅 문장 간판(왼쪽 벽에 걸린 방패)
  line(ctx, -84, -104, -104, -104, '#5a3a1e', 3);
  path(ctx, [[-116, -100], [-92, -100], [-92, -80], [-104, -68], [-116, -80]]); fillOut(ctx, vgrad(ctx, -100, -68, '#4a7cff'), 2.5);
  starPath(ctx, -104, -86, 6, 2.6); ctx.fillStyle = '#ffd84a'; ctx.fill();
  // 양옆 작은 덤불
  for (const sx of [-1, 1]) for (const [dx, dy, r] of [[0, -10, 14], [12 * sx, -6, 11]]) {
    ctx.beginPath(); ctx.arc(sx * 92 + dx, dy, r, 0, Math.PI * 2); fillOut(ctx, '#4f9a3e', 2, '#2e5a24');
  }
}
function houseFx(ctx, t) {
  // 굴뚝 연기: 천천히 올라가며 흐려짐(밝기 깜빡임 없음)
  for (let i = 0; i < 4; i++) {
    const k = ((t / 4200 + i / 4) % 1);
    ctx.beginPath(); ctx.arc(56 + Math.sin(k * 5 + i) * 6 + k * 18, -248 - k * 70, 7 + k * 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240,240,250,${0.55 * (1 - k)})`; ctx.fill();
  }
}

// ── 모험의 문 ──
function gate(ctx) {
  shadow(ctx, 120);
  // 계단
  rrect(ctx, -92, -14, 184, 16, 6); fillOut(ctx, vgrad(ctx, -14, 2, '#bdb5a8'));
  // 문 안: 멀리 보이는 모험의 세계
  const inner = () => { ctx.beginPath(); ctx.moveTo(-46, -14); ctx.lineTo(-46, -140); ctx.arc(0, -140, 46, Math.PI, 0); ctx.lineTo(46, -14); ctx.closePath(); };
  ctx.save(); inner(); ctx.clip();
  const sky = ctx.createLinearGradient(0, -190, 0, -14); sky.addColorStop(0, '#7fd0ff'); sky.addColorStop(0.55, '#e0f6ff'); sky.addColorStop(0.56, '#8fd86a'); sky.addColorStop(1, '#4f9e3a');
  ctx.fillStyle = sky; ctx.fillRect(-50, -190, 100, 180);
  path(ctx, [[-50, -92], [-22, -122], [0, -100], [24, -128], [50, -96], [50, -86], [-50, -86]]); ctx.fillStyle = '#9bb6d8'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -14); ctx.quadraticCurveTo(-4, -60, 2, -86); ctx.lineTo(6, -86); ctx.quadraticCurveTo(10, -60, 14, -14); ctx.closePath(); ctx.fillStyle = '#e3c98f'; ctx.fill();
  const rim = ctx.createRadialGradient(0, -90, 20, 0, -90, 90); rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(255,250,220,0.55)');
  ctx.fillStyle = rim; ctx.fillRect(-50, -190, 100, 180);
  ctx.restore();
  // 기둥 두 개(돌 블록)
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -84 : 46;
    for (let i = 0, y = -14; y > -150; y -= 27, i++) {
      rrect(ctx, x0 + (i % 2 ? 2 : 0), y - 27, 36, 27, 4);
      fillOut(ctx, hgrad(ctx, x0, x0 + 38, i % 2 ? '#c4bcae' : '#b6ae9f'), 2.5);
    }
    rrect(ctx, x0 - 4, -162, 46, 14, 4); fillOut(ctx, vgrad(ctx, -162, -148, '#d6cfc4'), 2.5);
  }
  // 아치(쐐기돌) + 가운데 이맛돌
  const R0 = 50, R1 = 84, n = 9;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 1) / n) * Math.PI;
    ctx.beginPath(); ctx.arc(0, -148, R1, a0, a1); ctx.arc(0, -148, R0, a1, a0, true); ctx.closePath();
    fillOut(ctx, i % 2 ? '#c4bcae' : '#b6ae9f', 2.5);
  }
  path(ctx, [[-16, -240], [16, -240], [12, -196], [-12, -196]]); fillOut(ctx, vgrad(ctx, -240, -196, '#e8d070'), 3, '#8a6a10');
  starPath(ctx, 0, -219, 9, 4); ctx.fillStyle = '#fff6c8'; ctx.fill();
  // 늘어진 깃발
  for (const fx of [-66, 66]) {
    path(ctx, [[fx - 12, -164], [fx + 12, -164], [fx + 12, -108], [fx, -96], [fx - 12, -108]]);
    fillOut(ctx, vgrad(ctx, -164, -96, '#3a6ae0'), 2.5);
    line(ctx, fx - 12, -158, fx + 12, -158, '#ffd84a', 3);
  }
  // 횃불 걸이
  for (const fx of [-96, 96]) {
    line(ctx, fx * 0.93, -96, fx, -104, '#4a3a2a', 4);
    rrect(ctx, fx - 6, -116, 12, 14, 3); fillOut(ctx, '#5a4a3a', 2.5);
  }
}
function gateFx(ctx, t) {
  // 횃불: 모양만 살랑(밝기는 그대로)
  for (const [fx, ph] of [[-96, 0], [96, 1.7]]) {
    const s = Math.sin(t / 380 + ph) * 2.5;
    ctx.beginPath(); ctx.moveTo(fx - 8, -116); ctx.quadraticCurveTo(fx - 9 + s, -134, fx + s * 1.5, -146); ctx.quadraticCurveTo(fx + 9 + s, -132, fx + 8, -116); ctx.closePath();
    ctx.fillStyle = '#ff9a3a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx - 4, -117); ctx.quadraticCurveTo(fx - 4 + s, -128, fx + s, -136); ctx.quadraticCurveTo(fx + 5 + s, -127, fx + 4, -117); ctx.closePath();
    ctx.fillStyle = '#ffe066'; ctx.fill();
  }
}

// ── 훈련장 ──
function training(ctx) {
  shadow(ctx, 120, 34);
  // 모래 바닥
  ctx.beginPath(); ctx.ellipse(0, -36, 110, 40, 0, 0, Math.PI * 2); fillOut(ctx, vgrad(ctx, -76, 4, '#e2c48a'), 3, '#9a7a4a');
  // 뒤쪽 울타리
  const rail = (front) => {
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI * (front ? -1 : 1);
      const x = Math.cos(a) * 112, y = -36 + Math.sin(a) * 42;
      rrect(ctx, x - 4, y - 30, 8, 32, 2); fillOut(ctx, '#9a6a3a', 2);
    }
    ctx.beginPath(); ctx.ellipse(0, -54, 112, 42, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#b07a44'; ctx.lineWidth = 4; ctx.stroke();
  };
  rail(false);
  // 무기 걸이(검·창·도끼)
  line(ctx, 42, -40, 58, -110, '#6b4a2e', 6); line(ctx, 94, -40, 78, -110, '#6b4a2e', 6); line(ctx, 50, -86, 88, -86, '#6b4a2e', 5);
  line(ctx, 58, -46, 58, -120, '#c9d3de', 4); line(ctx, 52, -92, 64, -92, '#c9a24a', 3);
  line(ctx, 70, -44, 70, -132, '#8a6436', 3); path(ctx, [[66, -132], [74, -132], [70, -146]]); fillOut(ctx, '#c9d3de', 2);
  line(ctx, 82, -46, 82, -114, '#8a6436', 3); path(ctx, [[82, -114], [96, -120], [96, -102], [82, -106]]); fillOut(ctx, '#c9d3de', 2);
  // 허수아비(볏짚 몸 + 자루 머리)
  line(ctx, -30, -30, -30, -128, '#6b4a2e', 7);
  line(ctx, -66, -98, 6, -98, '#6b4a2e', 6);
  rrect(ctx, -48, -114, 36, 52, 12); fillOut(ctx, vgrad(ctx, -114, -62, '#e2c46a'), 3, '#8a6a2a');
  for (const y of [-100, -86, -72]) line(ctx, -46, y, -14, y, 'rgba(120,90,30,0.5)', 2);
  ctx.beginPath(); ctx.arc(-30, -134, 18, 0, Math.PI * 2); fillOut(ctx, vgrad(ctx, -152, -116, '#d8c49a'), 3, '#8a6a2a');
  line(ctx, -37, -138, -33, -134, '#5a3a1e', 2.5); line(ctx, -33, -138, -37, -134, '#5a3a1e', 2.5);
  line(ctx, -27, -138, -23, -134, '#5a3a1e', 2.5); line(ctx, -23, -138, -27, -134, '#5a3a1e', 2.5);
  rrect(ctx, -22, -126, 9, 7, 2); fillOut(ctx, '#c8503e', 1.5);
  // 활쏘기 과녁
  line(ctx, -86, -36, -80, -80, '#6b4a2e', 4); line(ctx, -66, -36, -72, -80, '#6b4a2e', 4);
  for (const [r, c] of [[20, '#f4f0e6'], [15, '#d84a4a'], [10, '#f4f0e6'], [5, '#d84a4a']]) { ctx.beginPath(); ctx.arc(-76, -94, r, 0, Math.PI * 2); fillOut(ctx, c, r === 20 ? 3 : 1.2, r === 20 ? OUT : 'rgba(0,0,0,0.25)'); }
  line(ctx, -76, -94, -60, -104, '#6b4a2e', 2.5);
  // 앞쪽 울타리
  rail(true);
}

// ── 게시판 ──
function board(ctx) {
  shadow(ctx, 80);
  for (const x of [-52, 44]) { rrect(ctx, x, -126, 10, 126, 3); fillOut(ctx, hgrad(ctx, x, x + 10, '#7a5432')); rrect(ctx, x - 4, -10, 18, 10, 3); fillOut(ctx, '#a8a094', 2); }
  // 작은 지붕
  path(ctx, [[-72, -150], [0, -186], [72, -150], [64, -142], [0, -174], [-64, -142]]); fillOut(ctx, vgrad(ctx, -186, -142, '#c8503e'));
  // 판
  rrect(ctx, -62, -144, 124, 88, 6); fillOut(ctx, vgrad(ctx, -144, -56, '#c9946a'));
  for (const y of [-118, -90]) line(ctx, -60, y, 60, y, 'rgba(90,60,30,0.35)', 2);
  // 쪽지들(핀)
  for (const [x, y, w, h, c, a, pin] of [[-50, -134, 32, 38, '#fff6d8', -0.06, '#d84a4a'], [-10, -138, 30, 34, '#e8f4ff', 0.05, '#4a7cff'], [26, -132, 28, 40, '#ffe0e8', -0.04, '#3cb94e'], [-30, -96, 36, 30, '#fff6d8', 0.03, '#ffd84a']]) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(a);
    rrect(ctx, -w / 2, -h / 2, w, h, 2); fillOut(ctx, c, 1.5, 'rgba(0,0,0,0.3)');
    for (let k = 0; k < 3; k++) line(ctx, -w / 2 + 5, -h / 2 + 12 + k * 7, w / 2 - 5 - (k === 2 ? 8 : 0), -h / 2 + 12 + k * 7, 'rgba(0,0,0,0.25)', 1.5);
    ctx.beginPath(); ctx.arc(0, -h / 2 + 4, 3.2, 0, Math.PI * 2); ctx.fillStyle = pin; ctx.fill();
    ctx.restore();
  }
  // 걸린 등불
  line(ctx, 49, -126, 49, -112, '#3a2a1e', 2);
  rrect(ctx, 42, -112, 14, 18, 4); fillOut(ctx, '#ffd98a', 2.5, '#5a3a1e');
}

const DEFS = {
  summon: { draw: tower, fx: towerFx, top: 440 },
  heroes: { draw: house, fx: houseFx, top: 260 },
  adventure: { draw: gate, fx: gateFx, top: 250 },
  team: { draw: training, top: 160 },
  missions: { draw: board, top: 190 },
};

const cache = new Map();
// 건물 하나를 캔버스에 미리 그려 둔다(가로 300, 세로 = top + 30)
export function buildingSprite(key) {
  if (cache.has(key)) return cache.get(key);
  const d = DEFS[key];
  const c = document.createElement('canvas');
  c.width = 300; c.height = d.top + 30;
  const ctx = c.getContext('2d');
  ctx.translate(150, d.top);
  d.draw(ctx);
  const out = { canvas: c, ox: 150, oy: d.top };
  cache.set(key, out);
  return out;
}

export function drawBuilding(ctx, key, x, y, t, s = 1) {
  const sp = buildingSprite(key);
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.drawImage(sp.canvas, -sp.ox, -sp.oy);
  DEFS[key].fx?.(ctx, t);
  ctx.restore();
}
