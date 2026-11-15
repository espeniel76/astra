// 화면 전환, 위쪽 막대(재화), 알림, 창(모달). 각 화면은 src/ui/screens/*.js 의 render(root, app, params).
import { writeSave } from '../core/save.js';
import { ensureToday } from '../core/daily.js';
import { HERO, STAR_COLOR } from '../data/heroes.js';
import { heroCanvas } from '../render/portrait.js';
import { sfx } from '../core/sfx.js';

// h('div.card.row', { onclick }, '글자', 다른요소...)
export function h(sel, attrs, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), e => { if (k === 'onclick') sfx.play('click'); v(e); });
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}

// 별 표시. 각성한 ★7은 큰 별 하나(★8)
export const stars = (n, awakened = false) => (awakened
  ? h('span.bigstar', '★')
  : h('span.stars', { style: `color:${STAR_COLOR[n]}` }, '★'.repeat(n)));
export const fmt = n => n.toLocaleString('ko-KR');

// 영웅 카드(격자용)
export function heroCard(app, id, { onclick, picked, showLevel = true, silhouette = false } = {}) {
  const hero = HERO[id];
  const own = app.save.heroes[id];
  const el = h('div.hcard', { style: `border-color:${STAR_COLOR[hero.star]}`, onclick },
    heroCanvas(id, 120, { silhouette }),
    h('div.nm', silhouette ? '???' : hero.name),
    stars(hero.star, own?.awakened));
  if (picked) el.classList.add('picked');
  if (own && showLevel && !silhouette) {
    el.append(h('div.lv', `Lv${own.level}`));
    if (own.dupes) el.append(h('div.du', `+${own.dupes}`));
  }
  return el;
}

export function createApp(root, save, screens) {
  const app = {
    save, screens, root,
    current: null, params: null,
    persist() { writeSave(app.save); },
    show(name, params = {}) {
      // 이전 화면 정리(로비 마을 애니메이션 멈추기 등)
      if (app.cleanup) { app.cleanup(); app.cleanup = null; }
      ensureToday(app.save);
      app.current = name; app.params = params;
      root.replaceChildren();
      screens[name].render(root, app, params);
      root.scrollTop = 0; window.scrollTo(0, 0);
    },
    refresh() { app.show(app.current, app.params); },
    toast(text) {
      document.querySelector('.toast')?.remove();
      const t = h('div.toast', text);
      document.body.append(t);
      setTimeout(() => t.remove(), 2000);
    },
    // 위쪽 막대: 제목 + (뒤로) + 다이아·골드
    top(title, back = 'lobby') {
      return h('div.top',
        back ? h('button.back', { onclick: () => app.show(back), 'aria-label': '뒤로' }, '‹') : null,
        h('h1', title),
        h('div.money', h('span.d', `💎 ${fmt(app.save.diamonds)}`), h('span.g', `🪙 ${fmt(app.save.gold)}`)));
    },
    modal(...kids) {
      const bg = h('div.modal-bg');
      const close = () => bg.remove();
      bg.addEventListener('click', e => { if (e.target === bg) close(); });
      bg.append(h('div.modal.card.col', ...kids.map(k => (typeof k === 'function' ? k(close) : k))));
      document.body.append(bg);
      return close;
    },
  };
  return app;
}
