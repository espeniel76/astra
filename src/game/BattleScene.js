// 전투 화면: battle.js 의 step() 이벤트를 하나씩 애니메이션으로 재생한다.
import Phaser from 'phaser';
import { createBattle, step, queueSkill, DISABLE } from '../core/battle.js';
import { STAGE, STAGES, CHAPTERS } from '../data/stages.js';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { bump } from '../core/daily.js';
import { sfx } from '../core/sfx.js';
import { closeStage, setBackdrop } from './phaser.js';
import { text, button, heroTex, monTex, wait, tween, colorNum, PX, TEXRES, TS, hiDpi, gearTex, softTex, sparkTex, coinTex, gemTex } from './ui.js';
import { bgTexture, addAmbient, BACKDROP } from './backgrounds.js';
import { starsFor, recordStars } from '../core/stars.js';
import { dropGear } from '../core/gear.js';
import { countStat } from '../core/achievements.js';
import { music } from '../core/music.js';
import { gearName, GRADES } from '../data/gear.js';
import { winTower, towerSpec, winDungeon, dungeonState, finishPvp } from '../core/modes.js';

const W = 720;
const FOE_Y = 470, ALLY_Y = 880;
const SLOT_X = [150, 360, 570];
const STATUS_ICON = {
  taunt: '🛡', stun: '💫', freeze: '❄', sleep: '💤', stone: '🗿', bind: '🪢', charm: '🎭',
  poison: '☠', burn: '🔥', bleed: '🩸', slow: '🐌', vuln: '💔', atkUp: '⚔', defDown: '🔻',
  crit: '🎯', evade: '👻', reflect: '🪞', doom: '⏳', dragon: '🐉', echo: '🔊', regen: '🌿', timestop: '⏸', weak: '🌑',
};
const STATUS_NAME = {
  taunt: '도발', stun: '기절', freeze: '빙결', sleep: '잠', stone: '석화', bind: '묶임', charm: '조종',
  poison: '독', burn: '화상', bleed: '출혈', slow: '느림', vuln: '약점', atkUp: '공격↑', defDown: '방어↓',
  crit: '치명타 준비', evade: '회피', reflect: '반사', doom: '선고', dragon: '아기 용', echo: '메아리', regen: '재생', timestop: '시간 정지', weak: '약화',
};

