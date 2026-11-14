// Phaser 게임 하나를 만들어 두고, 전투·소환 연출 때만 #stage 를 보여 준다.
import Phaser from 'phaser';
import { BattleScene } from './BattleScene.js';
import { SummonScene } from './SummonScene.js';

let game = null;
const stage = () => document.getElementById('stage');

// 휴대폰이 게임 비율보다 길면 위아래가 남는다. 그 자리를 장면 색으로 채워 검은 띠가 안 보이게.
export function setBackdrop(top, bottom = top) {
  stage().style.background = `linear-gradient(${top}, ${bottom})`;
}

function ensureGame() {
  if (game) return Promise.resolve(game);
  return new Promise(resolve => {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'stage',
      width: 720,
      height: 1280,
      backgroundColor: '#0d1020',
      // 가운데 맞춤은 #stage(flex)가 한다. Phaser도 맞추면 PC에서 두 번 밀려 오른쪽으로 치우친다.
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
      render: { antialias: true },
      callbacks: { postBoot: () => resolve(game) },
    });
    game.scene.add('battle', BattleScene, false);
    game.scene.add('summon', SummonScene, false);
  });
}

function open() {
  stage().hidden = false;
  document.getElementById('app').hidden = true;
}

// 씬이 끝나면 부른다: Phaser를 재우고 DOM 화면으로 돌아간다
export function closeStage(app, screen, params) {
  for (const k of ['battle', 'summon']) if (game.scene.isActive(k)) game.scene.stop(k);
  stage().hidden = true;
  document.getElementById('app').hidden = false;
  game.loop.sleep();
  app.show(screen, params);
}

async function run(key, data) {
  open();
  const g = await ensureGame();
  g.loop.wake();
  g.scale.refresh();
  for (const k of ['battle', 'summon']) if (g.scene.isActive(k)) g.scene.stop(k);
  g.scene.start(key, data);
}

export const startBattle = (app, stageId) => run('battle', { app, stageId });
export const startSummon = (app, results, ticket = false) => run('summon', { app, results, ticket });
