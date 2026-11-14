// Phaser 씬에서 같이 쓰는 작은 도구: 버튼, 글꼴, 텍스처 등록, 기다리기.
import { heroSource, monsterSource } from '../render/portrait.js';

export const FONT = '"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif';
export const PX = 220; // 텍스처 한 변

export const colorNum = c => parseInt(c.slice(1), 16);

export function heroTex(scene, id) {
  const key = `hero:${id}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, heroSource(id, PX));
  return key;
}
export function monTex(scene, id) {
  const key = `mon:${id}`;
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, monsterSource(id, PX));
  return key;
}

export function text(scene, x, y, str, size = 28, color = '#ffffff', more = {}) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: 'bold',
    stroke: '#000000', strokeThickness: Math.max(3, size / 7), align: 'center', ...more,
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
