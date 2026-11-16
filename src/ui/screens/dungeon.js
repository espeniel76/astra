// 요일 던전: 오늘 열린 던전과 난이도 셋. 하루 3번(이겼을 때만 줄어듦)
import { h, fmt } from '../app.js';
import { teamPower } from '../../core/progress.js';
import { DUNGEONS, DUNGEON_IDS, DIFFS, DUNGEON_TRIES, dungeonState, isOpen, openDays, dungeonRec, dungeonSpec, rewardText } from '../../core/modes.js';
import { monsterCanvas } from '../../render/portrait.js';
import { challengeArt } from '../../render/challengeArt.js';

export function render(root, app) {
  const s = app.save;
  const st = dungeonState(s);
  const power = teamPower(s);
  const hasTeam = s.team.some(Boolean);
  root.append(...[
    app.top('요일 던전', 'challenge'),
    h('div.card.row', { style: 'margin-bottom:10px;padding:10px 14px' },
      h('div.grow', h('div.dim', { style: 'font-size:12px' }, '오늘 남은 횟수'), h('b', { style: 'font-size:22px' }, `${st.left} / ${DUNGEON_TRIES}`)),
      h('div', { style: 'text-align:right' }, h('div.dim', { style: 'font-size:12px' }, '우리 팀 전투력'), h('b', { style: 'font-size:20px' }, `⚔️ ${fmt(power)}`))),
    h('div.col', ...DUNGEON_IDS.map(key => {
      const D = DUNGEONS[key], open = isOpen(key);
      return h('div.card.col.art-card.dungeon-card' + (open ? '' : '.closed'),
        h('div.art-wrap', challengeArt(key, 360, 100), h('div.art-title', `${D.emoji} ${D.name}`)),
        h('div.col.art-info',
        h('div.row',
          monsterCanvas(D.boss, 64),
          h('div.grow', h('div', { style: 'font-size:14px;font-weight:700' }, D.desc), h('div.dim', { style: 'font-size:13px' }, `${openDays(key)}요일에 열려요`)),
          open ? h('span.open-tag', '열림') : h('span.dim', { style: 'font-size:13px' }, '🔒 닫힘')),
        open ? h('div.diff-row', ...DIFFS.map((d, i) => {
          const rec = dungeonRec(key, i);
          return h('button.btn.diff' + (power < rec ? '.hard' : ''), {
            disabled: !hasTeam || st.left < 1,
            onclick: () => app.startMode(dungeonSpec(key, i)),
          }, d.name, h('small', rewardText(key, i)), h('small', `추천 ${fmt(rec)}`));
        })) : null));
    })),
    !hasTeam ? h('div.center.dim', { style: 'margin-top:10px' }, '편성에서 영웅을 넣어 주세요') : null,
    st.left < 1 ? h('div.center.dim', { style: 'margin-top:10px' }, '오늘은 다 했어요. 내일 다시 와요!') : null,
  ].filter(Boolean));
}
