// ============================================================
//  GAME CONFIGURATION
// ============================================================

const CANVAS_W = 900;
const CANVAS_H = 600;
const GAME_DURATION = 20 * 60; // 20 minutes in seconds
const TILE_SIZE = 40;

// ─── CHARACTERS ─────────────────────────────────────────────
const CHARACTERS = {
  sora: {
    id: 'sora',
    name: '소라',
    subtitle: '검사 ⚔️',
    color: '#4488ff',
    colorAlpha: 'rgba(68,136,255,0.18)',
    colorShadow: 'rgba(68,136,255,0.5)',
    hp: 140,
    speed: 95,
    hpRegen: 0.05,
    startWeapon: 'sword',
    passive: { atkMult: 1.25 },
    description: '강력한 근접 공격\n패시브: 공격력 +25%',
    stats: { hp: 5, spd: 3, atk: 5, def: 4 },
    skinColor: '#ffd0a0',
    hairColor: '#3366cc',
    eyeColor: '#44aaff',
  },
  mika: {
    id: 'mika',
    name: '미카',
    subtitle: '마법사 ✨',
    color: '#cc44ff',
    colorAlpha: 'rgba(204,68,255,0.18)',
    colorShadow: 'rgba(204,68,255,0.5)',
    hp: 80,
    speed: 88,
    hpRegen: 0.04,
    startWeapon: 'magicOrb',
    passive: { aoeMult: 1.3 },
    description: '광역 마법 공격\n패시브: 범위 +30%',
    stats: { hp: 2, spd: 3, atk: 5, def: 2 },
    skinColor: '#ffe0d0',
    hairColor: '#8833aa',
    eyeColor: '#ee66ff',
  },
  hana: {
    id: 'hana',
    name: '하나',
    subtitle: '궁수 🏹',
    color: '#44cc66',
    colorAlpha: 'rgba(68,204,102,0.18)',
    colorShadow: 'rgba(68,204,102,0.5)',
    hp: 95,
    speed: 118,
    hpRegen: 0.06,
    startWeapon: 'arrow',
    passive: { piercing: true },
    description: '빠른 원거리 공격\n패시브: 화살 관통',
    stats: { hp: 3, spd: 5, atk: 4, def: 2 },
    skinColor: '#ffd8b0',
    hairColor: '#228844',
    eyeColor: '#66ee88',
  },
  luna: {
    id: 'luna',
    name: '루나',
    subtitle: '총사 🔫',
    color: '#ff5566',
    colorAlpha: 'rgba(255,85,102,0.18)',
    colorShadow: 'rgba(255,85,102,0.5)',
    hp: 100,
    speed: 108,
    hpRegen: 0.05,
    startWeapon: 'bullet',
    passive: { cdMult: 0.78 },
    description: '연속 사격\n패시브: 쿨다운 -22%',
    stats: { hp: 3, spd: 4, atk: 4, def: 3 },
    skinColor: '#ffd0c0',
    hairColor: '#cc2244',
    eyeColor: '#ff4466',
  },
};

