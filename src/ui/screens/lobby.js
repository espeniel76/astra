import { h, fmt } from '../app.js';
import { HERO, STAR_COLOR } from '../../data/heroes.js';
import { heroCanvas } from '../../render/portrait.js';
import { claimable } from '../../core/daily.js';

export function render(root, app) {
  const s = app.save;
  const owned = Object.keys(s.heroes).length;
  const team = h('div.team-show',
    ...s.team.map(id => h('div.slot',
      id ? [heroCanvas(id, 150), h('div.nm', { style: `color:${STAR_COLOR[HERO[id].star]}` }, HERO[id].name)]
        : h('div.empty-slot', '빈 자리'))));
  team.addEventListener('click', () => app.show('team'));

  const missions = claimable(s);
  root.append(...[
    app.top('', null),
    h('div.logo', 'ASTRA'),
    h('div.center.dim', { style: 'font-size:13px;margin-bottom:4px' }, '별에서 내려온 영웅들'),
    team,
    owned === 0 ? h('div.bubble', '먼저 소환해서 영웅을 모아요!') : null,
    h('div.menu',
      h('button.btn.gold.big', { onclick: () => app.show('summon') }, '✨ 소환'),
      h('button.btn.big', { onclick: () => app.show('adventure') }, '⚔️ 모험', h('small', nextStageText(s))),
      h('button.btn.ghost', { onclick: () => app.show('heroes') }, `영웅 (${owned})`),
      h('button.btn.ghost', { onclick: () => app.show('team') }, '편성'),
      h('button.btn.ghost' + (missions ? '.dot' : ''), { onclick: () => app.show('missions') }, '오늘의 미션'),
      h('button.btn.ghost', { onclick: () => app.show('settings') }, '⚙️ 설정')),
    h('div.center.dim', { style: 'margin-top:14px;font-size:12px' }, `💎 ${fmt(s.diamonds)} · 🪙 ${fmt(s.gold)}`),
  ].filter(Boolean));
}

function nextStageText(s) {
  const n = s.cleared.length;
  if (n >= 30) return '모든 스테이지 완료!';
  const c = Math.floor(n / 10) + 1, k = (n % 10) + 1;
  return `다음: ${c}-${k}`;
}
