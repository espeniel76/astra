import { h } from '../app.js';
import { MISSIONS, REWARD, claim } from '../../core/daily.js';
import { sfx } from '../../core/sfx.js';

export function render(root, app) {
  const d = app.save.daily;
  root.append(
    app.top('오늘의 미션'),
    h('div.dim', { style: 'font-size:13px;margin-bottom:8px' }, '매일 밤 12시에 새로 바뀌어요.'),
    h('div.col', ...MISSIONS.map(m => {
      const p = Math.min(m.goal, d.progress[m.id] || 0);
      const got = d.claimed.includes(m.id);
      return h('div.card.col',
        h('div.row', h('b.grow', m.text), h('span.dim', `${p} / ${m.goal}`)),
        h('div.bar', h('i', { style: `width:${(p / m.goal) * 100}%` })),
        h('button.btn' + (got ? '.ghost' : '.green'), {
          disabled: got || p < m.goal,
          onclick: () => { if (claim(app.save, m.id)) { app.persist(); sfx.play('reveal'); app.toast(`💎 ${REWARD} 받았어요!`); app.refresh(); } },
        }, got ? '받았어요' : `💎 ${REWARD} 받기`));
    })),
  );
}
