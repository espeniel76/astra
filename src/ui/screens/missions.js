// 게시판: 오늘의 미션 · 출석 체크 · 업적(탭 세 개)
import { h, fmt } from '../app.js';
import { MISSIONS, REWARD, claim, claimable } from '../../core/daily.js';
import { LOGIN_REWARDS, loginToday, claimLogin } from '../../core/attendance.js';
import { achvState, achvClaimable, claimAchv } from '../../core/achievements.js';
import { gearName, GRADES } from '../../data/gear.js';
import { gearCanvas } from '../../render/gearArt.js';
import { sfx } from '../../core/sfx.js';

// 보상 하나를 작은 칸으로(출석·업적·받은 보상 창에서 같이 씀)
export function rewardTile(r, big = false) {
  const px = big ? 64 : 44;
  if (r.kind === 'gear' && r.slot) return h('div.rw', gearCanvas(r.slot, r.grade, px), h('small', { style: `color:${GRADES[r.grade].color}` }, gearName(r.slot, r.grade)));
  const icon = { dia: '💎', gold: '🪙', ticket: '🎟️', gear: '🎁' }[r.kind];
  const label = r.kind === 'ticket' ? `★4 소환권 ${r.n}` : r.kind === 'gear' ? `${GRADES[r.top].name}까지 장비` : fmt(r.n);
  return h('div.rw', h('div.rw-icon', { style: `font-size:${big ? 40 : 26}px` }, icon), h('small', label));
}

// 받은 보상을 하나씩 튀어나오게 보여 주는 창
export function showRewards(app, title, got) {
  sfx.play('win');
  app.modal(close => h('div.col.center',
    h('h2', { style: 'margin:0' }, title),
    h('div.rw-row.pop-in', ...got.map((r, i) => { const t = rewardTile(r, true); t.style.animationDelay = `${0.15 + i * 0.2}s`; return t; })),
    h('button.btn', { onclick: close }, '좋아요!')));
}

// 출석판: 7칸(받은 날 ✓, 오늘 받을 칸은 빛남)
export function loginBoard(app, onClaim) {
  const s = app.save, today = loginToday(s);
  const done = today === null ? (s.login.day === 0 ? 7 : s.login.day) : s.login.day; // 이번 주기에서 받은 날 수
  return h('div.col',
    h('div.login-grid', ...LOGIN_REWARDS.map((rs, i) => {
      const got = i < done, now = today === i;
      return h('div.login-day' + (got ? '.got' : '') + (now ? '.now' : '') + (i === 6 ? '.big' : ''),
        h('b', `${i + 1}일째`), h('div.rw-row', ...rs.map(r => rewardTile(r))), got ? h('div.login-check', '✓') : null);
    })),
    today !== null
      ? h('button.btn.gold', { onclick: () => {
        const r = claimLogin(s);
        if (!r) return;
        app.persist();
        showRewards(app, `출석 ${r.day + 1}일째!`, r.got);
        onClaim?.();
      } }, `${today + 1}일째 보상 받기`)
      : h('div.center.dim', '오늘은 받았어요. 내일 또 와요!'),
    h('div.center.dim', { style: 'font-size:12px' }, `지금까지 출석 ${s.login.total}일 · 하루 빠져도 이어서 받아요`));
}

let tab = 'daily';

export function render(root, app, params = {}) {
  if (params.tab) tab = params.tab;
  const s = app.save;
  const dots = { daily: claimable(s) > 0, login: loginToday(s) !== null, achv: achvClaimable(s) > 0 };
  const tabBtn = (k, label) => h('button' + (tab === k ? '.on' : '') + (dots[k] ? '.dot' : ''), { onclick: () => { tab = k; app.refresh(); } }, label);
  let body;
  if (tab === 'daily') {
    const d = s.daily;
    body = h('div.col',
      h('div.dim', { style: 'font-size:13px' }, '매일 밤 12시에 새로 바뀌어요.'),
      ...MISSIONS.map(m => {
        const p = Math.min(m.goal, d.progress[m.id] || 0);
        const got = d.claimed.includes(m.id);
        return h('div.card.col',
          h('div.row', h('b.grow', m.text), h('span.dim', `${p} / ${m.goal}`)),
          h('div.bar', h('i', { style: `width:${(p / m.goal) * 100}%` })),
          h('button.btn' + (got ? '.ghost' : '.green'), {
            disabled: got || p < m.goal,
            onclick: () => { if (claim(s, m.id)) { app.persist(); sfx.play('reveal'); app.toast(`💎 ${REWARD} 받았어요!`); app.refresh(); } },
          }, got ? '받았어요' : `💎 ${REWARD} 받기`));
      }));
  } else if (tab === 'login') {
    body = h('div.card', loginBoard(app, () => app.refresh()));
  } else {
    const all = achvState(s);
    const list = [...all.filter(a => !a.claimed), ...all.filter(a => a.claimed)]; // 받은 업적은 맨 아래로
    let group = '';
    body = h('div.col', ...list.flatMap(a => {
      const g = a.claimed ? '받은 업적' : a.group;
      const head = g !== group ? (group = g, [h('div.achv-group', g)]) : [];
      return [...head, h('div.card.achv' + (a.claimed ? '.claimed' : a.done ? '.ready' : ''),
        h('div.row',
          h('div.grow', h('b', a.name), h('div.dim', { style: 'font-size:13px' }, a.desc)),
          h('div.rw-row', ...a.reward.map(r => rewardTile(r)))),
        a.goal > 1 && !a.claimed ? h('div.row', h('div.bar.grow', h('i', { style: `width:${(a.cur / a.goal) * 100}%` })), h('span.dim', { style: 'font-size:12px' }, `${fmt(a.cur)} / ${fmt(a.goal)}`)) : null,
        a.claimed ? h('div.dim', { style: 'font-size:13px' }, '✓ 받았어요')
          : a.done ? h('button.btn.gold', { onclick: () => { const r = claimAchv(s, a.id); if (r) { app.persist(); showRewards(app, `🏅 ${a.name}`, r); app.refresh(); } } }, '받기') : null)];
    }));
  }
  root.append(
    app.top('게시판'),
    h('div.tabs.board-tabs', tabBtn('daily', '오늘의 미션'), tabBtn('login', '출석'), tabBtn('achv', '업적')),
    body,
  );
}
