// 소환 연출 + ★5 이상 컷신(아들 요청으로 ★6 → ★5).
// 정직한 연출: 마법진·빛기둥·빛 알갱이의 색 = 이번 소환의 최고 별. 처음부터 끝까지 색이 바뀌지 않는다.
// 순서: 마법진 → 빛기둥 + 빨려 드는 빛 → 카드가 날아와 꽂힘 → 낮은 별부터 뒤집기(★5 이상은 컷신) → 결과.
import Phaser from 'phaser';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { summon, COST } from '../core/gacha.js';
import { bump } from '../core/daily.js';
import { makeRng } from '../core/rng.js';
import { sfx } from '../core/sfx.js';
import { closeStage, setBackdrop } from './phaser.js';
import { text, button, heroTex, wait, tween, colorNum, TS, TEXRES, hiDpi } from './ui.js';
import { propTex, TREE, TREE_TIPS } from '../render/props.js';

const W = 720, H = 1280;

export class SummonScene extends Phaser.Scene {
  constructor() { super('summon'); }

  init({ app, results, ticket = false }) {
    this.app = app;
    this.results = results;
    this.ticket = ticket;
    this.awaken = !!results[0]?.awaken; // ★7 각성(★8) 연출
    this.flash = app.save.settings.flash;
    this.skipAll = false;
  }

