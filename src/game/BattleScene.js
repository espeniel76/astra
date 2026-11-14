// 전투 화면: battle.js 의 step() 이벤트를 하나씩 애니메이션으로 재생한다.
import Phaser from 'phaser';
import { createBattle, step, queueSkill, DISABLE } from '../core/battle.js';
import { STAGE, STAGES, CHAPTERS } from '../data/stages.js';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { bump } from '../core/daily.js';
import { sfx } from '../core/sfx.js';
import { closeStage } from './phaser.js';
import { text, button, heroTex, monTex, wait, tween, colorNum, PX } from './ui.js';

const W = 720;
const FOE_Y = 470, ALLY_Y = 880;
const SLOT_X = [150, 360, 570];
const STATUS_ICON = {
  taunt: '🛡', stun: '💫', freeze: '❄', sleep: '💤', stone: '🗿', bind: '🪢', charm: '🎭',
  poison: '☠', burn: '🔥', bleed: '🩸', slow: '🐌', vuln: '💔', atkUp: '⚔', defDown: '🔻',
  crit: '🎯', evade: '👻', reflect: '🪞', doom: '⏳', dragon: '🐉', echo: '🔊',
};
const STATUS_NAME = {
  taunt: '도발', stun: '기절', freeze: '빙결', sleep: '잠', stone: '석화', bind: '묶임', charm: '조종',
  poison: '독', burn: '화상', bleed: '출혈', slow: '느림', vuln: '약점', atkUp: '공격↑', defDown: '방어↓',
  crit: '치명타 준비', evade: '회피', reflect: '반사', doom: '선고', dragon: '아기 용', echo: '메아리',
};
const BG = {
  meadow: { sky: [0x7ec8f0, 0xcdeefc], ground: 0x6cbf5a, dark: 0x4a9a3e },
  forest: { sky: [0x2a5a4a, 0x6a9a6a], ground: 0x3a6a32, dark: 0x264a22 },
  cave: { sky: [0x1a1424, 0x3a2e4a], ground: 0x4a4250, dark: 0x2e2836 },
};

