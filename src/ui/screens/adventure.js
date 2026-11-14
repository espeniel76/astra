import { h, fmt } from '../app.js';
import { CHAPTERS, STAGES, STAGE } from '../../data/stages.js';
import { MONSTERS } from '../../data/monsters.js';
import { monsterCanvas } from '../../render/portrait.js';
import { teamPower } from '../../core/progress.js';
import { chestState, claimChest, chapterStars } from '../../core/stars.js';
import { sfx } from '../../core/sfx.js';

const unlocked = (s, st) => {
  const i = STAGES.indexOf(st);
  return i === 0 || s.cleared.includes(STAGES[i - 1].id);
};
const starRow = n => h('span.stage-stars', '★'.repeat(n), h('i', '★'.repeat(3 - n)));

export function render(root, app, params = {}) {
  const s = app.save;
  const next = STAGES.find(st => !s.cleared.includes(st.id));
  const chapter = params.chapter || (next ? next.chapter : 3);
  const chapUnlocked = c => c === 1 || s.cleared.includes(`${c - 1}-10`);
  const power = teamPower(s);
  const chests = chestState(s, chapter);
  root.append(
    app.top('모험'),
    h('div.tabs', ...CHAPTERS.map(c => h('button' + (chapter === c.n ? '.on' : ''), {
      onclick: () => { if (!chapUnlocked(c.n)) return app.toast(`${c.n - 1}챕터 보스를 먼저 물리쳐요`); app.show('adventure', { chapter: c.n }); },
    }, chapUnlocked(c.n) ? `${c.n}. ${c.name}` : `🔒 ${c.name}`))),
    h('div.card.row', { style: 'margin-bottom:10px;padding:10px 14px' },
      h('div.grow', h('div.dim', { style: 'font-size:12px' }, '우리 팀 전투력'), h('b', { style: 'font-size:22px' }, `⚔️ ${fmt(power)}`)),
      h('div', { style: 'text-align:right' }, h('div.dim', { style: 'font-size:12px' }, '이 챕터 별'), h('b', { style: 'font-size:20px;color:var(--gold)' }, `★ ${chapterStars(s, chapter)} / 30`))),
    h('div.chests', ...chests.map(c => h('button.chest' + (c.ready ? '.ready' : '') + (c.got ? '.got' : ''), {
      onclick: () => {
        if (c.got) return app.toast('이미 받았어요');
        if (!c.ready) return app.toast(`별 ${c.need}개를 모으면 💎 ${c.dia}를 받아요`);
        if (claimChest(s, chapter, c.need)) { app.persist(); sfx.play('win'); app.toast(`💎 ${c.dia} 받았어요!`); app.refresh(); }
      },
    }, h('div', c.got ? '✅' : c.ready ? '🎁' : '📦'), h('small', `★${c.need}`), h('small', `💎${c.dia}`)))),
    h('div.stages', ...STAGES.filter(st => st.chapter === chapter).map(st => {
      const n = s.stars[st.id] || 0, open = unlocked(s, st);
      const cls = 'button.stage' + (n ? '.done' : '') + (open ? '' : '.locked') + (st.boss ? '.boss' : '') + (open && !n ? '.next' : '');
      return h(cls, { onclick: () => (open ? preview(app, st.id) : app.toast('앞 스테이지를 먼저 깨요')) },
        open ? h('div', st.boss ? `👑 ${st.id} 보스` : st.id) : '🔒',
        open ? starRow(n) : null,
        open && st.newFoe && !n ? h('span.newfoe', 'NEW') : null);
    })),
  );
}

function preview(app, id) {
  const st = STAGE[id], s = app.save;
  const first = !s.stars[id];
  const teamCount = s.team.filter(Boolean).length;
  const power = teamPower(s);
  const weak = power < st.rec;
  const nf = st.newFoe && MONSTERS[st.newFoe];
  app.modal(close => h('div.col',
    h('div.row', h('h2.grow', { style: 'margin:0' }, `${id} ${st.boss ? '보스' : ''}`), starRow(s.stars[id] || 0)),
    h('div.foes', ...st.foes.map(f => monsterCanvas(f.mon, 120))),
    h('div.center', st.foes.map(f => MONSTERS[f.mon].name).join(' · '), h('div.dim', `적 레벨 ${st.lv}`)),
    nf ? h('div.card.row.newcard', monsterCanvas(nf.id, 70), h('div.grow', h('b', `새로운 적: ${nf.name}`), h('div', { style: 'font-size:14px' }, nf.desc))) : null,
    h('div.card.row', { style: 'justify-content:space-around;text-align:center' },
      h('div', h('div.dim', { style: 'font-size:12px' }, '추천 전투력'), h('b', { style: 'font-size:20px' }, fmt(st.rec))),
      h('div', h('div.dim', { style: 'font-size:12px' }, '우리 팀'), h('b', { style: `font-size:20px;color:${weak ? 'var(--bad)' : 'var(--good)'}` }, fmt(power)))),
    weak ? h('div.center', { style: 'color:var(--bad);font-size:14px' }, '조금 힘들 수 있어요. 영웅을 레벨업하면 좋아요!') : null,
    h('div.card', { style: 'font-size:14px' },
      h('div', '★ 깨기'), h('div', '★★ 아무도 안 쓰러지기'), h('div', `★★★ 아무도 안 쓰러지고 ${st.limit}번 행동 안에 깨기`)),
    h('div.card.center', `보상: 🪙 ${fmt(st.gold)}`, first ? h('b', { style: 'color:var(--dia)' }, `  +💎 ${fmt(st.firstDia)} (첫 클리어)`) : null),
    teamCount
      ? h('button.btn', { onclick: () => { close(); app.startBattle(id); } }, '출발!')
      : h('div.col', h('div.center', '편성에서 영웅을 넣어 주세요'), h('button.btn.ghost', { onclick: () => { close(); app.show('team'); } }, '편성으로')),
  ));
}
