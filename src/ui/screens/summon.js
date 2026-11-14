import { h, fmt, stars } from '../app.js';
import { RATES, PITY, COST, summon } from '../../core/gacha.js';
import { bump } from '../../core/daily.js';
import { makeRng } from '../../core/rng.js';
import { STAR_COLOR } from '../../data/heroes.js';

export function render(root, app) {
  const s = app.save;
  const left = PITY + 1 - s.pity;
  const go = count => {
    if (s.diamonds < COST[count]) return app.toast('다이아가 부족해요');
    const r = summon(s, count, makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0));
    if (!r.ok) return app.toast('다이아가 부족해요');
    bump(s, 'summon');
    app.persist();
    app.startSummon(r.results);
  };
  root.append(
    app.top('소환'),
    h('div.card.center.col', { style: 'background:linear-gradient(#1c2350,#121633)' },
      h('div', { style: 'font-size:46px' }, '🌠'),
      h('b', '별에서 영웅을 불러와요'),
      h('div.dim', { style: 'font-size:14px' }, '빛의 색이 곧 등급이에요. 금빛이면 진짜 ★7!'),
      h('div', { style: 'font-weight:800;color:var(--gold)' }, `★6 이상 확정까지 ${left}번`)),
    h('div.col', { style: 'margin-top:12px' },
      h('button.btn.gold', { onclick: () => go(11), disabled: s.diamonds < COST[11] }, '10+1 소환', h('small', `💎 ${fmt(COST[11])}`)),
      h('button.btn', { onclick: () => go(1), disabled: s.diamonds < COST[1] }, '1회 소환', h('small', `💎 ${fmt(COST[1])}`)),
      s.diamonds < COST[1] ? h('div.center.dim', '다이아가 부족해요. 모험과 미션에서 모아요!') : null,
      h('button.btn.ghost', { onclick: () => rates(app) }, '확률 보기')),
  );
}

function rates(app) {
  app.modal(close => h('div.col',
    h('h2', { style: 'margin:0' }, '소환 확률'),
    h('table.rates', ...[7, 6, 5, 4, 3, 2, 1].map(n => h('tr', h('td', stars(n)), h('td', { style: `text-align:right;color:${STAR_COLOR[n]};font-weight:800` }, `${RATES[n]}%`)))),
    h('div.dim', { style: 'font-size:13px' }, `★6 이상이 ${PITY}번 연속 안 나오면 다음 1번은 ★6 이상이 확정이에요. 같은 별 안에서는 모든 영웅이 똑같은 확률이에요.`),
    h('button.btn.ghost', { onclick: close }, '닫기')));
}
