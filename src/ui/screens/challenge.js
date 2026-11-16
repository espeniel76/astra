// 도전: 무한의 탑 · 요일 던전 · 친구 대전으로 가는 곳(src/core/modes.js)
import { h } from '../app.js';
import { DUNGEONS, DUNGEON_IDS, dungeonState, isOpen } from '../../core/modes.js';

export function render(root, app) {
  const s = app.save;
  const today = DUNGEON_IDS.filter(k => isOpen(k)).map(k => `${DUNGEONS[k].emoji} ${DUNGEONS[k].name}`).join(' · ');
  const card = (emoji, title, sub, info, screen, cls) =>
    h('button.card.challenge-card' + cls, { onclick: () => app.show(screen) },
      h('div.ch-emoji', emoji),
      h('div.grow', h('b', title), h('div.dim', { style: 'font-size:13px' }, sub), h('div.ch-info', info)),
      h('div.ch-go', '›'));
  root.append(
    app.top('도전'),
    h('div.col',
      card('🗼', '무한의 탑', '한 층씩 올라가요. 높을수록 세지만 보상도 커요.', s.tower.best ? `최고 기록 ${s.tower.best}층` : '아직 도전 전', 'tower', '.tower'),
      card('📅', '요일 던전', '요일마다 열리는 던전. 하루 3번 보상을 받아요.', `오늘: ${today} · 남은 횟수 ${dungeonState(s).left}번`, 'dungeon', '.dungeon'),
      card('⚔️', '친구 대전', '팀 코드를 주고받아 친구 팀과 싸워요.', `${s.pvp.wins}승 ${s.pvp.losses}패`, 'pvp', '.pvp')),
  );
}
