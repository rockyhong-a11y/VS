// ============================================================
//  GAME CONFIGURATION
// ============================================================

const CANVAS_W = 900;
const CANVAS_H = 600;
const GAME_DURATION = 20 * 60; // 20 minutes in seconds
const TILE_SIZE = 40;

// ─── CHARACTERS ─────────────────────────────────────────────
// Sprite-based: spriteId maps to CHAR_SPRITE_MAP in sprites.js
const CHARACTERS = {
  antonio: {
    id: 'antonio', spriteId: 'antonio',
    name: '뽀끄루', subtitle: '대마왕 🌀',
    color: '#c83848',
    colorAlpha: 'rgba(200,56,72,0.2)', colorShadow: 'rgba(200,56,72,0.5)',
    hp: 130, speed: 100, hpRegen: 0.05,
    startWeapon: 'whip', passive: { atkMult: 1.22 },
    description: '채찍으로 적을 휩쓸기\n패시브: 공격력 +22%',
    stats: { hp: 4, spd: 4, atk: 5, def: 3 },
  },
  imelda: {
    id: 'imelda', spriteId: 'imelda',
    name: '레프리콘', subtitle: 'T-3 ✨',
    color: '#f2a6b8',
    colorAlpha: 'rgba(242,166,184,0.2)', colorShadow: 'rgba(242,166,184,0.5)',
    hp: 95, speed: 95, hpRegen: 0.05,
    startWeapon: 'magicWand', passive: { atkMult: 1.15, cdMult: 0.92 },
    description: '마법봉 자동 발사\n패시브: 공격+쿨다운 강화',
    stats: { hp: 3, spd: 3, atk: 5, def: 3 },
  },
  pasqualina: {
    id: 'pasqualina', spriteId: 'pasqualina',
    name: '불굴의 마리', subtitle: '룬 추적자 🔷',
    color: '#e8b8c4',
    colorAlpha: 'rgba(232,184,196,0.2)', colorShadow: 'rgba(232,184,196,0.5)',
    hp: 90, speed: 102, hpRegen: 0.05,
    startWeapon: 'runetracer', passive: { aoeMult: 1.25 },
    description: '반사하는 룬 단검\n패시브: 범위 +25%',
    stats: { hp: 3, spd: 4, atk: 4, def: 3 },
  },
  gennaro: {
    id: 'gennaro', spriteId: 'gennaro',
    name: '천아', subtitle: '여왕의 사냥개 🔫',
    color: '#f2a6b8',
    colorAlpha: 'rgba(242,166,184,0.2)', colorShadow: 'rgba(242,166,184,0.5)',
    hp: 105, speed: 108, hpRegen: 0.05,
    startWeapon: 'gun', passive: { cdMult: 0.78 },
    description: '연속 사격\n패시브: 쿨다운 -22%',
    stats: { hp: 3, spd: 5, atk: 4, def: 3 },
  },
  arca: {
    id: 'arca', spriteId: 'arca',
    name: '라미엘', subtitle: '고행의 천사 🔥',
    color: '#ff6622',
    colorAlpha: 'rgba(255,102,34,0.2)', colorShadow: 'rgba(255,102,34,0.5)',
    hp: 100, speed: 100, hpRegen: 0.05,
    startWeapon: 'fireWand', passive: { atkMult: 1.28 },
    description: '폭발하는 화염 투사체\n패시브: 공격력 +28%',
    stats: { hp: 3, spd: 4, atk: 5, def: 3 },
  },
  porta: {
    id: 'porta', spriteId: 'porta',
    name: '레아', subtitle: '오베로니아 ⚡',
    color: '#9966ff',
    colorAlpha: 'rgba(153,102,255,0.2)', colorShadow: 'rgba(153,102,255,0.5)',
    hp: 95, speed: 98, hpRegen: 0.05,
    startWeapon: 'lightningRing', passive: { aoeMult: 1.3 },
    description: '번개가 무작위 적 강타\n패시브: 범위 +30%',
    stats: { hp: 3, spd: 3, atk: 5, def: 3 },
  },
  poe: {
    id: 'poe', spriteId: 'poe',
    name: '드라큐리나', subtitle: '마늘의 사제 🧄',
    color: '#c83848',
    colorAlpha: 'rgba(200,56,72,0.2)', colorShadow: 'rgba(200,56,72,0.5)',
    hp: 140, speed: 96, hpRegen: 0.05,
    startWeapon: 'garlic', passive: { aoeMult: 1.35, hpRegenBonus: 0.15 },
    description: '마늘 오라\n패시브: 범위 +35% / 재생',
    stats: { hp: 5, spd: 3, atk: 3, def: 5 },
  },
  clerici: {
    id: 'clerici', spriteId: 'clerici',
    name: '알딸딸 키르케', subtitle: '성수술사 💧',
    color: '#64b878',
    colorAlpha: 'rgba(100,184,120,0.2)', colorShadow: 'rgba(100,184,120,0.5)',
    hp: 110, speed: 100, hpRegen: 0.05,
    startWeapon: 'holyWater', passive: { aoeMult: 1.25 },
    description: '바닥에 성수 웅덩이\n패시브: 범위 +25%',
    stats: { hp: 4, spd: 3, atk: 4, def: 4 },
  },
  dommario: {
    id: 'dommario', spriteId: 'dommario',
    name: '네오딤', subtitle: '성경술사 📖',
    color: '#e0c464',
    colorAlpha: 'rgba(224,196,100,0.2)', colorShadow: 'rgba(224,196,100,0.5)',
    hp: 115, speed: 100, hpRegen: 0.05,
    startWeapon: 'kingBible', passive: { aoeMult: 1.3 },
    description: '공전하는 성스러운 책\n패시브: 범위 +30%',
    stats: { hp: 4, spd: 3, atk: 4, def: 4 },
  },
  mortaccio: {
    id: 'mortaccio', spriteId: 'mortaccio',
    name: '펜리르', subtitle: '뼈술사 🦴',
    color: '#e8b8c4',
    colorAlpha: 'rgba(232,184,196,0.2)', colorShadow: 'rgba(232,184,196,0.5)',
    hp: 110, speed: 100, hpRegen: 0.05,
    startWeapon: 'bone', passive: { atkMult: 1.2 },
    description: '부메랑 뼈 던지기\n패시브: 공격력 +20%',
    stats: { hp: 4, spd: 4, atk: 4, def: 4 },
  },
  krochi: {
    id: 'krochi', spriteId: 'krochi',
    name: '소완', subtitle: '요리사 ✝️',
    color: '#4488cc',
    colorAlpha: 'rgba(68,136,204,0.2)', colorShadow: 'rgba(68,136,204,0.5)',
    hp: 100, speed: 115, hpRegen: 0.05,
    startWeapon: 'cross', passive: { cdMult: 0.82 },
    description: '돌아오는 십자가\n패시브: 쿨다운 -18%',
    stats: { hp: 3, spd: 5, atk: 5, def: 3 },
  },
  cavallo: {
    id: 'cavallo', spriteId: 'cavallo',
    name: '야타 카발로', subtitle: '폭탄술사 💣',
    color: '#c83848',
    colorAlpha: 'rgba(200,56,72,0.2)', colorShadow: 'rgba(200,56,72,0.5)',
    hp: 100, speed: 104, hpRegen: 0.05,
    startWeapon: 'cherryBomb', passive: { aoeMult: 1.4 },
    description: '튀는 체리 폭탄\n패시브: 범위 +40%',
    stats: { hp: 3, spd: 4, atk: 5, def: 3 },
  },
  lama: {
    id: 'lama', spriteId: 'lama',
    name: '라마 라돈나', subtitle: '흑익술사 🐦',
    color: '#8866cc',
    colorAlpha: 'rgba(136,102,204,0.2)', colorShadow: 'rgba(136,102,204,0.5)',
    hp: 105, speed: 106, hpRegen: 0.05,
    startWeapon: 'ebonyWings', passive: { atkMult: 1.2, cdMult: 0.88 },
    description: '공전하는 까마귀\n패시브: 공격력+쿨다운',
    stats: { hp: 3, spd: 4, atk: 4, def: 3 },
  },
  exdash: {
    id: 'exdash', spriteId: 'exdash',
    name: '무적의 용', subtitle: '비밀 캐릭터 🐲',
    color: '#44ddaa',
    colorAlpha: 'rgba(68,221,170,0.2)', colorShadow: 'rgba(68,221,170,0.5)',
    hp: 80, speed: 130, hpRegen: 0.05,
    startWeapon: 'magicWand', passive: { cdMult: 0.85, atkMult: 1.18 },
    description: '초고속 마법봉 연사\n패시브: 공격+쿨다운',
    stats: { hp: 2, spd: 5, atk: 5, def: 2 },
  },
  seika: {
    id: 'seika', spriteId: 'seika',
    name: '세이카', subtitle: '검술사 ⚔️',
    color: '#4488cc',
    colorAlpha: 'rgba(68,136,204,0.2)', colorShadow: 'rgba(68,136,204,0.5)',
    hp: 120, speed: 112, hpRegen: 0.05,
    startWeapon: 'sword', passive: { atkMult: 1.25, cdMult: 0.9 },
    description: '회전 베기 난무\n패시브: 공격력 +25%',
    stats: { hp: 4, spd: 4, atk: 5, def: 4 },
  },
  noa: {
    id: 'noa', spriteId: 'noa',
    name: '노아', subtitle: '오브술사 🔮',
    color: '#dd88ff',
    colorAlpha: 'rgba(221,136,255,0.2)', colorShadow: 'rgba(221,136,255,0.5)',
    hp: 90, speed: 98, hpRegen: 0.08,
    startWeapon: 'magicOrb', passive: { aoeMult: 1.4, hpRegenBonus: 0.1 },
    description: '공전하는 마법 구체\n패시브: 범위 +40%',
    stats: { hp: 3, spd: 3, atk: 4, def: 4 },
  },
};

