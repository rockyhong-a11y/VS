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
document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup',   e => { keys[e.code] = false; });

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

function spawnParticles(wx, wy, color, count, speed = 80) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const sp = speed * (0.5 + Math.random() * 0.8);
    const p = new Particle();
    p.reset(wx, wy, Math.cos(angle)*sp, Math.sin(angle)*sp - 40,
            color, 2 + Math.random()*3, 0.3 + Math.random()*0.5);
    particles.push(p);
  }
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
    this.speed = this.def.speed;
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

    // Movement
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
    if (dx || dy) {
      const n = normalize(dx, dy);
      this.x = clamp(this.x + n.x * this.speed * dt, 0, WORLD_W);
      this.y = clamp(this.y + n.y * this.speed * dt, 0, WORLD_H);
      if (n.x !== 0) this.facing = n.x > 0 ? 1 : -1;
    }
    this.moveX = dx; this.moveY = dy;

    // Invincibility
    if (this.invTimer > 0) this.invTimer -= dt;

    // HP regen
    this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);

    // Update weapon cooldowns & orb angles
    for (const w of this.weapons) {
      if (w.cooldownTimer > 0) w.cooldownTimer -= dt;
      if (w.def.id === 'magicOrb') {
        const lvl = w.def.levels[w.level - 1];
        w.orbAngle += lvl.speed * dt;
      }
    }

    // XP pickup
    if (G) {
      for (let i = G.xpGems.length - 1; i >= 0; i--) {
        const gem = G.xpGems[i];
        if (distSq(this.x, this.y, gem.x, gem.y) < this.xpRange * this.xpRange) {
          G.gainXp(gem.value);
          spawnParticles(gem.x, gem.y, '#88ffaa', 3, 40);
          G.xpGems.splice(i, 1);
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
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
    if (this.x < -200 || this.x > WORLD_W + 200 || this.y < -200 || this.y > WORLD_H + 200)
      this.alive = false;
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

    // Track which weapons can still be unlocked
    this.availableWeapons = Object.keys(WEAPON_DEFS).filter(id => id !== this.player.def.startWeapon);
    this.availableItems = Object.keys(ITEM_DEFS);

    screen = 'playing';
  }

  get charDef() { return this.player.def; }

  gainXp(amount) {
    this.xp += amount;
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    const idx = Math.min(this.level - 1, XP_TABLE.length - 1);
    this.xpNeeded = XP_TABLE[idx];
    this.pendingUpgrades = this._generateUpgrades(3);
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
      if (!this.player.hasWeapon(id) && this.player.weapons.length < 6) {
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
      case 'sword':
        this._fireSword(lvl, dmg, aoe); break;
      case 'arrow':
        this._fireArrow(lvl, dmg, p); break;
      case 'bullet':
        this._fireBullet(lvl, dmg, p); break;
      case 'thunder':
        this._fireThunder(lvl, dmg); break;
      case 'holyWater':
        this._fireHolyWater(lvl, dmg, aoe); break;
      case 'explosion':
        this._fireExplosion(lvl, dmg, aoe); break;
    }
    w.cooldownTimer = cd;
  }

  _nearestEnemy(x, y, exclude = []) {
    let nearest = null, bestDist = Infinity;
    for (const e of this.enemies) {
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
      this.areaEffects.push(eff);
    }
    // Instant damage ring
    for (const e of this.enemies) {
      if (dist(p.x, p.y, e.x, e.y) <= range) {
        this._dealDamage(e, dmg, p.x, p.y);
      }
    }
    spawnParticles(p.x, p.y, '#88ccff', 12, 80);
  }

  _fireArrow(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    if (!nearest) return;
    const piercing = lvl.piercing || player.def.passive.piercing;
    const spread = (lvl.count - 1) * 0.15;
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * 0.2;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#88ffaa', 'arrow', 5, piercing
      );
      this.projectiles.push(proj);
    }
    spawnParticles(player.x, player.y, '#88ffaa', 4, 50);
  }

  _fireBullet(lvl, dmg, player) {
    const nearest = this._nearestEnemy(player.x, player.y);
    if (!nearest) return;
    const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
    for (let i = 0; i < lvl.count; i++) {
      const angle = baseAngle + (i - (lvl.count-1)/2) * lvl.spread;
      const proj = new Projectile(
        player.x, player.y,
        Math.cos(angle) * lvl.speed, Math.sin(angle) * lvl.speed,
        dmg, '#ffaa44', 'bullet', 4, false
      );
      this.projectiles.push(proj);
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
        const next = this.enemies.find(e => !chain.includes(e) && dist(last.x, last.y, e.x, e.y) < 120);
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
    this.areaEffects.push(eff);
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
        if (dist(tx, ty, e.x, e.y) <= radius) {
          this._dealDamage(e, dmg, tx, ty);
        }
      }
      const eff = new AreaEffect(tx, ty, radius, 0, '#ff8844', 'explosion', 0.4, 999);
      this.areaEffects.push(eff);
      spawnParticles(tx, ty, '#ff8844', 20, 120);
      addScreenShake(4);
    }
  }

  _dealDamage(enemy, dmg, sx, sy) {
    const crit = Math.random() < 0.1;
    const finalDmg = Math.round(dmg * (crit ? 2 : 1));
    const died = enemy.takeDamage(finalDmg);
    dmgNumbers.push(new DmgNumber(enemy.x, enemy.y - 20, finalDmg, crit, '#fff'));
    if (died) {
      this._onEnemyDie(enemy);
    }
    return died;
  }

  _onEnemyDie(enemy) {
    this.kills++;
    spawnParticles(enemy.x, enemy.y, enemy.def.color, enemy.isBoss ? 30 : 10, 90);
    if (enemy.isBoss) { this.bossesDefeated++; addScreenShake(10); }
    // Drop XP gem
    const value = enemy.xp;
    this.xpGems.push(new XpGem(enemy.x, enemy.y, value));
    // Slime explodes
    if (enemy.def.onDeath === 'explode') {
      for (const e of this.enemies) {
        if (e !== enemy && dist(enemy.x, enemy.y, e.x, e.y) < 60) {
          this._dealDamage(e, enemy.def.damage * 2, enemy.x, enemy.y);
        }
      }
      spawnParticles(enemy.x, enemy.y, '#44ff66', 15, 100);
    }
  }

  _updateWeapons(dt) {
    const p = this.player;
    for (const w of p.weapons) {
      if (w.def.id === 'magicOrb') continue; // orbs handled in draw
      if (w.cooldownTimer <= 0) {
        this._fireWeapon(w);
      }
    }
  }

  _updateMagicOrbs(dt) {
    // Magic orb collision handled here
    const p = this.player;
    const orbWeapon = p.getWeapon('magicOrb');
    if (!orbWeapon) return;
    const lvl = orbWeapon.def.levels[orbWeapon.level - 1];
    const count = lvl.count;
    const radius = lvl.range * p.aoeMult;
    const dmg = lvl.damage * p.atkMult;

    for (let i = 0; i < count; i++) {
      const angle = orbWeapon.orbAngle + (i / count) * Math.PI * 2;
      const ox = p.x + Math.cos(angle) * radius;
      const oy = p.y + Math.sin(angle) * radius;
      // Collision
      for (const e of this.enemies) {
        if (dist(ox, oy, e.x, e.y) < e.def.size + 7) {
          if (!e._orbHitTimer || e._orbHitTimer <= 0) {
            this._dealDamage(e, dmg, ox, oy);
            e._orbHitTimer = 0.3;
          }
        }
        if (e._orbHitTimer > 0) e._orbHitTimer -= dt;
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
      screen = 'dead';
      showEndScreen(false, this);
      return;
    }

    // Enemy damage to player
    for (const e of this.enemies) {
      if (dist(this.player.x, this.player.y, e.x, e.y) < e.def.size + 14) {
        this.player.takeDamage(e.damage * dt * 2.5);
      }
    }

    // Spawn enemies
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const batch = Math.min(2 + Math.floor(this.gameTime / 30), 12);
      for (let i = 0; i < batch; i++) this.spawnEnemy();
      const interval = Math.max(0.4, 1.8 - this.gameTime / 120);
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

    // Projectile collision
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);
      if (!proj.alive) { this.projectiles.splice(i, 1); continue; }

      let hit = false;
      for (const e of this.enemies) {
        if (proj.hitIds.has(e.id)) continue;
        if (dist(proj.x, proj.y, e.x, e.y) < e.def.size + proj.radius) {
          proj.hitIds.add(e.id);
          this._dealDamage(e, proj.damage, proj.x, proj.y);
          spawnParticles(proj.x, proj.y, proj.color, 4, 50);
          if (!proj.piercing) { proj.alive = false; hit = true; break; }
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
          if (dist(eff.x, eff.y, e.x, e.y) <= eff.radius) {
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
    const camX = p.x - CANVAS_W / 2 + screenShake.x;
    const camY = p.y - CANVAS_H / 2 + screenShake.y;

    renderer.clear();
    renderer.drawWorld(camX, camY);

    ctx.save();
    ctx.translate(-camX, -camY);

    // XP gems
    for (const gem of this.xpGems) renderer.drawXpGem(ctx, gem);

    // Area effects
    for (const eff of this.areaEffects) renderer.drawAreaEffect(ctx, eff);

    // Enemies
    for (const e of this.enemies) renderer.drawEnemy(ctx, e);

    // Magic orbs
    const orbW = p.getWeapon('magicOrb');
    if (orbW) {
      const lvl = orbW.def.levels[orbW.level - 1];
      const count = lvl.count;
      const radius = lvl.range * p.aoeMult;
      for (let i = 0; i < count; i++) {
        const angle = orbW.orbAngle + (i / count) * Math.PI * 2;
        const ox = p.x + Math.cos(angle) * radius;
        const oy = p.y + Math.sin(angle) * radius;
        const fakeProj = { x: ox, y: oy, type: 'magic_orb', color: '#dd88ff', radius: 8, angle };
        renderer.drawProjectile(ctx, fakeProj);
      }
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

    // HUD (screen space)
    renderer.drawHUD(ctx, {
      player: p,
      gameTime: this.gameTime,
      totalTime: this.totalTime,
      level: this.level,
      xp: this.xp,
      xpNeeded: this.xpNeeded,
      kills: this.kills,
      charDef: p.def,
    });
    renderer.drawWeaponBar(ctx, p.weapons, p.items);
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
    portraitCanvas.width = 90; portraitCanvas.height = 110;

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

    setTimeout(() => drawCharPortrait(portraitCanvas, def, 1.8), 10);

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
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
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
buildCharSelect();
requestAnimationFrame((ts) => { lastTime = ts; gameLoop(ts); });
