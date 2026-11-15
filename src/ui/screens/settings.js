import { h } from '../app.js';
import { exportCode, importCode, defaultSave } from '../../core/save.js';
import { sfx } from '../../core/sfx.js';
import { isAdmin, lockAdmin, adminForm } from '../../core/admin.js';
import { maxAllHeroes } from '../../core/progress.js';

export function render(root, app) {
  const st = app.save.settings;
  const toggle = (key, label, desc) => {
    const box = h('input', { type: 'checkbox' });
    box.checked = st[key];
    box.addEventListener('change', () => { st[key] = box.checked; if (key === 'sound') sfx.setOn(box.checked); app.persist(); });
    return h('label.switch.card', h('div', h('b', label), desc ? h('div.dim', { style: 'font-size:13px' }, desc) : null), box);
  };
  const code = h('textarea', { readonly: true });
  code.value = exportCode(app.save);
  const paste = h('textarea', { placeholder: '여기에 저장 코드를 붙여넣어요' });
  root.append(
    app.top('설정'),
    h('div.col',
      toggle('sound', '소리'),
      toggle('flash', '번쩍임 효과', '빠르게 번쩍이는 화면 효과예요. 기본은 꺼져 있어요.'),
      h('div.card.col',
        h('b', '저장 코드 (백업)'),
        h('div.dim', { style: 'font-size:13px' }, '이 코드를 메모장이나 카톡에 보관해 두면, 브라우저 기록이 지워지거나 폰을 바꿔도 영웅을 되찾을 수 있어요.'),
        code,
        h('button.btn.ghost', { onclick: async () => {
          try { await navigator.clipboard.writeText(code.value); app.toast('복사했어요!'); }
          catch { code.select(); app.toast('코드를 길게 눌러 복사해 주세요'); }
        } }, '코드 복사')),
      h('div.card.col',
        h('b', '저장 코드 불러오기'),
        paste,
        h('button.btn.ghost', { onclick: () => {
          const s = importCode(paste.value);
          if (!s) return app.toast('코드가 맞지 않아요');
          app.modal(close => h('div.col',
            h('b', '지금 기록이 이 코드의 기록으로 바뀌어요. 괜찮아요?'),
            h('div.row', h('button.btn.ghost.grow', { onclick: close }, '취소'),
              h('button.btn.grow', { onclick: () => { app.save = s; app.persist(); close(); app.toast('불러왔어요!'); app.show('lobby'); } }, '바꾸기'))));
        } }, '불러오기')),
      h('button.btn.ghost', { style: 'margin-top:6px', onclick: () => app.modal(close => h('div.col',
        h('b', '처음부터 다시 할까요?'),
        h('div.dim', { style: 'font-size:14px' }, '영웅, 다이아, 별이 전부 사라지고 처음 선물(★4 확정 소환권)부터 다시 시작해요. 되돌릴 수 없어요!'),
        h('div.row', h('button.btn.ghost.grow', { onclick: close }, '취소'),
          h('button.btn.grow', { style: 'background:linear-gradient(#ff7a7a,#d84a4a);box-shadow:0 4px 0 #8a2a2a', onclick: () => {
            app.save = defaultSave(); app.persist(); close(); app.toast('새로 시작해요!'); app.show('lobby');
          } }, '다시 시작')))) }, '처음부터 다시 하기'),
      // 관리자: 코드를 맞힌 기기에서만 개발자 미리보기 버튼이 보인다(src/core/admin.js)
      isAdmin()
        ? h('div.col', { style: 'margin-top:6px' },
          h('a.btn.ghost', { href: './dev.html', style: 'display:flex;align-items:center;justify-content:center;text-decoration:none' }, '🧪 개발자 미리보기 열기'),
          h('button.btn.ghost', { style: 'font-size:13px;min-height:36px', onclick: () => { lockAdmin(); app.toast('관리자 잠금'); app.refresh(); } }, '🔒 관리자 잠그기'))
        : h('button.btn.ghost', { style: 'margin-top:6px;font-size:14px;min-height:40px', onclick: () => app.modal(close => h('div.col',
          h('h2', { style: 'margin:0' }, '🔑 관리자'),
          adminForm(h, {
            onOk: () => { maxAllHeroes(app.save); app.persist(); close(); app.toast('관리자로 열렸어요! 모든 영웅 풀강'); app.refresh(); },
            onFail: () => app.toast('코드가 달라요'),
          }),
          h('button.btn.ghost', { onclick: close }, '닫기'))) }, '🔑 관리자'),
      h('div.center.dim', { style: 'font-size:12px;margin-top:8px' }, '아스트라 v0.2'),
    ),
  );
}
