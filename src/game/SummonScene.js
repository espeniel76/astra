// 소환 연출 + ★6 이상 컷신.
// 정직한 연출: 떨어지는 별의 빛 색 = 이번 소환의 최고 별. 처음부터 끝까지 색이 바뀌지 않는다.
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
    sfx.play('summon');

    // 1) 별이 떨어진다 — 처음부터 결과 색
    const star = this.add.star(W / 2, -60, 5, 18, 40, color).setDepth(5);
    const glow = this.add.circle(W / 2, -60, 70, color, 0.35).setDepth(4);
    const trail = this.add.particles(0, 0, 'dot', {
      follow: star, lifespan: 700, speed: 20, scale: { start: 1.6, end: 0 }, alpha: { start: 0.6, end: 0 },
      tint: color, frequency: 25, blendMode: 'ADD',
    }).setDepth(3);
    const fall = top >= 7 ? 2000 : top >= 6 ? 1600 : 1200;
    this.tweens.add({ targets: [star, glow], y: 560, duration: fall, ease: 'Cubic.in' });
    this.tweens.add({ targets: star, angle: 360, duration: fall });
    await this.tapOrWait(fall);
    star.y = glow.y = 560;
    trail.stop();
    // 땅에 닿으면 같은 색 빛이 천천히 퍼진다
    const burst = this.add.circle(W / 2, 560, 40, color, 0.6).setDepth(2);
    this.tweens.add({ targets: burst, radius: 520, alpha: 0, duration: 900, ease: 'Cubic.out' });
    this.tweens.add({ targets: [star, glow], alpha: 0, duration: 500 });
    if (this.flash && top >= 6) this.whiteFlash();
    await wait(this, 500);

    // 2) 카드: 낮은 별부터 뒤집는다
    const order = res.map((r, i) => ({ ...r, i })).sort((a, b) => a.star - b.star || a.i - b.i);
    const cards = this.layoutCards(res.length);
    this.skipBtn = button(this, W / 2, 1200, 300, 80, '전부 보기', () => { this.skipAll = true; this.skipBtn.setEnabled(false); }, { size: 26, fill: 0x3a3f55 });
    for (let k = 0; k < order.length; k++) {
      const r = order[k];
      const slot = cards[k];
      if (r.star >= 6) await this.cutscene(r);
      this.flipCard(slot, r);
      if (!this.skipAll) await wait(this, r.star >= 4 ? 320 : 200);
    }
    this.skipBtn.destroy();
    await wait(this, 300);
    this.showEnd();
  }

  layoutCards(n) {
    const pos = [];
    if (n === 1) { pos.push({ x: W / 2, y: 560, w: 300, h: 400 }); }
    else {
      const rows = [4, 4, 3];
      let idx = 0;
      rows.forEach((cnt, r) => {
        for (let c = 0; c < cnt && idx < n; c++, idx++) {
          pos.push({ x: W / 2 + (c - (cnt - 1) / 2) * 165, y: 280 + r * 270, w: 150, h: 230 });
        }
      });
    }
    return pos.map(p => {
      const back = this.add.graphics().setPosition(p.x, p.y);
      back.fillStyle(0x1c2350, 1).fillRoundedRect(-p.w / 2, -p.h / 2, p.w, p.h, 16);
      back.lineStyle(3, 0x4a5590, 1).strokeRoundedRect(-p.w / 2, -p.h / 2, p.w, p.h, 16);
      back.fillStyle(0x4a5590, 1).fillCircle(0, 0, p.w * 0.15);
      return { ...p, back };
    });
  }

  flipCard(slot, r) {
    sfx.play('reveal');
    const c = this.add.container(slot.x, slot.y).setScale(0, 1);
    const col = colorNum(STAR_COLOR[r.star]);
    const g = this.add.graphics();
    g.fillStyle(0x151a38, 1).fillRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    g.fillStyle(col, 0.25).fillRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h * 0.7, 16);
    g.lineStyle(r.star >= 6 ? 6 : 4, col, 1).strokeRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    const big = slot.w > 200;
    const img = this.add.image(0, slot.h * 0.12, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(big ? 1.4 : 0.72);
    const name = text(this, 0, slot.h * 0.3, HERO[r.id].name, big ? 34 : 18, '#ffffff', { wordWrap: { width: slot.w - 10 } });
    const st = text(this, 0, slot.h * 0.42, '★'.repeat(r.star), big ? 28 : 16, STAR_COLOR[r.star], { strokeThickness: 3 });
    c.add([g, img, name, st]);
    const tag = r.isNew ? 'NEW' : r.overflowGold ? `+🪙${r.overflowGold}` : `+${r.dupes}`;
    c.add(text(this, slot.w / 2 - 22, -slot.h / 2 + 18, tag, big ? 26 : 16, r.isNew ? '#7dff8a' : '#ffd36a').setOrigin(1, 0.5));
    slot.back.destroy();
    this.tweens.add({ targets: c, scaleX: 1, duration: this.skipAll ? 1 : 180, ease: 'Back.out' });
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
