import './ui/style.css';
import { loadSave, writeSave } from './core/save.js';
import { ensureToday } from './core/daily.js';
import { sfx } from './core/sfx.js';
import { createApp } from './ui/app.js';
import * as lobby from './ui/screens/lobby.js';
import * as adventure from './ui/screens/adventure.js';
import * as heroes from './ui/screens/heroes.js';
import * as heroDetail from './ui/screens/heroDetail.js';
import * as team from './ui/screens/team.js';
import * as missions from './ui/screens/missions.js';
import * as settings from './ui/screens/settings.js';
import * as summon from './ui/screens/summon.js';

const TEST = /[?&]test\b/.test(location.search);
const save = loadSave();
// 테스트판(?test): 다이아·골드 100만, 다음 소환에서 바로 천장
if (TEST && !save.tips.testInit) {
  save.diamonds = 1_000_000;
  save.gold = 1_000_000;
  save.pity = 299;
  save.tips.testInit = true;
}
ensureToday(save);
writeSave(save);
sfx.setOn(save.settings.sound);

const app = createApp(document.getElementById('app'), save,
  { lobby, adventure, heroes, heroDetail, team, missions, settings, summon });

// 전투·소환 연출(Phaser)은 처음 쓸 때 불러온다
app.startBattle = async stageId => (await import('./game/phaser.js')).startBattle(app, stageId);
app.startSummon = async (results, ticket = false) => (await import('./game/phaser.js')).startSummon(app, results, ticket);

app.show('lobby');
// 탭을 닫거나 다른 앱으로 갈 때 저장
document.addEventListener('visibilitychange', () => { if (document.hidden) app.persist(); });
