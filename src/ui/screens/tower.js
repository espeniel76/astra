// 무한의 탑: 지금 도전할 층(최고 기록 + 1)과 그 위 몇 층의 보상
import { h, fmt } from '../app.js';
import { MONSTERS } from '../../data/monsters.js';
import { monsterCanvas } from '../../render/portrait.js';
import { teamPower } from '../../core/progress.js';
import { towerFloor, towerSpec } from '../../core/modes.js';
import { GRADES } from '../../data/gear.js';

const rewardLine = r => [
  `🪙 ${fmt(r.gold)}`,
  r.dia ? `💎 ${r.dia}` : null,
  r.gear ? `🎁 장비(${GRADES[r.gear].name}까지)` : null,
].filter(Boolean).join('  ');

export function render(root, app) {
  const s = app.save;
  const f = s.tower.best + 1;
  const t = towerFloor(f);
  const power = teamPower(s);
  const weak = power < t.rec;
  const hasTeam = s.team.some(Boolean);
  const upcoming = [1, 2, 3, 4].map(k => towerFloor(f + k));
  root.append(
    app.top('무한의 탑', 'challenge'),
    h('div.card.center.tower-head',
      h('div.dim', { style: 'font-size:13px' }, s.tower.best ? `최고 기록 ${s.tower.best}층` : '1층부터 시작해요'),
      h('div', { style: 'font-size:34px;font-weight:900' }, `🗼 ${f}층${t.boss ? ' 보스' : ''}`),
      h('div.dim', `적 레벨 ${t.lv}`)),
    h('div.foes', ...t.foes.map(x => monsterCanvas(x.mon, 110))),
    h('div.center', { style: 'font-size:14px' }, t.foes.map(x => MONSTERS[x.mon].name).join(' · ')),
    h('div.card.row', { style: 'justify-content:space-around;text-align:center;margin-top:8px' },
      h('div', h('div.dim', { style: 'font-size:12px' }, '추천 전투력'), h('b', { style: 'font-size:20px' }, fmt(t.rec))),
      h('div', h('div.dim', { style: 'font-size:12px' }, '우리 팀'), h('b', { style: `font-size:20px;color:${weak ? 'var(--bad)' : 'var(--good)'}` }, fmt(power)))),
    h('div.card.center', { style: 'margin-top:8px' }, h('div.dim', { style: 'font-size:12px' }, '처음 깨면'), h('b', rewardLine(t.reward))),
    hasTeam
      ? h('button.btn', { style: 'width:100%;margin-top:10px', onclick: () => app.startMode(towerSpec(f)) }, `${f}층 도전!`)
      : h('button.btn.ghost', { style: 'width:100%;margin-top:10px', onclick: () => app.show('team') }, '편성에서 영웅을 넣어 주세요'),
    h('h2', { style: 'margin:16px 0 6px;font-size:16px' }, '위층 보상'),
    h('div.col', ...upcoming.map(u => h('div.card.row', { style: 'padding:10px 14px' },
      h('b', { style: 'width:70px' }, `${u.floor}층${u.boss ? ' 👑' : ''}`), h('div.grow', { style: 'font-size:14px' }, rewardLine(u.reward))))),
  );
}
