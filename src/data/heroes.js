// 영웅 목록. ★1~★5는 아스트라의 판타지 영웅(임시 명단), ★6·★7은 좀비 생존자의 전설·신화·이터널 영웅.
// skill.fx 는 src/core/skills.js 가 실행한다. cd = 쿨타임(그 영웅의 행동 횟수 기준).

export const STAR_COLOR = [null, '#b8c2cc', '#55d468', '#5a9dff', '#b56dff', '#ffa33a', '#ff4d4d', '#ffe066'];
export const ROLE_NAME = { tank: '탱커', dps: '공격', support: '지원' };

const ROLE = {
  tank: { hp: 1.4, atk: 0.75, def: 1.3, spd: 90 },
  dps: { hp: 1.0, atk: 1.0, def: 1.0, spd: 105 },
  support: { hp: 1.1, atk: 0.8, def: 1.1, spd: 100 },
};

function base(star, role, spdAdj = 0) {
  const r = ROLE[role];
  return {
    hp: Math.round(260 * 1.32 ** (star - 1) * r.hp),
    atk: Math.round(36 * 1.32 ** (star - 1) * r.atk),
    def: Math.round(8 * 1.3 ** (star - 1) * r.def),
    spd: r.spd + spdAdj,
  };
}

// H(id, 이름, 별, 역할, 스킬, 모습, 대사, 추가)
const H = (id, name, star, role, skill, look, quote, extra = {}) => ({
  id, name, star, role, skill, look, quote,
  hero: star >= 6,
  base: base(star, role, extra.spd || 0),
  passive: extra.passive || null,
});
const S = (name, desc, cd, ...fx) => ({ name, desc, cd, fx });
const dmg = (target, mult, more = {}) => ({ t: 'dmg', target, mult, hits: 1, ...more });
const st = (target, k, turns, v = 0, more = {}) => ({ t: 'status', target, k, turns, v, ...more });

