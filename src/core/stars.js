// 별 3개: ★ 깨기 / ★★ 아무도 안 쓰러지기 / ★★★ 정해진 행동 수 안에 깨기(아무도 안 쓰러졌을 때).
// 챕터마다 별 10/20/30개를 모으면 다이아 상자.
import { STAGES } from '../data/stages.js';

export const CHESTS = [{ need: 10, dia: 100 }, { need: 20, dia: 200 }, { need: 30, dia: 300 }];

export function starsFor(battle, stage) {
  if (battle.result !== 'win') return 0;
  if (battle.anyAllyDied) return 1;
  return battle.turn <= stage.limit ? 3 : 2;
}

export function recordStars(save, stageId, n) {
  const first = !save.stars[stageId];
  if (n < 1) return { first: false };
  save.stars[stageId] = Math.max(save.stars[stageId] || 0, Math.min(3, n));
  save.cleared = STAGES.filter(s => save.stars[s.id]).map(s => s.id);
  return { first };
}

export const chapterStars = (save, chapter) =>
  STAGES.filter(s => s.chapter === chapter).reduce((t, s) => t + (save.stars[s.id] || 0), 0);

export function chestState(save, chapter) {
  const have = chapterStars(save, chapter);
  return CHESTS.map(c => {
    const got = save.starChests.includes(`${chapter}-${c.need}`);
    return { ...c, got, ready: !got && have >= c.need, have };
  });
}

export function claimChest(save, chapter, need) {
  const c = chestState(save, chapter).find(x => x.need === need);
  if (!c || !c.ready) return false;
  save.starChests.push(`${chapter}-${need}`);
  save.diamonds += c.dia;
  return true;
}
