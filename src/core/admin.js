// 관리자 코드: 개발자 미리보기(dev.html)를 잠근다(아들 요청, 2026-11-15).
// 코드는 그대로 적지 않고 SHA-256 지문만 둔다. 한 번 맞히면 그 기기(브라우저·앱)에 기억된다.
const HASH = 'ece12e6e385ee34206f8dd3371efed744a50e9f7bae70248e279dc721b10946d';
const KEY = 'astra.admin';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAdmin() {
  try { return localStorage.getItem(KEY) === HASH; } catch { return false; }
}

// 맞으면 true(그리고 이 기기에 기억), 틀리면 false
export async function tryAdmin(code) {
  const ok = (await sha256(String(code).trim())) === HASH;
  if (ok) { try { localStorage.setItem(KEY, HASH); } catch { /* 저장 못 해도 이번엔 열림 */ } }
  return ok;
}

export function lockAdmin() {
  try { localStorage.removeItem(KEY); } catch { /* 없어도 됨 */ }
}

// 코드 입력 칸 + 확인 버튼(DOM). onOk: 맞았을 때 부른다
export function adminForm(h, { onOk, onFail }) {
  const input = h('input.code', { type: 'password', inputmode: 'numeric', autocomplete: 'off', placeholder: '관리자 코드' });
  const go = async () => { if (await tryAdmin(input.value)) onOk(); else { input.value = ''; onFail?.(); } };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  return h('div.col', input, h('button.btn', { onclick: go }, '확인'));
}
