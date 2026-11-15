// 몬스터 그리기: 영웅과 같은 동그라미 몸 + 동공 없는 흰 눈. (x, y) = 발밑.
import { MONSTERS } from '../data/monsters.js';

function rgb(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function shade(c, amt) {
  const f = v => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `#${rgb(c).map(v => f(v).toString(16).padStart(2, '0')).join('')}`;
}
function fs(ctx, fill, lw = 2, stroke) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = stroke || (fill.startsWith('#') ? shade(fill, -0.6) : '#333'); ctx.lineJoin = 'round'; ctx.stroke();
}
function shadow(ctx, w = 22) {
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, w);
  g.addColorStop(0, 'rgba(0,0,0,0.38)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.scale(1, 0.3); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function bodyGrad(ctx, c, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 2, cx, cy, r * 1.25);
  g.addColorStop(0, shade(c, 0.4)); g.addColorStop(0.55, c); g.addColorStop(1, shade(c, -0.3));
  return g;
}
function eyes(ctx, y, gap = 7, r = 5.2, edge = '#222') {
  for (const x of [-gap + 1.5, gap + 1.5]) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = edge; ctx.stroke();
  }
}
function crown(ctx, y) {
  ctx.beginPath();
  ctx.moveTo(-12, y); ctx.lineTo(-14, y - 13); ctx.lineTo(-6, y - 6); ctx.lineTo(0, y - 16); ctx.lineTo(6, y - 6); ctx.lineTo(14, y - 13); ctx.lineTo(12, y);
  ctx.closePath(); fs(ctx, '#ffd84a', 1.6);
  for (const x of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(x, y - 3, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#ff4d6a'; ctx.fill(); }
}
function blob(ctx, c, cy, r) {
  ctx.beginPath(); ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad(ctx, c, 0, cy, r); ctx.fill();
  ctx.lineWidth = 2.6; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-r * 0.42, cy - r * 0.5, r * 0.26, r * 0.14, -0.7, 0, Math.PI * 2); ctx.fill();
}
function feet(ctx, c) {
  for (const fx of [-8, 8]) { ctx.beginPath(); ctx.ellipse(fx, -2.5, 6, 4, 0, 0, Math.PI * 2); fs(ctx, shade(c, -0.35), 2, shade(c, -0.6)); }
}

// 각 모양은 그린 뒤 머리 꼭대기 y를 돌려준다(왕관 위치)
const KIND = {
  slime(ctx, c) {
    shadow(ctx, 26);
    ctx.beginPath();
    ctx.moveTo(-24, 0); ctx.quadraticCurveTo(-26, -34, 0, -38); ctx.quadraticCurveTo(26, -34, 24, 0); ctx.quadraticCurveTo(0, 4, -24, 0);
    ctx.closePath();
    ctx.fillStyle = bodyGrad(ctx, c, 0, -18, 24); ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-10, -27, 6, 3.4, -0.6, 0, Math.PI * 2); ctx.fill();
    eyes(ctx, -17, 7, 5, shade(c, -0.6));
    return -38;
  },
  rat(ctx, c) {
    shadow(ctx);
    ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(-34, -8, -30, -24); ctx.stroke();
    feet(ctx, c);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(s * 13, -38, 8, 0, Math.PI * 2); fs(ctx, c);
      ctx.beginPath(); ctx.arc(s * 13, -38, 4, 0, Math.PI * 2); ctx.fillStyle = '#f0b8c0'; ctx.fill();
    }
    blob(ctx, c, -21, 19);
    eyes(ctx, -24, 6.5, 4.6, shade(c, -0.6));
    ctx.beginPath(); ctx.arc(17, -18, 3, 0, Math.PI * 2); ctx.fillStyle = '#f08aa0'; ctx.fill();
    return -46;
  },
  bee(ctx, c) {
    shadow(ctx, 16);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 12, -46, 9, 13, s * 0.5, 0, Math.PI * 2); fs(ctx, 'rgba(220,240,255,0.85)', 1.4, '#9ab8d0'); }
    ctx.save();
    ctx.beginPath(); ctx.arc(0, -30, 18, 0, Math.PI * 2); ctx.fillStyle = bodyGrad(ctx, c, 0, -30, 18); ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#2a2420'; for (const y of [-22, -14]) ctx.fillRect(-20, y, 40, 4);
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, -30, 18, 0, Math.PI * 2); ctx.lineWidth = 2.4; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(0, -5); ctx.lineTo(3, -12); ctx.fillStyle = '#2a2420'; ctx.fill();
    eyes(ctx, -34, 6, 4.6, shade(c, -0.6));
    return -58;
  },
  goblin(ctx, c) {
    shadow(ctx); feet(ctx, c);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 15, -34); ctx.lineTo(s * 32, -40); ctx.lineTo(s * 18, -24); ctx.closePath(); fs(ctx, c, 1.8); }
    blob(ctx, c, -23, 21);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -23, 19.6, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-22, -12, 44, 14); ctx.restore();
    eyes(ctx, -27, 7, 5, shade(c, -0.6));
    ctx.save(); ctx.translate(16, -18); ctx.rotate(-0.6);
    ctx.beginPath(); ctx.roundRect(0, -3, 22, 6, 3); fs(ctx, '#8a6436', 1.6);
    ctx.beginPath(); ctx.arc(22, 0, 6, 0, Math.PI * 2); fs(ctx, '#8a6436', 1.6); ctx.restore();
    return -46;
  },
  wolf(ctx, c) {
    shadow(ctx); feet(ctx, c);
    ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-36, -20, -30, -34); ctx.quadraticCurveTo(-26, -22, -14, -22); fs(ctx, c, 1.8);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -40); ctx.lineTo(s * 16, -56); ctx.lineTo(s * 19, -36); ctx.closePath(); fs(ctx, c, 1.8); }
    blob(ctx, c, -23, 21);
    ctx.beginPath(); ctx.ellipse(16, -16, 10, 7, 0, 0, Math.PI * 2); fs(ctx, shade(c, 0.35), 1.8);
    ctx.beginPath(); ctx.arc(24, -18, 3, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
    eyes(ctx, -28, 7, 4.8, shade(c, -0.6));
    return -56;
  },
  mushroom(ctx, c) {
    shadow(ctx); feet(ctx, '#e8dcc0');
    blob(ctx, '#f0e4c8', -18, 15);
    eyes(ctx, -18, 6, 4.4, '#8a7a5a');
    ctx.beginPath(); ctx.moveTo(-28, -28); ctx.quadraticCurveTo(-28, -58, 0, -58); ctx.quadraticCurveTo(28, -58, 28, -28); ctx.quadraticCurveTo(0, -36, -28, -28); ctx.closePath();
    ctx.fillStyle = bodyGrad(ctx, c, 0, -42, 28); ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    for (const [x, y, r] of [[-14, -42, 4], [2, -50, 5], [16, -38, 3.5]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
    return -58;
  },
  bat(ctx, c) {
    shadow(ctx, 14);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 10, -36); ctx.quadraticCurveTo(s * 34, -54, s * 40, -30); ctx.quadraticCurveTo(s * 32, -34, s * 28, -24);
      ctx.quadraticCurveTo(s * 22, -30, s * 16, -22); ctx.closePath(); fs(ctx, shade(c, -0.15), 1.8);
    }
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 5, -44); ctx.lineTo(s * 12, -56); ctx.lineTo(s * 15, -40); ctx.closePath(); fs(ctx, c, 1.6); }
    blob(ctx, c, -32, 16);
    eyes(ctx, -34, 6, 4.4, shade(c, -0.6));
    return -58;
  },
  golem(ctx, c) {
    shadow(ctx, 26);
    for (const fx of [-11, 11]) { ctx.beginPath(); ctx.roundRect(fx - 7, -8, 14, 9, 3); fs(ctx, shade(c, -0.3)); }
    ctx.beginPath(); ctx.roundRect(-24, -48, 48, 42, 12);
    ctx.fillStyle = bodyGrad(ctx, c, 0, -27, 26); ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    ctx.strokeStyle = shade(c, -0.35); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-6, -22); ctx.lineTo(-10, -30); ctx.moveTo(12, -12); ctx.lineTo(16, -20); ctx.stroke();
    for (const [x, y] of [[-12, -40], [14, -34]]) { ctx.beginPath(); ctx.ellipse(x, y, 4, 2.4, 0.3, 0, Math.PI * 2); ctx.fillStyle = '#7acf6a'; ctx.fill(); }
    eyes(ctx, -32, 8, 5, shade(c, -0.6));
    return -48;
  },
  spider(ctx, c) {
    shadow(ctx, 26);
    ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const y = -24 + i * 5;
      ctx.beginPath(); ctx.moveTo(s * 10, y); ctx.quadraticCurveTo(s * 26, y - 14, s * (28 + i * 2), y + 16 - i * 2); ctx.stroke();
    }
    ctx.lineCap = 'butt';
    blob(ctx, c, -22, 18);
    for (const [x, y, r] of [[-6, -26, 4.4], [6, -26, 4.4], [-11, -19, 2.6], [11, -19, 2.6]]) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#000'; ctx.stroke();
    }
    return -42;
  },
  // ── 4~15챕터 새 모양 ──
  scorpion(ctx, c) {
    shadow(ctx, 26);
    ctx.strokeStyle = shade(c, -0.35); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 10, -14 + i * 4); ctx.lineTo(s * (26 + i * 2), -4 + i * 3); ctx.stroke(); }
    ctx.lineCap = 'butt';
    for (const s of [-1, 1]) { // 집게
      ctx.beginPath(); ctx.ellipse(s * 24, -30, 9, 6, s * 0.4, 0, Math.PI * 2); fs(ctx, shade(c, 0.1), 2);
      ctx.beginPath(); ctx.moveTo(s * 28, -34); ctx.lineTo(s * 36, -40); ctx.lineTo(s * 31, -30); ctx.closePath(); fs(ctx, shade(c, 0.1), 1.6);
    }
    // 꼬리(몸 뒤로 둥글게 말려 올라감)
    ctx.strokeStyle = shade(c, -0.5); ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, -40, 18, Math.PI * 0.6, Math.PI * 1.9); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -40, 18, Math.PI * 0.6, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -52); ctx.lineTo(22, -62); ctx.lineTo(18, -48); ctx.closePath(); fs(ctx, '#2a2420', 1.4);
    blob(ctx, c, -20, 17);
    eyes(ctx, -22, 6, 4.4, shade(c, -0.6));
    return -62;
  },
  mummy(ctx, c) {
    shadow(ctx); feet(ctx, c);
    blob(ctx, c, -23, 21);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -23, 19.6, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 2;
    for (let y = -42; y < 0; y += 6) { ctx.beginPath(); ctx.moveTo(-22, y + (y % 12 ? 3 : -2)); ctx.lineTo(22, y + (y % 12 ? -2 : 3)); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#1a1410'; ctx.fillRect(-14, -32, 28, 10); // 눈가 틈
    eyes(ctx, -27, 6.5, 4.6, '#1a1410');
    ctx.beginPath(); ctx.moveTo(14, -10); ctx.quadraticCurveTo(26, -6, 22, 4); ctx.lineWidth = 3; ctx.strokeStyle = shade(c, -0.15); ctx.stroke(); // 풀린 붕대
    return -46;
  },
  frog(ctx, c) {
    shadow(ctx, 26);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 16, -3, 10, 5, 0, 0, Math.PI * 2); fs(ctx, shade(c, -0.2)); }
    ctx.beginPath(); ctx.ellipse(0, -18, 25, 18, 0, 0, Math.PI * 2); ctx.fillStyle = bodyGrad(ctx, c, 0, -18, 25); ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -10, 16, 8, 0, 0, Math.PI); ctx.fillStyle = shade(c, 0.45); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 11, -34, 9, 0, Math.PI * 2); fs(ctx, c); }
    eyes(ctx, -34, 11, 5.2, shade(c, -0.6));
    return -44;
  },
  crab(ctx, c) {
    shadow(ctx, 26);
    ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 14, -10 + i * 3); ctx.lineTo(s * (28 + i * 3), 0); ctx.stroke(); }
    ctx.lineCap = 'butt';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.arc(s * 30, -30, 10, 0, Math.PI * 2); fs(ctx, shade(c, 0.1), 2);
      ctx.beginPath(); ctx.moveTo(s * 30, -30); ctx.lineTo(s * 42, -38); ctx.lineTo(s * 40, -26); ctx.closePath(); ctx.fillStyle = '#1a1410'; ctx.fill();
      ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s * 6, -30); ctx.lineTo(s * 8, -40); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(0, -16, 24, 15, 0, 0, Math.PI * 2); ctx.fillStyle = bodyGrad(ctx, c, 0, -16, 24); ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = shade(c, -0.6); ctx.stroke();
    eyes(ctx, -42, 8, 4.4, shade(c, -0.6));
    return -48;
  },
  jelly(ctx, c) {
    ctx.strokeStyle = shade(c, 0.2); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const x of [-14, -6, 2, 10, 16]) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.quadraticCurveTo(x + 6, -8, x - 2, 4); ctx.stroke(); }
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(-24, -18); ctx.quadraticCurveTo(-24, -48, 0, -48); ctx.quadraticCurveTo(24, -48, 24, -18); ctx.quadraticCurveTo(0, -12, -24, -18); ctx.closePath();
    ctx.globalAlpha = 0.85; ctx.fillStyle = bodyGrad(ctx, c, 0, -32, 24); ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 2.4; ctx.strokeStyle = shade(c, -0.5); ctx.stroke();
    eyes(ctx, -30, 7, 4.6, shade(c, -0.6));
    return -48;
  },
  skeleton(ctx, c) {
    shadow(ctx); feet(ctx, '#d8d0c0');
    ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 4;
    for (const y of [-14, -8]) { ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(10, y); ctx.stroke(); } // 갈비뼈
    blob(ctx, '#ece6d8', -30, 18);
    ctx.fillStyle = '#1a1410';
    for (const x of [-7, 7]) { ctx.beginPath(); ctx.arc(x + 1.5, -32, 5.5, 0, Math.PI * 2); ctx.fill(); }
    eyes(ctx, -32, 7, 3, c); // 눈구멍 속 작은 빛(갑옷 색)
    ctx.fillStyle = '#1a1410'; for (const x of [-5, 0, 5]) ctx.fillRect(x - 1.5, -21, 3, 5);
    if (c !== '#ece6d8') { ctx.beginPath(); ctx.arc(0, -36, 19, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke(); } // 투구
    return -50;
  },
  ghost(ctx, c) {
    const g = ctx.createRadialGradient(0, -30, 4, 0, -30, 40);
    g.addColorStop(0, c.length === 7 ? c + 'aa' : c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -30, 40, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, -30); ctx.quadraticCurveTo(-20, -56, 0, -56); ctx.quadraticCurveTo(20, -56, 20, -30);
    ctx.lineTo(20, -6); ctx.lineTo(13, -12); ctx.lineTo(6, -4); ctx.lineTo(0, -12); ctx.lineTo(-7, -4); ctx.lineTo(-13, -12); ctx.lineTo(-20, -6); ctx.closePath();
    ctx.globalAlpha = 0.9; ctx.fillStyle = bodyGrad(ctx, c, 0, -32, 22); ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 2.4; ctx.strokeStyle = shade(c, -0.5); ctx.stroke();
    eyes(ctx, -36, 7, 5, shade(c, -0.6));
    return -56;
  },
  bird(ctx, c) {
    shadow(ctx, 18);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -34); ctx.quadraticCurveTo(s * 40, -60, s * 46, -28); ctx.quadraticCurveTo(s * 30, -34, s * 14, -22); ctx.closePath(); fs(ctx, shade(c, -0.1), 2); }
    feet(ctx, '#e8b923');
    blob(ctx, c, -26, 18);
    ctx.beginPath(); ctx.moveTo(14, -26); ctx.lineTo(26, -22); ctx.lineTo(14, -18); ctx.closePath(); fs(ctx, '#ffc83d', 1.6);
    ctx.beginPath(); ctx.moveTo(-4, -44); ctx.lineTo(0, -54); ctx.lineTo(4, -44); ctx.closePath(); fs(ctx, shade(c, 0.2), 1.4);
    eyes(ctx, -30, 6, 4.4, shade(c, -0.6));
    return -56;
  },
  dragon(ctx, c) {
    shadow(ctx, 34);
    for (const s of [-1, 1]) { // 큰 날개
      ctx.beginPath(); ctx.moveTo(s * 12, -40); ctx.lineTo(s * 52, -72); ctx.lineTo(s * 48, -40); ctx.lineTo(s * 60, -34); ctx.lineTo(s * 40, -20); ctx.lineTo(s * 16, -24); ctx.closePath();
      fs(ctx, shade(c, -0.2), 2.4);
    }
    ctx.strokeStyle = shade(c, -0.4); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-40, 0, -46, -20); ctx.stroke(); // 꼬리
    feet(ctx, c);
    blob(ctx, c, -28, 24);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 8, -48); ctx.lineTo(s * 14, -66); ctx.lineTo(s * 18, -46); ctx.closePath(); fs(ctx, '#f0e8d8', 1.6); } // 뿔
    ctx.beginPath(); ctx.ellipse(16, -20, 11, 7, 0, 0, Math.PI * 2); fs(ctx, shade(c, 0.25), 1.8); // 주둥이
    eyes(ctx, -34, 8, 5.4, shade(c, -0.6));
    return -66;
  },
};