export class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  // stageId = 모험 스테이지, spec = 도전 모드(무한의 탑·요일 던전·친구 대전, src/core/modes.js)
  init({ app, stageId = null, spec = null }) {
    this.app = app;
    this.spec = spec;
    this.stageId = spec ? null : stageId;
    this.stage = spec ? null : STAGE[stageId];
    this.settings = app.save.settings;
    this.ended = false;
    this.paused = false; // 같은 씬 객체를 다시 쓰므로 매번 풀어 준다
    this.exitUi = null;
    this.skillTip = null;
  }

  create() {
    hiDpi(this);
    // 보스·탑 10층마다·친구 대전은 보스 음악
    music.play(this.stage?.boss || this.spec?.kind === 'pvp' || (this.spec?.kind === 'tower' && this.spec.floor % 10 === 0) ? 'boss' : 'battle');
    const s = this.app.save;
    this.b = createBattle({
      team: s.team.map(id => (id && s.heroes[id] ? { id, ...s.heroes[id] } : null)),
      stageId: this.stageId,
      foes: this.spec?.foes || null,
      foeTeam: this.spec?.foeTeam || null,
      seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0,
    });
    this.drawBackground();
    this.views = new Map();
    for (const u of this.b.units) this.addUnitView(u);
    this.buildHud();
    this.setSpeed(this.settings.speed);
    this.refresh();
    this.time.delayedCall(500, () => this.loop());
    if (this.stageId === '1-3' && !s.tips.auto) {
      s.tips.auto = true;
      this.app.persist();
      const tip = text(this, 520, 150, '자동 버튼도 있어요! →', 26, '#ffe066');
      this.tweens.add({ targets: tip, y: 140, yoyo: true, repeat: 4, duration: 500, onComplete: () => tip.destroy() });
    }
  }

  drawBackground() {
    const kind = this.spec ? this.spec.bg : CHAPTERS[this.stage.chapter - 1].bg;
    setBackdrop(BACKDROP[kind], '#0d1020');
    this.add.rectangle(W / 2, 640, W, 1280, 0x0d1020);
    this.add.image(0, 0, bgTexture(this, kind)).setOrigin(0, 0).setScale(TS);
    addAmbient(this, kind);
    // 위쪽 막대 뒤 살짝 어둡게(글자가 잘 보이게)
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.45, 0, 0).fillRect(0, 0, W, 110);
  }

  pos(u) {
    return { x: SLOT_X[u.slot], y: u.side === 'ally' ? ALLY_Y : FOE_Y };
  }

  addUnitView(u) {
    const { x, y } = this.pos(u);
    const key = u.hero ? heroTex(this, u.id) : monTex(this, u.id);
    const scale = 1.05 * TS; // 텍스처가 2배라 0.5배 곱함
    const img = this.add.image(x, y, key).setOrigin(0.5, 0.86).setScale(scale);
    if (u.side === 'foe') img.setFlipX(true);
    const bar = this.add.graphics();
    const label = text(this, x, y + 40, u.side === 'ally' ? u.name : u.hero ? `${u.name}` : `${u.name} Lv${u.lv}`, 18, u.side === 'foe' && u.hero ? '#ffb0b0' : '#ffffff');
    const icons = text(this, x, y - PX * TEXRES * 0.86 * scale - 4, '', 22, '#ffffff', { strokeThickness: 0 });
    const v = { u, img, bar, label, icons, scale, hpShown: u.hp };
    this.views.set(u.uid, v);
    return v;
  }

  buildHud() {
    const st = this.stage;
    if (this.spec) text(this, 20, 50, this.spec.title, 24, '#ffffff', { wordWrap: { width: 300 }, align: 'left' }).setOrigin(0, 0.5);
    else text(this, 110, 50, `${st.id}${st.boss ? ' 보스' : ''}`, 30, '#ffffff');
    this.autoBtn = button(this, 400, 50, 120, 64, '자동', () => {
      this.settings.auto = !this.settings.auto; this.app.persist(); this.autoBtn.setOn(this.settings.auto);
    }, { size: 24 });
    this.autoBtn.setOn(this.settings.auto);
    this.speedBtn = button(this, 530, 50, 110, 64, `${this.settings.speed}배속`, () => {
      this.setSpeed(this.settings.speed === 1 ? 2 : 1); this.app.persist();
    }, { size: 24 });
    button(this, 650, 50, 110, 64, '나가기', () => this.askExit(), { size: 24, fill: 0x6a2a3a });

    // 스킬 버튼(아군 3칸)
    this.skillBtns = [];
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1020, 0.85).fillRoundedRect(10, 1060, W - 20, 210, 24);
    for (const u of this.b.units.filter(x => x.side === 'ally')) {
      const x = SLOT_X[u.slot];
      const btn = button(this, x, 1165, 210, 180, '', () => {
        if (queueSkill(this.b, u.uid)) {
          sfx.play('click');
          if (this.skillTip) { this.skillTip.destroy(); this.skillTip = null; this.app.save.tips.skill = true; this.app.persist(); }
          this.refresh();
        }
      }, { fill: colorNum(STAR_COLOR[u.star]) & 0x7f7f7f });
      const icon = this.add.image(0, -18, heroTex(this, u.id)).setScale(0.45 * TS).setOrigin(0.5, 0.86);
      icon.y = 20;
      btn.box.addAt(icon, 1);
      btn.label.setY(55).setFontSize(22);
      btn.label.setText(HERO[u.id].skill.name);
      const cd = text(this, 0, -15, '', 56, '#ffffff');
      btn.box.add(cd);
      const ring = this.add.graphics();
      btn.box.add(ring);
      this.skillBtns.push({ u, btn, cd, ring });
    }
  }

  setSpeed(v) {
    this.settings.speed = v;
    this.time.timeScale = v;
    this.tweens.timeScale = v;
    this.speedBtn?.set(`${v}배속`);
  }

  refresh() {
    for (const v of this.views.values()) this.drawBar(v);
    for (const sb of this.skillBtns) {
      const { u, cd, ring, btn } = sb;
      const ready = u.alive && u.cd === 0;
      const blocked = u.statuses.some(s => DISABLE.has(s.k));
      btn.setEnabled(u.alive && ready);
      cd.setText(!u.alive ? '✖' : u.cd > 0 ? String(u.cd) : '');
      ring.clear();
      if (u.queued) ring.lineStyle(8, 0xffe066, 1).strokeRoundedRect(-105, -90, 210, 180, 18);
      else if (ready && !blocked) ring.lineStyle(4, 0xffffff, 0.8).strokeRoundedRect(-105, -90, 210, 180, 18);
    }
    // 처음 전투: 스킬이 준비되면 "눌러 보세요!" 화살표
    const tips = this.app.save.tips;
    const readyBtn = this.skillBtns.find(sb => sb.u.alive && sb.u.cd === 0 && !sb.u.queued);
    // 가리키던 영웅이 더는 준비 상태가 아니면(자동·쓰러짐·쿨타임) 말풍선을 치운다
    if (this.skillTip && (this.settings.auto || !readyBtn || readyBtn.u.slot !== this.skillTipSlot)) { this.skillTip.destroy(); this.skillTip = null; }
    if (!tips.skill && !this.settings.auto && readyBtn && !this.skillTip && !this.ended) {
      this.skillTipSlot = readyBtn.u.slot;
      const x = SLOT_X[readyBtn.u.slot];
      this.skillTip = this.add.container(x, 1000).setDepth(50);
      const bubble = this.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(-110, -34, 220, 56, 16)
        .fillTriangle(-14, 22, 14, 22, 0, 42);
      this.skillTip.add([bubble, text(this, 0, -6, '눌러 보세요!', 28, '#222222', { strokeThickness: 0 })]);
      this.tweens.add({ targets: this.skillTip, y: 985, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  drawBar(v) {
    const { u, bar, icons } = v;
    const { x, y } = this.pos(u);
    bar.clear();
    if (!u.alive) { icons.setText(''); return; }
    const w = 150, top = y + 56;
    bar.fillStyle(0x000000, 0.6).fillRoundedRect(x - w / 2 - 3, top - 3, w + 6, 20, 8);
    const ratio = Math.max(0, u.hp / u.maxHp);
    bar.fillStyle(u.side === 'ally' ? 0x55d468 : 0xff5a5a, 1).fillRoundedRect(x - w / 2, top, Math.max(6, w * ratio), 14, 6);
    if (u.shield > 0) bar.fillStyle(0x9fd8ff, 0.9).fillRoundedRect(x - w / 2, top - 8, Math.min(w, (w * u.shield) / u.maxHp), 6, 3);
    icons.setText(u.statuses.map(s => STATUS_ICON[s.k] || '').join(''));
  }

  // ── 전투 진행 ──
  async loop() {
    while (!this.ended && !this.b.result) {
      if (this.paused) { await wait(this, 100); continue; }
      if (this.spec?.kind === 'pvp' && this.b.turn > 300) { this.b.result = 'draw'; break; }
      const ev = step(this.b, { auto: this.settings.auto });
      for (const e of ev) {
        if (this.ended) return;
        await this.play(e);
      }
      this.refresh();
      await wait(this, 120);
    }
    // 나가기 창이 떠 있으면 고를 때까지 결과를 미룬다(나가면 보상 없음)
    while (this.paused && !this.ended) await wait(this, 100);
    if (!this.ended) this.finish(this.b.result);
  }

  view(uid) { return this.views.get(uid); }

  // ── 타격감 도구(번쩍임 없음: 화면 전체가 하얘지는 일은 번쩍임 설정이 켜졌을 때만) ──
  // 맞은 자리에서 반짝이 조각이 사방으로 튄다
  burst(x, y, color, n = 8, speed = 260) {
    const e = this.add.particles(x, y, sparkTex(this), {
      speed: { min: speed * 0.45, max: speed }, angle: { min: 0, max: 360 }, lifespan: 380,
      scale: { start: 0.42, end: 0 }, rotate: { min: 0, max: 360 }, tint: [color, 0xffffff], blendMode: 'ADD', emitting: false,
    }).setDepth(30);
    e.explode(n);
    this.time.delayedCall(600, () => e.destroy());
  }
  // 칼이 지나간 자국(초승달 모양 선이 그어졌다 사라짐)
  slash(x, y, color) {
    const g = this.add.graphics().setDepth(31).setBlendMode('ADD');
    const a0 = Phaser.Math.FloatBetween(-2.6, -0.6);
    for (const [w, c, al] of [[14, color, 0.45], [6, 0xffffff, 0.95]]) {
      g.lineStyle(w, c, al).beginPath().arc(x, y - 60, 62, a0, a0 + 1.6).strokePath();
    }
    g.setScale(0.6); g.x = x * 0.4; g.y = (y - 60) * 0.4;
    this.tweens.add({ targets: g, scale: 1, x: 0, y: 0, alpha: 0, duration: 260, ease: 'Quad.out', onComplete: () => g.destroy() });
  }
  // 튀어 오르는 숫자: 크게 튀어나왔다가 제자리, 그다음 위로 사라짐
  popNumber(uid, str, color, size = 38, crit = false) {
    const v = this.view(uid);
    if (!v) return;
    v.stack = ((v.stack || 0) + 1) % 3;
    const t = text(this, v.img.x + Phaser.Math.Between(-26, 26), v.img.y - 120 - v.stack * 30, str, size, color, { strokeThickness: Math.max(6, size / 5) }).setDepth(40);
    t.setScale(crit ? 2 : 1.6);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 650, delay: crit ? 420 : 260, ease: 'Cubic.in', onComplete: () => t.destroy() });
  }
  // 맞으면 뒤로 밀렸다 돌아오고, 살짝 납작해지며 붉게 물든다
  hitReact(v, crit) {
    const push = v.u.side === 'ally' ? 16 : -16;
    const { y } = this.pos(v.u);
    this.tweens.killTweensOf(v.img);
    v.img.y = y; v.img.setScale(v.scale);
    this.tweens.add({ targets: v.img, y: y + push * (crit ? 1.6 : 1), scaleX: v.scale * 1.12, scaleY: v.scale * 0.88, duration: 70, yoyo: true, ease: 'Quad.out' });
    v.img.setTint(0xff9090);
    this.time.delayedCall(110, () => v.img.clearTint());
  }
  // 위로 올라가는 작은 빛 알갱이(회복·버프)
  rise(x, y, color, n = 10) {
    const e = this.add.particles(x, y - 40, softTex(this), {
      x: { min: -50, max: 50 }, y: { min: -10, max: 40 }, speedY: { min: -140, max: -70 }, lifespan: 700,
      scale: { start: 0.22, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: color, blendMode: 'ADD', emitting: false,
    }).setDepth(30);
    e.explode(n);
    this.time.delayedCall(900, () => e.destroy());
  }

  float(uid, str, color = '#ffffff', size = 34) {
    const v = this.view(uid);
    if (!v) return;
    const t = text(this, v.img.x + Phaser.Math.Between(-20, 20), v.img.y - 120, str, size, color);
    this.tweens.add({ targets: t, y: t.y - 70, alpha: 0, duration: 900, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  async play(e) {
    const flash = this.settings.flash;
    switch (e.type) {
      case 'attack': {
        const a = this.view(e.from), t = this.view(e.to);
        if (!a || !t) return;
        const home = this.pos(a.u);
        a.img.setPosition(home.x, home.y);
        const dx = t.img.x - home.x, dy = t.img.y - home.y;
        await tween(this, { targets: a.img, x: home.x - dx * 0.05, y: home.y - dy * 0.05, duration: 70, ease: 'Quad.out' });
        await tween(this, { targets: a.img, x: home.x + dx * 0.4, y: home.y + dy * 0.4, duration: 100, ease: 'Quad.in' });
        this.slash(t.img.x, t.img.y, a.u.side === 'ally' ? colorNum(STAR_COLOR[a.u.star] || '#ffffff') : 0xff7a7a);
        this.tweens.add({ targets: a.img, x: home.x, y: home.y, duration: 160, ease: 'Quad.out' });
        return;
      }
      case 'skill': {
        const a = this.view(e.from);
        if (!a) return;
        sfx.play('skill');
        const ally = a.u.side === 'ally';
        const color = a.u.hero ? (ally ? STAR_COLOR[a.u.star] : '#ff8a8a') : '#ff8a8a';
        const cn = colorNum(color);
        const dir = ally ? 1 : -1;
        const band = this.add.container(-dir * W, 0).setDepth(60);
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7).fillRect(0, 590, W, 150);
        bg.fillStyle(cn, 0.9).fillRect(0, 590, W, 6).fillRect(0, 734, W, 6);
        bg.fillGradientStyle(cn, cn, 0x000000, 0x000000, 0.45, 0.45, 0, 0).fillRect(0, 596, W, 70);
        band.add(bg);
        if (a.u.hero) band.add(this.add.image(ally ? 110 : W - 110, 720, heroTex(this, a.u.id)).setOrigin(0.5, 0.86).setScale(0.8 * TS).setFlipX(!ally));
        else band.add(this.add.image(W - 110, 720, monTex(this, a.u.id)).setOrigin(0.5, 0.86).setScale(0.8 * TS).setFlipX(true));
        const nx = a.u.hero && ally ? 430 : 290;
        band.add(text(this, nx, 640, a.u.name, 24, '#ffffff'));
        band.add(text(this, nx, 685, e.name, 46, color, { strokeThickness: 8 }));
        this.tweens.add({ targets: band, x: 0, duration: 180, ease: 'Cubic.out' });
        const aura = this.add.image(a.img.x, a.img.y - 60, softTex(this)).setTint(cn).setScale(0.6).setAlpha(0.9).setBlendMode('ADD');
        this.tweens.add({ targets: aura, scale: 2.6, alpha: 0, duration: 650, onComplete: () => aura.destroy() });
        this.rise(a.img.x, a.img.y, cn, 12);
        // 시전자 주변으로 천천히 퍼지는 빛 고리(번쩍이지 않음)
        const ring = this.add.circle(a.img.x, a.img.y - 60, 30).setStrokeStyle(8, colorNum(color), 0.9);
        this.tweens.add({ targets: ring, radius: 160, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
        if (flash) {
          const f = this.add.rectangle(W / 2, 640, W, 1280, 0xffffff, 0.5);
          this.tweens.add({ targets: f, alpha: 0, duration: 150, onComplete: () => f.destroy() });
        }
        await tween(this, { targets: a.img, scale: a.scale * 1.25, duration: 180, yoyo: true, ease: 'Quad.out' });
        await wait(this, 260);
        await tween(this, { targets: band, x: dir * W, duration: 150, ease: 'Cubic.in' });
        band.destroy();
        return;
      }
      case 'damage': {
        const t = this.view(e.to);
        if (!t) return;
        sfx.play(e.crit ? 'crit' : 'hit');
        const color = e.dot ? '#c08aff' : e.reflect ? '#9fd8ff' : e.crit ? '#ffe066' : t.u.side === 'ally' ? '#ff8a8a' : '#ffffff';
        if (e.crit) this.popNumber(e.to, '치명타!', '#ffb020', 26, true);
        this.popNumber(e.to, String(e.amount), color, e.crit ? 54 : e.dot ? 30 : 38, e.crit);
        if (!e.dot) {
          this.burst(t.img.x, t.img.y - 60, e.crit ? 0xffc23a : e.reflect ? 0x9fd8ff : 0xffffff, e.crit ? 14 : 8, e.crit ? 360 : 260);
          this.hitReact(t, e.crit);
        }
        if (e.crit) this.cameras.main.shake(140, flash ? 0.008 : 0.004);
        this.drawBar(t);
        await wait(this, e.dot ? 200 : 110);
        return;
      }
      case 'heal': if (e.amount > 0) { sfx.play('heal'); this.popNumber(e.to, `+${e.amount}`, '#7dff8a', 34); const hv = this.view(e.to); if (hv) this.rise(hv.img.x, hv.img.y, 0x7dff8a, 8); this.drawBar(hv); } await wait(this, 90); return;
      case 'shield': {
        const sv = this.view(e.to);
        if (sv) {
          const bub = this.add.circle(sv.img.x, sv.img.y - 70, 70, 0x9fd8ff, 0.18).setStrokeStyle(4, 0xcfeeff, 0.9).setScale(0.6).setDepth(25);
          this.tweens.add({ targets: bub, scale: 1.1, alpha: 0, duration: 600, ease: 'Sine.out', onComplete: () => bub.destroy() });
        }
        this.float(e.to, '보호막', '#9fd8ff', 28); this.drawBar(sv); await wait(this, 80); return;
      }
      case 'status': this.float(e.to, `${STATUS_ICON[e.k] || ''} ${STATUS_NAME[e.k] || e.k}`, '#ffe9a0', 26); this.drawBar(this.view(e.to)); await wait(this, 90); return;
      case 'resist': this.float(e.to, '보스는 안 통해요', '#cccccc', 24); await wait(this, 90); return;
      case 'miss': this.float(e.to, '피했다!', '#cfe8ff', 30); await wait(this, 120); return;
      case 'wake': this.float(e.to, '깼다! ×3', '#ffb8f0', 30); return;
      case 'skip': this.float(e.from, `${STATUS_ICON[e.k] || ''} 움직일 수 없어요`, '#cccccc', 24); await wait(this, 260); return;
      case 'dice': this.float(e.from, `🎲 ${e.amount}${e.amount === 6 ? ' 대박!' : ''}`, '#ffe066', 48); await wait(this, 450); return;
      case 'execute': this.float(e.to, '처형!', '#ff4d4d', 52); await wait(this, 250); return;
      case 'doom': this.float(e.to, '⏳ 선고 집행!', '#c08aff', 36); await wait(this, 250); return;
      case 'gold': this.float(e.from, '골드 ×2!', '#ffd36a', 34); return;
      case 'gauge': this.float(e.to, '밀려남', '#cfe8ff', 24); return;
      case 'cleanse': this.float(e.to, '정화', '#ffffff', 26); return;
      case 'purge': this.float(e.to, '🌑 효과 지움', '#ffd84a', 24); return;
      case 'pet': this.float(e.from, e.k === 'storm' ? '⚡' : '🐉', e.k === 'storm' ? '#9fdcff' : '#ff8a3a', 40); await wait(this, 150); return;
      case 'passive': {
        const a = this.view(e.from);
        if (e.name.startsWith('별 삼키기')) { this.float(e.from, '🌌 공격력↑', '#c9a8ff', 28); return; }
        sfx.play('star6');
        const t = text(this, W / 2, 660, `${a?.u.name || ''} · ${e.name}!`, 40, '#ffe066');
        await wait(this, 700); t.destroy();
        return;
      }
      case 'death': {
        const t = this.view(e.to);
        if (!t) return;
        sfx.play('death');
        const puff = this.add.particles(t.img.x, t.img.y - 50, softTex(this), {
          speed: { min: 40, max: 120 }, angle: { min: 0, max: 360 }, lifespan: 600, scale: { start: 0.35, end: 0.8 }, alpha: { start: 0.55, end: 0 },
          tint: t.u.side === 'ally' ? 0xb8c2cc : 0x8a7a9a, emitting: false,
        }).setDepth(28);
        puff.explode(10);
        this.time.delayedCall(800, () => puff.destroy());
        t.label.setAlpha(0.3);
        this.drawBar(t);
        await tween(this, { targets: t.img, alpha: 0, y: t.img.y + 20, duration: 380 });
        return;
      }
      case 'revive': {
        const t = this.view(e.to);
        if (!t) return;
        sfx.play('heal');
        t.img.setAlpha(1); t.label.setAlpha(1);
        t.img.y = this.pos(t.u).y;
        this.float(e.to, '🔥 부활!', '#ffa040', 40);
        this.drawBar(t);
        await wait(this, 400);
        return;
      }
      case 'summon': {
        const u = this.b.units.find(x => x.uid === e.to);
        const old = [...this.views.values()].find(v => v.u.side === 'foe' && v.u.slot === u.slot && !v.u.alive);
        if (old) { old.img.destroy(); old.bar.destroy(); old.label.destroy(); old.icons.destroy(); this.views.delete(old.u.uid); }
        const v = this.addUnitView(u);
        v.img.setAlpha(0).setScale(0.3 * TS);
        this.float(e.from, e.name, '#ffb0b0', 34);
        await tween(this, { targets: v.img, alpha: 1, scale: v.scale, duration: 350, ease: 'Back.out' });
        return;
      }
      default: return;
    }
  }

  // 결과 제목: 리본 띠 위의 글자 + 뒤에서 천천히 도는 빛살(이겼을 때)
  banner(c, y, str, win, color) {
    if (win) {
      const rays = this.add.container(W / 2, y).setAlpha(0);
      for (let i = 0; i < 14; i++) {
        const g = this.add.graphics();
        const a = (i / 14) * Math.PI * 2;
        g.fillStyle(0xffe066, 0.13).beginPath().moveTo(0, 0).lineTo(Math.cos(a - 0.09) * 520, Math.sin(a - 0.09) * 520).lineTo(Math.cos(a + 0.09) * 520, Math.sin(a + 0.09) * 520).closePath().fillPath();
        rays.add(g);
      }
      c.add(rays);
      this.tweens.add({ targets: rays, alpha: 1, duration: 600 });
      this.tweens.add({ targets: rays, angle: 360, duration: 24000, repeat: -1 });
    }
    const rib = this.add.graphics();
    const main = win ? 0xd8a020 : 0x4a4f66, dark = win ? 0x8a5a08 : 0x2a2e40;
    for (const sx of [-1, 1]) { // 접힌 리본 끝
      rib.fillStyle(dark, 1).fillPoints([{ x: W / 2 + sx * 230, y: y - 30 }, { x: W / 2 + sx * 300, y: y - 30 }, { x: W / 2 + sx * 275, y: y + 4 }, { x: W / 2 + sx * 300, y: y + 38 }, { x: W / 2 + sx * 230, y: y + 38 }], true);
    }
    rib.fillStyle(main, 1).fillRoundedRect(W / 2 - 250, y - 46, 500, 84, 14);
    rib.fillStyle(0xffffff, 0.18).fillRoundedRect(W / 2 - 240, y - 40, 480, 26, 10);
    rib.lineStyle(4, win ? 0xfff3b0 : 0x8a90aa, 1).strokeRoundedRect(W / 2 - 250, y - 46, 500, 84, 14);
    const t = text(this, W / 2, y - 4, str, 64, color, { strokeThickness: 10 });
    const box = this.add.container(0, 0, [rib, t]);
    c.add(box);
    box.setScale(0.3); box.x = W / 2 * 0.7; box.y = y * 0.7;
    this.tweens.add({ targets: box, scale: 1, x: 0, y: 0, duration: 420, ease: 'Back.out' });
  }

  // 보상 칸: [{ kind: 'gold'|'dia', n, note }, { kind: 'gear', slot, grade }]
  rewardChips(c, items, y) {
    const gap = 160, x0 = W / 2 - ((items.length - 1) * gap) / 2;
    items.forEach((it, i) => {
      const x = x0 + i * gap;
      const col = it.kind === 'gear' ? colorNum(GRADES[it.grade].color) : it.kind === 'gold' ? 0xffc23a : 0x5fd0ff;
      const box = this.add.container(x, y).setScale(0);
      if (it.kind === 'gear' && it.grade >= 4) { // 영웅·전설: 뒤에 천천히 숨 쉬는 빛
        const glow = this.add.image(0, -10, softTex(this)).setTint(col).setScale(1.9).setAlpha(0.55).setBlendMode('ADD');
        box.add(glow);
        this.tweens.add({ targets: glow, alpha: 0.25, scale: 2.2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      const g = this.add.graphics();
      g.fillStyle(0x141830, 0.96).fillRoundedRect(-68, -82, 136, 164, 18);
      g.fillStyle(col, 0.18).fillRoundedRect(-68, -82, 136, 90, 18);
      g.lineStyle(4, col, 1).strokeRoundedRect(-68, -82, 136, 164, 18);
      box.add(g);
      if (it.kind === 'gear') {
        box.add(this.add.image(0, -18, gearTex(this, it.slot, it.grade)).setScale(0.48));
        box.add(text(this, 0, 50, gearName(it.slot, it.grade), 20, GRADES[it.grade].color, { wordWrap: { width: 126 } }));
      } else {
        box.add(this.add.image(0, -20, it.kind === 'gold' ? coinTex(this) : gemTex(this)).setScale(0.42));
        const num = text(this, 0, 44, '0', 30, it.kind === 'gold' ? '#ffd36a' : '#7fd8ff');
        box.add(num);
        if (it.note) box.add(text(this, 0, 72, it.note, 15, '#cfd4e8'));
        const cnt = { v: 0 };
        this.tweens.add({ targets: cnt, v: it.n, duration: 700, delay: 500 + i * 260, ease: 'Cubic.out', onUpdate: () => num.setText(Math.round(cnt.v).toLocaleString('ko-KR')) });
      }
      c.add(box);
      this.tweens.add({ targets: box, scale: 1, duration: 340, delay: 350 + i * 260, ease: 'Back.out', onStart: () => sfx.play('reveal') });
    });
  }

  // ── 끝 ──
  overlay() {
    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(W / 2, 640, W, 1280, 0x000000, 0.7).setInteractive());
    return c;
  }

  askExit() {
    if (this.ended || this.paused) return;
    this.paused = true;
    const c = this.overlay();
    c.add(text(this, W / 2, 520, '나가면 이번 전투 보상은 없어요.\n나갈까요?', 34, '#ffffff'));
    const yes = button(this, W / 2 - 130, 680, 220, 90, '나가기', () => { this.ended = true; this.paused = false; closeStage(this.app, this.spec?.back || 'adventure'); }, { fill: 0x6a2a3a });
    const no = button(this, W / 2 + 130, 680, 220, 90, '계속 싸우기', () => this.closeExit());
    yes.box.setDepth(101); no.box.setDepth(101);
    this.exitUi = [c, yes, no];
  }

  // 나가기 창 닫기(계속 싸우기)
  closeExit() {
    if (!this.exitUi) return;
    for (const o of this.exitUi) o.destroy();
    this.exitUi = null;
    this.paused = false;
  }

  finish(result) {
    this.ended = true;
    this.skillTip?.destroy(); this.skillTip = null;
    if (this.spec) return this.finishMode(result);
    const s = this.app.save, st = this.stage;
    bump(s, 'battle');
    const c = this.overlay();
    const add = o => { c.add(o.box || o); return o; };
    if (result === 'win') {
      countStat(s, 'wins');
      sfx.play('win');
      const gold = Math.round(st.gold * this.b.goldMul);
      const got = starsFor(this.b, st);
      const { first } = recordStars(s, st.id, got);
      s.gold += gold;
      s.diamonds += st.dia + (first ? st.firstDia : 0);
      const drop = st.boss || Math.random() < 0.3 ? dropGear(s, Math.random, Math.min(5, 1 + Math.floor((st.chapter - 1) / 3)), 1) : [];
      this.app.persist();
      this.banner(c, 280, '승리!', true, '#fff6c8');
      // 별 3개: 하나씩 커지며 등장(번쩍임 없음)
      const conds = ['깨기', '아무도 안 쓰러지기', `${st.limit}번 행동 안에 깨기`];
      for (let i = 0; i < 3; i++) {
        const on = i < got;
        const star = add(this.add.star(W / 2 + (i - 1) * 120, 430 + (i === 1 ? -16 : 0), 5, 22, 50, on ? 0xffd84a : 0x3a3f55)
          .setStrokeStyle(4, on ? 0xb07a10 : 0x22263a));
        star.setScale(0);
        this.tweens.add({ targets: star, scale: 1, duration: 320, delay: 350 + i * 260, ease: 'Back.out', onStart: () => { if (on) sfx.play('reveal'); } });
        add(text(this, W / 2 + (i - 1) * 120, 500, conds[i], 17, on ? '#ffe9a0' : '#8a90aa', { wordWrap: { width: 116 } }));
      }
      this.rewardChips(c, [
        { kind: 'gold', n: gold, note: this.b.goldMul > 1 ? '골드 ×2' : '' },
        { kind: 'dia', n: st.dia + (first ? st.firstDia : 0), note: first ? '첫 클리어!' : '' },
        ...drop.map(d => ({ kind: 'gear', ...d })),
      ], 650);
      const idx = STAGES.indexOf(st);
      const next = STAGES[idx + 1];
      if (next) add(button(this, W / 2, 830, 420, 100, `다음: ${next.id}${next.boss ? ' 보스' : ''}`, () => this.scene.restart({ app: this.app, stageId: next.id, spec: null }), { fill: 0x3cb94e }));
      else add(text(this, W / 2, 830, '모든 스테이지를 깼어요!', 36, '#ffe066'));
      add(button(this, W / 2, 950, 420, 90, '모험으로', () => closeStage(this.app, 'adventure')));
    } else {
      sfx.play('lose');
      this.app.persist();
      this.banner(c, 380, '아쉬워요…', false, '#ffb0b0');
      add(text(this, W / 2, 560, '영웅을 레벨업하고\n다시 도전해요!', 36, '#ffffff'));
      add(button(this, W / 2, 720, 420, 96, '영웅 키우러 가기', () => closeStage(this.app, 'heroes'), { fill: 0x3cb94e }));
      add(button(this, W / 2, 840, 420, 90, '다시 도전', () => this.scene.restart({ app: this.app, stageId: st.id, spec: null })));
      add(button(this, W / 2, 950, 420, 90, '모험으로', () => closeStage(this.app, 'adventure'), { fill: 0x3a3f55 }));
    }
  }

  // 도전 모드 결과: 보상 주고, 다음 층·다시 하기·돌아가기
  finishMode(result) {
    const s = this.app.save, sp = this.spec;
    bump(s, 'battle');
    const c = this.overlay();
    const add = o => { c.add(o.box || o); return o; };
    const back = () => closeStage(this.app, sp.back);
    const again = nextSpec => this.scene.restart({ app: this.app, stageId: null, spec: nextSpec });
    const lines = [];
    let r = null;
    if (result === 'win') countStat(s, 'wins');
    if (result === 'win') {
      if (sp.kind === 'tower') r = winTower(s, sp.floor, Math.random);
      else if (sp.kind === 'dungeon') { r = winDungeon(s, sp.key, sp.diff, Math.random); if (!r) lines.push(['오늘 도전 횟수를 다 썼어요', '#cccccc']); }
      else if (sp.kind === 'pvp') r = finishPvp(s, 'win');
    } else if (sp.kind === 'pvp') finishPvp(s, result);
    const chips = [];
    if (r?.gold) chips.push({ kind: 'gold', n: r.gold });
    if (r?.dia) chips.push({ kind: 'dia', n: r.dia, note: sp.kind === 'pvp' ? '오늘 첫 승리' : '' });
    for (const g of r?.gear || []) chips.push({ kind: 'gear', ...g });
    this.app.persist();

    const win = result === 'win';
    sfx.play(win ? 'win' : 'lose');
    const head = win ? (sp.kind === 'tower' ? `${sp.floor}층 돌파!` : '승리!') : result === 'draw' ? '무승부' : sp.kind === 'pvp' ? '패배…' : '아쉬워요…';
    this.banner(c, 300, head, win, win ? '#fff6c8' : result === 'draw' ? '#eeeeee' : '#ffb0b0');
    if (sp.kind === 'pvp') add(text(this, W / 2, 400, `${s.pvp.wins}승 ${s.pvp.losses}패`, 32, '#ffffff'));
    lines.forEach(([t, col], i) => add(text(this, W / 2, 450 + i * 50, t, 30, col)));
    if (chips.length) this.rewardChips(c, chips, 590);
    let y = chips.length ? 790 : 640;
    if (sp.kind === 'tower' && win) { add(button(this, W / 2, y, 420, 100, `다음: ${sp.floor + 1}층`, () => again(towerSpec(sp.floor + 1)), { fill: 0x3cb94e })); y += 120; }
    else if (sp.kind === 'dungeon' && win && dungeonState(s).left > 0) { add(button(this, W / 2, y, 420, 100, `다시 하기 (남은 ${dungeonState(s).left}번)`, () => again(sp), { fill: 0x3cb94e })); y += 120; }
    else if (!win || sp.kind === 'pvp') { add(button(this, W / 2, y, 420, 100, sp.kind === 'pvp' ? '다시 대전' : '다시 도전', () => again(sp), { fill: 0x3cb94e })); y += 120; }
    add(button(this, W / 2, y, 420, 90, { tower: '탑으로', dungeon: '던전으로', pvp: '대전으로' }[sp.kind], back, { fill: 0x3a3f55 }));
  }
}
