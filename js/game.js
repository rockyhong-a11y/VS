// ============================================================
//  MAIN GAME LOGIC
// ============================================================

const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const renderer = new Renderer(canvas);
const ctx = canvas.getContext('2d');

// ─── INPUT ──────────────────────────────────────────────────
const keys = {};
const joystick = { active: false, dx: 0, dy: 0 };
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup',   e => { keys[e.code] = false; });

// Touch detection
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice) document.body.classList.add('is-touch');

// Virtual joystick
(function setupJoystick() {
  const pad = document.getElementById('joystick');
  const knob = document.getElementById('joystickKnob');
  if (!pad) return;
  let touchId = null;
  const MAX = 45;

  function start(e) {
    e.preventDefault();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    touchId = e.changedTouches ? t.identifier : 'mouse';
    joystick.active = true;
    move(e);
  }
  function move(e) {
    if (!joystick.active) return;
    e.preventDefault();
    let t;
    if (e.changedTouches) {
      for (const ct of e.changedTouches) if (ct.identifier === touchId) { t = ct; break; }
      if (!t) return;
    } else t = e;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len > MAX) { dx = dx/len*MAX; dy = dy/len*MAX; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const deadzone = 8;
    if (len < deadzone) { joystick.dx = 0; joystick.dy = 0; }
    else { joystick.dx = dx / MAX; joystick.dy = dy / MAX; }
  }
  function end(e) {
    if (e.changedTouches) {
      let match = false;
      for (const ct of e.changedTouches) if (ct.identifier === touchId) match = true;
      if (!match) return;
    }
    joystick.active = false;
    joystick.dx = 0; joystick.dy = 0;
    knob.style.transform = 'translate(0, 0)';
    touchId = null;
  }
  pad.addEventListener('touchstart', start, { passive: false });
  pad.addEventListener('touchmove', move, { passive: false });
  pad.addEventListener('touchend', end);
  pad.addEventListener('touchcancel', end);
  pad.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
})();

// Canvas responsive scaling (CSS size only, keep internal resolution)
function fitCanvas() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ratio = CANVAS_W / CANVAS_H; // 1.5 (landscape)

  if (isPortrait) {
    // 세로 모드: 화면 전체 높이를 채움. 가로는 비율 유지(화면보다 넓어지면 양옆 클리핑)
    const h = vh;
    const w = Math.round(h * ratio);
    canvas.style.width    = w + 'px';
    canvas.style.height   = h + 'px';
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = Math.round((vw - w) / 2) + 'px';
  } else {
    // 가로 모드: 비율 유지하며 뷰포트에 맞춤
    canvas.style.position = '';
    canvas.style.top      = '';
    canvas.style.left     = '';
    let w = vw, h = Math.round(vw / ratio);
    if (h > vh) { h = vh; w = Math.round(vh * ratio); }
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
  }
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 200));
fitCanvas();

// ─── GAME STATE ─────────────────────────────────────────────
let G = null; // current game state
let screen = 'charSelect'; // 'charSelect' | 'playing' | 'levelUp' | 'dead' | 'win'
let selectedCharId = null;
let animFrameId = null;

// ─── PARTICLES & FX ─────────────────────────────────────────
class Particle {
  constructor() { this.reset(); }
  reset(x=0, y=0, vx=0, vy=0, color='#fff', size=3, life=0.5) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.color=color; this.size=size;
    this.life=life; this.maxLife=life; this.alpha=1;
    return this;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 60 * dt;
    this.life -= dt;
    this.alpha = this.life / this.maxLife;
    this.size *= 0.98;
    return this.life > 0;
  }
}

class DmgNumber {
  constructor(x, y, value, crit, color) {
    this.x = x; this.y = y; this.value = value;
    this.crit = crit; this.color = color;
    this.vy = -60 - Math.random() * 30;
    this.life = 0.9; this.maxLife = 0.9; this.alpha = 1;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.92;
    this.life -= dt;
    this.alpha = Math.min(1, this.life / this.maxLife * 2);
    return this.life > 0;
  }
}

const particles = [];
const dmgNumbers = [];
let screenShake = { x: 0, y: 0, power: 0, timer: 0 };

// Performance caps
const MAX_PARTICLES    = 100;
const MAX_DMG_NUMBERS  = 20;
const MAX_ENEMIES      = 100;
const MAX_PROJECTILES  = 80;
const MAX_XP_GEMS      = 50;
const MAX_AREA_EFFECTS = 16;

// ── 게임 전역 설정 ─────────────────────────────────────────
const ZOOM         = 0.67;   // PC 가로 모드 줌
const ZOOM_PORTRAIT = 0.40;  // 모바일 세로 모드: 50% 줌아웃 (더 넓게)
const GAME_SPEED_MULT = 1.2; // 게임 속도 배율

function spawnParticles(wx, wy, color, count, speed = 80) {
  // Respect cap — drop oldest
  const budget = MAX_PARTICLES - particles.length;
  if (budget <= 0) return;
  count = Math.min(count, budget);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = speed * (0.5 + Math.random() * 0.8);
    const p = new Particle();
    p.reset(wx, wy, Math.cos(angle)*sp, Math.sin(angle)*sp - 40,
            color, 2 + Math.random()*3, 0.3 + Math.random()*0.5);
    particles.push(p);
  }
}

function pushDmgNumber(dn) {
  if (dmgNumbers.length >= MAX_DMG_NUMBERS) dmgNumbers.shift();
  dmgNumbers.push(dn);
}

function addScreenShake(power) {
  screenShake.power = Math.max(screenShake.power, power);
  screenShake.timer = 0.25;
}

