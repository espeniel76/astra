// Phaser 씬에서 같이 쓰는 작은 도구: 버튼, 글꼴, 텍스처 등록, 기다리기.
import { heroSource, monsterSource } from '../render/portrait.js';

export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif';
export const PX = 220; // 캐릭터 그림 한 변(화면 기준)
export const TEXRES = 2; // 텍스처는 2배로 촘촘하게 그린다
export const TS = 1 / TEXRES; // 그래서 표시할 땐 0.5배
export const ZOOM = 2; // 게임 캔버스도 2배 크기 → 카메라 확대 2배
// 씬 시작할 때 부른다: 720×1280 좌표 그대로 쓰면서 2배 선명하게
export const hiDpi = scene => scene.cameras.main.setZoom(ZOOM).centerOn(360, 640);

export const colorNum = c => parseInt(c.slice(1), 16);

export function heroTex(scene, id) {
  const key = `hero:${id}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, heroSource(id, PX * TEXRES));
  return key;
}
export function monTex(scene, id) {
  const key = `mon:${id}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, monsterSource(id, PX * TEXRES));
  return key;
}

export function text(scene, x, y, str, size = 28, color = '#ffffff', more = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: 'bold',
    stroke: '#000000', strokeThickness: Math.max(3, size / 7), align: 'center', resolution: ZOOM, ...more,
  }).setOrigin(0.5);
}

// 둥근 버튼. 돌려주는 객체: { box, label, set(label), setOn(bool), setEnabled(bool), destroy() }
export function button(scene, x, y, w, h, label, onClick, { fill = 0x5462e8, size = 28, color = '#ffffff' } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const t = text(scene, 0, 0, label, size, color, { strokeThickness: 0 });
  c.add([g, t]);
  let enabled = true, on = false, base = fill;
  const draw = () => {
    g.clear();
    const f = !enabled ? 0x3a3f55 : on ? 0xffd36a : base;
    g.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 18);
    g.fillStyle(f, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.fillStyle(0xffffff, 0.15).fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.4, 14);
    t.setColor(on ? '#3a2400' : color);
  };
  draw();
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerdown', () => { if (enabled) { c.setScale(0.96); onClick(); } });
  zone.on('pointerup', () => c.setScale(1));
  zone.on('pointerout', () => c.setScale(1));
  return {
    box: c, label: t,
    set(l) { t.setText(l); },
    setOn(v) { on = v; draw(); },
    setFill(v) { base = v; draw(); },
    setEnabled(v) { enabled = v; draw(); },
    destroy() { c.destroy(); },
  };
}

export const wait = (scene, ms) => new Promise(r => scene.time.delayedCall(ms, r));
export const tween = (scene, cfg) => new Promise(r => scene.tweens.add({ ...cfg, onComplete: r }));

// ── 효과·보상용 작은 그림(처음 쓸 때 한 번 그려 둔다) ──
import { gearSource } from '../render/gearArt.js';
export function gearTex(scene, slot, grade) {
  const key = `gear:${slot}-${grade}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, gearSource(slot, grade, 100 * TEXRES));
  return key;
}
function canvasTex(scene, key, size, draw) {
  if (scene.textures.exists(key)) return key;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  scene.textures.addCanvas(key, c);
  return key;
}
// 동그란 부드러운 빛 / 네 갈래 반짝이 / 금화 / 다이아
export const softTex = scene => canvasTex(scene, 'fx:soft', 128, (g, n) => {
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.5, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, n, n);
});
export const sparkTex = scene => canvasTex(scene, 'fx:spark', 64, (g, n) => {
  const c = n / 2;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(c, 2); g.quadraticCurveTo(c + 4, c - 4, n - 2, c); g.quadraticCurveTo(c + 4, c + 4, c, n - 2); g.quadraticCurveTo(c - 4, c + 4, 2, c); g.quadraticCurveTo(c - 4, c - 4, c, 2); g.fill();
});
export const coinTex = scene => canvasTex(scene, 'fx:coin', 200, (g, n) => {
  const c = n / 2;
  const lg = g.createLinearGradient(0, 20, 0, n - 20); lg.addColorStop(0, '#fff3b0'); lg.addColorStop(0.5, '#ffc23a'); lg.addColorStop(1, '#b0700a');
  g.beginPath(); g.arc(c, c, 80, 0, Math.PI * 2); g.fillStyle = lg; g.fill(); g.lineWidth = 8; g.strokeStyle = '#6a4000'; g.stroke();
  g.beginPath(); g.arc(c, c, 58, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = 'rgba(138,90,10,0.8)'; g.stroke();
  g.fillStyle = '#8a5a08'; g.font = 'bold 80px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('G', c, c + 4);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(c - 34, c - 40, 18, 10, -0.6, 0, Math.PI * 2); g.fill();
});
export const gemTex = scene => canvasTex(scene, 'fx:gem', 200, (g, n) => {
  const c = n / 2;
  const pts = [[c - 70, c - 20], [c - 40, c - 62], [c + 40, c - 62], [c + 70, c - 20], [c, c + 74]];
  const lg = g.createLinearGradient(0, c - 62, 0, c + 74); lg.addColorStop(0, '#e8fbff'); lg.addColorStop(0.45, '#5fd0ff'); lg.addColorStop(1, '#1a6aa8');
  g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fillStyle = lg; g.fill(); g.lineWidth = 8; g.strokeStyle = '#0e3a5a'; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(c - 70, c - 20); g.lineTo(c + 70, c - 20); g.moveTo(c - 40, c - 62); g.lineTo(c - 20, c - 20); g.lineTo(c, c + 74); g.lineTo(c + 20, c - 20); g.lineTo(c + 40, c - 62); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.moveTo(c - 30, c - 54); g.lineTo(c - 14, c - 54); g.lineTo(c - 22, c - 28); g.closePath(); g.fill();
});