export class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  init({ app, stageId }) {
    this.app = app;
    this.stageId = stageId;
    this.stage = STAGE[stageId];
    this.settings = app.save.settings;
    this.ended = false;
  }

  create() {
    const s = this.app.save;
    this.b = createBattle({
      team: s.team.map(id => (id && s.heroes[id] ? { id, ...s.heroes[id] } : null)),
      stageId: this.stageId,
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
    const bg = BG[CHAPTERS[this.stage.chapter - 1].bg];
    const g = this.add.graphics();
    g.fillGradientStyle(bg.sky[0], bg.sky[0], bg.sky[1], bg.sky[1], 1).fillRect(0, 0, W, 700);
    g.fillStyle(bg.ground, 1).fillRect(0, 620, W, 660);
    g.fillStyle(bg.dark, 1).fillEllipse(W / 2, 1000, 900, 200);
    g.fillStyle(bg.dark, 0.6).fillEllipse(W / 2, 560, 800, 120);
    // 장식: 초원 꽃, 숲 나무, 동굴 수정(가만히 있음)
    const rnd = new Phaser.Math.RandomDataGenerator([this.stageId]);
    for (let i = 0; i < 16; i++) {
      const x = rnd.between(10, W - 10), y = rnd.between(640, 1040);
      if (bg === BG.meadow) g.fillStyle([0xffffff, 0xffe066, 0xff9ad0][i % 3], 1).fillCircle(x, y, 5);
      else if (bg === BG.forest) g.fillStyle(0x1e3a1a, 0.7).fillTriangle(x, y - 60, x - 26, y, x + 26, y);
      else g.fillStyle(0x9a7aff, 0.5).fillTriangle(x, y - 26, x - 8, y, x + 8, y);
    }
  }

  pos(u) {
    return { x: SLOT_X[u.slot], y: u.side === 'ally' ? ALLY_Y : FOE_Y };
  }

  addUnitView(u) {
    const { x, y } = this.pos(u);
    const key = u.side === 'ally' ? heroTex(this, u.id) : monTex(this, u.id);
    const scale = u.side === 'ally' ? 1.05 : 1.05;
    const img = this.add.image(x, y, key).setOrigin(0.5, 0.86).setScale(scale);
    if (u.side === 'foe') img.setFlipX(true);
    const bar = this.add.graphics();
    const label = text(this, x, y + 40, u.side === 'ally' ? u.name : `${u.name} Lv${u.lv}`, 18, '#ffffff');
    const icons = text(this, x, y - PX * 0.86 * scale - 4, '', 22, '#ffffff', { strokeThickness: 0 });
    const v = { u, img, bar, label, icons, scale, hpShown: u.hp };
    this.views.set(u.uid, v);
    return v;
  }

  buildHud() {
    const st = this.stage;
    text(this, 110, 50, `${st.id}${st.boss ? ' 보스' : ''}`, 30, '#ffffff');
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
        if (queueSkill(this.b, u.uid)) { sfx.play('click'); this.refresh(); }
      }, { fill: colorNum(STAR_COLOR[u.star]) & 0x7f7f7f });
      const icon = this.add.image(0, -18, heroTex(this, u.id)).setScale(0.45).setOrigin(0.5, 0.86);
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
      const ev = step(this.b, { auto: this.settings.auto });
      for (const e of ev) {
        if (this.ended) return;
        await this.play(e);
      }
      this.refresh();
      await wait(this, 120);
    }
    if (!this.ended) this.finish(this.b.result);
  }

  view(uid) { return this.views.get(uid); }

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
        const dx = (t.img.x - a.img.x) * 0.35, dy = (t.img.y - a.img.y) * 0.35;
        await tween(this, { targets: a.img, x: a.img.x + dx, y: a.img.y + dy, duration: 130, yoyo: true, ease: 'Quad.out' });
        return;
      }
      case 'skill': {
        const a = this.view(e.from);
        if (!a) return;
        sfx.play('skill');
        const ally = a.u.side === 'ally';
        const color = ally ? STAR_COLOR[a.u.star] : '#ff8a8a';
        const band = this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0, 610, W, 110);
        const name = text(this, W / 2, 665, `${a.u.name} · ${e.name}`, 40, color);
        name.setScale(0.7);
        this.tweens.add({ targets: name, scale: 1, duration: 220, ease: 'Back.out' });
        // 시전자 주변으로 천천히 퍼지는 빛 고리(번쩍이지 않음)
        const ring = this.add.circle(a.img.x, a.img.y - 60, 30).setStrokeStyle(8, colorNum(color), 0.9);
        this.tweens.add({ targets: ring, radius: 160, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
        if (flash) {
          const f = this.add.rectangle(W / 2, 640, W, 1280, 0xffffff, 0.5);
          this.tweens.add({ targets: f, alpha: 0, duration: 150, onComplete: () => f.destroy() });
        }
        await tween(this, { targets: a.img, scale: a.scale * 1.25, duration: 180, yoyo: true, ease: 'Quad.out' });
        await wait(this, 250);
        band.destroy(); name.destroy();
        return;
      }
      case 'damage': {
        const t = this.view(e.to);
        if (!t) return;
        sfx.play(e.crit ? 'crit' : 'hit');
        const color = e.dot ? '#c08aff' : e.reflect ? '#9fd8ff' : e.crit ? '#ffe066' : t.u.side === 'ally' ? '#ff8a8a' : '#ffffff';
        this.float(e.to, `${e.crit ? '치명타! ' : ''}${e.amount}`, color, e.crit ? 44 : 34);
        this.tweens.add({ targets: t.img, x: t.img.x + (t.u.side === 'ally' ? -10 : 10), duration: 60, yoyo: true });
        this.drawBar(t);
        await wait(this, e.dot ? 200 : 110);
        return;
      }
      case 'heal': if (e.amount > 0) { sfx.play('heal'); this.float(e.to, `+${e.amount}`, '#7dff8a'); this.drawBar(this.view(e.to)); } await wait(this, 90); return;
      case 'shield': this.float(e.to, '보호막', '#9fd8ff', 28); this.drawBar(this.view(e.to)); await wait(this, 80); return;
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
      case 'pet': this.float(e.from, '🐉', '#ff8a3a', 40); await wait(this, 150); return;
      case 'passive': {
        const a = this.view(e.from);
        sfx.play('star6');
        const t = text(this, W / 2, 660, `${a?.u.name || ''} · ${e.name}!`, 40, '#ffe066');
        await wait(this, 700); t.destroy();
        return;
      }
      case 'death': {
        const t = this.view(e.to);
        if (!t) return;
        sfx.play('death');
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
        v.img.setAlpha(0).setScale(0.3);
        this.float(e.from, e.name, '#ffb0b0', 34);
        await tween(this, { targets: v.img, alpha: 1, scale: v.scale, duration: 350, ease: 'Back.out' });
        return;
      }
      default: return;
    }
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
    const yes = button(this, W / 2 - 130, 680, 220, 90, '나가기', () => { this.ended = true; closeStage(this.app, 'adventure'); }, { fill: 0x6a2a3a });
    const no = button(this, W / 2 + 130, 680, 220, 90, '계속 싸우기', () => { c.destroy(); yes.destroy(); no.destroy(); this.paused = false; });
    yes.box.setDepth(101); no.box.setDepth(101);
  }

  finish(result) {
    this.ended = true;
    const s = this.app.save, st = this.stage;
    bump(s, 'battle');
    const c = this.overlay();
    const add = o => { c.add(o.box || o); return o; };
    if (result === 'win') {
      sfx.play('win');
      const gold = Math.round(st.gold * this.b.goldMul);
      const first = !s.cleared.includes(st.id);
      s.gold += gold;
      if (first) { s.diamonds += st.firstDia; s.cleared.push(st.id); }
      this.app.persist();
      const title = add(text(this, W / 2, 420, '승리!', 96, '#ffe066'));
      title.setScale(0.4);
      this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.out' });
      add(text(this, W / 2, 560, `🪙 ${gold.toLocaleString('ko-KR')}${this.b.goldMul > 1 ? ' (×2)' : ''}`, 44, '#ffd36a'));
      if (first) add(text(this, W / 2, 630, `💎 ${st.firstDia.toLocaleString('ko-KR')} (첫 클리어)`, 40, '#7fd8ff'));
      const idx = STAGES.indexOf(st);
      const next = STAGES[idx + 1];
      if (next) add(button(this, W / 2, 780, 420, 100, `다음: ${next.id}${next.boss ? ' 보스' : ''}`, () => this.scene.restart({ app: this.app, stageId: next.id }), { fill: 0x3cb94e }));
      else add(text(this, W / 2, 780, '모든 스테이지를 깼어요!', 36, '#ffe066'));
      add(button(this, W / 2, 910, 420, 90, '모험으로', () => closeStage(this.app, 'adventure')));
    } else {
      sfx.play('lose');
      this.app.persist();
      add(text(this, W / 2, 440, '아쉬워요…', 80, '#ff8a8a'));
      add(text(this, W / 2, 560, '영웅을 레벨업하고\n다시 도전해요!', 36, '#ffffff'));
      add(button(this, W / 2, 720, 420, 96, '영웅 키우러 가기', () => closeStage(this.app, 'heroes'), { fill: 0x3cb94e }));
      add(button(this, W / 2, 840, 420, 90, '다시 도전', () => this.scene.restart({ app: this.app, stageId: st.id })));
      add(button(this, W / 2, 950, 420, 90, '모험으로', () => closeStage(this.app, 'adventure'), { fill: 0x3a3f55 }));
    }
  }
}