// ─── PLAYER ─────────────────────────────────────────────────
class Player {
  constructor(charId) {
    this.charId = charId;
    this.def = CHARACTERS[charId];
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.speed = this.def.speed * 1.2; // 이동속도 +20%
    this.hpRegen = this.def.hpRegen;
    this.atkMult = this.def.passive.atkMult || 1.0;
    this.cdMult = this.def.passive.cdMult || 1.0;
    this.aoeMult = this.def.passive.aoeMult || 1.0;
    this.xpRange = 110;
    this.invincibleTime = 1.0;
    this.invTimer = 0;
    this.frame = 0;
    this.facing = 1;
    this.moveX = 0; this.moveY = 0;
    this.weapons = [];
    this.items = [];
    this.itemLevels = {};

    // Add starting weapon
    this._addWeapon(this.def.startWeapon);
  }

  _addWeapon(id) {
    this.weapons.push({
      def: WEAPON_DEFS[id],
      level: 1,
      cooldownTimer: 0,
      orbAngle: 0,
    });
  }

  hasWeapon(id) { return this.weapons.some(w => w.def.id === id); }
  getWeapon(id) { return this.weapons.find(w => w.def.id === id); }

  get alive() { return this.hp > 0; }

  takeDamage(dmg) {
    if (this.invTimer > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.invTimer = this.invincibleTime;
    addScreenShake(dmg * 0.3);
    spawnParticles(this.x, this.y, '#ff4444', 6, 60);
  }

  update(dt, enemies) {
    this.frame += dt;

    // Movement (keyboard + joystick)
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
    if (joystick.active && (joystick.dx || joystick.dy)) {
      dx = joystick.dx; dy = joystick.dy;
    }
    const mag = Math.sqrt(dx*dx + dy*dy);
    if (mag > 0) {
      const speedScale = Math.min(mag, 1);
      const nx = dx / mag, ny = dy / mag;
      this.x = clamp(this.x + nx * this.speed * speedScale * dt, 0, WORLD_W);
      this.y = clamp(this.y + ny * this.speed * speedScale * dt, 0, WORLD_H);
      if (nx !== 0) this.facing = nx > 0 ? 1 : -1;
    }
    this.moveX = dx; this.moveY = dy;

    // Invincibility
    if (this.invTimer > 0) this.invTimer -= dt;

    // HP regen
    this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);

    // Update weapon cooldowns & orb angles
    for (const w of this.weapons) {
      if (w.cooldownTimer > 0) w.cooldownTimer -= dt;
      if (w.def.id === 'magicOrb' || w.def.id === 'kingBible' || w.def.id === 'ebonyWings') {
        const lvl = w.def.levels[w.level - 1];
        w.orbAngle = (w.orbAngle || 0) + lvl.speed * dt;
      }
    }

    // XP pickup. If too many gems accumulated, attract nearest ones toward player.
    if (G) {
      const rangeSq = this.xpRange * this.xpRange;
      const overflow = G.xpGems.length > MAX_XP_GEMS;
      for (let i = G.xpGems.length - 1; i >= 0; i--) {
        const gem = G.xpGems[i];
        const dSq = distSq(this.x, this.y, gem.x, gem.y);
        if (dSq < rangeSq) {
          G.gainXp(gem.value);
          spawnParticles(gem.x, gem.y, '#88ffaa', 2, 40);
          G.xpGems.splice(i, 1);
        } else if (overflow) {
          // Pull toward player so they can be collected
          const d = Math.sqrt(dSq) || 1;
          gem.x += (this.x - gem.x) / d * 220 * dt;
          gem.y += (this.y - gem.y) / d * 220 * dt;
        }
      }
    }
  }
}

// ─── ENEMY ──────────────────────────────────────────────────
class Enemy {
  constructor(defId, x, y, difficulty) {
    this.def = ENEMY_DEFS[defId];
    this.x = x; this.y = y;
    const scale = 1 + difficulty * 0.12;
    this.hp = this.def.hp * scale;
    this.maxHp = this.hp;
    this.speed = this.def.speed * (1 + difficulty * 0.05);
    this.damage = this.def.damage * (1 + difficulty * 0.1);
    this.xp = this.def.xp;
    this.isBoss = !!this.def.isBoss;
    this.flashTimer = 0;
    this.alive = true;
    this.id = Math.random();
  }

  update(dt, px, py) {
    const d = normalize(px - this.x, py - this.y);
    this.x += d.x * this.speed * dt;
    this.y += d.y * this.speed * dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.flashTimer = 0.08;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
}

// ─── XP GEM ─────────────────────────────────────────────────
class XpGem {
  constructor(x, y, value) {
    this.x = x; this.y = y; this.value = value;
    this.pulseT = Math.random() * Math.PI * 2;
  }
  update(dt) { this.pulseT += dt; }
}

// ─── AREA EFFECT ────────────────────────────────────────────
class AreaEffect {
  constructor(x, y, radius, damage, color, type, duration, tickRate = 0.5) {
    this.x = x; this.y = y;
    this.radius = radius; this.damage = damage;
    this.color = color; this.type = type;
    this.duration = duration; this.timer = duration;
    this.tickRate = tickRate; this.tickTimer = 0;
    this.alpha = 0.7;
    this.startAngle = 0; this.endAngle = 0; // for sword slash
  }
  update(dt) {
    this.timer -= dt;
    this.alpha = (this.timer / this.duration) * 0.7;
    this.tickTimer -= dt;
    return this.timer > 0;
  }
  canTick() {
    if (this.tickTimer <= 0) { this.tickTimer = this.tickRate; return true; }
    return false;
  }
}

// ─── PROJECTILE ─────────────────────────────────────────────
class Projectile {
  constructor(x, y, vx, vy, damage, color, type, radius, piercing) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.damage = damage; this.color = color;
    this.type = type; this.radius = radius;
    this.piercing = piercing;
    this.angle = Math.atan2(vy, vx);
    this.alive = true;
    this.hitIds = new Set();
    this.lifetime = 2.5;
  }
  update(dt, game) {
    // BOOMERANG (cross, bone): go out, then return to player
    if (this.boomerang) {
      this.spin = (this.spin || 0) + dt * 18;
      const p = game.player;
      if (!this.returning) {
        const dx = this.x - this.originX, dy = this.y - this.originY;
        if (dx*dx + dy*dy > this.maxRange * this.maxRange) this.returning = true;
      }
      if (this.returning) {
        const dx = p.x - this.x, dy = p.y - this.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 20) { this.alive = false; return; }
        const sp = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        this.vx = dx / d * sp; this.vy = dy / d * sp;
        // Re-hit enemies on return
        this.hitIds.clear();
      }
    }

