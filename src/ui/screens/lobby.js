// 로비: 살아 있는 마을(건물 = 메뉴, 영웅이 걸어 다님) + 아래 큰 모험 버튼과 아이콘 줄.
import { h, fmt } from '../app.js';
import { HERO } from '../../data/heroes.js';
import { STAGES } from '../../data/stages.js';
import { claimable } from '../../core/daily.js';
import { teamPower } from '../../core/progress.js';
import { startTown } from '../../render/town.js';

export function render(root, app) {
  const s = app.save;
  const owned = Object.keys(s.heroes);
  const next = STAGES.find(st => !s.cleared.includes(st.id));
  const missions = claimable(s);
  const hasTeam = s.team.some(Boolean);

  // 튜토리얼 안내: 선물 소환권 → 모험의 문
  let hint = null;
  if (s.tickets.star4 > 0) hint = { building: 'summon', text: '선물이 있어요! 눌러 봐요' };
  else if (hasTeam && !s.cleared.includes('1-1')) hint = { building: 'adventure', text: '첫 모험을 떠나요!' };
  else if (!hasTeam && owned.length) hint = { building: 'team', text: '영웅을 편성해요' };

  // 걸어 다닐 영웅: 팀 먼저, 그다음 별 높은 순
  const walkers = [...new Set([...s.team.filter(Boolean), ...owned.sort((a, b) => HERO[b].star - HERO[a].star)])];
  const canvas = h('canvas.town');
  const go = { summon: 'summon', heroes: 'heroes', adventure: 'adventure', team: 'team', missions: 'missions' };
  app.cleanup = startTown(canvas, {
    heroes: walkers,
    badges: { missions: missions > 0, summon: s.tickets.star4 > 0 },
    hint,
    onBuilding: k => app.show(go[k]),
    onHero: id => app.show('heroDetail', { id, from: 'lobby' }),
  });

  const icon = (emoji, label, screen, dot) =>
    h('button.icon-btn' + (dot ? '.dot' : ''), { onclick: () => app.show(screen) }, h('span', emoji), h('small', label));

  root.append(...[
    app.top('', null),
    h('div.town-wrap', canvas, h('div.town-logo', 'ASTRA')),
    h('button.btn.adventure-btn', { onclick: () => app.show('adventure') },
      h('div', '⚔️ 모험 떠나기'),
      h('small', `${next ? `다음: ${next.id}${next.boss ? ' 보스' : ''}` : '모든 스테이지 완료!'} · 팀 전투력 ${fmt(teamPower(s))}`)),
    h('div.icon-row',
      icon('🌟', '소환', 'summon', s.tickets.star4 > 0),
      icon('🏆', '도전', 'challenge'),
      icon('🏠', '영웅', 'heroes'),
      icon('🛡️', '편성', 'team'),
      icon('📜', '미션', 'missions', missions > 0),
      icon('⚙️', '설정', 'settings')),
  ].filter(Boolean));
}
