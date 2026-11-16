// 친구 대전: 내 팀 코드 복사 → 친구에게 보내기 / 친구 팀 코드 붙여넣기 → 대전
import { h, fmt, stars } from '../app.js';
import { HERO } from '../../data/heroes.js';
import { heroCanvas } from '../../render/portrait.js';
import { teamPower } from '../../core/progress.js';
import { teamCode, readTeamCode, friendPower, pvpSpec, PVP_WIN_DIA } from '../../core/modes.js';

let pasted = ''; // 화면을 다시 그려도 붙여넣은 코드가 남게

export function render(root, app) {
  const s = app.save;
  const hasTeam = s.team.some(Boolean);
  const nameInput = h('input.name-input', { value: s.pvp.name, maxlength: 10, placeholder: '내 이름(10자까지)' });
  nameInput.addEventListener('change', () => { s.pvp.name = nameInput.value.trim().slice(0, 10); app.persist(); app.refresh(); });
  const code = hasTeam ? teamCode(s) : '';
  const box = h('textarea.code-box', { rows: 3, placeholder: '친구가 보낸 팀 코드를 여기에 붙여 넣어요' });
  box.value = pasted;
  const preview = h('div.col');
  // 붙여넣으면 아래 미리보기만 다시 그린다(입력 칸은 그대로 둬야 계속 고칠 수 있다)
  const drawPreview = () => {
  preview.replaceChildren();
  const friend = readTeamCode(pasted);
  if (pasted && !friend) preview.append(h('div.center', { style: 'color:var(--bad)' }, '코드가 맞지 않아요. 다시 복사해 봐요.'));
  if (friend) {
    const fp = friendPower(friend), mine = teamPower(s);
    preview.append(
      h('div.card.col',
        h('div.row', h('b.grow', `${friend.name}의 팀`), h('span', `⚔️ ${fmt(fp)}`)),
        h('div.vs-team', ...friend.team.map(x => h('div.vs-hero',
          heroCanvas(x.id, 84), h('div', { style: 'font-size:12px;font-weight:700' }, HERO[x.id].name),
          stars(HERO[x.id].star, x.awakened, x.id), h('div.dim', { style: 'font-size:11px' }, `Lv ${x.level}${x.dupes ? ` +${x.dupes}` : ''}`)))),
        h('div.center.dim', { style: 'font-size:13px' }, `우리 팀 ⚔️ ${fmt(mine)}`)),
      h('button.btn', { disabled: !hasTeam, onclick: () => app.startMode(pvpSpec(friend)) }, hasTeam ? '⚔️ 대전 시작!' : '편성에서 영웅을 넣어 주세요'));
  }
  };
  drawPreview();
  box.addEventListener('input', () => { pasted = box.value.trim(); drawPreview(); });

  root.append(
    app.top('친구 대전', 'challenge'),
    h('div.card.row', { style: 'margin-bottom:10px;padding:10px 14px' },
      h('div.grow', h('div.dim', { style: 'font-size:12px' }, '전적'), h('b', { style: 'font-size:22px' }, `${s.pvp.wins}승 ${s.pvp.losses}패`)),
      h('div.dim', { style: 'font-size:12px;text-align:right' }, h('div', '하루 첫 승리'), h('b', { style: 'color:var(--dia)' }, `💎 ${PVP_WIN_DIA}`))),
    h('div.card.col',
      h('b', '1. 내 팀 코드 보내기'),
      h('div.dim', { style: 'font-size:13px' }, '지금 편성한 팀이 코드가 돼요. 복사해서 친구한테 보내 줘요.'),
      nameInput,
      hasTeam
        ? h('button.btn.ghost', { onclick: async () => {
          try { await navigator.clipboard.writeText(code); app.toast('팀 코드를 복사했어요!'); } catch { app.modal(close => h('div.col', h('b', '아래 코드를 길게 눌러 복사해요'), h('textarea.code-box', { rows: 4, readonly: true }, code), h('button.btn', { onclick: close }, '닫기'))); }
        } }, '📋 내 팀 코드 복사')
        : h('div.dim', '편성에서 영웅을 먼저 넣어 주세요')),
    h('div.card.col', { style: 'margin-top:10px' },
      h('b', '2. 친구 팀과 싸우기'),
      h('div.dim', { style: 'font-size:13px' }, '친구 팀은 컴퓨터가 대신 싸워요. 스킬도 알아서 써요.'),
      box,
      preview),
  );
}
