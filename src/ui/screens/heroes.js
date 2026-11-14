// 영웅의 집: 위에 우리 팀(3칸)과 파티 전투력, 아래에 영웅 카드 격자(별 색 배경 + 위쪽 별 + 아래 레벨).
// "편성하기"를 켜면 카드를 눌러 팀에 넣고 뺀다. 끄면 카드를 눌러 영웅 상세로 간다.
import { h, fmt } from '../app.js';
import { HEROES, HERO, STAR_COLOR } from '../../data/heroes.js';
import { heroCanvas } from '../../render/portrait.js';
import { maxLevel, teamPower } from '../../core/progress.js';

let filter = 'all';
let editing = false;

export function render(root, app, params = {}) {
  if (params.edit != null) editing = params.edit;
  const s = app.save;
  const owned = Object.keys(s.heroes).length;
  const save = () => { app.persist(); app.refresh(); };

  const toggleTeam = id => {
    const i = s.team.indexOf(id);
    if (i >= 0) { s.team[i] = null; return save(); }
    const free = s.team.indexOf(null);
    if (free < 0) return app.toast('팀이 꽉 찼어요. 위에서 ✕로 먼저 빼 주세요');
    s.team[free] = id; save();
  };

  const slot = (id, i) => {
    if (!id) return h('div.tslot.empty', { onclick: () => { editing = true; app.refresh(); } }, h('span', '+'), h('small', '영웅을 넣어요'));
    const hero = HERO[id];
    return h('div.tslot', { style: `--c:${STAR_COLOR[hero.star]}`, onclick: () => app.show('heroDetail', { id, from: 'heroes' }) },
      h('div.hstars', '★'.repeat(hero.star)),
      heroCanvas(id, 120),
      h('div.tname', hero.name),
      h('button.tx', { onclick: e => { e.stopPropagation(); s.team[i] = null; save(); }, 'aria-label': '빼기' }, '✕'));
  };

  const list = [...HEROES]
    .filter(x => filter === 'all' || s.heroes[x.id])
    .sort((a, b) => {
      const oa = s.heroes[a.id], ob = s.heroes[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      return b.star - a.star || (ob?.level || 0) - (oa?.level || 0);
    });

  const card = x => {
    const own = s.heroes[x.id];
    const inTeam = s.team.includes(x.id);
    const el = h('div.hcard2' + (own ? '' : '.off') + (inTeam ? '.inteam' : ''), {
      style: `--c:${STAR_COLOR[x.star]}`,
      onclick: () => {
        if (editing && own) return toggleTeam(x.id);
        app.show('heroDetail', { id: x.id, from: 'heroes' });
      },
    },
      h('div.hstars', '★'.repeat(x.star)),
      heroCanvas(x.id, 120, { silhouette: !own }),
      h('div.hlv', own ? `Lv ${own.level}/${maxLevel(x.id)}` : '미보유'));
    if (own?.dupes) el.append(h('div.hdupe', `+${own.dupes}`));
    if (inTeam) el.append(h('div.hcheck', '✔'));
    return el;
  };

  const tab = (k, label) => h('button' + (filter === k ? '.on' : ''), { onclick: () => { filter = k; app.refresh(); } }, label);
  root.append(...[
    app.top('영웅의 집'),
    h('div.team-panel',
      h('div.tslots', ...s.team.map(slot)),
      h('div.party',
        h('div', h('small', '⚔️ 파티 전투력'), h('b', fmt(teamPower(s)))),
        h('div', h('small', '📖 모은 영웅'), h('b', `${owned} / ${HEROES.length}`)),
        h('button.btn' + (editing ? '.gold' : '.ghost'), { onclick: () => { editing = !editing; app.refresh(); } }, editing ? '편성 끝' : '편성하기'))),
    editing ? h('div.edit-tip', '영웅을 누르면 팀에 넣거나 뺄 수 있어요') : null,
    h('div.tabs', tab('all', `전체 ${HEROES.length}`), tab('own', `가진 영웅 ${owned}`)),
    list.length ? h('div.hgrid', ...list.map(card)) : h('div.card.center.dim', '아직 영웅이 없어요. 소환해 보세요!'),
  ].filter(Boolean));
}