    // BOUNCY (cherryBomb): bounce off world edges, explode when done
    if (this.bouncy) {
      this.spin = (this.spin || 0) + dt * 10;
      // Ground drag
      this.vx *= (1 - dt * 0.6);
      this.vy *= (1 - dt * 0.6);
    }

    // RUNETRACER: bounce off world edges, counts down
    if (this.bounces !== undefined && this.bounces > 0) {
      if (this.x < 0 || this.x > WORLD_W) { this.vx = -this.vx; this.bounces--; }
      if (this.y < 0 || this.y > WORLD_H) { this.vy = -this.vy; this.bounces--; }
      this.x = clamp(this.x, 0, WORLD_W);
      this.y = clamp(this.y, 0, WORLD_H);
    } else if (this.bouncy) {
      if (this.x < 0 || this.x > WORLD_W) {
        this.vx = -this.vx * 0.8;
        if (this.bouncesLeft-- <= 0) this._explode(game);
      }
      if (this.y < 0 || this.y > WORLD_H) {
        this.vy = -this.vy * 0.8;
        if (this.bouncesLeft-- <= 0) this._explode(game);
      }
      this.x = clamp(this.x, 0, WORLD_W);
      this.y = clamp(this.y, 0, WORLD_H);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      if (this.bouncy && !this._exploded) this._explode(game);
      this.alive = false;
    }
    if (!this.boomerang &&
        (this.x < -200 || this.x > WORLD_W + 200 || this.y < -200 || this.y > WORLD_H + 200))
      this.alive = false;
  }
  _explode(game) {
    if (this._exploded) return;
    this._exploded = true;
    const eff = new AreaEffect(this.x, this.y, this.explosionRadius, this.explosionDamage, '#ff6633', 'explosion', 0.5, 999);
    if (game.areaEffects.length >= MAX_AREA_EFFECTS) game.areaEffects.shift();
    game.areaEffects.push(eff);
    // instant damage
    for (const e of game.enemies) {
      if (e.alive && dist(this.x, this.y, e.x, e.y) <= this.explosionRadius) {
        game._dealDamage(e, this.explosionDamage, e.x, e.y);
      }
    }
    spawnParticles(this.x, this.y, '#ff6633', 14, 180);
    screenShake.power = 10; screenShake.timer = 0.25;
  }
}

// ─── GAME ───────────────────────────────────────────────────
class Game {
  constructor(charId) {
    this.player = new Player(charId);
    this.enemies = [];
    this.projectiles = [];
    this.areaEffects = [];
    this.xpGems = [];

    this.gameTime = 0;
    this.totalTime = GAME_DURATION;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = XP_TABLE[0];
    this.kills = 0;
    this.bossesDefeated = 0;

    this.spawnTimer = 0;
    this.spawnInterval = 1.8;
    this.spawnBatch = 3;
    this.bossTimer = 0;
    this.nextBossTime = 5 * 60; // first boss at 5 min

    this.pendingUpgrades = [];
    this.difficulty = 0;

    // Track which weapons can still be unlocked.
    // Aliases share mechanics — pick one representative per group.
    const aliasGroups = {
      arrow: 'magicWand', magicWand: 'magicWand',
      bullet: 'gun',      gun: 'gun',
      thunder: 'lightningRing', lightningRing: 'lightningRing',
      magicOrb: 'kingBible',    kingBible: 'kingBible',
    };
    const startCanon = aliasGroups[this.player.def.startWeapon] || this.player.def.startWeapon;
    const seen = new Set([startCanon]);
    this.availableWeapons = [];
    for (const id of Object.keys(WEAPON_DEFS)) {
      const canon = aliasGroups[id] || id;
      if (seen.has(canon)) continue;
      seen.add(canon);
      this.availableWeapons.push(id);
    }
    this.availableItems = Object.keys(ITEM_DEFS);

    screen = 'playing';
  }

  get charDef() { return this.player.def; }