// ─── WEAPONS ────────────────────────────────────────────────
const WEAPON_DEFS = {
  sword: {
    id: 'sword', name: '검격', icon: '⚔️',
    desc: '주위 적을 베는 회전 공격',
    color: '#88ccff',
    maxLevel: 5,
    levels: [
      { damage: 22, cooldown: 1.1, range: 60, count: 4 },
      { damage: 30, cooldown: 1.0, range: 72, count: 5 },
      { damage: 40, cooldown: 0.9, range: 84, count: 6 },
      { damage: 52, cooldown: 0.8, range: 96, count: 7 },
      { damage: 70, cooldown: 0.7, range: 112, count: 8 },
    ],
    levelDescs: [
      '기본 회전 베기', '범위 확대', '데미지 증가', '다중 타격', '폭풍 참격'
    ],
  },
  magicOrb: {
    id: 'magicOrb', name: '마법 오브', icon: '🔮',
    desc: '주위를 공전하는 마법 구체',
    color: '#dd88ff',
    maxLevel: 5,
    levels: [
      { damage: 15, cooldown: 0.0, range: 70, count: 2, speed: 2.2 },
      { damage: 20, cooldown: 0.0, range: 80, count: 3, speed: 2.5 },
      { damage: 27, cooldown: 0.0, range: 90, count: 4, speed: 2.8 },
      { damage: 36, cooldown: 0.0, range: 104, count: 5, speed: 3.1 },
      { damage: 50, cooldown: 0.0, range: 120, count: 6, speed: 3.5 },
    ],
    levelDescs: [
      '2개 공전', '3개 공전', '4개 공전', '5개 공전', '6개 공전'
    ],
  },
  arrow: {
    id: 'arrow', name: '화살 연사', icon: '🏹',
    desc: '가장 가까운 적에게 화살 발사',
    color: '#88ffaa',
    maxLevel: 5,
    levels: [
      { damage: 18, cooldown: 0.85, count: 1, piercing: false, speed: 380 },
      { damage: 24, cooldown: 0.75, count: 2, piercing: false, speed: 400 },
      { damage: 32, cooldown: 0.65, count: 2, piercing: true,  speed: 420 },
      { damage: 42, cooldown: 0.55, count: 3, piercing: true,  speed: 440 },
      { damage: 56, cooldown: 0.45, count: 4, piercing: true,  speed: 480 },
    ],
    levelDescs: [
      '1발 발사', '2발 발사', '관통 해금', '3발 발사', '4발 폭풍 연사'
    ],
  },
  bullet: {
    id: 'bullet', name: '탄환 연사', icon: '🔫',
    desc: '빠른 속도로 탄환을 발사',
    color: '#ffaa44',
    maxLevel: 5,
    levels: [
      { damage: 12, cooldown: 0.45, count: 1, spread: 0, speed: 500 },
      { damage: 14, cooldown: 0.38, count: 2, spread: 0.08, speed: 520 },
      { damage: 17, cooldown: 0.32, count: 3, spread: 0.1, speed: 540 },
      { damage: 21, cooldown: 0.28, count: 4, spread: 0.12, speed: 560 },
      { damage: 28, cooldown: 0.22, count: 5, spread: 0.14, speed: 600 },
    ],
    levelDescs: [
      '단발', '더블샷', '트리플샷', '쿼드 버스트', '5연발 폭격'
    ],
  },
  thunder: {
    id: 'thunder', name: '번개', icon: '⚡',
    desc: '적을 향해 번개를 내리친다 (연쇄)',
    color: '#ffee44',
    maxLevel: 5,
    levels: [
      { damage: 35, cooldown: 2.0, count: 1, chain: 1 },
      { damage: 48, cooldown: 1.8, count: 1, chain: 2 },
      { damage: 64, cooldown: 1.6, count: 2, chain: 2 },
      { damage: 84, cooldown: 1.4, count: 2, chain: 3 },
      { damage: 110, cooldown: 1.1, count: 3, chain: 4 },
    ],
    levelDescs: [
      '번개 1발', '2연쇄', '2발 동시', '2발 3연쇄', '3발 4연쇄 폭풍'
    ],
  },
  holyWater: {
    id: 'holyWater', name: '성수', icon: '💧',
    desc: '바닥에 성수 웅덩이를 생성',
    color: '#44ddff',
    maxLevel: 5,
    levels: [
      { damage: 8, cooldown: 4.0, radius: 48, duration: 3.5 },
      { damage: 12, cooldown: 3.5, radius: 58, duration: 4.0 },
      { damage: 17, cooldown: 3.0, radius: 68, duration: 4.5 },
      { damage: 23, cooldown: 2.5, radius: 80, duration: 5.0 },
      { damage: 32, cooldown: 2.0, radius: 96, duration: 5.5 },
    ],
    levelDescs: [
      '작은 웅덩이', '넓어짐', '데미지 증가', '광역 확대', '성수 폭류'
    ],
  },
  explosion: {
    id: 'explosion', name: '폭발', icon: '💥',
    desc: '랜덤 위치에 폭발 생성',
    color: '#ff8844',
    maxLevel: 5,
    levels: [
      { damage: 45, cooldown: 3.5, radius: 55, count: 1 },
      { damage: 62, cooldown: 3.0, radius: 65, count: 1 },
      { damage: 82, cooldown: 2.5, radius: 75, count: 2 },
      { damage: 106, cooldown: 2.0, radius: 88, count: 2 },
      { damage: 140, cooldown: 1.5, radius: 104, count: 3 },
    ],
    levelDescs: [
      '1회 폭발', '폭발 확대', '2회 폭발', '강화 폭발', '3연 폭격'
    ],
  },
};

