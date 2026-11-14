import { h, fmt } from '../app.js';
import { CHAPTERS, STAGES, STAGE } from '../../data/stages.js';
import { MONSTERS } from '../../data/monsters.js';
import { monsterCanvas } from '../../render/portrait.js';

let chapter = null;

const unlocked = (s, st) => {
  const i = STAGES.indexOf(st);
  return i === 0 || s.cleared.includes(STAGES[i - 1].id);
};

export function render(root, app) {
  const s = app.save;
  if (chapter == null) {
    const next = STAGES.find(st => !s.cleared.includes(st.id));
    chapter = next ? next.chapter : 3;
  }
  const chapUnlocked = c => c === 1 || s.cleared.includes(`${c - 1}-10`);
  root.append(
    app.top('모험'),
    h('div.tabs', ...CHAPTERS.map(c => h('button' + (chapter === c.n ? '.on' : ''), {
      onclick: () => { if (!chapUnlocked(c.n)) return app.toast(`${c.n - 1}챕터 보스를 먼저 물리쳐요`); chapter = c.n; app.refresh(); },
    }, chapUnlocked(c.n) ? `${c.n}. ${c.name}` : `🔒 ${c.name}`))),
    h('div.stages', ...STAGES.filter(st => st.chapter === chapter).map(st => {
      const done = s.cleared.includes(st.id), open = unlocked(s, st);
      const cls = 'button.stage' + (done ? '.done' : '') + (open ? '' : '.locked') + (st.boss ? '.boss' : '');
      return h(cls, { onclick: () => (open ? preview(app, st.id) : app.toast('앞 스테이지를 먼저 깨요')) },
        open ? (st.boss ? `👑 ${st.id} 보스` : st.id) : '🔒');
    })),
  );
}

function preview(app, id) {
  const st = STAGE[id], s = app.save;
  const first = !s.cleared.includes(id);
  const teamCount = s.team.filter(Boolean).length;
  app.modal(close => h('div.col',
    h('h2', { style: 'margin:0' }, `${id} ${st.boss ? '보스' : ''}`),
    h('div.foes', ...st.foes.map(f => monsterCanvas(f.mon, 120))),
    h('div.center', st.foes.map(f => MONSTERS[f.mon].name).join(' · '), h('div.dim', `적 레벨 ${st.lv}`)),
    h('div.card.center', `보상: 🪙 ${fmt(st.gold)}`, first ? h('b', { style: 'color:var(--dia)' }, `  +💎 ${fmt(st.firstDia)} (첫 클리어)`) : null),
    teamCount
      ? h('button.btn', { onclick: () => { close(); app.startBattle(id); } }, '출발!')
      : h('div.col', h('div.center', '편성에서 영웅을 넣어 주세요'), h('button.btn.ghost', { onclick: () => { close(); app.show('team'); } }, '편성으로')),
  ));
}