export const HEROES = [
  // ── ★1 ──
  H('shieldboy', '방패 소년', 1, 'tank',
    S('막아서기', '2턴 동안 적의 공격을 자기에게 모으고 보호막을 둘러요.', 3, st('self', 'taunt', 2), { t: 'shield', target: 'self', mult: 1.5 }),
    { shirt: 0x6b8fb0, hat: 0x9aa6b2, hatStyle: 'helm', gun: 'buckler' }, '내 뒤에 있어! …아마 괜찮을 거야.', { spd: -5 }),
  H('slinger', '돌팔매 목동', 1, 'dps',
    S('연속 돌팔매', '무작위 적에게 돌을 2번 던져요.', 2, dmg('random', 0.9, { hits: 2 })),
    { shirt: 0xc9a46a, hat: 0x7a5a3a, hatStyle: 'bandana', gun: 'sling' }, '양 떼 지키던 솜씨, 보여줄게.'),
  H('herbalist', '약초꾼', 1, 'support',
    S('약초 찜질', '체력이 가장 적은 아군을 크게 치료해요.', 2, { t: 'heal', target: 'lowest', mult: 1.8 }),
    { shirt: 0x6a9a4a, hat: 0x4a6a2a, hatStyle: 'hood', gun: 'herb' }, '쓴 게 몸에 좋은 거야.'),
  H('woodcutter', '나무꾼', 1, 'dps',
    S('통나무 베기', '적 하나를 방어를 무시하고 세게 찍어요.', 3, dmg('one', 1.8, { ignoreDef: true })),
    { shirt: 0xa83a2a, hat: 0x5a3a22, hatStyle: 'bandana', gun: 'woodaxe' }, '나무든 슬라임이든, 한 번에.', { spd: -5 }),

  // ── ★2 ──
  H('wolfgirl', '늑대 소녀', 2, 'dps',
    S('늑대 발톱', '적 하나를 2번 할퀴고 2턴 동안 피를 흘리게 해요.', 3, dmg('one', 0.8, { hits: 2 }), st('lastHit', 'bleed', 2, 0.4)),
    { shirt: 0x7a6a5a, hat: 0x8a8a8a, hatStyle: 'wolfhood', gun: 'claw' }, '아우우— 사냥 시간이야.', { spd: 10 }),
  H('bard', '떠돌이 음유시인', 2, 'support',
    S('용기의 노래', '2턴 동안 아군 전체의 공격력이 25% 올라가요.', 3, st('allies', 'atkUp', 2, 0.25)),
    { shirt: 0x8a3a8a, hat: 0x5a2a5a, hatStyle: 'feather', gun: 'lute' }, '이 노래가 끝날 때쯤, 전투도 끝나 있을걸.'),
  H('trapper', '덫 사냥꾼', 2, 'support',
    S('올가미 덫', '적 하나를 때리고 1턴 동안 묶어서 못 움직이게 해요.', 3, dmg('one', 1.0), st('lastHit', 'bind', 1)),
    { shirt: 0x5a6a3a, hat: 0x3a4a22, hatStyle: 'hood', gun: 'net' }, '거기 밟으면 안 되는데.'),
  H('chainmonk', '쇠사슬 수도승', 2, 'tank',
    S('쇠사슬 휘감기', '적 하나를 때리고 2턴 동안 방어를 40% 깎아요.', 3, dmg('one', 1.2), st('lastHit', 'defDown', 2, 0.4)),
    { shirt: 0xd08a2a, hat: 0xd08a2a, hatStyle: 'bald', gun: 'chain' }, '마음을 비우면, 사슬이 무거워진다.'),

  // ── ★3 ──
  H('frostarcher', '서리 궁수', 3, 'dps',
    S('서리 화살', '적 하나를 세게 쏘고 1턴 동안 얼려요.', 3, dmg('one', 1.6), st('lastHit', 'freeze', 1)),
    { shirt: 0x8ac8e8, hat: 0xe8f4ff, hatStyle: 'hood', gun: 'frostbow', glow: 0xbfe9ff }, '숨 쉬지 마. 입김에 들킨다.'),
  H('runesmith', '룬 대장장이', 3, 'support',
    S('룬 방패', '아군 전체에게 룬 보호막을 둘러요.', 3, { t: 'shield', target: 'allies', mult: 1.2 }),
    { shirt: 0x6a4a3a, hat: 0x3a3f45, hatStyle: 'goggles', gun: 'hammer', glow: 0x7fd4ff }, '두드릴수록 단단해지지.', { spd: -5 }),
  H('stingthief', '독침 도적', 3, 'dps',
    S('독침', '적 하나를 찌르고 3턴 동안 독을 퍼뜨려요.', 2, dmg('one', 1.0), st('lastHit', 'poison', 3, 0.6)),
    { shirt: 0x2a3a2a, hat: 0x1a221a, hatStyle: 'mask', gun: 'dagger' }, '살짝 따끔할 거야. 그다음이 문제지.', { spd: 15 }),
  H('stormlancer', '폭풍 창기사', 3, 'dps',
    S('돌격 관통', '적 전체를 한 줄로 꿰뚫어요.', 3, dmg('all', 0.8)),
    { shirt: 0x3a5a9a, hat: 0xc9d3de, hatStyle: 'helm', gun: 'spear' }, '바람보다 먼저 도착한다.'),

  // ── ★4 ──
  H('astrologer', '별점술사', 4, 'support',
    S('운명의 별자리', '아군 전체의 다음 공격이 반드시 치명타가 돼요.', 3, st('allies', 'crit', 2)),
    { shirt: 0x2a2a6a, hat: 0x3a3a8a, hatStyle: 'wizard', gun: 'astrolabe', glow: 0xc9b8ff }, '별이 말하길, 다음 한 방은 아플 거래.'),
  H('berserker', '피의 광전사', 4, 'dps',
    S('피의 분노', '잃은 체력이 많을수록 더 세게 때리고, 준 피해의 30%만큼 회복해요.', 3, { t: 'rage', base: 1.4, per: 1.6, lifesteal: 0.3 }),
    { shirt: 0x8a1a1a, hat: 0x5a4a3a, hatStyle: 'hornhelm', gun: 'greataxe' }, '아프냐고? 이제 시작이야.'),
  H('moonpriest', '달빛 사제', 4, 'support',
    S('달빛 축복', '아군 전체를 치료하고 나쁜 상태를 풀어 줘요.', 3, { t: 'heal', target: 'allies', mult: 1.2 }, { t: 'cleanse' }),
    { shirt: 0xe8e8f8, hat: 0xc9d3ff, hatStyle: 'circlet', gun: 'moonstaff', glow: 0xd8e0ff }, '밤은 길어도, 달은 꺼지지 않아.'),
  H('phantomblade', '유령 검객', 4, 'dps',
    S('유령 걸음', '적 하나를 베고, 2턴 동안 50% 확률로 공격을 피하며 반격해요.', 3, dmg('one', 1.3), st('self', 'evade', 2, 0.5)),
    { shirt: 0x3a4a5a, hat: 0x9fb8d0, hatStyle: 'ronin', gun: 'katana', glow: 0x9fd0ff }, '내가 보였다면, 이미 늦었어.', { spd: 15 }),

  // ── ★5 ──
  H('thunderpaladin', '천둥 성기사', 5, 'tank',
    S('심판의 천둥', '적 전체에 번개를 내리고 30% 확률로 기절시켜요. 2턴 동안 적의 공격을 자기에게 모아요.', 3,
      dmg('all', 1.0), st('all', 'stun', 1, 0, { chance: 0.3 }), st('self', 'taunt', 2)),
    { shirt: 0xe8d070, hat: 0xfff0b0, hatStyle: 'wingedhelm', gun: 'warhammer', glow: 0xfff07a }, '하늘이 내 편이다.'),
  H('starmage', '별의 마도사', 5, 'dps',
    S('별똥별', '하늘에서 별똥별을 떨어뜨려 적 전체를 크게 때려요.', 3, dmg('all', 1.7)),
    { shirt: 0x1a1a4a, hat: 0x2a2a6a, hatStyle: 'wizard', gun: 'starstaff', glow: 0x8ab4ff }, '소원 빌 시간은 없을 거야.'),
  H('forestwarden', '숲의 파수꾼', 5, 'tank',
    S('고목의 방벽', '아군 전체에 두꺼운 보호막을 두르고 2턴 동안 적의 공격을 자기에게 모아요.', 3,
      { t: 'shield', target: 'allies', mult: 2.0 }, st('self', 'taunt', 2)),
    { shirt: 0x3a5a2a, hat: 0x6a4a2a, hatStyle: 'antler', gun: 'treeshield', glow: 0x9fe07a }, '숲이 허락하지 않으면, 아무도 지나갈 수 없다.', { spd: -5 }),
  H('windhunter', '바람 사냥꾼', 5, 'dps',
    S('질풍 사격', '체력이 가장 적은 적부터 4번 연달아 쏴요.', 3, dmg('lowest', 0.6, { hits: 4 })),
    { shirt: 0x4a8a6a, hat: 0xd7eef8, hatStyle: 'feather', gun: 'windbow', glow: 0xd7f8e8 }, '바람이 부는 쪽에, 내 화살이 있다.', { spd: 20 }),

  // ── ★6: 좀비 생존자 전설 ──
  H('echo', '메아리술사', 6, 'support',
    S('메아리', '아군 전체의 다음 기본 공격이 2번 나가요.', 3, st('allies', 'echo', 2)),
    { shirt: 0x1f6f68, gun: 'fork', glow: 0x7fffd4 }, '네가 한 번 쏘면, 나는 한 번 더.'),
  H('wisp', '도깨비불 술사', 6, 'dps',
    S('도깨비불', '도깨비불이 무작위 적에게 4번 날아가요.', 3, dmg('random', 0.7, { hits: 4 })),
    { shirt: 0xf2efe6, gun: 'talisman', glow: 0x5fb0ff }, '불을 끄려 해 봐. 쫓아가는 건 불 쪽이니까.'),
  H('magnetist', '자력술사', 6, 'tank',
    S('밀어내기', '적 전체를 때리고 행동 게이지를 뒤로 밀어내요.', 3, dmg('all', 0.8), { t: 'gauge', target: 'all', v: -400 }),
    { shirt: 0xd8323c, gun: 'magnet', glow: 0xff6a6a }, '같은 극끼리는 만날 수 없지.'),
  H('clown', '폭탄 광대', 6, 'dps',
    S('튕기는 폭탄', '폭탄이 무작위 적에게 3번 튕기고, 튕길 때마다 20%씩 세져요.', 3, dmg('random', 0.9, { hits: 3, grow: 0.2 })),
    { shirt: 0xf4f4f4, gun: 'bomb', glow: 0xff4d6a }, '박수는 세 번째 폭발 뒤에.'),
  H('swamp', '늪지 마녀', 6, 'support',
    S('늪', '2턴 동안 적 전체를 느리게 하고 독에 빠뜨려요.', 3, st('all', 'slow', 2, 0.3), st('all', 'poison', 2, 0.5)),
    { shirt: 0x3a4a22, gun: 'broom', glow: 0x8acf4a }, '한 발짝만 더. 그다음은 늪이 알아서 해.'),
  // ── ★6: 좀비 생존자 신화 ──
  H('gravity', '중력 조종자', 6, 'dps',
    S('중력장', '적 전체를 한 점으로 끌어모아 짓눌러요.', 4, dmg('all', 1.6)),
    { shirt: 0x22184a, gun: 'orb', glow: 0x8a6cff }, '모든 것은 결국 한 점으로 떨어진다.'),
  H('demon', '악마 계약자', 6, 'dps',
    S('피의 계약', '적 하나를 크게 때려요. 아군 체력이 적을수록 최대 3배까지 세져요.', 3, { t: 'pact', mult: 2, max: 3 }),
    { shirt: 0x1a0e12, gun: 'scroll', glow: 0xff1f1f }, '대가는 이미 치렀다. 이제 내 차례.'),
  H('puppeteer', '꼭두각시 인형사', 6, 'support',
    S('조종', '적 하나를 1턴 동안 조종해서 다른 적을 공격하게 해요.', 4, st('one', 'charm', 1)),
    { shirt: 0x3a1a4a, gun: 'cross', glow: 0xd28aff }, '실 끝에 매달린 건 너희 쪽이야.'),
  H('timethief', '시간 도둑', 6, 'support',
    S('시간 정지', '적 전체를 1턴 멈추고, 2턴 동안 받는 피해를 30% 늘려요.', 4, st('all', 'freeze', 1), st('all', 'vuln', 2, 0.3)),
    { shirt: 0x1f4a5a, gun: 'watch', glow: 0x5fe0ff }, '1초면 충분해. 너희 1초는 내 거니까.'),
  H('plague', '역병 의사', 6, 'dps',
    S('전염', '적 하나에게 3턴 동안 역병을 걸어요. 역병에 걸린 적이 쓰러지면 다른 적에게 옮아요.', 3, st('one', 'poison', 3, 0.5, { spread: true })),
    { shirt: 0x22262c, gun: 'lantern', glow: 0x7fdc4a }, '한 마리면 충분하다. 나머지는 알아서 옮는다.'),
  H('mirror', '거울 기사', 6, 'tank',
    S('반사', '2턴 동안 적의 공격을 자기에게 모으고, 아군이 받은 피해의 절반을 되돌려줘요.', 3, st('self', 'taunt', 2), st('allies', 'reflect', 2, 0.5)),
    { shirt: 0x9fb8d0, gun: 'mirror', glow: 0xbfe9ff }, '네가 휘두른 그대로 돌려주지.'),
  H('dream', '꿈의 요정', 6, 'support',
    S('잠', '적 전체를 2턴 재워요. 잠든 적을 처음 때리면 3배 피해를 주고 깨워요.', 4, st('all', 'sleep', 2)),
    { shirt: 0xf2a8d8, gun: 'wand', glow: 0xffb8f0 }, '쉿, 착하지. 깰 때 조금 아플 거야.'),
  H('gambler', '운명의 도박사', 6, 'dps',
    S('주사위', '주사위를 굴려 나온 눈만큼 때려요. 6이 나오면 대박!', 2, { t: 'dice' }),
    { shirt: 0x2a5a3a, gun: 'dice', glow: 0xffd84a }, '인생은 한 판. 오늘은 6이 나올 것 같은데?'),
  H('executioner', '처형인', 6, 'dps',
    S('처형', '적 하나를 베어요. 체력이 30% 이하인 적은 단칼에 쓰러뜨려요(보스는 최대 체력의 15%).', 3, { t: 'execute', mult: 1.5, threshold: 0.3, bossPct: 0.15 }),
    { shirt: 0x2a2a30, gun: 'axe', glow: 0xc0c8d0 }, '마지막 한 칼은 언제나 내 몫이다.'),
  H('souls', '영혼 수집가', 6, 'dps',
    S('영혼 해방', '이번 전투에서 쓰러진 적이 많을수록 적 전체를 세게 때려요.', 3, { t: 'souls', base: 1.0, per: 0.6 }),
    { shirt: 0x2a3a3a, gun: 'jar', glow: 0x9fffd0 }, '쓰러진 자는 모두 내 병 속으로.'),
  H('dragon', '용 조련사', 6, 'dps',
    S('아기 용', '3턴 동안 아기 용이 매 턴 무작위 적에게 불을 뿜어요.', 4, st('self', 'dragon', 3, 0.6), dmg('one', 1.0)),
    { shirt: 0xc8202e, gun: 'horn', glow: 0xff8a3a }, '작아도 용이야. 불은 진짜라고.'),
  H('stone', '석화의 눈', 6, 'tank',
    S('석화', '적 하나를 2턴 동안 돌로 만들고, 적의 공격을 자기에게 모아요.', 3, st('one', 'stone', 2), st('self', 'taunt', 2)),
    { shirt: 0x6a7a5a, gun: 'shield', glow: 0xc9c2a0 }, '눈을 마주친 순간, 끝이야.'),
  H('shadowlord', '그림자 군주', 6, 'dps',
    S('그림자 칼날', '그림자 칼날이 적 전체를 2번 베어요.', 4, dmg('all', 0.9, { hits: 2 })),
    { shirt: 0x1a1424, gun: 'scepter', glow: 0x8a5cff }, '빛이 닿지 않는 곳은 전부 내 땅이다.'),
  H('phoenix', '불사조 기사', 6, 'tank',
    S('불꽃 일격', '적 하나를 불꽃 검으로 베고 2턴 동안 불태워요. (전투마다 한 번, 쓰러진 아군을 되살려요)', 3, dmg('one', 1.6), st('lastHit', 'burn', 2, 0.5)),
    { shirt: 0xe2582a, gun: 'flamesword', glow: 0xffa040 }, '재가 되어도, 다시 타오른다.', { passive: { k: 'phoenix', hp: 0.4 } }),
  H('tornado', '회오리 술사', 6, 'dps',
    S('회오리', '적 전체를 휩쓸고, 절반 확률로 행동 게이지를 날려 버려요.', 3, dmg('all', 1.1), { t: 'gauge', target: 'all', v: -1000, chance: 0.5 }),
    { shirt: 0x7a9ab0, gun: 'fan', glow: 0xd7eef8 }, '바람이 데려가는 곳이 너희 무덤이야.'),
  H('emperor', '죽음의 황제', 6, 'dps',
    S('죽음의 선고', '체력이 가장 많은 적 셋에게 선고를 내려요. 2턴 뒤 현재 체력의 30%가 사라져요(보스는 10%).', 4, { t: 'doom', count: 3, turns: 2, pct: 0.3, bossPct: 0.1 }),
    { shirt: 0x1a1020, gun: 'scepter', glow: 0x9a3aff }, '이름을 불렀다. 이제 끝이다.'),
  H('goldlord', '영원한 황금의 군주', 6, 'support',
    S('황금비', '적 전체에 황금비를 내리고, 이번 전투에서 얻는 골드를 2배로 만들어요.', 4, dmg('all', 1.0), { t: 'goldMul', v: 2 }),
    { shirt: 0xe8b923, gun: 'orb', glow: 0xffd84a }, '내 비에 젖는 자는 모두 금이 된다.'),

  // ── ★7 ──
  H('guardian', '영원한 황금의 수호신', 7, 'tank',
    S('황금 결계', '황금 창 5개를 무작위 적에게 꽂고, 아군 전체에 보호막을 둘러요. (아군이 받는 피해 -20%, 전투마다 한 번 모두를 되살리듯 회복)', 3,
      dmg('random', 0.9, { hits: 5 }), { t: 'shield', target: 'allies', mult: 1.5 }),
    { shirt: 0xfff0b0, gun: 'staff', glow: 0xffe066 }, '영원히. 이 결계가 서 있는 한.', { passive: { k: 'guardian', guard: 0.2, at: 0.2, heal: 0.3 } }),
];

export const HERO = Object.fromEntries(HEROES.map(h => [h.id, h]));
