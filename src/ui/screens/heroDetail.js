import { h, stars, fmt } from '../app.js';
import { HERO, STAR_COLOR, ROLE_NAME } from '../../data/heroes.js';
import { heroCanvas } from '../../render/portrait.js';
import { heroStats, levelCost, levelUp, maxLevel, power, DUPE_MAX } from '../../core/progress.js';
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
  const st = heroStats(id, own.level, own.dupes);
  const maxed = own.level >= maxLevel(id);
  const cost = levelCost(own.level);
  const stat = (label, v) => h('div', h('b' + (pop ? '.pop' : ''), fmt(v)), h('span', label));
  root.append(
    app.top(hero.name, from),
    h('div.detail-art', heroCanvas(id, 260)),
    h('div.center', stars(hero.star), ' ', h('span.dim', ROLE_NAME[hero.role])),
    h('div.center', { style: 'font-size:22px;font-weight:900;margin:4px 0' },
      h('span' + (pop ? '.pop' : ''), `Lv ${own.level}`), h('span.dim', { style: 'font-size:15px' }, ` / ${maxLevel(id)}`),
      own.dupes ? h('span', { style: 'color:var(--gold);margin-left:8px' }, `+${own.dupes}`) : null),
    h('p.quote', `“${hero.quote}”`),
    h('div.stat', stat('체력', st.hp), stat('공격', st.atk), stat('방어', st.def), stat('속도', st.spd)),
    h('div.card.col', { style: `margin-top:10px;border-color:${STAR_COLOR[hero.star]}` },
      h('div.row', h('b.grow', `스킬 · ${hero.skill.name}`), h('span.dim', `쿨타임 ${hero.skill.cd}턴`)),
      h('div', hero.skill.desc)),
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
  );
}
