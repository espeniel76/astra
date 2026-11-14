import { h, heroCard } from '../app.js';
import { HERO } from '../../data/heroes.js';

// 편성: 위 3칸(누르면 빼기), 아래 가진 영웅(누르면 빈 칸에 넣기)
export function render(root, app) {
  const s = app.save;
  const owned = Object.keys(s.heroes).sort((a, b) => HERO[b].star - HERO[a].star || s.heroes[b].level - s.heroes[a].level);
  const save = () => { app.persist(); app.refresh(); };
  root.append(
    app.top('편성'),
    h('div.dim', { style: 'font-size:13px;margin-bottom:8px' }, '최대 3명. 왼쪽이 맨 앞이라 적의 공격을 먼저 받아요. 칸을 누르면 빠져요.'),
    h('div.team-slots', ...s.team.map((id, i) => id
      ? heroCard(app, id, { onclick: () => { s.team[i] = null; save(); } })
      : h('div.empty-slot', `${i + 1}번 자리`))),
    owned.length ? h('div.grid', ...owned.map(id => {
      const inTeam = s.team.includes(id);
      return heroCard(app, id, {
        picked: inTeam,
        onclick: () => {
          if (inTeam) { s.team[s.team.indexOf(id)] = null; return save(); }
          const free = s.team.indexOf(null);
          if (free < 0) return app.toast('자리가 꽉 찼어요. 위에서 먼저 빼 주세요');
          s.team[free] = id; save();
        },
      });
    })) : h('div.card.center.dim', '아직 영웅이 없어요. 소환해 보세요!',
      h('div', { style: 'margin-top:10px' }, h('button.btn.gold', { onclick: () => app.show('summon') }, '소환하러 가기'))),
  );
}
