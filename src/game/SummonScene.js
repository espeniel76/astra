// 소환 연출 + ★6 이상 컷신.
// 정직한 연출: 마법진·빛기둥·빛 알갱이의 색 = 이번 소환의 최고 별. 처음부터 끝까지 색이 바뀌지 않는다.
// 순서: 마법진 → 빛기둥 + 빨려 드는 빛 → 카드가 날아와 꽂힘 → 낮은 별부터 뒤집기(★6 이상은 컷신) → 결과.
import Phaser from 'phaser';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { summon, COST } from '../core/gacha.js';
import { bump } from '../core/daily.js';
import { makeRng } from '../core/rng.js';
import { sfx } from '../core/sfx.js';
import { closeStage, setBackdrop } from './phaser.js';
import { text, button, heroTex, wait, tween, colorNum } from './ui.js';

const W = 720, H = 1280;

export class SummonScene extends Phaser.Scene {
  constructor() { super('summon'); }

  init({ app, results }) {
    this.app = app;
    this.results = results;
    this.flash = app.save.settings.flash;
    this.skipAll = false;
  }

  create() {
    if (!this.textures.exists('dot')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
      g.generateTexture('dot', 16, 16);
      g.destroy();
    }
    this.drawSky();
    this.run();
  }

  drawSky() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x05060f, 0x05060f, 0x1a1f4a, 0x1a1f4a, 1).fillRect(0, 0, W, H);
    const rnd = new Phaser.Math.RandomDataGenerator(['astra']);
    for (let i = 0; i < 90; i++) {
      const s = this.add.circle(rnd.between(0, W), rnd.between(0, H), rnd.realInRange(0.8, 2.4), 0xffffff, rnd.realInRange(0.3, 0.9));
      // 아주 천천히 밝아졌다 어두워짐(깜빡임 아님)
      this.tweens.add({ targets: s, alpha: 0.15, duration: rnd.between(2200, 4200), yoyo: true, repeat: -1, delay: rnd.between(0, 2000) });
    }
  }

  // 탭하면 다음으로(대기 중인 단계를 건너뜀)
  tapOrWait(ms) {
    return new Promise(resolve => {
      const done = () => { this.input.off('pointerdown', done); ev.remove(); resolve(); };
      const ev = this.time.delayedCall(ms, done);
      this.time.delayedCall(150, () => this.input.once('pointerdown', done));
    });
  }

  async run() {
    const res = this.results;
    const top = Math.max(...res.map(r => r.star));
    const color = colorNum(STAR_COLOR[top]);
    const big = top >= 6;
    sfx.play('summon');

    // 1) 바닥에 마법진이 그려지며 천천히 돈다 — 색은 처음부터 결과의 최고 별 색
    const CY = 820;
    const circle = this.add.container(W / 2, CY).setDepth(2).setScale(0.2, 0.07).setAlpha(0);
    const outer = this.add.graphics();
    outer.lineStyle(6, color, 1).strokeCircle(0, 0, 230);
    outer.lineStyle(2, color, 0.8).strokeCircle(0, 0, 205);
    for (let i = 0; i < 24; i++) { // 룬 눈금
      const a = (i / 24) * Math.PI * 2;
      outer.fillStyle(color, 0.9).fillRect(Math.cos(a) * 216 - 4, Math.sin(a) * 216 - 4, 8, i % 3 ? 4 : 10);
    }
    const inner = this.add.graphics();
    inner.lineStyle(4, color, 0.9);
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; pts.push([Math.cos(a) * 180, Math.sin(a) * 180]); }
    inner.strokeTriangle(pts[0][0], pts[0][1], pts[2][0], pts[2][1], pts[4][0], pts[4][1]);
    inner.strokeTriangle(pts[1][0], pts[1][1], pts[3][0], pts[3][1], pts[5][0], pts[5][1]);
    inner.lineStyle(3, color, 0.8).strokeCircle(0, 0, 90);
    const glowFloor = this.add.circle(0, 0, 240, color, 0.18);
    circle.add([glowFloor, outer, inner]);
    this.tweens.add({ targets: circle, alpha: 1, scaleX: 1.35, scaleY: 0.45, duration: 700, ease: 'Cubic.out' });
    this.tweens.add({ targets: outer, angle: 360, duration: 14000, repeat: -1 });
    this.tweens.add({ targets: inner, angle: -360, duration: 9000, repeat: -1 });
    await this.tapOrWait(750);

    // 2) 빛기둥이 솟고 3) 빛 알갱이가 빨려 들어온다
    // 빛기둥: 가운데가 하얗고 가장자리·위쪽으로 갈수록 부드럽게 사라지는 그림
    const pillar = this.add.image(W / 2, CY, this.pillarTexture(STAR_COLOR[top])).setOrigin(0.5, 1).setDepth(3).setBlendMode('ADD');
    pillar.setScale(0, 1);
    const pw = { w: 0 };
    const drawPillar = w => pillar.setScale(w / 128, 1);
    this.tweens.add({ targets: pw, w: big ? 260 : 190, duration: 700, ease: 'Cubic.out', onUpdate: () => drawPillar(pw.w) });
    const motes = this.add.particles(W / 2, 560, 'dot', {
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 440) },
      moveToX: W / 2, moveToY: 600, lifespan: 1100, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.9, end: 0.2 },
      tint: [color, 0xffffff], frequency: 30, quantity: 2, blendMode: 'ADD',
    }).setDepth(4);
    if (top >= 7) { // ★7: 금빛 가루가 더 많이, 더 길게
      motes.setFrequency(15);
    }
    await this.tapOrWait(big ? 2000 : 1300);
    motes.stop();
    if (this.flash && big) this.whiteFlash();

    // 4) 카드가 빛기둥에서 날아 나와 자리에 꽂힌다
    const order = res.map((r, i) => ({ ...r, i })).sort((a, b) => a.star - b.star || a.i - b.i);
    const cards = this.layoutCards(res.length);
    await Promise.all(cards.map((slot, k) => {
      slot.back.setPosition(W / 2, 600).setScale(0.15).setAngle(-30 + k * 6);
      return tween(this, { targets: slot.back, x: slot.x, y: slot.y, scale: 1, angle: 0, delay: k * 60, duration: 420, ease: 'Back.out' });
    }));
    this.tweens.add({ targets: [circle], alpha: 0.35, duration: 500 });
    this.tweens.add({ targets: pw, w: 0, duration: 500, onUpdate: () => drawPillar(pw.w) });

    // 5) 낮은 별부터 뒤집는다
    this.skipBtn = button(this, W / 2, 1200, 300, 80, '전부 보기', () => { this.skipAll = true; this.skipBtn.setEnabled(false); }, { size: 26, fill: 0x3a3f55 });
    for (let k = 0; k < order.length; k++) {
      const r = order[k];
      if (r.star >= 6) await this.cutscene(r);
      await this.flipCard(cards[k], r);
      if (!this.skipAll) await wait(this, r.star >= 4 ? 260 : 120);
    }
    this.skipBtn.destroy();
    await wait(this, 300);
    this.showEnd();
  }

  pillarTexture(css) {
    const key = `pillar:${css}`;
    if (this.textures.exists(key)) return key;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 1000;
    const ctx = c.getContext('2d');
    const hg = ctx.createLinearGradient(0, 0, 128, 0);
    hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.25, css); hg.addColorStop(0.5, '#ffffff'); hg.addColorStop(0.75, css); hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, 128, 1000);
    // 위로 갈수록 사라짐
    ctx.globalCompositeOperation = 'destination-in';
    const vg = ctx.createLinearGradient(0, 0, 0, 1000);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.6, 'rgba(0,0,0,0.75)'); vg.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 128, 1000);
    this.textures.addCanvas(key, c);
    return key;
  }

  layoutCards(n) {
    const pos = [];
    if (n === 1) pos.push({ x: W / 2, y: 560, w: 300, h: 400 });
    else {
      let idx = 0;
      [4, 4, 3].forEach((cnt, r) => {
        for (let c = 0; c < cnt && idx < n; c++, idx++) pos.push({ x: W / 2 + (c - (cnt - 1) / 2) * 165, y: 270 + r * 265, w: 150, h: 230 });
      });
    }
    return pos.map(p => {
      // 카드 뒷면: 모두 같은 모양(앞면을 미리 알려 주지 않음)
      const back = this.add.container(p.x, p.y).setDepth(6);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.35).fillRoundedRect(-p.w / 2 + 4, -p.h / 2 + 6, p.w, p.h, 16);
      g.fillGradientStyle(0x2a3270, 0x2a3270, 0x161b40, 0x161b40, 1).fillRoundedRect(-p.w / 2, -p.h / 2, p.w, p.h, 16);
      g.lineStyle(3, 0xc9b06a, 1).strokeRoundedRect(-p.w / 2 + 6, -p.h / 2 + 6, p.w - 12, p.h - 12, 12);
      back.add([g, this.add.star(0, 0, 4, p.w * 0.07, p.w * 0.2, 0xc9b06a), this.add.circle(0, 0, p.w * 0.26).setStrokeStyle(2, 0xc9b06a, 0.8)]);
      return { ...p, back };
    });
  }

  async flipCard(slot, r) {
    const quick = this.skipAll;
    // 뒷면이 옆으로 돌아 사라지고
    if (!quick) await tween(this, { targets: slot.back, scaleX: 0, duration: 110, ease: 'Quad.in' });
    slot.back.destroy();
    sfx.play('reveal');
    const c = this.add.container(slot.x, slot.y).setScale(quick ? 1 : 0, 1).setDepth(6);
    const col = colorNum(STAR_COLOR[r.star]);
    const big = slot.w > 200;
    if (r.star >= 5) { // ★5 이상: 카드 뒤에서 빛살이 천천히 돈다
      const rays = this.add.graphics();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, R = slot.h * 0.8;
        rays.fillStyle(col, 0.28).fillTriangle(0, 0, Math.cos(a - 0.12) * R, Math.sin(a - 0.12) * R, Math.cos(a + 0.12) * R, Math.sin(a + 0.12) * R);
      }
      c.add(rays);
      this.tweens.add({ targets: rays, angle: 360, duration: 8000, repeat: -1 });
    }
    const g = this.add.graphics();
    g.fillStyle(0x151a38, 1).fillRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    g.fillGradientStyle(col, col, 0x151a38, 0x151a38, 0.45, 0.45, 0, 0).fillRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h * 0.75, 16);
    g.lineStyle(r.star >= 6 ? 6 : 4, col, 1).strokeRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    const img = this.add.image(0, slot.h * 0.12, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(big ? 1.4 : 0.72);
    const name = text(this, 0, slot.h * 0.3, HERO[r.id].name, big ? 34 : 18, '#ffffff', { wordWrap: { width: slot.w - 10 } });
    const st = text(this, 0, slot.h * 0.42, '★'.repeat(r.star), big ? 28 : 16, STAR_COLOR[r.star], { strokeThickness: 3 });
    c.add([g, img, name, st]);
    const tag = r.isNew ? 'NEW' : r.overflowGold ? `+🪙${r.overflowGold}` : `+${r.dupes}`;
    c.add(text(this, slot.w / 2 - 22, -slot.h / 2 + 18, tag, big ? 26 : 16, r.isNew ? '#7dff8a' : '#ffd36a').setOrigin(1, 0.5));
    if (!quick) await tween(this, { targets: c, scaleX: 1, duration: 160, ease: 'Back.out' });
  }

  whiteFlash() {
    const f = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.85).setDepth(200);
    this.tweens.add({ targets: f, alpha: 0, duration: 150, onComplete: () => f.destroy() });
  }

  // ★6 이상 등장 컷신. 탭하면 넘어간다.
  async cutscene(r) {
    const hero = HERO[r.id];
    const seven = r.star >= 7;
    const col = colorNum(STAR_COLOR[r.star]);
    const layer = this.add.container(0, 0).setDepth(150);
    const dark = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setInteractive();
    layer.add(dark);
    this.tweens.add({ targets: dark, fillAlpha: 0.9, duration: 300 });
    sfx.play(seven ? 'star7' : 'star6');

    // 빛줄기: 천천히 돌며 밝아진다
    const beams = this.add.container(W / 2, 560);
    for (let i = 0; i < 12; i++) {
      const g = this.add.graphics();
      g.fillStyle(col, 0.22).fillTriangle(0, 0, -40, -900, 40, -900);
      g.rotation = (i / 12) * Math.PI * 2;
      beams.add(g);
    }
    beams.setAlpha(0);
    layer.add(beams);
    this.tweens.add({ targets: beams, alpha: 1, duration: 700 });
    this.tweens.add({ targets: beams, angle: 30, duration: seven ? 6000 : 4000 });

    // ★7: 금빛 가루가 천천히 떨어진다
    if (seven) {
      const dust = this.add.particles(0, 0, 'dot', {
        x: { min: 0, max: W }, y: -20, lifespan: 4000, speedY: { min: 60, max: 140 }, speedX: { min: -20, max: 20 },
        scale: { min: 0.3, max: 0.7 }, alpha: { start: 0.9, end: 0 }, tint: [0xffe066, 0xfff3c0, 0xffc83d], frequency: 40,
      });
      layer.add(dust);
    }

    const img = this.add.image(W / 2, 1400, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(1.6);
    layer.add(img);
    if (this.flash) this.time.delayedCall(500, () => this.whiteFlash());
    this.tweens.add({ targets: img, y: 760, scale: seven ? 3.2 : 2.8, duration: 800, delay: 300, ease: 'Back.out' });

    const name = text(this, W / 2, 860, '', 60, '#ffffff');
    const stars = text(this, W / 2, 940, '', 44, STAR_COLOR[r.star]);
    const quote = text(this, W / 2, 1030, '', 30, '#e8e8ff', { wordWrap: { width: W - 80 }, fontStyle: 'italic bold' });
    layer.add([name, stars, quote]);
    if (r.isNew) {
      const nw = text(this, W - 110, 200, 'NEW!', 54, '#7dff8a');
      nw.setAngle(12).setAlpha(0);
      layer.add(nw);
      this.tweens.add({ targets: nw, alpha: 1, scale: { from: 1.6, to: 1 }, duration: 400, delay: 1100, ease: 'Back.out' });
    } else {
      const dp = text(this, W - 120, 200, r.overflowGold ? `+🪙${r.overflowGold}` : `+${r.dupes}`, 46, '#ffd36a');
      layer.add(dp.setAlpha(0));
      this.tweens.add({ targets: dp, alpha: 1, duration: 400, delay: 1100 });
    }

    let skipped = false;
    const skip = () => { skipped = true; };
    this.time.delayedCall(250, () => dark.once('pointerdown', skip));
    const type = async (obj, str, each) => {
      for (let i = 1; i <= str.length && !skipped; i++) { obj.setText(str.slice(0, i)); await wait(this, each); }
      obj.setText(str);
    };
    await wait(this, 900);
    if (!skipped) await type(name, hero.name, 70);
    if (!skipped) await type(stars, '★'.repeat(r.star), 90);
    if (!skipped) await type(quote, `“${hero.quote}”`, 35);
    name.setText(hero.name); stars.setText('★'.repeat(r.star)); quote.setText(`“${hero.quote}”`);
    const hold = seven ? 2200 : 1200;
    for (let t = 0; t < hold && !skipped; t += 100) await wait(this, 100);
    if (!skipped) {
      const tip = text(this, W / 2, 1200, '눌러서 계속', 26, '#aab0d0');
      layer.add(tip);
      await new Promise(res => { if (skipped) res(); else { dark.removeAllListeners('pointerdown'); dark.once('pointerdown', res); } });
    }
    await tween(this, { targets: layer, alpha: 0, duration: 250 });
    layer.destroy();
  }

  showEnd() {
    const s = this.app.save;
    const count = this.results.length;
    const again = button(this, W / 2 - 160, 1200, 290, 90, `다시 ${count === 11 ? '10+1' : '1회'} 💎${COST[count]}`, () => {
      if (s.diamonds < COST[count]) return;
      const r = summon(s, count, makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0));
      if (!r.ok) return;
      bump(s, 'summon');
      this.app.persist();
      this.scene.restart({ app: this.app, results: r.results });
    }, { size: 26, fill: 0xf0a52a, color: '#3a2400' });
    again.setEnabled(s.diamonds >= COST[count]);
    button(this, W / 2 + 160, 1200, 290, 90, '확인', () => closeStage(this.app, 'summon'), { size: 30 });
    text(this, W / 2, 60, `💎 ${s.diamonds.toLocaleString('ko-KR')}`, 30, '#7fd8ff');
  }
}