// ─── PASSIVE ITEMS ──────────────────────────────────────────
const ITEM_DEFS = {
  hpUp: {
    id: 'hpUp', name: '체력 강화', icon: '❤️',
    desc: '최대 체력 +20%',
    rarity: 'common',
    maxLevel: 4,
    apply: (p) => { p.maxHp *= 1.2; p.hp = Math.min(p.hp + p.maxHp * 0.2, p.maxHp); },
  },
  speedUp: {
    id: 'speedUp', name: '이동속도 강화', icon: '👟',
    desc: '이동속도 +12%',
    rarity: 'common',
    maxLevel: 4,
    apply: (p) => { p.speed *= 1.12; },
  },
  atkUp: {
    id: 'atkUp', name: '공격력 강화', icon: '💪',
    desc: '전체 공격력 +15%',
    rarity: 'rare',
    maxLevel: 5,
    apply: (p) => { p.atkMult *= 1.15; },
  },
  cdUp: {
    id: 'cdUp', name: '신속의 반지', icon: '💍',
    desc: '쿨다운 -10%',
    rarity: 'rare',
    maxLevel: 4,
    apply: (p) => { p.cdMult *= 0.90; },
  },
  aoeUp: {
    id: 'aoeUp', name: '범위 확장 룬', icon: '🌀',
    desc: '공격 범위 +15%',
    rarity: 'rare',
    maxLevel: 3,
    apply: (p) => { p.aoeMult *= 1.15; },
  },
  regen: {
    id: 'regen', name: '자연 회복', icon: '🌿',
    desc: 'HP 재생 +0.1/초',
    rarity: 'common',
    maxLevel: 4,
    apply: (p) => { p.hpRegen += 0.1; },
  },
  luck: {
    id: 'luck', name: '행운의 부적', icon: '🍀',
    desc: '경험치 흡수 범위 +25%',
    rarity: 'common',
    maxLevel: 3,
    apply: (p) => { p.xpRange *= 1.25; },
  },
  magnet: {
    id: 'magnet', name: '자석', icon: '🧲',
    desc: '경험치 자동 수집 범위 대폭 증가',
    rarity: 'epic',
    maxLevel: 2,
    apply: (p) => { p.xpRange *= 1.6; },
  },
  shield: {
    id: 'shield', name: '방어 오라', icon: '🛡️',
    desc: '피격 쿨타임 +0.5초 (무적 시간)',
    rarity: 'epic',
    maxLevel: 2,
    apply: (p) => { p.invincibleTime += 0.5; },
  },
};

// ─── ENEMIES ────────────────────────────────────────────────
const ENEMY_DEFS = {
  zombie: {
    id: 'zombie', name: '좀비', color: '#558855', size: 14,
    hp: 20, speed: 45, damage: 6, xp: 2,
    spawnWeight: 10,
  },
  bat: {
    id: 'bat', name: '박쥐', color: '#553366', size: 10,
    hp: 10, speed: 100, damage: 4, xp: 1,
    spawnWeight: 8,
  },
  golem: {
    id: 'golem', name: '골렘', color: '#887755', size: 22,
    hp: 120, speed: 30, damage: 14, xp: 8,
    spawnWeight: 3,
  },
  slime: {
    id: 'slime', name: '슬라임', color: '#44aa66', size: 13,
    hp: 30, speed: 55, damage: 8, xp: 3,
    spawnWeight: 6,
    onDeath: 'explode',
  },
  skeleton: {
    id: 'skeleton', name: '스켈레톤', color: '#cccc99', size: 15,
    hp: 45, speed: 65, damage: 10, xp: 5,
    spawnWeight: 5,
  },
  darkKnight: {
    id: 'darkKnight', name: '암흑기사', color: '#334466', size: 18,
    hp: 200, speed: 50, damage: 18, xp: 15,
    spawnWeight: 2,
  },
  boss: {
    id: 'boss', name: '보스', color: '#cc2233', size: 36,
    hp: 3000, speed: 40, damage: 30, xp: 100,
    spawnWeight: 0,
    isBoss: true,
  },
};

// ─── XP TABLE ───────────────────────────────────────────────
const XP_TABLE = [];
(function buildXpTable() {
  let base = 10;
  for (let i = 0; i < 60; i++) {
    XP_TABLE.push(Math.floor(base));
    base *= 1.12;
  }
})();

// ─── WORLD ──────────────────────────────────────────────────
const WORLD_W = 3200;
const WORLD_H = 3200;
