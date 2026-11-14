// 영웅·몬스터 그림 확인용 페이지(mockup.html)
import { HEROES, STAR_COLOR, ROLE_NAME } from './data/heroes.js';
import { MONSTERS } from './data/monsters.js';
import { heroCanvas, monsterCanvas } from './render/portrait.js';

const root = document.getElementById('root');
const sec = t => {
  const h = document.createElement('h2'); h.textContent = t;
  const g = document.createElement('div'); g.className = 'grid';
  root.append(h, g);
  return g;
};
for (let s = 1; s <= 7; s++) {
  const g = sec('★'.repeat(s));
  for (const h of HEROES.filter(x => x.star === s)) {
    const c = document.createElement('div'); c.className = 'c'; c.style.border = `2px solid ${STAR_COLOR[s]}`;
    c.append(heroCanvas(h.id, 110));
    c.insertAdjacentHTML('beforeend', `${h.name}<b>${ROLE_NAME[h.role]} · ${h.skill.name}</b>`);
    g.append(c);
  }
}
const g = sec('몬스터');
for (const m of Object.values(MONSTERS)) {
  const c = document.createElement('div'); c.className = 'c';
  c.append(monsterCanvas(m.id, 110), m.name);
  g.append(c);
}
