// 개발자 전용 미리보기(dev.html). 게임 기록은 건드리지 않고, 뽑기 연출만 마음대로 틀어 본다.
import './ui/style.css';
import { h, heroCard, stars } from './ui/app.js';
import { HEROES, STAR_COLOR } from './data/heroes.js';
import { defaultSave } from './core/save.js';
import { startSummon } from './game/phaser.js';
import { isAdmin, adminForm } from './core/admin.js';

// 가짜 저장(브라우저에 저장하지 않음): 모든 영웅을 가진 상태, 다이아 넉넉히
const save = defaultSave();
save.diamonds = 9_999_999;
for (const x of HEROES) save.heroes[x.id] = { level: 1, dupes: 0 };
const opt = { isNew: true, flash: false };

const root = document.getElementById('app');
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const ofStar = s => HEROES.filter(x => x.star === s);
const result = (x, extra = {}) => ({ id: x.id, star: x.star, isNew: opt.isNew, dupes: opt.isNew ? 0 : 2, overflowGold: 0, ...extra });

// 진짜 소환처럼 보이는 10+1: 낮은 별 10명 + 고른 별 1명
function bundle(top) {
  const low = [];
  for (let i = 0; i < 10; i++) {
    const s = Math.min(top, pick([1, 1, 1, 2, 2, 2, 3, 3, 4]));
    low.push(result(pick(ofStar(s))));
  }
  return [...low, result(pick(ofStar(top)))];
}

const app = {
  save,
  persist() {},
  toast() {},
  show() { render(); },
};

function play(results) {
  save.settings.flash = opt.flash;
  startSummon(app, results);
}

// 안드로이드 앱 안에서 열었을 때: 휴대폰 뒤로 가기 = 연출 중이면 연출 끄기, 아니면 게임으로 돌아가기
const IN_APP = import.meta.env.MODE === 'app';
const toGame = () => { location.href = './index.html'; };
if (IN_APP) {
  window.__app = {
    back() {
      const stage = document.getElementById('stage');
      if (stage && !stage.hidden) import('./game/phaser.js').then(m => m.closeStage(app, 'dev'));
      else toGame();
      return 'handled';
    },
    pause() { return 'ok'; },
    resume() { return 'ok'; },
  };
}

function render() {
  const btn = (label, fn, cls = '') => h('button.btn' + cls, { onclick: fn }, label);
  const toggle = (key, label, desc) => {
    const box = h('input', { type: 'checkbox' });
    box.checked = opt[key];
    box.addEventListener('change', () => { opt[key] = box.checked; });
    return h('label.switch.card', h('div', h('b', label), h('div.dim', { style: 'font-size:13px' }, desc)), box);
  };
  root.replaceChildren(
    h('div.top', IN_APP ? h('button.back', { onclick: toGame, 'aria-label': '게임으로' }, '‹') : null, h('h1', '🧪 개발자 미리보기')),
    h('div.dim', { style: 'font-size:13px;margin-bottom:10px' }, '뽑기 연출만 틀어 봐요. 진짜 게임 기록은 안 바뀌어요.'),
    h('div.col',
      toggle('isNew', '처음 뽑은 영웅처럼(NEW)', '끄면 이미 가진 영웅이 겹친 것처럼(+2) 보여요.'),
      toggle('flash', '번쩍임 효과 켜고 보기', '진짜 점멸·빠른 번개가 나와요. 기본 게임에서는 꺼져 있어요.'),
      h('h2', { style: 'margin:8px 0 0' }, '한 장 공개'),
      h('div.dev-row', ...[1, 2, 3, 4, 5, 6, 7, 8].map(s =>
        btn(h('span', { style: `color:${STAR_COLOR[s]}` }, `★${s}`), () => play([result(pick(ofStar(s)))]), '.ghost'))),
      h('div.dim', { style: 'font-size:12px' }, '★1~★4: 카드 뒤집기 · ★5: 컷신 · ★6: 암전 + 대사 + 번개 · ★7: 전용 애니메이션'),
      h('h2', { style: 'margin:8px 0 0' }, '10+1 묶음 (최고 별 고르기)'),
      h('div.dev-row', ...[1, 2, 3, 4, 5, 6, 7, 8].map(s =>
        btn(h('span', { style: `color:${STAR_COLOR[s]}` }, `★${s}`), () => play(bundle(s)), '.ghost'))),
      h('h2', { style: 'margin:8px 0 0' }, '★7 각성(큰 별 ★8)'),
      h('div.grid', ...ofStar(7).map(x => heroCard({ save }, x.id, {
        showLevel: false,
        onclick: () => play([{ ...result(x), isNew: false, dupes: 5, awaken: true }]),
      }))),
      h('div.dim', { style: 'font-size:12px' }, '★7 전용 애니메이션 → 카드 → 작은 별 일곱 개가 모여 큰 별 하나 + "각성!"'),
      h('h2', { style: 'margin:8px 0 0' }, '영웅 골라서 보기'),
      ...[8, 7, 6, 5, 4, 3, 2, 1].flatMap(s => [
        h('div', { style: 'margin-top:6px' }, stars(s), h('span.dim', ` ${ofStar(s).length}명`)),
        h('div.grid', ...ofStar(s).map(x => heroCard({ save }, x.id, { showLevel: false, onclick: () => play([result(x)]) }))),
      ]),
    ),
  );
}

// 관리자 코드를 맞힌 기기에서만 연다(src/core/admin.js)
function lockScreen() {
  root.replaceChildren(
    h('div.top', IN_APP ? h('button.back', { onclick: toGame, 'aria-label': '게임으로' }, '‹') : null, h('h1', '🔑 관리자 전용')),
    h('div.card.col', { style: 'margin-top:12px' },
      h('div.dim', '개발자 미리보기는 관리자만 볼 수 있어요.'),
      adminForm(h, { onOk: render, onFail: () => { const m = root.querySelector('.lock-msg'); if (m) m.textContent = '코드가 달라요'; } }),
      h('div.lock-msg', { style: 'color:var(--bad);font-size:14px;min-height:20px' })),
  );
}

if (isAdmin()) render(); else lockScreen();