// ─── WEAPONS ────────────────────────────────────────────────
const WEAPON_DEFS = {
  // === NEW: WHIP (directional horizontal slash) ===
  whip: {
    id: 'whip', name: '채찍', icon: '🌀',
    desc: '좌우로 휩쓰는 채찍',
    color: '#ff88aa',
    maxLevel: 5,
    levels: [
      { damage: 25, cooldown: 1.2, length: 120, width: 26, count: 1 },
      { damage: 32, cooldown: 1.1, length: 140, width: 30, count: 2 },
      { damage: 42, cooldown: 1.0, length: 160, width: 34, count: 2 },
      { damage: 55, cooldown: 0.9, length: 180, width: 38, count: 3 },
      { damage: 75, cooldown: 0.8, length: 200, width: 42, count: 4 },
    ],
    levelDescs: ['양방향', '2연타', '범위 확대', '3연타', '4연타 폭풍'],
  },
  // === NEW: MAGIC WAND (arrow variant — slow homing) ===
  magicWand: {
    id: 'magicWand', name: '마법봉', icon: '🪄',
    desc: '가장 가까운 적 자동 추적',
    color: '#88ccff',
    maxLevel: 5,
    levels: [
      { damage: 20, cooldown: 1.2, count: 1, speed: 300 },
      { damage: 25, cooldown: 1.0, count: 1, speed: 320 },
      { damage: 32, cooldown: 0.85, count: 2, speed: 340 },
      { damage: 42, cooldown: 0.7, count: 2, speed: 360 },
      { damage: 56, cooldown: 0.55, count: 3, speed: 400 },
    ],
    levelDescs: ['기본', '쿨다운↓', '2발', '강화', '3발 폭풍'],
  },
  // === NEW: RUNETRACER (bouncing piercing square) ===
  runetracer: {
    id: 'runetracer', name: '룬 단검', icon: '🔷',
    desc: '벽에 반사되는 관통 단검',
    color: '#66ddff',
    maxLevel: 5,
    levels: [
      { damage: 18, cooldown: 1.8, count: 1, speed: 260, bounces: 3, lifetime: 3 },
      { damage: 24, cooldown: 1.6, count: 2, speed: 280, bounces: 4, lifetime: 3.5 },
      { damage: 32, cooldown: 1.4, count: 2, speed: 300, bounces: 5, lifetime: 4 },
      { damage: 42, cooldown: 1.2, count: 3, speed: 320, bounces: 6, lifetime: 4.5 },
      { damage: 56, cooldown: 1.0, count: 4, speed: 340, bounces: 7, lifetime: 5 },
    ],
    levelDescs: ['1발', '2발', '반사 강화', '3발', '4발 난무'],
  },
  // === GUN (renamed from bullet) ===
  gun: {
    id: 'gun', name: '총', icon: '🔫',
    desc: '빠른 연속 사격',
    color: '#ffaa44',
    maxLevel: 5,
    levels: [
      { damage: 12, cooldown: 0.45, count: 1, spread: 0, speed: 500 },
      { damage: 14, cooldown: 0.38, count: 2, spread: 0.08, speed: 520 },
      { damage: 17, cooldown: 0.32, count: 3, spread: 0.1, speed: 540 },
      { damage: 21, cooldown: 0.28, count: 4, spread: 0.12, speed: 560 },
      { damage: 28, cooldown: 0.22, count: 5, spread: 0.14, speed: 600 },
    ],
    levelDescs: ['단발', '더블샷', '트리플샷', '쿼드 버스트', '5연발 폭격'],
  },
  // === NEW: FIRE WAND (explosive projectile) ===
  fireWand: {
    id: 'fireWand', name: '화염봉', icon: '🔥',
    desc: '명중 시 폭발하는 화염탄',
    color: '#ff6622',
    maxLevel: 5,
    levels: [
      { damage: 22, cooldown: 1.4, count: 1, speed: 280, explosionRadius: 40 },
      { damage: 30, cooldown: 1.25, count: 1, speed: 300, explosionRadius: 48 },
      { damage: 42, cooldown: 1.1, count: 2, speed: 320, explosionRadius: 56 },
      { damage: 56, cooldown: 0.95, count: 2, speed: 340, explosionRadius: 66 },
      { damage: 78, cooldown: 0.8, count: 3, speed: 380, explosionRadius: 80 },
    ],
    levelDescs: ['단발 폭발', '폭발 강화', '2발', '범위↑', '3발 지옥불'],
  },
  // === NEW: GARLIC (passive damage aura) ===
  garlic: {
    id: 'garlic', name: '마늘', icon: '🧄',
    desc: '주위 적에게 지속 피해',
    color: '#d8e0a0',
    maxLevel: 5,
    levels: [
      { damage: 10, cooldown: 0.0, radius: 70,  tickRate: 0.5 },
      { damage: 14, cooldown: 0.0, radius: 85,  tickRate: 0.45 },
      { damage: 20, cooldown: 0.0, radius: 100, tickRate: 0.4 },
      { damage: 28, cooldown: 0.0, radius: 120, tickRate: 0.35 },
      { damage: 40, cooldown: 0.0, radius: 145, tickRate: 0.3 },
    ],
    levelDescs: ['기본 오라', '범위↑', '피해↑', '광역', '전설의 마늘'],
  },
  // === NEW: CROSS (boomerang) ===
  cross: {
    id: 'cross', name: '십자가', icon: '✝️',
    desc: '나갔다 돌아오는 십자가',
    color: '#ffdd88',
    maxLevel: 5,
    levels: [
      { damage: 26, cooldown: 1.3, count: 1, speed: 320, range: 180 },
      { damage: 34, cooldown: 1.15, count: 1, speed: 340, range: 210 },
      { damage: 44, cooldown: 1.0, count: 2, speed: 360, range: 240 },
      { damage: 58, cooldown: 0.9, count: 2, speed: 380, range: 270 },
      { damage: 76, cooldown: 0.75, count: 3, speed: 420, range: 300 },
    ],
    levelDescs: ['부메랑', '사거리↑', '2개', '강화', '3개 난사'],
  },
  // === NEW: BONE (arc boomerang) ===
  bone: {
    id: 'bone', name: '뼈', icon: '🦴',
    desc: '포물선으로 던지는 뼈',
    color: '#f0e8d4',
    maxLevel: 5,
    levels: [
      { damage: 24, cooldown: 1.1, count: 1, speed: 280, range: 160 },
      { damage: 30, cooldown: 1.0, count: 2, speed: 300, range: 180 },
      { damage: 40, cooldown: 0.9, count: 2, speed: 320, range: 200 },
      { damage: 52, cooldown: 0.8, count: 3, speed: 340, range: 220 },
      { damage: 70, cooldown: 0.7, count: 4, speed: 360, range: 250 },
    ],
    levelDescs: ['기본', '2개', '사거리↑', '3개', '4개 뼈바람'],
  },
  // === NEW: CHERRY BOMB (bouncing explosion) ===
  cherryBomb: {
    id: 'cherryBomb', name: '체리 폭탄', icon: '💣',
    desc: '튀다 폭발하는 폭탄',
    color: '#ff4466',
    maxLevel: 5,
    levels: [
      { damage: 50, cooldown: 2.5, count: 1, speed: 240, bounces: 2, radius: 70 },
      { damage: 66, cooldown: 2.2, count: 1, speed: 260, bounces: 3, radius: 80 },
      { damage: 88, cooldown: 1.9, count: 2, speed: 280, bounces: 3, radius: 90 },
      { damage: 116, cooldown: 1.6, count: 2, speed: 300, bounces: 4, radius: 105 },
      { damage: 150, cooldown: 1.3, count: 3, speed: 320, bounces: 4, radius: 120 },
    ],
    levelDescs: ['단발', '범위↑', '2개', '강화', '3개 대폭격'],
  },
  // === NEW: EBONY WINGS (orbital birds) ===
  ebonyWings: {
    id: 'ebonyWings', name: '흑익', icon: '🐦',
    desc: '주위를 도는 까마귀',
    color: '#8866cc',
    maxLevel: 5,
    levels: [
      { damage: 14, cooldown: 0.0, range: 80,  count: 2, speed: 2.8 },
      { damage: 19, cooldown: 0.0, range: 90,  count: 3, speed: 3.0 },
      { damage: 26, cooldown: 0.0, range: 100, count: 4, speed: 3.2 },
      { damage: 36, cooldown: 0.0, range: 115, count: 5, speed: 3.5 },
      { damage: 50, cooldown: 0.0, range: 130, count: 6, speed: 4.0 },
    ],
    levelDescs: ['2마리', '3마리', '4마리', '5마리', '6마리 대군'],
  },
  // === LIGHTNING RING (renamed from thunder) ===
  lightningRing: {
    id: 'lightningRing', name: '번개 고리', icon: '⚡',
    desc: '무작위 적에게 번개 강타',
    color: '#ffee44',
    maxLevel: 5,
    levels: [
      { damage: 35, cooldown: 2.0, count: 1, chain: 1 },
      { damage: 48, cooldown: 1.8, count: 1, chain: 2 },
      { damage: 64, cooldown: 1.6, count: 2, chain: 2 },
      { damage: 84, cooldown: 1.4, count: 2, chain: 3 },
      { damage: 110, cooldown: 1.1, count: 3, chain: 4 },
    ],
    levelDescs: ['1발', '2연쇄', '2발', '2발 3연쇄', '3발 4연쇄'],
  },
  // === KING BIBLE (renamed from magicOrb) ===
  kingBible: {
    id: 'kingBible', name: '성경', icon: '📖',
    desc: '주위를 공전하는 성스러운 책',
    color: '#ffdd88',
    maxLevel: 5,
    levels: [
      { damage: 16, cooldown: 0.0, range: 70, count: 2, speed: 2.2 },
      { damage: 22, cooldown: 0.0, range: 80, count: 3, speed: 2.5 },
      { damage: 30, cooldown: 0.0, range: 90, count: 4, speed: 2.8 },
      { damage: 40, cooldown: 0.0, range: 105, count: 5, speed: 3.1 },
      { damage: 54, cooldown: 0.0, range: 120, count: 6, speed: 3.5 },
    ],
    levelDescs: ['2권', '3권', '4권', '5권', '6권 성경'],
  },
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
