// ============================================================
//  RENDERER  — draws characters, enemies, effects
// ============================================================

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // ── WORLD BACKGROUND ────────────────────────────────────
  drawWorld(camX, camY) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // Dark grass tiling
    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (dungeon floor feel)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gs = 60;
    const offX = (-camX) % gs;
    const offY = (-camY) % gs;
    for (let x = offX; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = offY; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Subtle vignette
    const grad = ctx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.72);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── SHADOW ──────────────────────────────────────────────
  drawShadow(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.55, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── PLAYER CHARACTER ────────────────────────────────────
  drawPlayer(ctx, px, py, charDef, facing, frame, invincible, invTimer) {
    const x = px, y = py;
    const t = frame;
    const bob = Math.sin(t * 6) * 2.5;

    if (invincible && Math.floor(invTimer * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y + bob);
    if (facing < 0) ctx.scale(-1, 1);

    this.drawShadow(ctx, 0, 18, 16);
    this._drawCharBody(ctx, charDef);
    ctx.restore();
  }

  _drawCharBody(ctx, charDef) {
    const { skinColor, hairColor, eyeColor, color, id } = charDef;

    // ─ Body ─
    ctx.fillStyle = color + '33'; // outfit base glow
    ctx.beginPath();
    ctx.ellipse(0, 8, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outfit
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-10, 2, 20, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Legs
    ctx.fillStyle = color + 'dd';
    ctx.fillRect(-8, 18, 6, 8);
    ctx.fillRect(2, 18, 6, 8);
    // Shoes
    ctx.fillStyle = '#333';
    ctx.fillRect(-9, 24, 7, 4);
    ctx.fillRect(1, 24, 7, 4);

    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(-14, 4, 5, 12); // left arm
    ctx.fillRect(9, 4, 5, 12);   // right arm

    // Neck
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(0, -10, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = hairColor;
    switch (id) {
      case 'sora':   this._hairTwinTail(ctx, hairColor); break;
      case 'mika':   this._hairLongWave(ctx, hairColor); break;
      case 'hana':   this._hairSidePony(ctx, hairColor); break;
      case 'luna':   this._hairShortBold(ctx, hairColor); break;
      default:       this._hairDefault(ctx, hairColor);
    }

    // Eyes
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.ellipse(-4, -11, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -11, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-3.5, -12, 1, 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4.5, -12, 1, 1, 0, 0, Math.PI * 2); ctx.fill();
    // Pupils
    ctx.fillStyle = '#000a';
    ctx.beginPath(); ctx.ellipse(-4, -10.5, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -10.5, 1.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255,160,140,0.45)';
    ctx.beginPath(); ctx.ellipse(-7, -8, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -8, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

    // Weapon indicator
    this._drawWeaponIcon(ctx, id, color);
  }

  _hairTwinTail(ctx, c) { // 소라 - 쌍 포니테일
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -19, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Left tail
    ctx.save();
    ctx.translate(-12, -14);
    ctx.rotate(-0.4);
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(-8, 8, -6, 20, -2, 28);
    ctx.bezierCurveTo(2, 28, 4, 20, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Right tail
    ctx.save();
    ctx.translate(12, -14);
    ctx.rotate(0.4);
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(8, 8, 6, 20, 2, 28);
    ctx.bezierCurveTo(-2, 28, -4, 20, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _hairLongWave(ctx, c) { // 미카 - 긴 웨이브 + 마법사 햇
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -18, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Long flowing hair
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.bezierCurveTo(-16, 0, -18, 15, -12, 28);
    ctx.bezierCurveTo(-8, 30, -6, 24, -8, 16);
    ctx.bezierCurveTo(-6, 6, -4, -4, -10, -16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -16);
    ctx.bezierCurveTo(16, 0, 18, 15, 12, 28);
    ctx.bezierCurveTo(8, 30, 6, 24, 8, 16);
    ctx.bezierCurveTo(6, 6, 4, -4, 10, -16);
    ctx.fill();
    // Witch hat
    ctx.fillStyle = '#220033';
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.lineTo(14, -18);
    ctx.lineTo(10, -20);
    ctx.lineTo(4, -34);
    ctx.lineTo(-4, -34);
    ctx.lineTo(-10, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c + 'cc';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Hat band
    ctx.strokeStyle = '#ff88ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -20); ctx.lineTo(12, -20);
    ctx.stroke();
    // Star
    ctx.fillStyle = '#ffe066';
    ctx.font = '8px serif';
    ctx.fillText('★', -4, -22);
  }

  _hairSidePony(ctx, c) { // 하나 - 사이드 포니테일
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -18, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(2, -18, 8, 6, 0.2, 0, Math.PI * 2); ctx.fill();
    // Side pony
    ctx.save();
    ctx.translate(13, -16);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(10, 6, 12, 18, 8, 30);
    ctx.bezierCurveTo(4, 30, 2, 22, 4, 12);
    ctx.bezierCurveTo(2, 4, 0, 0, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Hair ornament
    ctx.fillStyle = '#88ffcc';
    ctx.beginPath(); ctx.arc(12, -16, 3, 0, Math.PI * 2); ctx.fill();
  }

  _hairShortBold(ctx, c) { // 루나 - 짧고 강렬한 헤어
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -20, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -14, 10, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
    // Side bangs
    ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(-14, -6); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -18); ctx.lineTo(14, -6); ctx.lineTo(8, -8); ctx.closePath(); ctx.fill();
    // Hair highlight
    ctx.fillStyle = '#ff8899';
    ctx.beginPath(); ctx.ellipse(-3, -20, 2.5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
  }

  _hairDefault(ctx, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -18, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  _drawWeaponIcon(ctx, id, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    switch (id) {
      case 'sora': // Sword
        ctx.strokeStyle = '#aaccff';
        ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(20, -16); ctx.stroke();
        ctx.fillStyle = '#ffdd88';
        ctx.beginPath(); ctx.arc(12, -4, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'mika': // Staff tip
        ctx.strokeStyle = '#dd88ff';
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, -12); ctx.stroke();
        ctx.fillStyle = '#ff88ff';
        ctx.beginPath(); ctx.arc(20, -14, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'hana': // Bow
        ctx.strokeStyle = '#88ffaa';
        ctx.beginPath(); ctx.arc(16, -4, 8, -1.0, 1.0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(16 + 8 * Math.cos(-1), -4 + 8 * Math.sin(-1));
        ctx.lineTo(16 + 8 * Math.cos(1), -4 + 8 * Math.sin(1)); ctx.stroke();
        break;
      case 'luna': // Pistol
        ctx.fillStyle = '#888';
        ctx.fillRect(10, -2, 10, 5);
        ctx.fillStyle = '#555';
        ctx.fillRect(18, -4, 4, 3);
        break;
    }
    ctx.restore();
  }

  // ── ENEMY ───────────────────────────────────────────────
  drawEnemy(ctx, enemy, hitFlash) {
    const { x, y, def, hp, maxHp, isBoss, flashTimer } = enemy;
    const r = def.size;
    const flash = flashTimer > 0;

    ctx.save();
    ctx.translate(x, y);

    this.drawShadow(ctx, 0, r * 0.7, r);

    // Body
    ctx.fillStyle = flash ? '#ffffff' : def.color;
    ctx.strokeStyle = flash ? '#fff' : def.color + 'aa';
    ctx.lineWidth = isBoss ? 3 : 1.5;

    switch (def.id) {
      case 'bat':     this._drawBat(ctx, r, def.color, flash); break;
      case 'golem':   this._drawGolem(ctx, r, def.color, flash); break;
      case 'slime':   this._drawSlime(ctx, r, def.color, flash); break;
      case 'boss':    this._drawBoss(ctx, r, def.color, flash); break;
      default:        this._drawZombie(ctx, r, def.color, flash, def.id);
    }

    // HP bar (only if damaged)
    if (hp < maxHp) {
      const bw = r * 2.4;
      const bh = 4;
      const bx = -bw / 2;
      const by = -r - 10;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = isBoss ? '#ff4444' : '#44ff88';
      ctx.fillRect(bx, by, bw * (hp / maxHp), bh);
    }

    // Boss label
    if (isBoss) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 BOSS', 0, -r - 18);
    }

    ctx.restore();
  }

  _drawZombie(ctx, r, color, flash, id) {
    const c = flash ? '#fff' : color;
    // Body
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    // Eyes
    ctx.fillStyle = flash ? '#f00' : '#ff4422';
    ctx.beginPath(); ctx.arc(-r*0.3, -r*0.25, r*0.18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3, -r*0.25, r*0.18, 0, Math.PI*2); ctx.fill();
    // Mouth
    ctx.strokeStyle = flash ? '#f00' : '#cc2200';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, r*0.1, r*0.3, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  _drawBat(ctx, r, color, flash) {
    const c = flash ? '#fff' : color;
    ctx.fillStyle = c;
    // Wings
    ctx.save();
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-r*2.2, -r*0.8); ctx.lineTo(-r*1.5, r*0.3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(r*2.2, -r*0.8); ctx.lineTo(r*1.5, r*0.3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // Body
    ctx.beginPath(); ctx.ellipse(0, 0, r*0.8, r, 0, 0, Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#ff3300';
    ctx.beginPath(); ctx.arc(-r*0.28, -r*0.2, r*0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.28, -r*0.2, r*0.2, 0, Math.PI*2); ctx.fill();
  }

  _drawGolem(ctx, r, color, flash) {
    const c = flash ? '#fff' : color;
    ctx.fillStyle = c;
    ctx.strokeStyle = flash ? '#fff' : '#aa9977';
    ctx.lineWidth = 2;
    // Body (blocky)
    ctx.beginPath(); ctx.roundRect(-r, -r*0.8, r*2, r*1.8, 4); ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.roundRect(-r*0.75, -r*1.8, r*1.5, r, 3); ctx.fill(); ctx.stroke();
    // Eyes glow
    ctx.fillStyle = '#ff8800';
    ctx.beginPath(); ctx.arc(-r*0.3, -r*1.4, r*0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3, -r*1.4, r*0.2, 0, Math.PI*2); ctx.fill();
    // Crack
    ctx.strokeStyle = '#55443388';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r*0.6); ctx.lineTo(-r*0.3, r*0.4); ctx.stroke();
  }

  _drawSlime(ctx, r, color, flash) {
    const c = flash ? '#fff' : color;
    ctx.fillStyle = c + (flash ? '' : '99');
    ctx.strokeStyle = flash ? '#fff' : color;
    ctx.lineWidth = 2;
    // Blobby body
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.bezierCurveTo(-r*1.2, -r*1.5, r*1.2, -r*1.5, r, 0);
    ctx.bezierCurveTo(r*1.1, r*0.8, -r*1.1, r*0.8, -r, 0);
    ctx.fill(); ctx.stroke();
    // Highlights
    ctx.fillStyle = '#ffffff55';
    ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.6, r*0.25, r*0.35, -0.3, 0, Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-r*0.28, -r*0.3, r*0.18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.28, -r*0.3, r*0.18, 0, Math.PI*2); ctx.fill();
  }

  _drawBoss(ctx, r, color, flash) {
    const c = flash ? '#fff' : color;
    const t = performance.now() / 1000;
    // Aura
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 3);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Body
    ctx.fillStyle = c;
    ctx.strokeStyle = flash ? '#fff' : '#ff8888';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Horns
    ctx.fillStyle = flash ? '#fff' : '#880000';
    ctx.beginPath(); ctx.moveTo(-r*0.6, -r*0.8); ctx.lineTo(-r*1.0, -r*1.8); ctx.lineTo(-r*0.2, -r*0.8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r*0.6, -r*0.8); ctx.lineTo(r*1.0, -r*1.8); ctx.lineTo(r*0.2, -r*0.8); ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = flash ? '#f00' : '#ffff00';
    ctx.beginPath(); ctx.arc(-r*0.3, -r*0.1, r*0.22, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3, -r*0.1, r*0.22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-r*0.3, -r*0.1, r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(r*0.3, -r*0.1, r*0.1, 0, Math.PI*2); ctx.fill();
    // Scar
    ctx.strokeStyle = '#ff2222';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r*0.1, -r*0.5); ctx.lineTo(r*0.15, r*0.2); ctx.stroke();
  }

  // ── PROJECTILES ─────────────────────────────────────────
  drawProjectile(ctx, proj) {
    const { x, y, type, color, radius, angle } = proj;
    ctx.save();
    ctx.translate(x, y);

    switch (type) {
      case 'arrow':
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(-6, -3); ctx.lineTo(-4, 0); ctx.lineTo(-6, 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#88ffcc';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case 'bullet':
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        break;
      case 'thunder_bolt':
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -12); ctx.lineTo(-4, 0); ctx.lineTo(4, -2); ctx.lineTo(0, 12);
        ctx.stroke();
        break;
      case 'magic_orb':
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff8';
        ctx.beginPath(); ctx.arc(-radius*0.3, -radius*0.3, radius*0.3, 0, Math.PI*2); ctx.fill();
        break;
      default:
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // ── AREA EFFECTS ────────────────────────────────────────
  drawAreaEffect(ctx, eff) {
    const { x, y, radius, color, alpha, type } = eff;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (type === 'holyWater') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, color + 'cc');
      g.addColorStop(0.7, color + '66');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.stroke();
    } else if (type === 'explosion') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, '#ffcc44');
      g.addColorStop(0.7, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
    } else if (type === 'sword_slash') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, radius, eff.startAngle, eff.endAngle);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── XP GEM ──────────────────────────────────────────────
  drawXpGem(ctx, gem) {
    const { x, y, value, pulseT } = gem;
    const scale = 0.9 + 0.12 * Math.sin(pulseT * 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const color = value >= 8 ? '#ff88ff' : value >= 3 ? '#4488ff' : '#44ffaa';
    const sz = value >= 8 ? 7 : value >= 3 ? 6 : 5;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -sz); ctx.lineTo(sz*0.6, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz*0.6, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffffffaa';
    ctx.beginPath(); ctx.ellipse(-sz*0.15, -sz*0.35, sz*0.18, sz*0.28, -0.5, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  // ── PARTICLES ───────────────────────────────────────────
  drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ── DAMAGE NUMBER ────────────────────────────────────────
  drawDmgNumber(ctx, dn) {
    ctx.save();
    ctx.globalAlpha = dn.alpha;
    ctx.fillStyle = dn.crit ? '#ffdd00' : dn.color;
    ctx.font = `${dn.crit ? 'bold ' : ''}${dn.crit ? 18 : 14}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = dn.crit ? '#ff8800' : '#000';
    ctx.shadowBlur = dn.crit ? 10 : 4;
    ctx.fillText(dn.crit ? `${dn.value}!` : dn.value, dn.x, dn.y);
    ctx.restore();
  }

  // ── HUD ─────────────────────────────────────────────────
  drawHUD(ctx, state) {
    const { player, gameTime, totalTime, level, xp, xpNeeded, kills, charDef } = state;
    const W = this.canvas.width;

    // HP Bar
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = '#00000099';
    ctx.fillRect(12, 12, 210, 18);
    const hpColor = hpRatio > 0.5 ? '#44ff88' : hpRatio > 0.25 ? '#ffcc00' : '#ff4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(12, 12, 210 * hpRatio, 18);
    ctx.strokeStyle = '#ffffff55';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, 210, 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`♥ ${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`, 117, 25);

    // XP Bar
    ctx.fillStyle = '#00000099';
    ctx.fillRect(12, 34, 210, 8);
    ctx.fillStyle = '#8844ff';
    ctx.fillRect(12, 34, 210 * (xp / xpNeeded), 8);
    ctx.strokeStyle = '#ffffff33';
    ctx.strokeRect(12, 34, 210, 8);

    // Level badge
    ctx.fillStyle = '#8844ff';
    ctx.beginPath(); ctx.roundRect(12, 46, 56, 20, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${level}`, 18, 61);

    // Character name
    ctx.fillStyle = charDef.color;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${charDef.name} ${charDef.subtitle}`, 74, 61);

    // Timer (center top)
    const remaining = Math.max(0, totalTime - gameTime);
    ctx.fillStyle = '#000000aa';
    ctx.beginPath(); ctx.roundRect(W/2 - 52, 10, 104, 28, 6); ctx.fill();
    ctx.fillStyle = gameTime > totalTime * 0.8 ? '#ff6644' : '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(remaining), W/2, 30);

    // Kills (top right)
    ctx.fillStyle = '#000000aa';
    ctx.beginPath(); ctx.roundRect(W - 110, 10, 100, 24, 5); ctx.fill();
    ctx.fillStyle = '#ffcc44';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💀 ${kills}`, W - 16, 27);

    ctx.textAlign = 'left';
  }

  // ── WEAPON ICONS (bottom HUD) ───────────────────────────
  drawWeaponBar(ctx, weapons, items) {
    const H = this.canvas.height;
    const W = this.canvas.width;
    const slotW = 52, slotH = 52;
    const totalW = Math.min(weapons.length + items.length, 12) * (slotW + 6);
    let startX = W / 2 - totalW / 2;
    const y = H - slotH - 10;

    const all = [...weapons.map(w => ({ ...w, isWeapon: true })), ...items.map(i => ({ ...i, isWeapon: false }))];

    for (const slot of all) {
      ctx.fillStyle = '#000000bb';
      ctx.strokeStyle = slot.isWeapon ? slot.def.color : '#888';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(startX, y, slotW, slotH, 6); ctx.fill(); ctx.stroke();

      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.fillText(slot.def.icon, startX + slotW/2, y + 30);

      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`Lv.${slot.level}`, startX + slotW/2, y + slotH - 5);

      if (slot.isWeapon && slot.cooldownTimer > 0) {
        const ratio = slot.cooldownTimer / (slot.def.levels[slot.level-1].cooldown * (slot.cdMult || 1));
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.moveTo(startX + slotW/2, y + slotH/2);
        ctx.arc(startX + slotW/2, y + slotH/2, slotW*0.45, -Math.PI/2, -Math.PI/2 + Math.PI*2*ratio);
        ctx.closePath(); ctx.fill();
      }

      startX += slotW + 6;
    }
  }
}

// Draw character portrait on a small canvas (for character select)
function drawCharPortrait(canvas, charDef, scale = 1.8) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const R = new Renderer(canvas);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2 + 16);
  ctx.scale(scale, scale);
  R._drawCharBody(ctx, charDef);
  ctx.restore();
}
