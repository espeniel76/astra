// 전투 화면: battle.js 의 step() 이벤트를 하나씩 애니메이션으로 재생한다.
import Phaser from 'phaser';
import { createBattle, step, queueSkill, DISABLE } from '../core/battle.js';
import { STAGE, STAGES, CHAPTERS } from '../data/stages.js';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { bump } from '../core/daily.js';
import { sfx } from '../core/sfx.js';
import { closeStage, setBackdrop } from './phaser.js';
import { text, button, heroTex, monTex, wait, tween, colorNum, PX } from './ui.js';
import { bgTexture, addAmbient } from './backgrounds.js';
import { starsFor, recordStars } from '../core/stars.js';

const W = 720;
const FOE_Y = 470, ALLY_Y = 880;
const SLOT_X = [150, 360, 570];
const STATUS_ICON = {
  taunt: '🛡', stun: '💫', freeze: '❄', sleep: '💤', stone: '🗿', bind: '🪢', charm: '🎭',
  poison: '☠', burn: '🔥', bleed: '🩸', slow: '🐌', vuln: '💔', atkUp: '⚔', defDown: '🔻',
  crit: '🎯', evade: '👻', reflect: '🪞', doom: '⏳', dragon: '🐉', echo: '🔊', regen: '🌿',
};
const STATUS_NAME = {
  taunt: '도발', stun: '기절', freeze: '빙결', sleep: '잠', stone: '석화', bind: '묶임', charm: '조종',
  poison: '독', burn: '화상', bleed: '출혈', slow: '느림', vuln: '약점', atkUp: '공격↑', defDown: '방어↓',
  crit: '치명타 준비', evade: '회피', reflect: '반사', doom: '선고', dragon: '아기 용', echo: '메아리', regen: '재생',
};

export class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  init({ app, stageId }) {
    this.app = app;
    this.stageId = stageId;
    this.stage = STAGE[stageId];
    this.settings = app.save.settings;
    this.ended = false;
    this.paused = false; // 같은 씬 객체를 다시 쓰므로 매번 풀어 준다
    this.exitUi = null;
    this.skillTip = null;
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
    const kind = CHAPTERS[this.stage.chapter - 1].bg;
    setBackdrop({ meadow: '#6cc4f5', forest: '#1d3b2c', cave: '#120e1c' }[kind], '#0d1020');
    this.add.rectangle(W / 2, 640, W, 1280, 0x0d1020);
    this.add.image(0, 0, bgTexture(this, kind)).setOrigin(0, 0);
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
        if (queueSkill(this.b, u.uid)) {
          sfx.play('click');
          if (this.skillTip) { this.skillTip.destroy(); this.skillTip = null; this.app.save.tips.skill = true; this.app.persist(); }
          this.refresh();
        }
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
    const yes = button(this, W / 2 - 130, 680, 220, 90, '나가기', () => { this.ended = true; this.paused = false; closeStage(this.app, 'adventure'); }, { fill: 0x6a2a3a });
    const no = button(this, W / 2 + 130, 680, 220, 90, '계속 싸우기', () => { c.destroy(); yes.destroy(); no.destroy(); this.exitUi = null; this.paused = false; });
    yes.box.setDepth(101); no.box.setDepth(101);
    this.exitUi = [c, yes, no];
  }

  finish(result) {
    this.ended = true;
    this.skillTip?.destroy(); this.skillTip = null;
    const s = this.app.save, st = this.stage;
    bump(s, 'battle');
    const c = this.overlay();
    const add = o => { c.add(o.box || o); return o; };
    if (result === 'win') {
      sfx.play('win');
      const gold = Math.round(st.gold * this.b.goldMul);
      const got = starsFor(this.b, st);
      const { first } = recordStars(s, st.id, got);
      s.gold += gold;
      if (first) s.diamonds += st.firstDia;
      this.app.persist();
      const title = add(text(this, W / 2, 300, '승리!', 96, '#ffe066'));
      title.setScale(0.4);
      this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.out' });
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
      add(text(this, W / 2, 575, `🪙 ${gold.toLocaleString('ko-KR')}${this.b.goldMul > 1 ? ' (×2)' : ''}`, 44, '#ffd36a'));
      if (first) add(text(this, W / 2, 640, `💎 ${st.firstDia.toLocaleString('ko-KR')} (첫 클리어)`, 40, '#7fd8ff'));
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