  gainXp(amount) {
    this.xp += amount;
    // 한 번에 하나씩만 처리 — 동시 다중 레벨업으로 인한 UI 중복·멈춤 방지
    if (this.xp >= this.xpNeeded && screen === 'playing') {
      this.xp -= this.xpNeeded;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    const idx = Math.min(this.level - 1, XP_TABLE.length - 1);
    this.xpNeeded = XP_TABLE[idx];
    this.pendingUpgrades = this._generateUpgrades(2);
    screen = 'levelUp';
    showLevelUpUI(this.pendingUpgrades, this);
  }

  _generateUpgrades(count) {
    const options = [];

    // Upgradeable existing weapons
    for (const w of this.player.weapons) {
      if (w.level < w.def.maxLevel) {
        options.push({ type: 'weapon_upgrade', weapon: w, rarity: w.level >= 3 ? 'epic' : 'rare' });
      }
    }

    // New weapons
    for (const id of this.availableWeapons) {
      if (!this.player.hasWeapon(id) && this.player.weapons.length < 4) {
        options.push({ type: 'weapon_new', defId: id, rarity: 'rare' });
      }
    }

    // Passive items
    for (const id of this.availableItems) {
      const def = ITEM_DEFS[id];
      const curLevel = this.player.itemLevels[id] || 0;
      if (curLevel < def.maxLevel) {
        options.push({ type: 'item', defId: id, rarity: def.rarity });
      }
    }

    // Shuffle & pick
    const shuffled = shuffle(options);
    const rarityOrder = { epic: 3, rare: 2, common: 1 };
    shuffled.sort((a, b) => (rarityOrder[b.rarity] || 1) - (rarityOrder[a.rarity] || 1));

    // Pick 'count' with at least variety
    const picked = [];
    const seen = new Set();
    for (const o of shuffle(options)) {
      const key = o.type === 'weapon_upgrade' ? o.weapon.def.id :
                  o.type === 'weapon_new' ? o.defId : o.defId;
      if (!seen.has(key)) {
        seen.add(key);
        picked.push(o);
        if (picked.length >= count) break;
      }
    }
    // Pad with random if needed
    while (picked.length < count) {
      const fallback = shuffle(options).find(o => !picked.includes(o));
      if (!fallback) break;
      picked.push(fallback);
    }
    return picked.slice(0, count);
  }

  applyUpgrade(choice) {
    const p = this.player;
    if (choice.type === 'weapon_upgrade') {
      choice.weapon.level = Math.min(choice.weapon.level + 1, choice.weapon.def.maxLevel);
    } else if (choice.type === 'weapon_new') {
      p._addWeapon(choice.defId);
      this.availableWeapons = this.availableWeapons.filter(id => id !== choice.defId);
    } else if (choice.type === 'item') {
      const def = ITEM_DEFS[choice.defId];
      def.apply(p);
      p.itemLevels[choice.defId] = (p.itemLevels[choice.defId] || 0) + 1;
      if (!p.items.find(i => i.def === def)) {
        p.items.push({ def, level: p.itemLevels[choice.defId] });
      } else {
        p.items.find(i => i.def === def).level = p.itemLevels[choice.defId];
      }
    }
    screen = 'playing';
    hideLevelUpUI();
  }

  spawnEnemy() {
    const cam = this._getCam();
    const pos = randomSpawnPos(cam.x, cam.y, CANVAS_W, CANVAS_H, 100);
    const t = this.gameTime;

    // Weight table evolves over time
    const pool = [];
    const weights = [];
    if (t < 60)       { pool.push('zombie'); weights.push(12); }
    if (t >= 30)      { pool.push('bat');    weights.push(8 + t/30); }
    if (t >= 90)      { pool.push('slime');  weights.push(5); }
    if (t >= 150)     { pool.push('skeleton'); weights.push(6); }
    if (t >= 300)     { pool.push('golem');  weights.push(3); }
    if (t >= 480)     { pool.push('darkKnight'); weights.push(4); }
    if (pool.length === 0) { pool.push('zombie'); weights.push(1); }

    const defId = weightedRandom(pool, weights);
    this.enemies.push(new Enemy(defId, pos.x, pos.y, this.difficulty));
  }

  spawnBoss() {
    const cam = this._getCam();
    const pos = randomSpawnPos(cam.x, cam.y, CANVAS_W, CANVAS_H, 80);
    this.enemies.push(new Enemy('boss', pos.x, pos.y, this.difficulty * 2));
    addScreenShake(8);
  }

  _getCam() {
    return {
      x: this.player.x - CANVAS_W / 2,
      y: this.player.y - CANVAS_H / 2,
    };
  }

  _fireWeapon(w) {
    const p = this.player;
    const lvl = w.def.levels[w.level - 1];
    const dmg = lvl.damage * p.atkMult;
    const aoe = p.aoeMult;
    const cd = (lvl.cooldown || 1) * p.cdMult;

    switch (w.def.id) {
      case 'sword':          this._fireSword(lvl, dmg, aoe); break;
      case 'arrow':
      case 'magicWand':      this._fireArrow(lvl, dmg, p); break;
      case 'bullet':
      case 'gun':            this._fireBullet(lvl, dmg, p); break;
      case 'thunder':
      case 'lightningRing':  this._fireThunder(lvl, dmg); break;
      case 'holyWater':      this._fireHolyWater(lvl, dmg, aoe); break;
      case 'explosion':      this._fireExplosion(lvl, dmg, aoe); break;
      case 'whip':           this._fireWhip(lvl, dmg, aoe); break;
      case 'runetracer':     this._fireRunetracer(lvl, dmg, p); break;
      case 'fireWand':       this._fireFireWand(lvl, dmg, aoe, p); break;
      case 'cross':          this._fireCross(lvl, dmg, p); break;
      case 'bone':           this._fireBone(lvl, dmg, p); break;
      case 'cherryBomb':     this._fireCherryBomb(lvl, dmg, aoe, p); break;
    }
    w.cooldownTimer = cd;
  }

  _nearestEnemy(x, y, exclude = []) {
    let nearest = null, bestDist = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;  // 죽은 적 타겟 금지
      if (exclude.includes(e)) continue;
      const d = distSq(x, y, e.x, e.y);
      if (d < bestDist) { bestDist = d; nearest = e; }
    }
    return nearest;
  }

  _fireSword(lvl, dmg, aoeMult) {
    const p = this.player;
    const range = lvl.range * aoeMult;
    const slices = lvl.count;
    for (let i = 0; i < slices; i++) {
      const angle = (i / slices) * Math.PI * 2;
      const eff = new AreaEffect(p.x, p.y, range, dmg, '#88ccff', 'sword_slash', 0.35, 999);
      eff.startAngle = angle;
      eff.endAngle = angle + Math.PI * 2 / slices;
      eff.startAngle = -Math.PI/2; eff.endAngle = Math.PI*2 - Math.PI/2;
      this._pushAreaEffect(eff);
    }
    // Instant damage ring
    for (const e of this.enemies) {
      if (e.alive && dist(p.x, p.y, e.x, e.y) <= range) {
        this._dealDamage(e, dmg, p.x, p.y);
      }
    }
    spawnParticles(p.x, p.y, '#88ccff', 12, 80);
  }

  _pushAreaEffect(eff) {
    if (this.areaEffects.length >= MAX_AREA_EFFECTS) this.areaEffects.shift();
    this.areaEffects.push(eff);
  }

  _pushProjectile(proj) {
    if (this.projectiles.length >= MAX_PROJECTILES) this.projectiles.shift();
    this.projectiles.push(proj);
  }

