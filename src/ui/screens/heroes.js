import { h, heroCard } from '../app.js';
import { HEROES } from '../../data/heroes.js';

let filter = 'all';

export function render(root, app) {
  const s = app.save;
  const list = [...HEROES]
    .filter(x => filter === 'all' || s.heroes[x.id])
    .sort((a, b) => {
      const oa = s.heroes[a.id], ob = s.heroes[b.id];
      if (!!oa !== !!ob) return oa ? -1 : 1;
      return b.star - a.star || (ob?.level || 0) - (oa?.level || 0);
    });
  const owned = Object.keys(s.heroes).length;
  const tab = (k, label) => h('button' + (filter === k ? '.on' : ''), { onclick: () => { filter = k; app.refresh(); } }, label);
  root.append(
    app.top('영웅'),
    h('div.tabs', tab('all', `전체 ${HEROES.length}`), tab('own', `가진 영웅 ${owned}`)),
    list.length ? h('div.grid', ...list.map(x => {
      const own = !!s.heroes[x.id];
      return heroCard(app, x.id, { silhouette: !own, onclick: () => app.show('heroDetail', { id: x.id, from: 'heroes' }) });
    })) : h('div.card.center.dim', '아직 영웅이 없어요. 소환해 보세요!'),
  );
}
