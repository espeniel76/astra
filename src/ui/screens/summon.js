import { h, fmt, stars } from '../app.js';
import { RATES, PITY, COST, summon, useTicket } from '../../core/gacha.js';
import { bump } from '../../core/daily.js';
import { makeRng } from '../../core/rng.js';
import { STAR_COLOR } from '../../data/heroes.js';

const TEST = /[?&]test\b/.test(location.search);
let busy = false; // 처음 소환할 때 연출 파일을 받는 동안 두 번 눌리지 않게

export function render(root, app) {
  busy = false;
  const s = app.save;
  const left = PITY - s.pity;
  const go = count => {
    if (busy) return;
    if (count !== 'ticket' && s.diamonds < COST[count]) return app.toast('다이아가 부족해요');
    busy = true;
    for (const b of root.querySelectorAll('button')) b.disabled = true;
    app.toast('별을 부르는 중…');
    const rng = makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    const r = count === 'ticket' ? useTicket(s, rng) : summon(s, count, rng);
    if (!r.ok) { busy = false; return app.toast('다이아가 부족해요'); }
    if (count === 'ticket') {
      // 시작 선물 영웅은 편성 빈 자리에 바로 넣어 준다
      const id = r.results[0].id, free = s.team.indexOf(null);
      if (!s.team.includes(id) && free >= 0) s.team[free] = id;
    } else bump(s, 'summon');
    app.persist();
    app.startSummon(r.results, count === 'ticket');
  };
  root.append(
    app.top('소환'),
    h('div.card.center.col', { style: 'background:linear-gradient(#1c2350,#121633)' },
      h('div', { style: 'font-size:46px' }, '🌠'),
      h('b', '별에서 영웅을 불러와요'),
      h('div.dim', { style: 'font-size:14px' }, '빛의 색이 곧 등급이에요. 금빛이면 진짜 ★7!'),
      h('div', { style: 'font-weight:800;color:var(--gold)' }, `★6 이상 확정까지 ${left}번`)),
    h('div.col', { style: 'margin-top:12px' },
      s.tickets.star4 > 0 ? h('button.btn.green.big', { style: 'min-height:76px;font-size:21px', onclick: () => go('ticket') },
        '🎟️ ★4 확정 소환권 쓰기', h('small', `처음 시작 선물이에요! (${s.tickets.star4}장)`)) : null,
      h('button.btn.gold', { onclick: () => go(11), disabled: s.diamonds < COST[11] }, '10+1 소환', h('small', `💎 ${fmt(COST[11])} · ★4 이상 1명 보장`)),
      h('button.btn', { onclick: () => go(1), disabled: s.diamonds < COST[1] }, '1회 소환', h('small', `💎 ${fmt(COST[1])}`)),
      s.diamonds < COST[11] ? h('div.center.dim', s.diamonds < COST[1] ? '다이아가 부족해요. 모험과 미션에서 모아요!' : `10+1 소환은 💎 ${fmt(COST[11])}가 필요해요. 모험과 미션에서 모아요!`) : null,
      h('button.btn.ghost', { onclick: () => rates(app) }, '확률 보기'),
      // 테스트판 전용: 저장은 그대로 두고 ★6·★7 연출만 미리 보기
      TEST ? h('div.row', { style: 'gap:8px' },
        h('button.btn.ghost.grow', { onclick: () => app.startSummon([{ id: 'executioner', star: 6, isNew: false, dupes: 1, overflowGold: 0 }]) }, '🧪 ★6 연출'),
        h('button.btn.ghost.grow', { onclick: () => app.startSummon([{ id: 'guardian', star: 7, isNew: true, dupes: 0, overflowGold: 0 }]) }, '🧪 ★7 연출')) : null),
  );
}

function rates(app) {
  app.modal(close => h('div.col',
    h('h2', { style: 'margin:0' }, '소환 확률'),
    h('table.rates', ...[7, 6, 5, 4, 3, 2, 1].map(n => h('tr', h('td', stars(n)), h('td', { style: `text-align:right;color:${STAR_COLOR[n]};font-weight:800` }, `${RATES[n]}%`)))),
    h('div.dim', { style: 'font-size:13px' }, `★6 이상이 계속 안 나와도 ${PITY}번째 소환은 ★6 이상이 확정이에요(★6:★7 = 4:1). 10+1 소환에는 ★4 이상이 꼭 1명 들어가요. 같은 별 안에서는 모든 영웅이 똑같은 확률이에요.`),
    h('button.btn.ghost', { onclick: close }, '닫기')));
}