  _fireArrow(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    if (!nearest) return;
    const piercing = lvl.piercing || player.def.passive.piercing;
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * 0.2;
      this._pushProjectile(new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#88ffaa', 'arrow', 5, piercing
      ));
    }
    spawnParticles(player.x, player.y, '#88ffaa', 3, 50);
  }

  _fireBullet(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    if (!nearest) return;
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * lvl.spread;
      this._pushProjectile(new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#ffaa44', 'bullet', 4, false
      ));
    }
  }

  _fireThunder(lvl, dmg) {
    const p = this.player;
    for (let shot = 0; shot < lvl.count; shot++) {
      const target = this._nearestEnemy(p.x, p.y, []);
      if (!target) break;
      const chain = [target];
      let last = target;
      for (let c = 0; c < lvl.chain; c++) {
        const next = this.enemies.find(e => e.alive && !chain.includes(e) && dist(last.x, last.y, e.x, e.y) < 120);
        if (!next) break;
        chain.push(next);
        last = next;
      }
      for (const e of chain) {
        this._dealDamage(e, dmg * (0.7 ** chain.indexOf(e)), p.x, p.y);
        spawnParticles(e.x, e.y, '#ffee44', 6, 50);
      }
      // Thunder bolt projectile (visual only, instant)
      addScreenShake(2);
    }
  }

  _fireHolyWater(lvl, dmg, aoeMult) {
    const p = this.player;
    const nearest = this._nearestEnemy(p.x, p.y);
    const tx = nearest ? nearest.x + randomInRange(-30, 30) : p.x + randomInRange(-100, 100);
    const ty = nearest ? nearest.y + randomInRange(-30, 30) : p.y + randomInRange(-100, 100);
    const radius = lvl.radius * aoeMult;
    const eff = new AreaEffect(tx, ty, radius, dmg, '#44ddff', 'holyWater', lvl.duration, 0.4);
    this._pushAreaEffect(eff);
  }

  _fireExplosion(lvl, dmg, aoeMult) {
    const p = this.player;
    for (let i = 0; i < lvl.count; i++) {
      const nearest = this._nearestEnemy(p.x, p.y);
      const range = 200;
      const tx = nearest ? nearest.x + randomInRange(-20, 20) : p.x + randomInRange(-range, range);
      const ty = nearest ? nearest.y + randomInRange(-20, 20) : p.y + randomInRange(-range, range);
      const radius = lvl.radius * aoeMult;
      // Instant explosion
      for (const e of this.enemies) {
        if (e.alive && dist(tx, ty, e.x, e.y) <= radius) {
          this._dealDamage(e, dmg, tx, ty);
        }
      }
      const eff = new AreaEffect(tx, ty, radius, 0, '#ff8844', 'explosion', 0.4, 999);
      this._pushAreaEffect(eff);
      spawnParticles(tx, ty, '#ff8844', 20, 120);
      addScreenShake(4);
    }
  }

  // === NEW WEAPONS ===
  _fireWhip(lvl, dmg, aoeMult) {
    const p = this.player;
    const len = lvl.length * aoeMult;
    const wid = lvl.width;
    // Alternate sides per shot
    p._whipToggle = !p._whipToggle;
    const dirs = lvl.count >= 2 ? [-1, 1] : [p._whipToggle ? -1 : 1];
    if (lvl.count >= 4) dirs.push(-1, 1);
    for (const sign of dirs) {
      const cx = p.x + sign * len / 2, cy = p.y;
      // Instant damage in rectangle
      for (const e of this.enemies) {
        if (e.alive && Math.abs(e.x - cx) < len/2 && Math.abs(e.y - cy) < wid/2) {
          this._dealDamage(e, dmg, e.x, e.y);
        }
      }
      // Visual: directional slash
      const eff = new AreaEffect(cx, cy, len/2, 0, '#ff99bb', 'whip', 0.25, 999);
      eff.width = wid; eff.sign = sign;
      this._pushAreaEffect(eff);
      spawnParticles(cx, cy, '#ff99bb', 6, 80);
    }
  }

  _fireRunetracer(lvl, dmg, player) {
    for (let i = 0; i < lvl.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#66ddff', 'runetracer', 7, true
      );
      proj.bounces = lvl.bounces;
      proj.lifetime = lvl.lifetime;
      this._pushProjectile(proj);
    }
    spawnParticles(player.x, player.y, '#66ddff', 5, 60);
  }

  _fireFireWand(lvl, dmg, aoeMult, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    if (!nearest) return;
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * 0.15;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#ff6622', 'fireball', 7, false
      );
      proj.onHit = 'explode';
      proj.explosionRadius = lvl.explosionRadius * aoeMult;
      this._pushProjectile(proj);
    }
  }

  _fireCross(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    const baseAngle = nearest
      ? Math.atan2(nearest.y - player.y, nearest.x - player.x)
      : Math.random() * Math.PI * 2;
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * 0.3;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#ffdd88', 'cross', 9, true
      );
      proj.boomerang = true;
      proj.originX = player.x; proj.originY = player.y;
      proj.maxRange = lvl.range;
      proj.returning = false;
      proj.lifetime = 4;
      proj.spin = 0;
      this._pushProjectile(proj);
    }
  }

  _fireBone(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    const baseAngle = nearest
      ? Math.atan2(nearest.y - player.y, nearest.x - player.x)
      : Math.random() * Math.PI * 2;
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * 0.25;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#f0e8d4', 'bone', 7, true
      );
      proj.boomerang = true;
      proj.originX = player.x; proj.originY = player.y;
      proj.maxRange = lvl.range;
      proj.returning = false;
      proj.lifetime = 4;
      proj.spin = 0;
      this._pushProjectile(proj);
    }
  }

  _fireCherryBomb(lvl, dmg, aoeMult, player) {
    const radius = lvl.radius * aoeMult;
    for (let i = 0; i < lvl.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#ff4466', 'cherryBomb', 8, false
      );
      proj.bouncy = true;
      proj.bouncesLeft = lvl.bounces;
      proj.explosionRadius = radius;
      proj.explosionDamage = dmg;
      proj.lifetime = 2.5;
      proj.spin = 0;
      this._pushProjectile(proj);
    }
  }

  // GARLIC aura — called every frame, not via _fireWeapon
  _updateGarlic(dt) {
    const p = this.player;
    const garlic = p.getWeapon('garlic');
    if (!garlic) return;
    const lvl = garlic.def.levels[garlic.level - 1];
    const radius = lvl.radius * p.aoeMult;
    const tickRate = lvl.tickRate * p.cdMult;
    const dmg = lvl.damage * p.atkMult;
    p._garlicTick = (p._garlicTick || 0) - dt;
    if (p._garlicTick <= 0) {
      p._garlicTick = tickRate;
      for (const e of this.enemies) {
        if (e.alive && dist(p.x, p.y, e.x, e.y) <= radius) {
          this._dealDamage(e, dmg, e.x, e.y);
        }
      }
    }
  }

  _dealDamage(enemy, dmg, sx, sy) {
    if (!enemy.alive) return false;  // 이미 죽은 적에게 데미지 금지 (무한재귀 방지)
    const crit = Math.random() < 0.1;
    const finalDmg = Math.round(dmg * (crit ? 2 : 1));
    const died = enemy.takeDamage(finalDmg);
    pushDmgNumber(new DmgNumber(enemy.x, enemy.y - 20, finalDmg, crit, '#fff'));
    if (died) {
      this._onEnemyDie(enemy);
    }
    return died;
  }

  _onEnemyDie(enemy) {
    if (enemy._dieHandled) return;  // 중복 사망 처리 방지
    enemy._dieHandled = true;
    this.kills++;
    spawnParticles(enemy.x, enemy.y, enemy.def.color, enemy.isBoss ? 30 : 10, 90);
    if (enemy.isBoss) { this.bossesDefeated++; addScreenShake(10); }
    // Drop XP gem
    const value = enemy.xp;
    this.xpGems.push(new XpGem(enemy.x, enemy.y, value));
    // Slime explodes — alive 체크로 이미 죽은 적에게 연쇄 금지
    if (enemy.def.onDeath === 'explode') {
      for (const e of this.enemies) {
        if (e !== enemy && e.alive && dist(enemy.x, enemy.y, e.x, e.y) < 60) {
          this._dealDamage(e, enemy.def.damage * 2, enemy.x, enemy.y);
        }
      }
      spawnParticles(enemy.x, enemy.y, '#44ff66', 15, 100);
    }
  }

  _updateWeapons(dt) {
    const p = this.player;
    for (const w of p.weapons) {
      const id = w.def.id;
      // Orbiters + garlic are continuously handled, not cooldown-fired
      if (id === 'magicOrb' || id === 'kingBible' || id === 'ebonyWings' || id === 'garlic') continue;
      if (w.cooldownTimer <= 0) {
        this._fireWeapon(w);
      }
    }
  }

  _updateMagicOrbs(dt) {
    const p = this.player;
    const orbiters = p.weapons.filter(w =>
      w.def.id === 'magicOrb' || w.def.id === 'kingBible' || w.def.id === 'ebonyWings');
    if (!orbiters.length) return;
    // decay hit cooldowns per enemy once
    for (const e of this.enemies) if (e._orbHitTimer > 0) e._orbHitTimer -= dt;

    for (const orb of orbiters) {
      const lvl = orb.def.levels[orb.level - 1];
      const count = lvl.count;
      const radius = lvl.range * p.aoeMult;
      const dmg = lvl.damage * p.atkMult;
      // angle already updated in Player.update
      for (let i = 0; i < count; i++) {
        const angle = orb.orbAngle + (i / count) * Math.PI * 2;
        const ox = p.x + Math.cos(angle) * radius;
        const oy = p.y + Math.sin(angle) * radius;
        for (const e of this.enemies) {
          if (e.alive && dist(ox, oy, e.x, e.y) < e.def.size + 8) {
            if (!e._orbHitTimer || e._orbHitTimer <= 0) {
              this._dealDamage(e, dmg, ox, oy);
              e._orbHitTimer = 0.35;
            }
          }
        }
      }
    }
  }

  update(dt) {
    if (screen !== 'playing') return;

    this.gameTime += dt;
    this.difficulty = this.gameTime / 60;

    // Win condition
    if (this.gameTime >= this.totalTime) {
      screen = 'win';
      showEndScreen(true, this);
      return;
    }

    // Player
    this.player.update(dt, this.enemies);
    if (!this.player.alive) {
      screen = 'charSelect';
      G = null;
      selectedCharId = null;
      document.getElementById('charSelectOverlay').style.display = 'flex';
      document.getElementById('endOverlay').classList.remove('active');
      return;
    }

    // Enemy damage to player
    for (const e of this.enemies) {
      if (e.alive && dist(this.player.x, this.player.y, e.x, e.y) < e.def.size + 14) {
        this.player.takeDamage(e.damage * dt * 25);
      }
    }

    // Spawn enemies (capped)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const room = MAX_ENEMIES - this.enemies.length;
      if (room > 0) {
        const batch = Math.min(2 + Math.floor(this.gameTime / 45), 5, room);
        for (let i = 0; i < batch; i++) this.spawnEnemy();
      }
      const interval = Math.max(0.6, 1.8 - this.gameTime / 180);
      this.spawnTimer = interval;
    }

    // Spawn boss
    if (this.gameTime >= this.nextBossTime) {
      this.spawnBoss();
      this.nextBossTime += 5 * 60;
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player.x, this.player.y);
      if (!e.alive) this.enemies.splice(i, 1);
    }

    // Weapons
    this._updateWeapons(dt);
    this._updateMagicOrbs(dt);
    this._updateGarlic(dt);

    // Projectile collision
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, this);
      if (!proj.alive) { this.projectiles.splice(i, 1); continue; }

      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (proj.hitIds.has(e.id)) continue;
        if (dist(proj.x, proj.y, e.x, e.y) < e.def.size + proj.radius) {
          proj.hitIds.add(e.id);
          this._dealDamage(e, proj.damage, proj.x, proj.y);
          spawnParticles(proj.x, proj.y, proj.color, 3, 50);
          // On-hit explosion (fireWand)
          if (proj.onHit === 'explode' && !proj._exploded) proj._explode(this);
          if (!proj.piercing) { proj.alive = false; break; }
        }
      }
      if (!proj.alive) this.projectiles.splice(i, 1);
    }

    // Area effects
    for (let i = this.areaEffects.length - 1; i >= 0; i--) {
      const eff = this.areaEffects[i];
      const alive = eff.update(dt);
      if (!alive) { this.areaEffects.splice(i, 1); continue; }
      if (eff.canTick() && eff.damage > 0) {
        for (const e of this.enemies) {
          if (e.alive && dist(eff.x, eff.y, e.x, e.y) <= eff.radius) {
            this._dealDamage(e, eff.damage, eff.x, eff.y);
          }
        }
      }
    }

    // XP gems
    for (const gem of this.xpGems) gem.update(dt);

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].update(dt)) particles.splice(i, 1);
    }
    for (let i = dmgNumbers.length - 1; i >= 0; i--) {
      if (!dmgNumbers[i].update(dt)) dmgNumbers.splice(i, 1);
    }

    // Screen shake decay
    if (screenShake.timer > 0) {
      screenShake.timer -= dt;
      const intensity = screenShake.power * (screenShake.timer / 0.25);
      screenShake.x = (Math.random() - 0.5) * intensity * 2;
      screenShake.y = (Math.random() - 0.5) * intensity * 2;
    } else {
      screenShake.x = 0; screenShake.y = 0;
    }
  }

  draw() {
    const p = this.player;

    // ── 방향에 따라 ZOOM 결정 ─────────────────────────────
    const isPortrait = window.innerHeight > window.innerWidth;
    const curZoom = isPortrait ? ZOOM_PORTRAIT : ZOOM;

    // ── HUD visible region 계산 (세로 모드에서 캔버스가 viewport보다 넓어 클리핑됨) ──
    // canvas.style.left 가 음수면 그만큼 캔버스가 왼쪽으로 벗어난 것
    const cssW   = parseFloat(canvas.style.width)  || CANVAS_W;
    const cssLeft = parseFloat(canvas.style.left)  || 0;  // e.g. -438
    const cssToCvs = CANVAS_W / cssW;              // CSS px → 캔버스 px 변환비
    const vpLeft = Math.round(Math.max(0, -cssLeft) * cssToCvs); // visible 시작 x (canvas px)
    const vpW    = Math.round(Math.min(window.innerWidth, cssW) * cssToCvs); // visible 너비
    const hudRegion = { x: vpLeft, w: Math.min(vpW, CANVAS_W - vpLeft) };

    // ── 카메라 ────────────────────────────────────────────
    const visW = CANVAS_W / curZoom;
    const visH = CANVAS_H / curZoom;
    const camX = p.x - visW / 2 + screenShake.x / curZoom;
    const camY = p.y - visH / 2 + screenShake.y / curZoom;

    renderer.clear();
    renderer.drawWorld(camX, camY, curZoom);

    ctx.save();
    ctx.scale(curZoom, curZoom);
    ctx.translate(-camX, -camY);

    // Viewport for culling (세계 좌표 기준)
    const vL = camX - 60, vR = camX + visW + 60;
    const vT = camY - 60, vB = camY + visH + 60;
    // portrait에서 실제 보이는 세계 x 범위만 culling
    const visWorldX = hudRegion.x / curZoom;
    const visWorldW = hudRegion.w / curZoom;
    const inView = (x, y) => x > vL && x < vR && y > vT && y < vB;

    // XP gems (cull offscreen)
    for (const gem of this.xpGems) if (inView(gem.x, gem.y)) renderer.drawXpGem(ctx, gem);

    // Area effects
    for (const eff of this.areaEffects) if (inView(eff.x, eff.y)) renderer.drawAreaEffect(ctx, eff);

    // Enemies (cull offscreen)
    for (const e of this.enemies) if (inView(e.x, e.y)) renderer.drawEnemy(ctx, e);

    // Orbital weapons (magicOrb / kingBible / ebonyWings)
    for (const id of ['magicOrb', 'kingBible', 'ebonyWings']) {
      const orbW = p.getWeapon(id);
      if (!orbW) continue;
      const lvl = orbW.def.levels[orbW.level - 1];
      const count = lvl.count;
      const radius = lvl.range * p.aoeMult;
      const visualType = id === 'ebonyWings' ? 'bird_orb' : (id === 'kingBible' ? 'book_orb' : 'magic_orb');
      const col = id === 'ebonyWings' ? '#3a2a4a' : (id === 'kingBible' ? '#ffdd88' : '#dd88ff');
      for (let i = 0; i < count; i++) {
        const angle = orbW.orbAngle + (i / count) * Math.PI * 2;
        const ox = p.x + Math.cos(angle) * radius;
        const oy = p.y + Math.sin(angle) * radius;
        const fakeProj = { x: ox, y: oy, type: visualType, color: col, radius: 8, angle };
        renderer.drawProjectile(ctx, fakeProj);
      }
    }

    // Garlic aura ring (visual only)
    const garlicW = p.getWeapon('garlic');
    if (garlicW) {
      const lvl = garlicW.def.levels[garlicW.level - 1];
      const r = lvl.radius * p.aoeMult;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(performance.now() * 0.005);
      ctx.fillStyle = '#d8e0a0';
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#b0c068';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }

    // Projectiles
    for (const proj of this.projectiles) renderer.drawProjectile(ctx, proj);

    // Player
    renderer.drawPlayer(ctx, p.x, p.y, p.def, p.facing, p.frame,
      p.invTimer > 0, p.invTimer);

    // Particles (world space)
    for (const part of particles) renderer.drawParticle(ctx, part);

    // Damage numbers
    for (const dn of dmgNumbers) renderer.drawDmgNumber(ctx, dn);

    ctx.restore();

    // HUD (screen space) — hudRegion으로 가시 영역 내에 그림
    renderer.drawHUD(ctx, {
      player: p,
      gameTime: this.gameTime,
      totalTime: this.totalTime,
      level: this.level,
      xp: this.xp,
      xpNeeded: this.xpNeeded,
      kills: this.kills,
      charDef: p.def,
    }, hudRegion);
    renderer.drawWeaponBar(ctx, p.weapons, p.items, hudRegion);
  }
}

