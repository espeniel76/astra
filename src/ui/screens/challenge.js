// 도전: 무한의 탑 · 요일 던전 · 친구 대전으로 가는 곳(src/core/modes.js). 카드마다 그림(src/render/challengeArt.js)
import { h } from '../app.js';
import { DUNGEONS, DUNGEON_IDS, dungeonState, isOpen } from '../../core/modes.js';
import { challengeArt } from '../../render/challengeArt.js';

export function render(root, app) {
  const s = app.save;
  const todayKey = DUNGEON_IDS.find(k => isOpen(k) && k !== 'gold') || 'gold';
  const today = DUNGEON_IDS.filter(k => isOpen(k)).map(k => `${DUNGEONS[k].emoji} ${DUNGEONS[k].name}`).join(' · ');
  const card = (art, title, sub, info, screen) =>
    h('button.card.art-card', { onclick: () => app.show(screen) },
      h('div.art-wrap', art, h('div.art-title', title)),
      h('div.row.art-info', h('div.grow', h('div.dim', { style: 'font-size:13px' }, sub), h('div.ch-info', info)), h('div.ch-go', '›')));
  root.append(
    app.top('도전'),
    h('div.col',
      card(challengeArt('tower', 360, 130), '🗼 무한의 탑', '한 층씩 올라가요. 높을수록 세지만 보상도 커요.', s.tower.best ? `최고 기록 ${s.tower.best}층` : '아직 도전 전', 'tower'),
      card(challengeArt(todayKey, 360, 110), '📅 요일 던전', '요일마다 열리는 던전. 하루 3번 보상을 받아요.', `오늘: ${today} · 남은 ${dungeonState(s).left}번`, 'dungeon'),
      card(challengeArt('arena', 360, 110), '⚔️ 친구 대전', '팀 코드를 주고받아 친구 팀과 싸워요.', `${s.pvp.wins}승 ${s.pvp.losses}패`, 'pvp')),
  );
}