// 꾸밈(색만 바꾼 같은 모양도 다르게 보이게): flame / ice / crystal / stars / halo
function deco(ctx, kind, top) {
  if (kind === 'flame') for (const [x, h] of [[-8, 12], [0, 18], [8, 12]]) {
    ctx.beginPath(); ctx.moveTo(x - 6, top + 6); ctx.quadraticCurveTo(x - 4, top - h * 0.5, x, top - h); ctx.quadraticCurveTo(x + 4, top - h * 0.5, x + 6, top + 6); ctx.closePath();
    ctx.fillStyle = '#ff7a2a'; ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(x, top + 2, 3, 0, Math.PI * 2); ctx.fill();
  }
  if (kind === 'ice' || kind === 'crystal') for (const [x, h] of [[-10, 12], [0, 18], [10, 12]]) {
    ctx.beginPath(); ctx.moveTo(x - 5, top + 6); ctx.lineTo(x, top + 6 - h); ctx.lineTo(x + 5, top + 6); ctx.closePath();
    fs(ctx, kind === 'ice' ? '#d8f4ff' : '#c9a8ff', 1.4, kind === 'ice' ? '#6aa8c8' : '#6a3aaa');
  }
  if (kind === 'stars') for (const [x, y] of [[-16, top - 4], [14, top - 8], [2, top - 14]]) {
    ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  if (kind === 'halo') { ctx.beginPath(); ctx.ellipse(0, top - 6, 14, 4, 0, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#ffe066'; ctx.stroke(); }
}

export function drawMonster(ctx, x, y, s, id, opts = {}) {
  const L = MONSTERS[id].look;
  ctx.save();
  ctx.translate(x, y);
  const k = s * (L.s || 1);
  ctx.scale(opts.flip ? -k : k, k);
  const top = KIND[L.kind](ctx, L.body);
  if (L.deco) deco(ctx, L.deco, top);
  if (L.crown) crown(ctx, top + 2 - (L.deco ? 12 : 0));
  ctx.restore();
}