// ─── UI MANAGEMENT ──────────────────────────────────────────
function showLevelUpUI(upgrades, game) {
  const overlay = document.getElementById('levelUpOverlay');
  const cards = document.getElementById('levelUpCards');
  cards.innerHTML = '';

  for (const [i, choice] of upgrades.entries()) {
    let icon, name, desc, levelStr, rarity = 'common';
    if (choice.type === 'weapon_upgrade') {
      const w = choice.weapon;
      const lvl = w.def.levels[w.level]; // next level
      icon = w.def.icon;
      name = w.def.name;
      rarity = choice.rarity;
      levelStr = `Lv.${w.level} → Lv.${w.level + 1}`;
      desc = w.def.levelDescs[w.level] || '강화';
    } else if (choice.type === 'weapon_new') {
      const def = WEAPON_DEFS[choice.defId];
      icon = def.icon;
      name = def.name + ' (신규)';
      rarity = 'rare';
      levelStr = 'NEW';
      desc = def.desc;
    } else {
      const def = ITEM_DEFS[choice.defId];
      const curLv = game.player.itemLevels[choice.defId] || 0;
      icon = def.icon;
      name = def.name;
      rarity = def.rarity;
      levelStr = curLv === 0 ? 'NEW' : `Lv.${curLv} → Lv.${curLv + 1}`;
      desc = def.desc;
    }

    const card = document.createElement('div');
    card.className = `upgrade-card rarity-${rarity}`;
    card.innerHTML = `
      <div class="card-icon">${icon}</div>
      <div class="card-name">${name}</div>
      <div class="card-level">${levelStr}</div>
      <div class="card-desc">${desc}</div>
    `;
    card.addEventListener('click', () => game.applyUpgrade(choice));
    cards.appendChild(card);
  }

  overlay.classList.add('active');
}

