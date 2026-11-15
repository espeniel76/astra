// 안드로이드 앱(플러터, app/ 폴더)이 게임을 부르는 창구. 웹에서는 쓰이지 않는다(vite --mode app 일 때만 켜짐).
// 앱은 게임을 화면 가득 띄워 두고, 휴대폰 뒤로 가기·홈 버튼이 눌리면 아래 함수를 부른다.
import { suspendAudio, resumeAudio } from './sfx.js';

export function installAppBridge(app) {
  window.__app = {
    // 뒤로 가기: 'handled' = 게임이 알아서 처리함, 'exit' = 첫 화면(마을)이라 더 돌아갈 곳이 없음
    // (그러면 앱이 "한 번 더 누르면 게임이 꺼져요"를 띄운다)
    back() {
      const modal = [...document.querySelectorAll('.modal-bg')].pop();
      if (modal) { modal.remove(); return 'handled'; }
      const stage = document.getElementById('stage');
      if (stage && !stage.hidden) {
        // 전투 중이면 "나갈까요?" 창, 소환 연출 중이면 아무것도 안 함(연출은 탭으로 넘긴다)
        import('../game/phaser.js').then(m => m.stageBack());
        return 'handled';
      }
      const backBtn = document.querySelector('#app .top .back');
      if (backBtn) { backBtn.click(); return 'handled'; }
      return 'exit';
    },
    // 홈 버튼·전화 등으로 앱이 뒤로 갈 때: 저장하고 소리를 쉰다
    pause() {
      app.persist();
      suspendAudio();
      return 'ok';
    },
    resume() {
      resumeAudio();
      return 'ok';
    },
  };
}
