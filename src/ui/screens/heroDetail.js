import { h, stars, fmt } from '../app.js';
import { HERO, STAR_COLOR, ROLE_NAME } from '../../data/heroes.js';
import { heroCanvas } from '../../render/portrait.js';
import { heroStats, levelCost, levelUp, maxLevel, awaken, DUPE_MAX } from '../../core/progress.js';
import { bump } from '../../core/daily.js';
import { sfx } from '../../core/sfx.js';

export function render(root, app, { id, from = 'heroes', pop = false }) {
  const hero = HERO[id];
  const own = app.save.heroes[id];
  if (!own) {
    root.append(app.top('???', from), h('div.detail-art', heroCanvas(id, 260, { silhouette: true })),
      h('div.card.center', stars(hero.star), h('p.dim', '아직 만나지 못한 영웅이에요. 소환에서 만날 수 있어요!')));
    return;
  }
  const aw = !!own.awakened;
  const st = heroStats(id, own.level, own.dupes, aw);
  const maxLv = maxLevel(id, aw);
  const maxed = own.level >= maxLv;
  const cost = levelCost(own.level);
  const stat = (label, v) => h('div', h('b' + (pop ? '.pop' : ''), fmt(v)), h('span', label));

  // ★7 각성(큰 별 ★8): +5까지 겹치면 버튼이 켜진다
  let awakenBox = null;
  if (hero.star === 7) {
    awakenBox = aw
      ? h('div.card.center.awakened-card', h('span.bigstar', '★'), h('b', ' 각성 완료!'), h('div.dim', { style: 'font-size:13px' }, '능력치 2배 · 최대 레벨 60'))
      : h('div.card.col.awaken-card',
        h('div.row', h('b.grow', '🌟 각성(큰 별 ★8)'), h('span.dim', `+${own.dupes} / +${DUPE_MAX}`)),
        h('div', { style: 'font-size:14px' }, '같은 영웅을 +5까지 겹치면 각성할 수 있어요. 각성하면 큰 별 하나가 되고, 능력치가 2배, 최대 레벨이 60이 돼요.'),
        h('div.bar', h('i', { style: `width:${(own.dupes / DUPE_MAX) * 100}%;background:linear-gradient(90deg,#ffe066,#ff9ad0,#9fd8ff)` })),
        h('button.btn.gold', {
          disabled: own.dupes < DUPE_MAX,
          onclick: () => app.modal(close => h('div.col',
            h('b', `${hero.name}을(를) 각성할까요?`),
            h('div.dim', { style: 'font-size:14px' }, '되돌릴 수 없어요. 큰 별 하나(★8)가 돼요!'),
            h('div.row', h('button.btn.ghost.grow', { onclick: close }, '취소'),
              h('button.btn.gold.grow', { onclick: () => {
                close();
                if (!awaken(app.save, id).ok) return app.toast('아직 각성할 수 없어요');
                app.persist();
                app.startSummon([{ id, star: 7, isNew: false, dupes: DUPE_MAX, overflowGold: 0, awaken: true }]);
              } }, '각성!')))),
        }, own.dupes < DUPE_MAX ? `+${DUPE_MAX - own.dupes} 더 겹치면 각성` : '각성하기'));
  }

  root.append(...[
    app.top(hero.name, from),
    h('div.detail-art' + (aw ? '.aw' : ''), heroCanvas(id, 260)),
    h('div.center', stars(hero.star, aw), ' ', h('span.dim', ROLE_NAME[hero.role])),
    h('div.center', { style: 'font-size:22px;font-weight:900;margin:4px 0' },
      h('span' + (pop ? '.pop' : ''), `Lv ${own.level}`), h('span.dim', { style: 'font-size:15px' }, ` / ${maxLv}`),
      own.dupes ? h('span', { style: 'color:var(--gold);margin-left:8px' }, `+${own.dupes}`) : null),
    h('p.quote', `“${hero.quote}”`),
    h('div.stat', stat('체력', st.hp), stat('공격', st.atk), stat('방어', st.def), stat('속도', st.spd)),
    h('div.card.col', { style: `margin-top:10px;border-color:${STAR_COLOR[hero.star]}` },
      h('div.row', h('b.grow', `스킬 · ${hero.skill.name}`), h('span.dim', `쿨타임 ${hero.skill.cd}턴`)),
      h('div', hero.skill.desc)),
    awakenBox,
    h('div.dim', { style: 'font-size:13px;margin:8px 2px' },
      `겹침 +${own.dupes} / +${DUPE_MAX} — 같은 영웅을 또 뽑으면 능력치가 10%씩 올라가요.`),
    h('button.btn.green', {
      style: 'width:100%;margin-top:6px',
      disabled: maxed || app.save.gold < cost,
      onclick: () => {
        const r = levelUp(app.save, id);
        if (!r.ok) return app.toast(r.reason === 'max' ? '최고 레벨이에요!' : '골드가 부족해요');
        bump(app.save, 'levelup');
        app.persist();
        sfx.play('heal');
        app.show('heroDetail', { id, from, pop: true });
      },
    }, maxed ? '최고 레벨!' : '레벨업', maxed ? null : h('small', `🪙 ${fmt(cost)}${app.save.gold < cost ? ' (골드 부족)' : ''}`)),
  ].filter(Boolean));
}