function hideLevelUpUI() {
  document.getElementById('levelUpOverlay').classList.remove('active');
}

function showEndScreen(win, game) {
  const overlay = document.getElementById('endOverlay');
  const title = document.getElementById('endTitle');
  const stats = document.getElementById('endStats');

  if (win) {
    title.textContent = '🏆 생존 성공!';
    title.style.color = '#ffe066';
    title.style.textShadow = '0 0 20px #ffaa00';
  } else {
    title.textContent = '💀 사망';
    title.style.color = '#ff4444';
    title.style.textShadow = '0 0 20px #ff0000';
  }

  const t = formatTime(game.gameTime);
  stats.innerHTML = `
    캐릭터: <b>${game.charDef.name}</b> (${game.charDef.subtitle})<br>
    생존 시간: <b>${t}</b><br>
    처치 수: <b>${game.kills}</b>마리<br>
    레벨: <b>${game.level}</b><br>
    보스 처치: <b>${game.bossesDefeated}</b>마리
  `;
  overlay.classList.add('active');
}

// ─── CHARACTER SELECT ────────────────────────────────────────
function buildCharSelect() {
  const charCards = document.getElementById('charCards');
  charCards.innerHTML = '';
  const startBtn = document.getElementById('startBtn');

  for (const [id, def] of Object.entries(CHARACTERS)) {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.style.setProperty('--char-color', def.color);
    card.style.setProperty('--char-color-alpha', def.colorAlpha);
    card.style.setProperty('--char-color-shadow', def.colorShadow);
    card.dataset.charId = id;

    const portraitCanvas = document.createElement('canvas');
    portraitCanvas.width = 110; portraitCanvas.height = 140;

    const stats = def.stats;
    card.innerHTML = `
      <div class="char-name">${def.name}</div>
      <div class="char-subtitle">${def.subtitle}</div>
    `;
    card.insertBefore(portraitCanvas, card.firstChild);
    card.innerHTML += `
      <div class="char-desc">${def.description.replace('\n','<br>')}</div>
      <div class="char-stats">
        ${['hp','spd','atk','def'].map(s => `
          <div class="stat">
            <div class="stat-label">${s.toUpperCase()}</div>
            <div class="stat-bar"><div class="stat-fill" style="width:${stats[s]*20}%"></div></div>
          </div>
        `).join('')}
      </div>
    `;
    // Re-insert portrait canvas (after innerHTML overwrite)
    card.insertBefore(portraitCanvas, card.firstChild);

    setTimeout(() => drawCharPortrait(portraitCanvas, def, 1.15), 10);

    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCharId = id;
      startBtn.disabled = false;
    });

    charCards.appendChild(card);
  }

  startBtn.disabled = true;
  startBtn.addEventListener('click', () => {
    if (!selectedCharId) return;
    document.getElementById('charSelectOverlay').style.display = 'none';
    startGame(selectedCharId);
  });
}

function startGame(charId) {
  G = new Game(charId);
  screen = 'playing';
  document.getElementById('endOverlay').classList.remove('active');
}

// ─── RETRY ──────────────────────────────────────────────────
document.getElementById('retryBtn').addEventListener('click', () => {
  document.getElementById('endOverlay').classList.remove('active');
  document.getElementById('charSelectOverlay').style.display = 'flex';
  screen = 'charSelect';
  selectedCharId = null;
  G = null;
});

// ─── GAME LOOP ──────────────────────────────────────────────
let lastTime = 0;

function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05) * GAME_SPEED_MULT;
  lastTime = ts;

  if (G && screen === 'playing') {
    G.update(dt);
    G.draw();
  } else if (!G) {
    // Just clear canvas on char select
    renderer.clear();
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

// ─── INIT ───────────────────────────────────────────────────
SPRITES.load(() => {
  buildCharSelect();
  requestAnimationFrame((ts) => { lastTime = ts; gameLoop(ts); });
});