  create() {
    hiDpi(this);
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
    const big = top >= 5;
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
    this.tweens.add({ targets: circle, alpha: 1, scaleX: 1.35, scaleY: 0.45, duration: 1200, ease: 'Cubic.out' });
    this.tweens.add({ targets: outer, angle: 360, duration: 14000, repeat: -1 });
    this.tweens.add({ targets: inner, angle: -360, duration: 9000, repeat: -1 });
    await this.tapOrWait(1400);

    // 2) 빛기둥이 솟고 3) 빛 알갱이가 빨려 들어온다
    // 빛기둥: 가운데가 하얗고 가장자리·위쪽으로 갈수록 부드럽게 사라지는 그림
    const pillar = this.add.image(W / 2, CY, this.pillarTexture(STAR_COLOR[top])).setOrigin(0.5, 1).setDepth(3).setBlendMode('ADD');
    pillar.setScale(0, TS);
    const pw = { w: 0 };
    const drawPillar = w => pillar.setScale((w / 128) * TS, TS);
    this.tweens.add({ targets: pw, w: big ? 260 : 190, duration: 1100, ease: 'Cubic.out', onUpdate: () => drawPillar(pw.w) });
    const motes = this.add.particles(W / 2, 560, 'dot', {
      emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 440) },
      moveToX: W / 2, moveToY: 600, lifespan: 1100, scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.9, end: 0.2 },
      tint: [color, 0xffffff], frequency: 30, quantity: 2, blendMode: 'ADD',
    }).setDepth(4);
    if (top >= 7) { // ★7: 금빛 가루가 더 많이, 더 길게
      motes.setFrequency(15);
    }
    await this.tapOrWait(big ? 3000 : 2000);
    motes.stop();
    if (this.flash && big) this.whiteFlash();

    // 4) 카드가 빛기둥에서 날아 나와 자리에 꽂힌다
    const order = res.map((r, i) => ({ ...r, i })).sort((a, b) => a.star - b.star || a.i - b.i);
    const cards = this.layoutCards(res.length);
    await Promise.all(cards.map((slot, k) => {
      slot.back.setPosition(W / 2, 600).setScale(0.15).setAngle(-30 + k * 6);
      return tween(this, { targets: slot.back, x: slot.x, y: slot.y, scale: 1, angle: 0, delay: k * 110, duration: 650, ease: 'Back.out' });
    }));
    this.tweens.add({ targets: [circle], alpha: 0.35, duration: 800 });
    this.tweens.add({ targets: pw, w: 0, duration: 800, onUpdate: () => drawPillar(pw.w) });

    // 5) 낮은 별부터 뒤집는다
    this.skipBtn = button(this, W / 2, 1200, 300, 80, '전부 보기', () => { this.skipAll = true; this.skipBtn.setEnabled(false); }, { size: 26, fill: 0x3a3f55 });
    for (let k = 0; k < order.length; k++) {
      const r = order[k];
      if (r.star >= 6) await this.mythicReveal(cards[k], r);
      else {
        if (r.star >= 5) await this.cutscene(r);
        await this.flipCard(cards[k], r);
      }
      if (!this.skipAll) await wait(this, r.star >= 4 ? 500 : 280);
    }
    this.skipBtn.destroy();
    await wait(this, 600);
    this.showEnd();
  }

  pillarTexture(css) {
    const key = `pillar:${css}`;
    if (this.textures.exists(key)) return key;
    const c = document.createElement('canvas');
    c.width = 128 * TEXRES; c.height = 1000 * TEXRES;
    const ctx = c.getContext('2d');
    ctx.scale(TEXRES, TEXRES);
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
    if (!quick) await tween(this, { targets: slot.back, scaleX: 0, duration: 220, ease: 'Quad.in' });
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
    g.lineStyle(r.star >= 5 ? 6 : 4, col, 1).strokeRoundedRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h, 16);
    const img = this.add.image(0, slot.h * 0.12, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale((big ? 1.4 : 0.72) * TS);
    const name = text(this, 0, slot.h * 0.3, HERO[r.id].name, big ? 34 : 18, '#ffffff', { wordWrap: { width: slot.w - 10 } });
    const st = r.awaken
      ? text(this, 0, slot.h * 0.42, '★', big ? 54 : 30, '#ffe066', { stroke: '#8a4a10', strokeThickness: 5 }) // 큰 별 하나 = ★8
      : text(this, 0, slot.h * 0.42, '★'.repeat(r.star), big ? 28 : 16, STAR_COLOR[r.star], { strokeThickness: 3 });
    c.add([g, img, name, st]);
    const tag = r.isNew ? 'NEW' : r.overflowGold ? `+🪙${r.overflowGold}` : `+${r.dupes}`;
    c.add(text(this, slot.w / 2 - 22, -slot.h / 2 + 18, tag, big ? 26 : 16, r.isNew ? '#7dff8a' : '#ffd36a').setOrigin(1, 0.5));
    if (!quick) await tween(this, { targets: c, scaleX: 1, duration: 300, ease: 'Back.out' });
    return c;
  }

  // ★6 이상 카드: 화면이 까맣게 → 빛나는 흰 글씨로 대사 → 번쩍(번쩍임 설정이 꺼져 있으면 부드러운 빛) + 흔들림
  // → 어둠이 천천히 걷히며 카드가 뒤집힘 → 카드 주변에 찌릿찌릿 번개(★6 빨강, ★7 금색)
  async mythicReveal(slot, r) {
    const hero = HERO[r.id];
    const seven = r.star >= 7;
    const col = seven ? ({ stareater: 0xb06aff, judge: 0xffffff, abysslord: 0x3fd8d0, worldtree: 0x9fe07a }[r.id] ?? 0xffe066) : 0xff3a3a;
    // 번개 바깥 빛: 심판자 회색, 심해의 군주 깊은 청록, 세계수의 여왕 금색
    const outer = { judge: 0x8a8f99, abysslord: 0x0e6a70, worldtree: 0xffd84a }[r.id] ?? col;
    // 1) 암전: 화면 전체를 까맣게
    const dark = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setAlpha(0).setDepth(140).setInteractive();
    this.tweens.add({ targets: dark, alpha: 1, duration: 900 }); // 화면 전체 암전(카드도 안 보임)
    setBackdrop('#000000', '#000000');
    sfx.play('summon');
    await wait(this, 1000);

    // 2) 빛나는 흰 글씨 대사(한 글자씩). 탭하면 바로 다 나온다.
    const qy = H / 2; // 화면 정가운데
    const quote = text(this, W / 2, qy, '', 40, '#ffffff', { wordWrap: { width: W - 90 }, strokeThickness: 0, fontStyle: 'bold' })
      .setDepth(160).setShadow(0, 0, '#ffffff', 22, true, true);
    let skip = false;
    dark.once('pointerdown', () => { skip = true; });
    const line = `“${hero.quote}”`;
    for (let i = 1; i <= line.length && !skip; i++) { quote.setText(line.slice(0, i)); await wait(this, 85); }
    quote.setText(line);
    await wait(this, 2000); // 대사를 다 읽을 수 있게 2초 기다림

    // ★7 전용 애니메이션: 수호신 = 하늘이 갈라지며 강림, 별을 삼킨 자 = 별들을 빨아들이는 블랙홀
    if (seven) {
      this.tweens.add({ targets: quote, alpha: 0, duration: 400 });
      if (r.id === 'stareater') await this.voidAwakening(r);
      else if (r.id === 'judge') await this.finalJudgment(r);
      else if (r.id === 'abysslord') await this.abyssRise(r);
      else if (r.id === 'worldtree') await this.worldTreeBloom(r);
      else await this.eternalDescent(r);
    }

    // 3) 쾅: 번쩍 + 화면 흔들림
    sfx.play(seven ? 'star7' : 'star6');
    this.cameras.main.shake(seven ? 900 : 650, this.flash ? 0.02 : 0.012);
    if (this.flash) {
      // 번쩍임 효과가 켜져 있을 때만 진짜 점멸(세 번)
      for (let i = 0; i < 3; i++) {
        const f = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.9).setDepth(200);
        await tween(this, { targets: f, alpha: 0, duration: 80 });
        f.destroy();
        await wait(this, 60);
      }
    } else {
      // 기본: 깜빡이지 않는 부드러운 빛 한 번(천천히 밝아졌다 천천히 사라짐)
      const f = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1).setAlpha(0).setDepth(200);
      await tween(this, { targets: f, alpha: 0.55, duration: 260, ease: 'Sine.out' });
      this.tweens.add({ targets: f, alpha: 0, duration: 1200, ease: 'Sine.in', onComplete: () => f.destroy() });
    }

    // 4) 어둠이 천천히 걷히며 카드가 뒤집힌다


    this.tweens.add({ targets: [dark, quote], alpha: 0, duration: 1500, onComplete: () => { dark.destroy(); quote.destroy(); setBackdrop('#05060f', '#1a1f4a'); } });
    await wait(this, 500);
    this.skipAll = false;
    const card = await this.flipCard(slot, r);
    card.setDepth(150);
    await tween(this, { targets: card, scale: 1.18, duration: 300, yoyo: true, ease: 'Quad.out' });
    card.setDepth(6);
    // 5) 찌릿찌릿
    this.crackle(card, slot, col, outer);
    if (r.awaken) await this.awakenBurst(card, slot, r);
  }

  // ★7 전용 애니메이션(약 6초, 탭하면 넘어감). 번쩍임 없이: 모든 빛은 천천히 밝아지고 천천히 사라진다.
  // 1) 어둠 한가운데 금빛 선이 그어지고 2) 위아래로 벌어지며 금빛 하늘이 열린다
  // 3) 후광 고리와 빛살이 돌고 금빛 깃털이 떨어진다 4) 수호신이 위에서 천천히 내려와 땅에 닿는다(쿵, 흔들림)
  // 5) 황금 창 다섯 자루가 날아와 둘레에 원을 이룬다 6) 이름과 별 일곱 개, "ETERNAL"
  async eternalDescent(r) {
    const hero = HERO[r.id];
    const GOLD = 0xffe066;
    const layer = this.add.container(0, 0).setDepth(170);
    const cy = H / 2 - 40;
    let skipped = false;
    const hit = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setInteractive();
    layer.add(hit);
    this.time.delayedCall(400, () => hit.once('pointerdown', () => { skipped = true; }));
    const pause = async ms => { for (let t = 0; t < ms && !skipped; t += 50) await wait(this, 50); };

    // 1) 금빛 선
    const seam = this.add.rectangle(W / 2, cy, 4, 4, GOLD, 1);
    layer.add(seam);
    await tween(this, { targets: seam, width: W, duration: 900, ease: 'Cubic.out' });
    // 2) 하늘이 열린다(금빛 그라데이션이 위아래로 벌어짐)
    const sky = this.add.graphics();
    const drawSky = h => {
      sky.clear();
      sky.fillGradientStyle(0xfff6c8, 0xfff6c8, 0xc9961a, 0xc9961a, 1).fillRect(0, cy - h, W, h);
      sky.fillGradientStyle(0xc9961a, 0xc9961a, 0xfff6c8, 0xfff6c8, 1).fillRect(0, cy, W, h);
    };
    layer.addAt(sky, 1);
    const open = { h: 0 };
    await tween(this, { targets: open, h: H / 2 + 60, duration: 1800, ease: 'Sine.inOut', onUpdate: () => drawSky(open.h) });
    setBackdrop('#fff6c8', '#fff6c8');
    this.tweens.add({ targets: seam, alpha: 0, duration: 400 });
    if (!skipped) sfx.play('star7');

    // 3) 후광 고리 + 빛살 + 깃털
    const rays = this.add.container(W / 2, cy);
    for (let i = 0; i < 16; i++) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.22).fillTriangle(0, 0, -36, -760, 36, -760);
      g.rotation = (i / 16) * Math.PI * 2;
      rays.add(g);
    }
    rays.setAlpha(0);
    layer.add(rays);
    this.tweens.add({ targets: rays, alpha: 1, duration: 1400 });
    this.tweens.add({ targets: rays, angle: 360, duration: 24000, repeat: -1 });
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(W / 2, cy, 120 + i * 70).setStrokeStyle(6 - i, 0xffffff, 0.75 - i * 0.18).setScale(0.4).setAlpha(0);
      layer.add(ring);
      this.tweens.add({ targets: ring, scale: 1, alpha: 1, duration: 1800, delay: i * 400, ease: 'Cubic.out' });
    }
    const feathers = this.add.particles(0, 0, propTex(this, 'feather'), {
      x: { min: 0, max: W }, y: -40, lifespan: 6000, speedY: { min: 60, max: 120 }, speedX: { min: -30, max: 30 },
      scale: { min: 0.6 * TS, max: 1.1 * TS }, rotate: { start: -30, end: 60 },
      alpha: { start: 0.95, end: 0.2 }, frequency: 120,
    });
    layer.add(feathers);

    // 4) 수호신이 내려온다
    const img = this.add.image(W / 2, -260, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(2.6 * TS);
    layer.add(img);
    await tween(this, { targets: img, y: cy + 200, duration: skipped ? 1 : 2700, ease: 'Sine.out' });
    this.cameras.main.shake(500, this.flash ? 0.018 : 0.01);
    const dust = this.add.ellipse(W / 2, cy + 205, 80, 20, 0xffffff, 0.8);
    layer.addAt(dust, layer.getIndex(img));
    this.tweens.add({ targets: dust, scaleX: 6, scaleY: 3, alpha: 0, duration: 900, ease: 'Cubic.out' });
    this.tweens.add({ targets: img, y: cy + 188, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // 5) 황금 창 다섯 자루가 날아와 원을 이룬다
    const spears = this.add.container(W / 2, cy + 70);
    layer.add(spears);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      // 창끝이 바깥을 향하게(그림은 위가 창끝)
      const sp = this.add.image(Math.cos(a) * 700, Math.sin(a) * 700, propTex(this, 'spear')).setOrigin(0.5, 0.45).setScale(0.62 * TS).setRotation(a + Math.PI / 2);
      spears.add(sp);
      this.tweens.add({ targets: sp, x: Math.cos(a) * 310, y: Math.sin(a) * 310, duration: skipped ? 1 : 900, delay: skipped ? 0 : i * 240, ease: 'Back.out' });
    }
    this.tweens.add({ targets: spears, angle: 360, duration: 16000, repeat: -1 });
    await pause(1800);

    // 6) 이름 + 별 일곱 + ETERNAL
    const name = text(this, W / 2, H - 250, '', 54, '#fff6c8', { stroke: '#6a4a00', strokeThickness: 8 });
    const stars = text(this, W / 2, H - 180, '', 42, '#ffe066', { stroke: '#6a4a00', strokeThickness: 6 });
    const eternal = text(this, W / 2, 120, 'ETERNAL', 46, '#ffffff', { stroke: '#8a6410', strokeThickness: 6 }).setAlpha(0).setScale(1.6);
    layer.add([name, stars, eternal]);
    this.tweens.add({ targets: eternal, alpha: 1, scale: 1, duration: 700, ease: 'Back.out' });
    for (let i = 1; i <= hero.name.length && !skipped; i++) { name.setText(hero.name.slice(0, i)); await wait(this, 120); }
    name.setText(hero.name);
    for (let i = 1; i <= 7 && !skipped; i++) { stars.setText('★'.repeat(i)); await wait(this, 170); }
    stars.setText('★'.repeat(7));
    await pause(3500);

    // 끝: 천천히 사라지고 원래 연출(쾅 → 카드 뒤집기)로
    feathers.stop();
    await tween(this, { targets: layer, alpha: 0, duration: 1000 });
    layer.destroy();
  }

  // 별을 삼킨 자 전용(약 10초, 탭하면 넘어감). 번쩍임 없음: 모두 천천히 움직이고 천천히 밝아진다.
  // 1) 어둠 속에 별들이 하나둘 떠오르고 2) 한가운데 작은 블랙홀이 열려 별들을 소용돌이치며 삼킨다
  // 3) 보랏빛 고리가 커지며 돌고 4) 블랙홀 속에서 별을 삼킨 자가 떠오른다(별 조각 왕관이 둘레를 돈다)
  // 5) ETERNAL + 이름 + 별 일곱
  async voidAwakening(r) {
    const hero = HERO[r.id];
    const VIOLET = 0xb06aff;
    const layer = this.add.container(0, 0).setDepth(170);
    const cx = W / 2, cy = H / 2 - 60;
    let skipped = false;
    const hit = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1);
    layer.add(hit);
    hit.setInteractive();
    this.time.delayedCall(400, () => hit.once('pointerdown', () => { skipped = true; }));
    const pause = async ms => { for (let t = 0; t < ms && !skipped; t += 50) await wait(this, 50); };
    setBackdrop('#000000', '#000000');

    // 1) 별들이 떠오른다
    const starDots = [];
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 520;
      const s = this.add.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.3, 1.5 + Math.random() * 2.5, i % 5 ? 0xffffff : 0xd8c0ff).setAlpha(0);
      layer.add(s);
      starDots.push({ s, a, d });
      this.tweens.add({ targets: s, alpha: 0.9, duration: 1200, delay: Math.random() * 900 });
    }
    await pause(1800);

    // 2) 블랙홀이 열리고 별들을 삼킨다
    const glow = this.add.circle(cx, cy, 200, VIOLET, 0.25).setScale(0.05);
    const hole = this.add.circle(cx, cy, 70, 0x000000, 1).setScale(0.05).setStrokeStyle(5, 0xd8b0ff, 1);
    const ring = this.add.ellipse(cx, cy, 380, 90).setStrokeStyle(10, VIOLET, 0.9).setScale(0.05).setAngle(-18);
    const ring2 = this.add.ellipse(cx, cy, 300, 66).setStrokeStyle(4, 0xffffff, 0.7).setScale(0.05).setAngle(-18);
    layer.add([glow, ring, ring2, hole]);
    sfx.play('star7');
    this.tweens.add({ targets: [glow, hole, ring, ring2], scale: 1, duration: skipped ? 1 : 2200, ease: 'Sine.inOut' });
    this.tweens.add({ targets: glow, alpha: 0.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    for (const { s, a, d } of starDots) {
      const o = { t: 0 };
      this.tweens.add({
        targets: o, t: 1, duration: skipped ? 1 : 2400 + Math.random() * 1400, delay: Math.random() * 600, ease: 'Cubic.in',
        onUpdate: () => {
          const ang = a + o.t * 4, rr = d * (1 - o.t);
          s.setPosition(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.6);
          s.setScale(1 - o.t * 0.8);
        },
        onComplete: () => s.setAlpha(0),
      });
    }
    await pause(3200);

    // 3) 고리가 돈다(타원 고리를 납작하게 돌리는 느낌으로 기울기를 천천히 바꿈)
    this.tweens.add({ targets: [ring, ring2], angle: 18, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // 4) 블랙홀 속에서 떠오른다
    const img = this.add.image(cx, cy + 170, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(0.1 * TS).setAlpha(0);
    layer.add(img);
    this.tweens.add({ targets: img, alpha: 1, scale: 2.6 * TS, y: cy + 190, duration: skipped ? 1 : 2200, ease: 'Back.out' });
    await pause(2200);
    this.cameras.main.shake(500, this.flash ? 0.016 : 0.008);
    this.tweens.add({ targets: img, y: cy + 176, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // 별 조각 왕관이 둘레를 돈다
    const crown = this.add.container(cx, cy + 40);
    layer.add(crown);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      crown.add(this.add.image(Math.cos(a) * 250, Math.sin(a) * 250 * 0.5, propTex(this, 'shard')).setScale(0.7 * TS));
    }
    crown.setAlpha(0);
    this.tweens.add({ targets: crown, alpha: 1, duration: 900 });
    this.tweens.add({ targets: crown, angle: 360, duration: 14000, repeat: -1 });

    // 5) 이름
    const eternal = text(this, W / 2, 120, 'ETERNAL', 46, '#f0e0ff', { stroke: '#3a0a6a', strokeThickness: 6 }).setAlpha(0).setScale(1.6);
    const name = text(this, W / 2, H - 250, '', 54, '#f0e0ff', { stroke: '#3a0a6a', strokeThickness: 8 });
    const stars = text(this, W / 2, H - 180, '', 42, '#d8b0ff', { stroke: '#3a0a6a', strokeThickness: 6 });
    layer.add([eternal, name, stars]);
    this.tweens.add({ targets: eternal, alpha: 1, scale: 1, duration: 1000, ease: 'Back.out' });
    for (let i = 1; i <= hero.name.length && !skipped; i++) { name.setText(hero.name.slice(0, i)); await wait(this, 130); }
    name.setText(hero.name);
    for (let i = 1; i <= 7 && !skipped; i++) { stars.setText('★'.repeat(i)); await wait(this, 170); }
    stars.setText('★'.repeat(7));
    await pause(3500);

    await tween(this, { targets: layer, alpha: 0, duration: 1000 });
    layer.destroy();
  }

  // 최후의 심판자 전용(약 10초, 탭하면 넘어감). 흰색·검은색. 번쩍임 없음.
  // 1) 흰 칼금이 화면을 위에서 아래로 가르고 2) 왼쪽은 검정, 오른쪽은 흰색으로 천천히 갈라진다
  // 3) 심판의 고리가 그려지며 돈다 4) 하늘에서 은빛 검 일곱 자루가 하나씩 꽂힌다
  // 5) 심판자가 어둠에서 걸어 나온다 6) ETERNAL + 이름 + 별 일곱
  async finalJudgment(r) {
    const hero = HERO[r.id];
    const LIGHT = 0xffffff, DARK = 0x141418, MID = 0x8a8f99;
    const layer = this.add.container(0, 0).setDepth(170);
    const cx = W / 2, cy = H / 2 - 60;
    let skipped = false;
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setInteractive();
    layer.add(bg);
    this.time.delayedCall(400, () => bg.once('pointerdown', () => { skipped = true; }));
    const pause = async ms => { for (let t = 0; t < ms && !skipped; t += 50) await wait(this, 50); };
    const fast = ms => (skipped ? 1 : ms);

    // 1) 칼금
    const slash = this.add.rectangle(cx, 0, 6, 0, LIGHT, 1).setOrigin(0.5, 0);
    layer.add(slash);
    sfx.play('crit');
    await tween(this, { targets: slash, height: H, duration: fast(600), ease: 'Cubic.in' });
    // 2) 검정·흰색으로 갈라짐(천천히 밝아짐, 번쩍임 아님)
    const left = this.add.rectangle(cx, H / 2, W / 2, H, 0x0a0a0c, 1).setOrigin(1, 0.5).setAlpha(0);
    const right = this.add.rectangle(cx, H / 2, W / 2, H, 0xe8e8ec, 1).setOrigin(0, 0.5).setAlpha(0);
    layer.addAt([left, right], 1);
    this.tweens.add({ targets: [left, right], alpha: 1, duration: fast(1200) });
    this.tweens.add({ targets: slash, width: 14, duration: fast(600), yoyo: true, onComplete: () => this.tweens.add({ targets: slash, alpha: 0, duration: 800 }) });
    setBackdrop('#0a0a0c', '#e8e8ec');
    await pause(1300);

    // 3) 심판의 고리(그려지며 돈다)
    const ringG = this.add.graphics();
    const ring = this.add.container(cx, cy + 205, [ringG]).setScale(1, 0.42); // 바닥에 그려지는 고리
    layer.add(ring);
    const prog = { p: 0 };
    const drawRing = () => {
      ringG.clear();
      ringG.lineStyle(12, DARK, 0.9).beginPath().arc(0, 0, 250, -Math.PI / 2, -Math.PI / 2 + prog.p * Math.PI * 2).strokePath();
      ringG.lineStyle(7, LIGHT, 1).beginPath().arc(0, 0, 250, -Math.PI / 2, -Math.PI / 2 + prog.p * Math.PI * 2).strokePath();
      ringG.lineStyle(3, MID, 0.9).beginPath().arc(0, 0, 228, -Math.PI / 2, -Math.PI / 2 + prog.p * Math.PI * 2).strokePath();
      const n = Math.floor(prog.p * 12);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
        ringG.fillStyle(DARK, 1).fillRect(Math.cos(a) * 239 - 7, Math.sin(a) * 239 - 7, 14, 14);
        ringG.fillStyle(LIGHT, 1).fillRect(Math.cos(a) * 239 - 5, Math.sin(a) * 239 - 5, 10, 10);
      }
    };
    await tween(this, { targets: prog, p: 1, duration: fast(1500), ease: 'Sine.inOut', onUpdate: drawRing });
    drawRing();
    this.tweens.add({ targets: ringG, angle: 360, duration: 20000, repeat: -1 });

    // 4) 은빛 검 일곱 자루가 하나씩 꽂힌다
    for (let i = 0; i < 7; i++) {
      const x = cx + (i - 3) * 95, y = cy + 120 - Math.abs(i - 3) * 30;
      // 은빛 장검 그림(아래가 칼끝). 칼끝이 땅(y + 225)에 꽂힌다
      const sw = this.add.image(x, -60, propTex(this, 'sword')).setOrigin(0.5, 1).setScale(0.82 * TS);
      layer.add(sw);
      await tween(this, { targets: sw, y: y + 225, duration: fast(320), ease: 'Quad.in' });
      if (!skipped) { sfx.play('hit'); this.cameras.main.shake(140, this.flash ? 0.01 : 0.005); }
      await pause(160);
    }

    // 5) 심판자가 걸어 나온다
    const img = this.add.image(cx, cy + 250, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(2.1 * TS).setAlpha(0);
    layer.add(img);
    sfx.play('star7');
    await tween(this, { targets: img, alpha: 1, scale: 2.6 * TS, y: cy + 200, duration: fast(1800), ease: 'Sine.out' });
    this.tweens.add({ targets: img, y: cy + 190, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // 6) 이름
    const eternal = text(this, W / 2, 120, 'ETERNAL', 46, '#ffffff', { stroke: '#000000', strokeThickness: 8 }).setAlpha(0).setScale(1.6);
    const name = text(this, W / 2, H - 250, '', 54, '#ffffff', { stroke: '#000000', strokeThickness: 9 });
    const stars = text(this, W / 2, H - 180, '', 42, '#ffffff', { stroke: '#000000', strokeThickness: 7 });
    layer.add([eternal, name, stars]);
    this.tweens.add({ targets: eternal, alpha: 1, scale: 1, duration: 1000, ease: 'Back.out' });
    for (let i = 1; i <= hero.name.length && !skipped; i++) { name.setText(hero.name.slice(0, i)); await wait(this, 130); }
    name.setText(hero.name);
    for (let i = 1; i <= 7 && !skipped; i++) { stars.setText('★'.repeat(i)); await wait(this, 170); }
    stars.setText('★'.repeat(7));
    await pause(3500);

    await tween(this, { targets: layer, alpha: 0, duration: 1000 });
    layer.destroy();
    setBackdrop('#000000', '#000000');
  }

  // ★7 전용 애니메이션 공통 마무리: ETERNAL + 이름 + 별 일곱, 잠시 보여 주고 사라짐
  async eternalTitle(layer, hero, fill, stroke, starFill, pause, isSkipped) {
    const eternal = text(this, W / 2, 120, 'ETERNAL', 46, fill, { stroke, strokeThickness: 7 }).setAlpha(0).setScale(1.6);
    const name = text(this, W / 2, H - 250, '', 54, fill, { stroke, strokeThickness: 9 });
    const stars = text(this, W / 2, H - 180, '', 42, starFill, { stroke, strokeThickness: 6 });
    layer.add([eternal, name, stars]);
    this.tweens.add({ targets: eternal, alpha: 1, scale: 1, duration: 1000, ease: 'Back.out' });
    for (let i = 1; i <= hero.name.length && !isSkipped(); i++) { name.setText(hero.name.slice(0, i)); await wait(this, 130); }
    name.setText(hero.name);
    for (let i = 1; i <= 7 && !isSkipped(); i++) { stars.setText('★'.repeat(i)); await wait(this, 170); }
    stars.setText('★'.repeat(7));
    await pause(3500);
    await tween(this, { targets: layer, alpha: 0, duration: 1000 });
    layer.destroy();
  }

  // ★7 전용 애니메이션 시작 준비: 맨 위 층 + 탭하면 건너뛰기
  eternalLayer(bgColor = 0x000000) {
    const layer = this.add.container(0, 0).setDepth(170);
    const state = { skipped: false };
    const bg = this.add.rectangle(W / 2, H / 2, W, H, bgColor, 1).setInteractive();
    layer.add(bg);
    this.time.delayedCall(400, () => bg.once('pointerdown', () => { state.skipped = true; }));
    const pause = async ms => { for (let t = 0; t < ms && !state.skipped; t += 50) await wait(this, 50); };
    const fast = ms => (state.skipped ? 1 : ms);
    return { layer, state, pause, fast };
  }

  // 심해의 군주 전용(약 11초): 1) 아래부터 물이 차오르고 물방울이 올라간다 2) 깊은 바다 속에서 거대한 눈이 천천히 떠진다
  // 3) 눈이 감기고 소용돌이가 돈다 4) 소용돌이를 타고 군주가 올라온다 5) ETERNAL + 이름. 번쩍임 없음.
  async abyssRise(r) {
    const hero = HERO[r.id];
    const { layer, state, pause, fast } = this.eternalLayer(0x02080a);
    const cx = W / 2, cy = H / 2 - 40;
    setBackdrop('#02080a', '#02080a');

    // 1) 물이 차오른다(물결 윗면)
    const water = this.add.graphics();
    layer.add(water);
    const lvl = { y: H + 40, t: 0 };
    const drawWater = () => {
      water.clear();
      // 물 몸통(그라데이션은 사각형으로만) + 물결 윗면(단색 경로)
      water.fillGradientStyle(0x1a8a90, 0x1a8a90, 0x031418, 0x031418, 1).fillRect(0, lvl.y + 10, W, Math.max(0, H - lvl.y));
      water.fillStyle(0x1a8a90, 1).beginPath(); water.moveTo(0, lvl.y + 12);
      for (let x = 0; x <= W; x += 24) water.lineTo(x, lvl.y + Math.sin(x / 60 + lvl.t) * 12);
      water.lineTo(W, lvl.y + 12); water.closePath(); water.fillPath();
      water.lineStyle(3, 0x7ff0e8, 0.7).beginPath();
      for (let x = 0; x <= W; x += 24) (x ? water.lineTo(x, lvl.y + Math.sin(x / 60 + lvl.t) * 12) : water.moveTo(x, lvl.y + Math.sin(x / 60 + lvl.t) * 12));
      water.strokePath();
    };
    const waveTick = this.time.addEvent({ delay: 40, loop: true, callback: () => { lvl.t += 0.12; drawWater(); } });
    const bubbles = this.add.particles(0, 0, 'dot', {
      x: { min: 20, max: W - 20 }, y: H + 10, lifespan: 4200, speedY: { min: -150, max: -70 }, speedX: { min: -12, max: 12 },
      scale: { min: 0.3, max: 0.9 }, alpha: { start: 0.7, end: 0 }, tint: [0xbff8f4, 0x7ff0e8], frequency: 60,
    });
    layer.add(bubbles);
    sfx.play('summon');
    await tween(this, { targets: lvl, y: -40, duration: fast(2600), ease: 'Sine.inOut' });
    setBackdrop('#1a8a90', '#031418');

    // 2) 거대한 눈이 떠진다(흰 눈, 동공 없음 — 게임 그림체 그대로)
    const eyeLid = { open: 0 };
    const eye = this.add.graphics();
    layer.add(eye);
    const almond = (rx, h) => {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI; pts.push({ x: cx - rx * Math.cos(t), y: cy - h * Math.pow(Math.sin(t), 1.3) }); }
      for (let i = 24; i >= 0; i--) { const t = (i / 24) * Math.PI; pts.push({ x: cx - rx * Math.cos(t), y: cy + h * 0.8 * Math.pow(Math.sin(t), 1.3) }); }
      return pts;
    };
    const drawEye = () => {
      eye.clear();
      const h = 95 * eyeLid.open;
      eye.fillStyle(0x7ff0e8, 0.14).fillEllipse(cx, cy, 520, 280);
      eye.fillStyle(0x0e4a50, 1).fillPoints(almond(196, Math.max(14, h + 18)), true); // 눈꺼풀
      eye.lineStyle(4, 0x3fd8d0, 0.9).strokePoints(almond(196, Math.max(14, h + 18)), true);
      if (h > 2) {
        eye.fillStyle(0xf4fffe, 1).fillPoints(almond(160, h), true); // 흰 눈(동공 없음)
        eye.fillStyle(0xbff8f4, 0.8).fillEllipse(cx - 40, cy - h * 0.35, 70, Math.max(2, h * 0.28));
      }
    };
    drawEye();
    sfx.play('star7');
    await tween(this, { targets: eyeLid, open: 1, duration: fast(1600), ease: 'Sine.inOut', onUpdate: drawEye });
    await pause(1200);
    await tween(this, { targets: eyeLid, open: 0, duration: fast(700), ease: 'Sine.in', onUpdate: drawEye });
    this.tweens.add({ targets: eye, alpha: 0, duration: 500 });

    // 3) 소용돌이
    const swirl = this.add.container(cx, cy + 160).setScale(1, 0.45);
    for (let i = 0; i < 5; i++) {
      const g = this.add.graphics();
      g.lineStyle(8 - i, i % 2 ? 0x7ff0e8 : 0x3fd8d0, 0.8).beginPath().arc(0, 0, 70 + i * 45, i, i + Math.PI * 1.3).strokePath();
      swirl.add(g);
    }
    swirl.setAlpha(0);
    layer.add(swirl);
    this.tweens.add({ targets: swirl, alpha: 1, duration: 800 });
    this.tweens.add({ targets: swirl, angle: -360, duration: 5000, repeat: -1 });

    // 4) 군주가 올라온다
    const img = this.add.image(cx, cy + 360, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(2.2 * TS).setAlpha(0);
    layer.add(img);
    await tween(this, { targets: img, alpha: 1, y: cy + 200, scale: 2.6 * TS, duration: fast(2200), ease: 'Sine.out' });
    this.cameras.main.shake(500, this.flash ? 0.014 : 0.007);
    this.tweens.add({ targets: img, y: cy + 186, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    await this.eternalTitle(layer, hero, '#e8fffd', '#06343a', '#7ff0e8', pause, () => state.skipped);
    waveTick.remove();
    setBackdrop('#000000', '#000000');
  }

  // 세계수의 여왕 전용(약 11초): 1) 땅이 갈라지고 2) 거대한 나무가 하늘까지 자라며 가지를 뻗는다
  // 3) 가지마다 빛나는 꽃이 피고 꽃잎이 흩날린다 4) 나무 밑동의 빛 속에서 여왕이 나타난다 5) ETERNAL + 이름. 번쩍임 없음.
  async worldTreeBloom(r) {
    const hero = HERO[r.id];
    const { layer, state, pause, fast } = this.eternalLayer(0x06120a);
    const cx = W / 2, ground = H / 2 + 260;
    setBackdrop('#06120a', '#0a1a0c');

    // 하늘과 땅
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a1a2a, 0x0a1a2a, 0x2a5a2a, 0x2a5a2a, 1).fillRect(0, 0, W, ground);
    sky.fillStyle(0x1e3a14, 1).fillRect(0, ground, W, H - ground);
    sky.setAlpha(0);
    layer.add(sky);
    this.tweens.add({ targets: sky, alpha: 1, duration: fast(1000) });
    // 1) 땅이 갈라지는 금빛 틈
    const crack = this.add.graphics();
    layer.add(crack);
    crack.lineStyle(5, 0xffd84a, 1).beginPath().moveTo(cx - 160, ground + 6).lineTo(cx - 60, ground - 2).lineTo(cx, ground + 8).lineTo(cx + 70, ground).lineTo(cx + 170, ground + 6).strokePath();
    crack.setScale(0, 1).setPosition(cx * (1 - 0), 0);
    crack.x = 0;
    await tween(this, { targets: crack, scaleX: 1, duration: fast(800), ease: 'Cubic.out' });
    sfx.play('summon');

    // 2) 나무가 자란다: 줄기·가지 그림이 아래에서 위로 드러나고, 잎이 피어난다
    const top0 = ground - TREE.base; // 나무 그림의 맨 위가 놓일 화면 높이
    const trunkImg = this.add.image(0, top0, propTex(this, 'treeTrunk')).setOrigin(0, 0).setScale(TS);
    const canopyImg = this.add.image(W / 2, top0 + TREE.h / 2, propTex(this, 'treeCanopy')).setAlpha(0).setScale(0.85 * TS);
    layer.add([trunkImg, canopyImg]);
    const grow = { p: 0 };
    const reveal = () => { const h = TREE.h * grow.p * TEXRES; trunkImg.setCrop(0, TREE.h * TEXRES - h, TREE.w * TEXRES, h); };
    reveal();
    sfx.play('star7');
    this.tweens.add({ targets: canopyImg, alpha: 1, scale: TS, duration: fast(1800), delay: state.skipped ? 0 : 1900, ease: 'Back.out' });
    await tween(this, { targets: grow, p: 1, duration: fast(3200), ease: 'Sine.inOut', onUpdate: reveal });
    reveal();
    await pause(500);

    // 3) 빛나는 꽃(다섯 잎) + 꽃잎이 흩날린다
    const flower = (x, y, c) => {
      const f = this.add.container(x, y);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; f.add(this.add.circle(Math.cos(a) * 7, Math.sin(a) * 7, 6, c).setStrokeStyle(1.5, 0xc85a98)); }
      f.add(this.add.circle(0, 0, 4.5, 0xffe066).setStrokeStyle(1.2, 0xc8961a));
      return f;
    };
    const blossoms = [];
    for (const [tx, ty] of TREE_TIPS) {
      for (let k = 0; k < 3; k++) {
        const b = flower(tx + (Math.random() - 0.5) * 90, top0 + ty + (Math.random() - 0.5) * 60, k % 2 ? 0xffb8e0 : 0xfff3f8).setScale(0);
        layer.add(b);
        blossoms.push(b);
      }
    }
    blossoms.forEach((b, i) => this.tweens.add({ targets: b, scale: 1, duration: fast(450), delay: state.skipped ? 0 : i * 45, ease: 'Back.out' }));
    const petals = this.add.particles(0, 0, propTex(this, 'petal'), {
      x: { min: 40, max: W - 40 }, y: { min: 60, max: 420 }, lifespan: 5000, speedY: { min: 40, max: 90 }, speedX: { min: -40, max: 20 },
      scale: { min: 0.7 * TS, max: 1.1 * TS }, rotate: { start: 0, end: 300 }, alpha: { start: 0.95, end: 0 }, frequency: 80,
    });
    layer.add(petals);
    await pause(1200);

    // 4) 밑동의 빛 속에서 여왕이 나타난다
    const light = this.add.circle(cx, ground - 60, 40, 0xfff3c0, 0.9).setScale(0.2);
    layer.add(light);
    await tween(this, { targets: light, scale: 3, alpha: 0.35, duration: fast(1200), ease: 'Sine.out' });
    const img = this.add.image(cx, ground + 10, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(1.6 * TS).setAlpha(0);
    layer.add(img);
    await tween(this, { targets: img, alpha: 1, scale: 2.5 * TS, y: ground - 10, duration: fast(1800), ease: 'Back.out' });
    this.tweens.add({ targets: img, y: ground - 24, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: light, alpha: 0.15, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    await this.eternalTitle(layer, hero, '#fff6c8', '#2a5a24', '#ffe066', pause, () => state.skipped);
    petals.stop();
    setBackdrop('#000000', '#000000');
  }

  // 각성: 뒤집힌 카드 위로 작은 별 일곱 개가 모여 큰 별 하나가 된다 + '각성!'
  async awakenBurst(card, slot, r) {
    const cx = slot.x, cy = slot.y - slot.h / 2 - 70;
    const small = [];
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i / 7) * Math.PI * 2;
      const st = text(this, cx + Math.cos(a) * 140, cy + Math.sin(a) * 90, '★', 36, '#ffe066', { stroke: '#8a4a10', strokeThickness: 4 }).setDepth(180).setAlpha(0);
      small.push(st);
      this.tweens.add({ targets: st, alpha: 1, duration: 400, delay: i * 120 });
    }
    await wait(this, 1300);
    await Promise.all(small.map(st => tween(this, { targets: st, x: cx, y: cy, scale: 0.5, duration: 700, ease: 'Cubic.in' })));
    small.forEach(st => st.destroy());
    sfx.play('star7');
    this.cameras.main.shake(400, this.flash ? 0.012 : 0.006);
    const big = text(this, cx, cy, '★', 150, '#ffe066', { stroke: '#8a4a10', strokeThickness: 10 }).setDepth(180).setScale(0.2);
    big.setShadow(0, 0, '#fff3c0', 30, true, true);
    const label = text(this, cx, cy + 110, '각성!', 64, '#ffffff', { stroke: '#8a4a10', strokeThickness: 10 }).setDepth(180).setAlpha(0);
    await tween(this, { targets: big, scale: 1, duration: 700, ease: 'Back.out' });
    this.tweens.add({ targets: label, alpha: 1, duration: 500 });
    this.tweens.add({ targets: big, angle: 360, duration: 12000, repeat: -1 });
    await wait(this, 2200);
    this.tweens.add({ targets: [big, label], alpha: 0, duration: 800 });
  }

  // 카드 둘레의 번개. 번쩍임이 꺼져 있으면 밝기는 그대로 두고 모양만 천천히 바뀐다.
  crackle(card, slot, col, outer = col) {
    const g = this.add.graphics();
    card.add(g);
    const hw = slot.w / 2, hh = slot.h / 2;
    const edgePoint = () => {
      const side = Math.floor(Math.random() * 4), t = Math.random() * 2 - 1;
      return side === 0 ? [t * hw, -hh] : side === 1 ? [hw, t * hh] : side === 2 ? [t * hw, hh] : [-hw, t * hh];
    };
    const bolt = (len) => {
      const [x0, y0] = edgePoint();
      const ang = Math.atan2(y0, x0) + (Math.random() - 0.5) * 1.2;
      const pts = [[x0, y0]];
      let x = x0, y = y0;
      for (let i = 0; i < 5; i++) {
        x += Math.cos(ang) * (len / 5) + (Math.random() - 0.5) * 14;
        y += Math.sin(ang) * (len / 5) + (Math.random() - 0.5) * 14;
        pts.push([x, y]);
      }
      return pts;
    };
    const draw = () => {
      g.clear();
      const n = 4 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const pts = bolt(slot.w * (0.25 + Math.random() * 0.25));
        for (const [w, c, a] of [[9, outer, 0.45], [3.5, col, 0.95], [1.4, 0xffffff, 1]]) {
          g.lineStyle(w, c, a);
          g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
          for (const [px, py] of pts.slice(1)) g.lineTo(px, py);
          g.strokePath();
        }
      }
      g.lineStyle(7, outer, 0.6).strokeRoundedRect(-hw, -hh, slot.w, slot.h, 16);
      g.lineStyle(4, col, 0.9).strokeRoundedRect(-hw, -hh, slot.w, slot.h, 16);
      if (this.flash) g.setAlpha(0.55 + Math.random() * 0.45);
    };
    draw();
    this.time.addEvent({ delay: this.flash ? 80 : 420, loop: true, callback: draw });
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
    this.tweens.add({ targets: dark, fillAlpha: 0.9, duration: 600 });
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
    this.tweens.add({ targets: beams, alpha: 1, duration: 1100 });
    this.tweens.add({ targets: beams, angle: 30, duration: seven ? 6000 : 4000 });

    // ★7: 금빛 가루가 천천히 떨어진다
    if (seven) {
      const dust = this.add.particles(0, 0, 'dot', {
        x: { min: 0, max: W }, y: -20, lifespan: 4000, speedY: { min: 60, max: 140 }, speedX: { min: -20, max: 20 },
        scale: { min: 0.3, max: 0.7 }, alpha: { start: 0.9, end: 0 }, tint: [0xffe066, 0xfff3c0, 0xffc83d], frequency: 40,
      });
      layer.add(dust);
    }

    const img = this.add.image(W / 2, 1400, heroTex(this, r.id)).setOrigin(0.5, 0.86).setScale(1.6 * TS);
    layer.add(img);
    if (this.flash) this.time.delayedCall(500, () => this.whiteFlash());
    this.tweens.add({ targets: img, y: 760, scale: (seven ? 3.2 : 2.8) * TS, duration: 1300, delay: 500, ease: 'Back.out' });

    const name = text(this, W / 2, 860, '', 60, '#ffffff');
    const stars = text(this, W / 2, 940, '', 44, STAR_COLOR[r.star]);
    const quote = text(this, W / 2, 1030, '', 30, '#e8e8ff', { wordWrap: { width: W - 80 }, fontStyle: 'italic bold' });
    layer.add([name, stars, quote]);
    if (r.isNew) {
      const nw = text(this, W - 110, 200, 'NEW!', 54, '#7dff8a');
      nw.setAngle(12).setAlpha(0);
      layer.add(nw);
      this.tweens.add({ targets: nw, alpha: 1, scale: { from: 1.6, to: 1 }, duration: 400, delay: 1800, ease: 'Back.out' });
    } else {
      const dp = text(this, W - 120, 200, r.overflowGold ? `+🪙${r.overflowGold}` : `+${r.dupes}`, 46, '#ffd36a');
      layer.add(dp.setAlpha(0));
      this.tweens.add({ targets: dp, alpha: 1, duration: 400, delay: 1800 });
    }

    let skipped = false;
    const skip = () => { skipped = true; };
    this.time.delayedCall(250, () => dark.once('pointerdown', skip));
    const type = async (obj, str, each) => {
      for (let i = 1; i <= str.length && !skipped; i++) { obj.setText(str.slice(0, i)); await wait(this, each); }
      obj.setText(str);
    };
    await wait(this, 1500);
    if (!skipped) await type(name, hero.name, 110);
    if (!skipped) await type(stars, '★'.repeat(r.star), 140);
    if (!skipped) await type(quote, `“${hero.quote}”`, 60);
    name.setText(hero.name); stars.setText('★'.repeat(r.star)); quote.setText(`“${hero.quote}”`);
    const hold = seven ? 3200 : 2200;
    for (let t = 0; t < hold && !skipped; t += 100) await wait(this, 100);
    if (!skipped) {
      const tip = text(this, W / 2, 1200, '눌러서 계속', 26, '#aab0d0');
      layer.add(tip);
      await new Promise(res => { if (skipped) res(); else { dark.removeAllListeners('pointerdown'); dark.once('pointerdown', res); } });
    }
    await tween(this, { targets: layer, alpha: 0, duration: 500 });
    layer.destroy();
  }

  showEnd() {
    const s = this.app.save;
    if (this.awaken) {
      text(this, W / 2, 1090, '큰 별 하나 ★8 · 능력치 2배 · 최대 레벨 60', 28, '#ffe9a0');
      button(this, W / 2, 1200, 420, 96, '좋아요!', () => closeStage(this.app, 'heroDetail', { id: this.results[0].id }), { size: 32, fill: 0xc8961a });
      return;
    }
    if (this.ticket) {
      // 시작 선물: 편성에 넣어 줬으니 바로 마을로 돌아가 첫 모험으로
      const inTeam = s.team.includes(this.results[0].id);
      text(this, W / 2, 1090, inTeam ? '편성에 넣어 뒀어요! 이제 첫 모험을 떠나요' : '편성에서 이 영웅을 넣어 보세요!', 28, '#ffe9a0');
      button(this, W / 2, 1200, 420, 96, '좋아요!', () => closeStage(this.app, 'lobby'), { size: 32, fill: 0x3cb94e });
      return;
    }
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
