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
  drawWorld(camX, camY, zoom = 1) {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    // Dark grass tiling
    ctx.fillStyle = '#111820';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (dungeon floor feel) — scaled by zoom
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gs = 60 * zoom;
    const offX = (-camX * zoom) % gs;
    const offY = (-camY * zoom) % gs;
    for (let x = offX; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = offY; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Cached vignette (built once)
    if (!this._vignette || this._vignette.width !== W) {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const octx = off.getContext('2d');
      const grad = octx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.72);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.45)');
      octx.fillStyle = grad;
      octx.fillRect(0, 0, W, H);
      this._vignette = off;
    }
    ctx.drawImage(this._vignette, 0, 0);
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
    if (invincible && Math.floor(invTimer * 10) % 2 === 0) return;

    const sprId = charDef.spriteId || charDef.id;
    const targetH = 80;   // 캔버스 기준 렌더링 높이 (px)
    const aspect  = SPRITES.charAspect(sprId) || 0.5;
    const dw = Math.round(targetH * aspect);
    const dh = targetH;
    const bob = Math.sin(frame * 6) * 2.5;

    // 프레임 인덱스: frame (0~N 연속값) → 정수 인덱스
    const fc = SPRITES.frameCount(sprId);
    const fps = 6;   // 초당 몇 프레임 바꿀지
    const frameIdx = Math.floor(frame * fps) % fc;

    this.drawShadow(ctx, px, py + dh * 0.42, dw * 0.45);

    const dx = px - dw / 2;
    const dy = py + bob - dh * 0.52;
    const drawn = SPRITES.drawChar(ctx, sprId, dx, dy, targetH, facing, invincible, frameIdx);
    if (!drawn) {
      // Fallback: canvas-drawn character
      ctx.save();
      ctx.translate(px, py + bob);
      if (facing < 0) ctx.scale(-1, 1);
      this._drawCharBody(ctx, charDef);
      ctx.restore();
    }
  }

  // 6-등신 proportions. Origin (0,0) is at waist.
  // Head: y≈-38, Feet: y≈+36, Total ~74px
  _drawCharBody(ctx, charDef) {
    const { skinColor, hairColor, eyeColor, color, id, armorColor = '#333', outfitKind } = charDef;

    // CREATURE (Exdash etc) — entirely different body
    if (outfitKind === 'creature') {
      this._drawCreature(ctx, charDef);
      return;
    }

    // Legs (back layer)
    ctx.fillStyle = outfitKind === 'knight' ? armorColor : skinColor;
    ctx.fillRect(-7, 8, 5, 22);
    ctx.fillRect(2, 8, 5, 22);
    // Thigh-high / boots
    if (outfitKind === 'knight') {
      ctx.fillStyle = '#1c1c2a';
      ctx.fillRect(-7.5, 22, 6, 10);
      ctx.fillRect(1.5, 22, 6, 10);
    } else if (outfitKind === 'whip') {
      ctx.fillStyle = '#2a1838';
      ctx.fillRect(-7.5, 20, 6, 12);
      ctx.fillRect(1.5, 20, 6, 12);
    } else {
      ctx.fillStyle = '#241810';
      ctx.fillRect(-7.5, 24, 6, 8);
      ctx.fillRect(1.5, 24, 6, 8);
    }
    // Boots sole
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(-8, 32, 7, 3);
    ctx.fillRect(1, 32, 7, 3);

    // Hip band / belt
    ctx.fillStyle = id === 'chloe' ? '#4a2f14' : '#222';
    ctx.fillRect(-9, 6, 18, 3);

    // TORSO — outfit silhouette (hourglass)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.bezierCurveTo(-12, -12, -11, -6, -7, -2); // side curve
    ctx.lineTo(-8, 6);
    ctx.lineTo(8, 6);
    ctx.lineTo(7, -2);
    ctx.bezierCurveTo(11, -6, 12, -12, 10, -20);
    ctx.closePath();
    ctx.fill();

    // Outfit accent (shading)
    ctx.fillStyle = color + 'cc';
    ctx.beginPath();
    ctx.ellipse(-4, -10, 4.5, 6, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -10, 4.5, 6, 0.1, 0, Math.PI * 2); ctx.fill();
    // Outfit highlight line
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 4); ctx.stroke();

    // Outfit-specific details
    if (outfitKind === 'knight') {
      // Shoulder pauldron (metallic)
      ctx.fillStyle = armorColor;
      ctx.beginPath(); ctx.ellipse(-11, -19, 5, 4, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, -19, 5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
      // Chest plate highlight
      ctx.strokeStyle = armorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, -18); ctx.lineTo(9, -18);
      ctx.stroke();
    } else if (outfitKind === 'steampunk') {
      // Blouse collar
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.moveTo(-10, -20); ctx.lineTo(-6, -14); ctx.lineTo(6, -14); ctx.lineTo(10, -20);
      ctx.lineTo(6, -22); ctx.lineTo(-6, -22); ctx.closePath(); ctx.fill();
      // Corset laces
      ctx.strokeStyle = '#ffcc55';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-3, -8 + i*4); ctx.lineTo(3, -8 + i*4);
        ctx.stroke();
      }
      // Gear buckle
      ctx.fillStyle = '#d4a24a';
      ctx.beginPath(); ctx.arc(0, 4, 2, 0, Math.PI * 2); ctx.fill();
    } else if (outfitKind === 'whip') {
      // Strap/crossbelt
      ctx.strokeStyle = '#1a0f2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-9, -16); ctx.lineTo(9, -2); ctx.stroke();
      // Gold trim
      ctx.strokeStyle = '#d4a24a';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, -20); ctx.lineTo(10, -20); ctx.stroke();
    }

    // ARMS
    ctx.fillStyle = skinColor;
    ctx.fillRect(-13, -18, 4, 16); // upper+forearm L
    ctx.fillRect(9, -18, 4, 16);
    // Gloves / bracers
    if (outfitKind === 'knight') {
      ctx.fillStyle = armorColor;
      ctx.fillRect(-13.5, -4, 5, 8);
      ctx.fillRect(8.5, -4, 5, 8);
    } else if (outfitKind === 'steampunk') {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-13.5, -4, 5, 8);
      ctx.fillRect(8.5, -4, 5, 8);
    } else {
      ctx.fillStyle = '#2a1838';
      ctx.fillRect(-13.5, -6, 5, 10);
      ctx.fillRect(8.5, -6, 5, 10);
    }

    // NECK
    ctx.fillStyle = skinColor;
    ctx.fillRect(-2.5, -24, 5, 5);

    // HEAD
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.ellipse(0, -31, 8, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Chin shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(0, -23.5, 4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // HAIR — dispatch by hairStyle
    const hs = charDef.hairStyle || 'shortBob';
    switch (hs) {
      case 'longStraight': this._hairLongStraight(ctx, charDef); break;
      case 'twinTail':     this._hairTwinTail(ctx, charDef); break;
      case 'ponytail':     this._hairPonytail(ctx, charDef); break;
      case 'silverFlow':   this._hairSilverFlow(ctx, charDef); break;
      case 'creature':     /* no hair */ break;
      case 'shortBob':
      default:             this._hairShortBob(ctx, charDef); break;
    }

    // ACCESSORY (on top of hair)
    const acc = charDef.accessory || 'none';
    switch (acc) {
      case 'catEars':  this._accCatEars(ctx, charDef); break;
      case 'ribbon':   this._accRibbon(ctx, charDef); break;
      case 'hood':     this._accHood(ctx, charDef); break;
      case 'crown':    this._accCrown(ctx, charDef); break;
    }

    // EYES
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-3, -31, 1.8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -31, 1.8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(-3, -31, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -31, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-3, -31, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -31, 0.6, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2.5, -31.6, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -31.6, 0.5, 0, Math.PI * 2); ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255,140,120,0.35)';
    ctx.beginPath(); ctx.ellipse(-5, -28, 2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -28, 2, 1.2, 0, 0, Math.PI * 2); ctx.fill();

    // Weapon indicator — based on starting weapon
    this._drawWeaponIcon(ctx, charDef.startWeapon, charDef);
  }

  // ── Creature body (Exdash) ──
  _drawCreature(ctx, def) {
    const { color, hairColor, skinColor } = def;
    // Body (round blob)
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 20, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hairColor + 'aa';
    ctx.beginPath(); ctx.ellipse(-4, -6, 6, 7, -0.2, 0, Math.PI*2); ctx.fill();
    // Feet
    ctx.fillStyle = '#e8a040';
    ctx.fillRect(-7, 18, 5, 3);
    ctx.fillRect(2, 18, 5, 3);
    // Wings
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-16, -4); ctx.quadraticCurveTo(-22, 4, -14, 10);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -4); ctx.quadraticCurveTo(22, 4, 14, 10);
    ctx.closePath(); ctx.fill();
    // Eyes (big)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, -4, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -4, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-5, -3, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -3, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4, -4, 0.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -4, 0.8, 0, Math.PI*2); ctx.fill();
    // Beak
    ctx.fillStyle = '#e8a040';
    ctx.beginPath();
    ctx.moveTo(-2, 2); ctx.lineTo(2, 2); ctx.lineTo(0, 5);
    ctx.closePath(); ctx.fill();
    // Blush
    ctx.fillStyle = 'rgba(255,80,120,0.3)';
    ctx.beginPath(); ctx.ellipse(-9, 2, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, 2, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
    // Crown (if accessory)
    if (def.accessory === 'crown') {
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.moveTo(-8, -14);
      ctx.lineTo(-4, -20); ctx.lineTo(-2, -14);
      ctx.lineTo(0, -20); ctx.lineTo(2, -14);
      ctx.lineTo(4, -20); ctx.lineTo(8, -14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff4444';
      ctx.beginPath(); ctx.arc(0, -17, 1.2, 0, Math.PI*2); ctx.fill();
    }
  }

  // ── HAIR STYLES ────────────────────────────────────────
  // 짧은 보브 (default)
  _hairShortBob(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Cap
    ctx.beginPath(); ctx.ellipse(0, -36, 10, 9, 0, 0, Math.PI*2); ctx.fill();
    // Side
    ctx.beginPath();
    ctx.moveTo(-9, -34); ctx.bezierCurveTo(-11, -28, -10, -24, -8, -22);
    ctx.lineTo(-4, -24); ctx.bezierCurveTo(-6, -30, -8, -33, -9, -34);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -34); ctx.bezierCurveTo(11, -28, 10, -24, 8, -22);
    ctx.lineTo(4, -24); ctx.bezierCurveTo(6, -30, 8, -33, 9, -34);
    ctx.closePath(); ctx.fill();
    // Front bangs
    ctx.beginPath();
    ctx.moveTo(-6, -34); ctx.lineTo(-2, -27); ctx.lineTo(2, -27); ctx.lineTo(6, -34);
    ctx.lineTo(3, -38); ctx.lineTo(-3, -38); ctx.closePath(); ctx.fill();
    // Highlight
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(-3, -39, 2.2, 1.2, -0.3, 0, Math.PI*2); ctx.fill();
  }

  // 긴 스트레이트
  _hairLongStraight(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -37, 10, 8, 0, 0, Math.PI*2); ctx.fill();
    // Long hair to chest
    ctx.beginPath();
    ctx.moveTo(-9, -35);
    ctx.bezierCurveTo(-14, -20, -15, -6, -12, 6);
    ctx.lineTo(-8, 4);
    ctx.bezierCurveTo(-10, -8, -8, -22, -6, -32);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -35);
    ctx.bezierCurveTo(14, -20, 15, -6, 12, 6);
    ctx.lineTo(8, 4);
    ctx.bezierCurveTo(10, -8, 8, -22, 6, -32);
    ctx.closePath(); ctx.fill();
    // Front bangs
    ctx.beginPath();
    ctx.moveTo(-6, -35); ctx.lineTo(-3, -26); ctx.lineTo(3, -26); ctx.lineTo(6, -35);
    ctx.lineTo(3, -40); ctx.lineTo(-3, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(-3, -39, 2.5, 1.3, -0.3, 0, Math.PI*2); ctx.fill();
  }

  // 쌍 포니테일
  _hairTwinTail(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Cap
    ctx.beginPath(); ctx.ellipse(0, -37, 10, 8, 0, 0, Math.PI*2); ctx.fill();
    // Front bangs
    ctx.beginPath();
    ctx.moveTo(-6, -35); ctx.lineTo(-2, -26); ctx.lineTo(2, -26); ctx.lineTo(6, -35);
    ctx.lineTo(3, -40); ctx.lineTo(-3, -40); ctx.closePath(); ctx.fill();
    // Side bangs
    ctx.beginPath();
    ctx.moveTo(-9, -34); ctx.lineTo(-6, -22); ctx.lineTo(-3, -26);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -34); ctx.lineTo(6, -22); ctx.lineTo(3, -26);
    ctx.closePath(); ctx.fill();
    // Left twin tail
    ctx.save();
    ctx.translate(-11, -32); ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8, 6, -10, 18, -6, 24);
    ctx.bezierCurveTo(-2, 22, 0, 12, 2, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // Right twin tail
    ctx.save();
    ctx.translate(11, -32); ctx.rotate(0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(8, 6, 10, 18, 6, 24);
    ctx.bezierCurveTo(2, 22, 0, 12, -2, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(-3, -39, 2.2, 1.2, -0.3, 0, Math.PI*2); ctx.fill();
  }

  // 포니테일 (뒤로 하나)
  _hairPonytail(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -37, 10, 8, 0, 0, Math.PI*2); ctx.fill();
    // Back ponytail behind head
    ctx.beginPath();
    ctx.moveTo(-6, -36);
    ctx.bezierCurveTo(-4, -28, -2, -14, 0, 8);
    ctx.bezierCurveTo(2, -14, 4, -28, 6, -36);
    ctx.closePath(); ctx.fill();
    // Side bangs
    ctx.beginPath();
    ctx.moveTo(-9, -34); ctx.lineTo(-4, -22); ctx.lineTo(-2, -26);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -34); ctx.lineTo(4, -22); ctx.lineTo(2, -26);
    ctx.closePath(); ctx.fill();
    // Front bangs
    ctx.beginPath();
    ctx.moveTo(-5, -36); ctx.lineTo(-2, -27); ctx.lineTo(3, -27); ctx.lineTo(6, -36);
    ctx.lineTo(3, -40); ctx.lineTo(-3, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(2, -39, 2, 1.2, 0.3, 0, Math.PI*2); ctx.fill();
  }

  // 리나 스타일은 제거 (사용 안함). 남아있으면 호환용.
  _hairBlondeLong(ctx, def) { this._hairLongStraight(ctx, def); }
  _hairTealTopHat(ctx, def) { this._hairShortBob(ctx, def); }

  // 실버 웨이브 플로우 (아르카/글레리씨)
  _hairSilverFlow(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Top / back
    ctx.beginPath(); ctx.ellipse(0, -37, 10, 8, 0, 0, Math.PI*2); ctx.fill();
    // Side bangs
    ctx.beginPath();
    ctx.moveTo(-9, -36);
    ctx.bezierCurveTo(-11, -30, -10, -26, -7, -23);
    ctx.lineTo(-3, -28);
    ctx.bezierCurveTo(-5, -32, -7, -35, -9, -36);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -36);
    ctx.bezierCurveTo(11, -30, 10, -26, 7, -23);
    ctx.lineTo(3, -28);
    ctx.bezierCurveTo(5, -32, 7, -35, 9, -36);
    ctx.closePath(); ctx.fill();
    // Long hair behind shoulders flowing to chest
    ctx.beginPath();
    ctx.moveTo(-9, -35);
    ctx.bezierCurveTo(-14, -20, -15, -6, -12, 6);
    ctx.lineTo(-8, 4);
    ctx.bezierCurveTo(-10, -8, -8, -22, -6, -32);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -35);
    ctx.bezierCurveTo(14, -20, 15, -6, 12, 6);
    ctx.lineTo(8, 4);
    ctx.bezierCurveTo(10, -8, 8, -22, 6, -32);
    ctx.closePath(); ctx.fill();
    // Highlight
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(-3, -38, 3, 1.5, -0.3, 0, Math.PI*2); ctx.fill();
  }

  // 클로이 — 청발 + 실크햇
  _hairTealTopHat(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Base hair
    ctx.beginPath(); ctx.ellipse(0, -36, 10, 8, 0, 0, Math.PI*2); ctx.fill();
    // Flowing strands
    ctx.beginPath();
    ctx.moveTo(-9, -33);
    ctx.bezierCurveTo(-13, -18, -14, 0, -10, 10);
    ctx.lineTo(-6, 8);
    ctx.bezierCurveTo(-9, -4, -7, -20, -6, -30);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, -33);
    ctx.bezierCurveTo(13, -18, 14, 0, 10, 10);
    ctx.lineTo(6, 8);
    ctx.bezierCurveTo(9, -4, 7, -20, 6, -30);
    ctx.closePath(); ctx.fill();
    // Side bangs
    ctx.beginPath();
    ctx.moveTo(-8, -34); ctx.lineTo(-4, -24); ctx.lineTo(-2, -28);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -34); ctx.lineTo(4, -24); ctx.lineTo(2, -28);
    ctx.closePath(); ctx.fill();

    // TOP HAT
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-11, -42, 22, 2);     // brim
    ctx.fillRect(-8, -52, 16, 10);     // crown
    // Gold band
    ctx.fillStyle = '#d4a24a';
    ctx.fillRect(-8, -45, 16, 2);
    // Gear on hat
    ctx.strokeStyle = '#d4a24a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(-4, -47, 2, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#d4a24a';
    ctx.fillRect(-4.5, -49.5, 1, 5);
    ctx.fillRect(-6.5, -47.5, 5, 1);

    // Highlight
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(3, -36, 2, 1, 0.3, 0, Math.PI*2); ctx.fill();
  }

  // 노아 — 백발 웨이브
  _hairSilverFlow(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Top
    ctx.beginPath(); ctx.ellipse(0, -37, 10, 9, 0, 0, Math.PI*2); ctx.fill();
    // Long flowing hair to waist
    ctx.beginPath();
    ctx.moveTo(-10, -34);
    ctx.bezierCurveTo(-16, -16, -18, 4, -14, 14);
    ctx.lineTo(-9, 12);
    ctx.bezierCurveTo(-12, 0, -10, -18, -6, -30);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -34);
    ctx.bezierCurveTo(16, -16, 18, 4, 14, 14);
    ctx.lineTo(9, 12);
    ctx.bezierCurveTo(12, 0, 10, -18, 6, -30);
    ctx.closePath(); ctx.fill();
    // Center bangs (long, split)
    ctx.beginPath();
    ctx.moveTo(-4, -36); ctx.bezierCurveTo(-5, -30, -3, -26, -2, -24);
    ctx.lineTo(1, -26); ctx.bezierCurveTo(-1, -30, -2, -33, -4, -36);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, -36); ctx.bezierCurveTo(5, -30, 3, -26, 2, -24);
    ctx.lineTo(-1, -26); ctx.bezierCurveTo(1, -30, 2, -33, 4, -36);
    ctx.closePath(); ctx.fill();
    // Shade
    ctx.fillStyle = cs;
    ctx.beginPath(); ctx.ellipse(-4, -38, 3, 1.5, -0.3, 0, Math.PI*2); ctx.fill();
    // Horn-like accent (small purple hair accessory)
    ctx.fillStyle = '#8a3aa8';
    ctx.beginPath(); ctx.arc(-6, -40, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -40, 1.5, 0, Math.PI*2); ctx.fill();
  }

  _hairDefault(ctx, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, -18, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ── ACCESSORIES ────────────────────────────────────────
  _accCatEars(ctx, def) {
    const c = def.hairColor, cs = def.hairSub;
    ctx.fillStyle = c;
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-9, -42); ctx.lineTo(-4, -48); ctx.lineTo(-3, -40);
    ctx.closePath(); ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(9, -42); ctx.lineTo(4, -48); ctx.lineTo(3, -40);
    ctx.closePath(); ctx.fill();
    // Inner ear (pink)
    ctx.fillStyle = '#ff99bb';
    ctx.beginPath();
    ctx.moveTo(-7, -43); ctx.lineTo(-5, -46); ctx.lineTo(-4, -41);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -43); ctx.lineTo(5, -46); ctx.lineTo(4, -41);
    ctx.closePath(); ctx.fill();
  }

  _accRibbon(ctx, def) {
    // Red bow on top of head
    ctx.fillStyle = '#e02040';
    ctx.beginPath();
    ctx.moveTo(-1, -44); ctx.lineTo(-8, -48); ctx.lineTo(-6, -42); ctx.lineTo(-2, -42);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1, -44); ctx.lineTo(8, -48); ctx.lineTo(6, -42); ctx.lineTo(2, -42);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8899';
    ctx.fillRect(-1.5, -45, 3, 4);
  }

  _accHood(ctx, def) {
    const hoodColor = '#c0a070';
    ctx.fillStyle = hoodColor;
    // Hood over head
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.bezierCurveTo(-14, -38, -8, -44, 0, -44);
    ctx.bezierCurveTo(8, -44, 14, -38, 12, -26);
    ctx.lineTo(10, -24);
    ctx.bezierCurveTo(10, -32, 6, -36, 0, -36);
    ctx.bezierCurveTo(-6, -36, -10, -32, -10, -24);
    ctx.closePath(); ctx.fill();
    // Trim
    ctx.strokeStyle = '#8a6848';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _accCrown(ctx, def) {
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.moveTo(-7, -42);
    ctx.lineTo(-4, -48); ctx.lineTo(-2, -42);
    ctx.lineTo(0, -48); ctx.lineTo(2, -42);
    ctx.lineTo(4, -48); ctx.lineTo(7, -42);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(0, -45, 1.2, 0, Math.PI*2); ctx.fill();
  }

  _drawWeaponIcon(ctx, weaponId, charDef) {
    ctx.save();
    ctx.lineWidth = 2;
    switch (weaponId) {
      case 'whip': { // Coiled whip
        ctx.strokeStyle = '#c84040';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(15, -2, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15, 2); ctx.lineTo(20, 10);
        ctx.stroke();
        break;
      }
      case 'magicWand': { // Staff with blue orb
        ctx.strokeStyle = '#442288';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(20, -12); ctx.stroke();
        ctx.fillStyle = '#44aaff';
        ctx.beginPath(); ctx.arc(21, -14, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff66';
        ctx.beginPath(); ctx.arc(20, -15, 1.2, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'runetracer': { // Cyan diamond
        ctx.fillStyle = '#66ddff';
        ctx.beginPath();
        ctx.moveTo(18, -10); ctx.lineTo(24, -4); ctx.lineTo(18, 2); ctx.lineTo(12, -4);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#226688'; ctx.lineWidth = 1; ctx.stroke();
        break;
      }
      case 'gun': { // Pistol
        ctx.fillStyle = '#555';
        ctx.fillRect(10, -2, 11, 4);
        ctx.fillRect(18, -4, 4, 3);
        ctx.fillStyle = '#333';
        ctx.fillRect(12, 2, 3, 4);
        break;
      }
      case 'fireWand': { // Orange torch
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(13, -4, 3, 14);
        // Flame
        ctx.fillStyle = '#ff6622';
        ctx.beginPath();
        ctx.moveTo(14.5, -6); ctx.bezierCurveTo(10, -12, 19, -14, 14.5, -18);
        ctx.bezierCurveTo(20, -12, 16, -8, 14.5, -6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath(); ctx.ellipse(14.5, -12, 1.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'lightningRing': { // Lightning bolt
        ctx.strokeStyle = '#ffee44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, -12); ctx.lineTo(13, -4); ctx.lineTo(18, -2); ctx.lineTo(13, 8);
        ctx.stroke();
        break;
      }
      case 'garlic': { // Garlic bulb
        ctx.fillStyle = '#f0e8c8';
        ctx.beginPath(); ctx.ellipse(16, -2, 5, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#c0b878';
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(16, -8); ctx.lineTo(16, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(20, -2); ctx.stroke();
        break;
      }
      case 'holyWater': { // Bottle
        ctx.fillStyle = '#44ccee';
        ctx.fillRect(13, -2, 5, 8);
        ctx.fillStyle = '#888';
        ctx.fillRect(14, -5, 3, 3);
        break;
      }
      case 'kingBible': { // Book
        ctx.fillStyle = '#8a3028';
        ctx.fillRect(12, -6, 10, 8);
        ctx.fillStyle = '#ffdd44';
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 1;
        ctx.strokeRect(13, -5, 8, 6);
        ctx.beginPath(); ctx.moveTo(17, -4); ctx.lineTo(17, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(19, -2); ctx.stroke();
        break;
      }
      case 'cross': { // Cross
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(15, -10, 2, 14);
        ctx.fillRect(11, -5, 10, 2);
        break;
      }
      case 'bone': { // Bone
        ctx.fillStyle = '#f0e8d4';
        ctx.fillRect(13, -3, 10, 2);
        ctx.beginPath(); ctx.arc(13, -3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(13, -1, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, -3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, -1, 2, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'cherryBomb': { // Bomb
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(16, 0, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#8a5a2a';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(16, -5); ctx.lineTo(18, -10); ctx.stroke();
        ctx.fillStyle = '#ffaa22';
        ctx.beginPath(); ctx.arc(19, -11, 1.5, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'ebonyWings': { // Bird
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.ellipse(16, -2, 5, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffaa22';
        ctx.beginPath();
        ctx.moveTo(20, -2); ctx.lineTo(23, -3); ctx.lineTo(20, -1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(18, -3, 0.8, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'sword':
      default: { // Generic sword fallback
        ctx.save();
        ctx.translate(10, -6);
        ctx.rotate(-0.7);
        ctx.fillStyle = '#ccd8ee';
        ctx.fillRect(-2, -22, 4, 20);
        ctx.fillStyle = '#d4a24a';
        ctx.fillRect(-4, -2, 8, 2);
        ctx.fillStyle = '#3a2015';
        ctx.fillRect(-1.5, 0, 3, 6);
        ctx.restore();
        break;
      }
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
        // Cheap glow: concentric fills (much faster than shadowBlur)
        ctx.fillStyle = color + '44';
        ctx.beginPath(); ctx.arc(0, 0, radius * 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        break;
      case 'magic_orb':
        ctx.fillStyle = color + '55';
        ctx.beginPath(); ctx.arc(0, 0, radius * 1.6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff8';
        ctx.beginPath(); ctx.arc(-radius*0.3, -radius*0.3, radius*0.3, 0, Math.PI*2); ctx.fill();
        break;
      case 'book_orb':
        ctx.rotate(performance.now() * 0.004);
        ctx.fillStyle = '#8a3028';
        ctx.fillRect(-7, -6, 14, 12);
        ctx.fillStyle = '#ffdd88';
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-6, -5, 12, 10);
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke();
        break;
      case 'bird_orb': {
        // Wings flap
        const flap = Math.sin(performance.now() * 0.02) * 0.4;
        ctx.fillStyle = '#221a30';
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1024';
        // Left wing
        ctx.save(); ctx.rotate(-0.3 + flap);
        ctx.beginPath(); ctx.ellipse(-6, 0, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(0.3 - flap);
        ctx.beginPath(); ctx.ellipse(6, 0, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        // Beak
        ctx.fillStyle = '#ffaa22';
        ctx.beginPath();
        ctx.moveTo(4, -1); ctx.lineTo(8, -2); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
        // Eye
        ctx.fillStyle = '#ff4455';
        ctx.beginPath(); ctx.arc(3, -2, 0.8, 0, Math.PI*2); ctx.fill();
        break;
      }
      case 'fireball':
        // Trailing glow
        ctx.fillStyle = '#ffaa3344';
        ctx.beginPath(); ctx.arc(0, 0, radius * 2.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff6622';
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffdd44';
        ctx.beginPath(); ctx.arc(-radius*0.2, -radius*0.2, radius*0.5, 0, Math.PI*2); ctx.fill();
        break;
      case 'runetracer':
        ctx.rotate(performance.now() * 0.005);
        ctx.fillStyle = color + '55';
        ctx.beginPath();
        ctx.moveTo(0, -radius*1.8); ctx.lineTo(radius*1.8, 0);
        ctx.lineTo(0, radius*1.8); ctx.lineTo(-radius*1.8, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -radius); ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius); ctx.lineTo(-radius, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, radius*0.3, 0, Math.PI*2); ctx.fill();
        break;
      case 'cross':
        ctx.rotate(proj.spin || 0);
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(-1.5, -radius, 3, radius*2);
        ctx.fillRect(-radius*0.7, -1.5, radius*1.4, 3);
        break;
      case 'bone':
        ctx.rotate(proj.spin || 0);
        ctx.fillStyle = '#f0e8d4';
        ctx.fillRect(-radius, -1.5, radius*2, 3);
        ctx.beginPath(); ctx.arc(-radius, -1.5, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-radius, 1.5, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(radius, -1.5, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(radius, 1.5, 2, 0, Math.PI*2); ctx.fill();
        break;
      case 'cherryBomb':
        ctx.rotate(proj.spin || 0);
        // Bomb body
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
        // Highlight
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(-radius*0.35, -radius*0.35, radius*0.3, 0, Math.PI*2); ctx.fill();
        // Fuse spark
        ctx.strokeStyle = '#8a5a2a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(3, -radius-5); ctx.stroke();
        const flicker = ((performance.now() / 80) | 0) % 2 === 0;
        ctx.fillStyle = flicker ? '#ffee33' : '#ff7722';
        ctx.beginPath(); ctx.arc(3, -radius-6, 2.4, 0, Math.PI*2); ctx.fill();
        break;
      default:
        ctx.fillStyle = color + '55';
        ctx.beginPath(); ctx.arc(0, 0, radius * 1.6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = color;
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
      ctx.beginPath();
      ctx.arc(x, y, radius, eff.startAngle, eff.endAngle);
      ctx.stroke();
    } else if (type === 'whip') {
      // Horizontal elongated slash
      const w = eff.width || 30;
      const len = radius;
      ctx.fillStyle = color + '66';
      ctx.beginPath();
      ctx.ellipse(x, y, len, w/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, len, w/2, 0, 0, Math.PI*2);
      ctx.stroke();
    } else if (type === 'garlic') {
      // Soft pulse ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = color + '18';
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
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

    // Cheap glow halo
    ctx.fillStyle = color + '44';
    ctx.beginPath(); ctx.arc(0, 0, sz * 1.6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -sz); ctx.lineTo(sz*0.6, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz*0.6, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffffffaa';
    ctx.beginPath(); ctx.ellipse(-sz*0.15, -sz*0.35, sz*0.18, sz*0.28, -0.5, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  // ── PARTICLES ───────────────────────────────────────────
  drawParticle(ctx, p) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
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
  // hudRegion: { x, w } — canvas 픽셀 기준 화면에 보이는 영역 (portrait 클리핑 대응)
  drawHUD(ctx, state, hudRegion = null) {
    const { player, gameTime, totalTime, level, xp, xpNeeded, kills, charDef } = state;
    const W = this.canvas.width;

    // 가시 영역 (기본 = 전체 캔버스)
    const VX    = hudRegion ? hudRegion.x : 0;
    const VW    = hudRegion ? hudRegion.w : W;
    const VMid  = VX + VW / 2;
    const VRight = VX + VW;
    const PAD   = 10;

    // UI 스케일: 가시 너비 280px 기준, 최대 1.0 (너비 좁을수록 작아짐)
    const S = Math.min(1.0, VW / 280);

    // ── HP Bar ──────────────────────────────────────────────
    const barW  = Math.round(Math.min(200, VW * 0.48) * S);
    const barH  = Math.round(15 * S);
    const barX  = VX + PAD;
    const barY  = 10;
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = '#00000099';
    ctx.fillRect(barX, barY, barW, barH);
    const hpColor = hpRatio > 0.5 ? '#44ff88' : hpRatio > 0.25 ? '#ffcc00' : '#ff4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, Math.round(10 * S))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`♥ ${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`, barX + barW / 2, barY + barH - 2);

    // ── XP Bar ──────────────────────────────────────────────
    const xpY = barY + barH + 2;
    const xpH = Math.round(6 * S);
    ctx.fillStyle = '#00000099';
    ctx.fillRect(barX, xpY, barW, xpH);
    ctx.fillStyle = '#8844ff';
    ctx.fillRect(barX, xpY, barW * (xp / xpNeeded), xpH);
    ctx.strokeStyle = '#ffffff33';
    ctx.strokeRect(barX, xpY, barW, xpH);

    // ── Level badge + Character name ────────────────────────
    const lvlY  = xpY + xpH + 3;
    const lvlH  = Math.round(17 * S);
    const lvlBW = Math.round(42 * S);
    ctx.fillStyle = '#8844ff';
    ctx.beginPath(); ctx.roundRect(barX, lvlY, lvlBW, lvlH, 3); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, Math.round(10 * S))}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${level}`, barX + 4, lvlY + lvlH - 3);
    ctx.fillStyle = charDef.color;
    ctx.font = `bold ${Math.max(8, Math.round(10 * S))}px sans-serif`;
    ctx.fillText(`${charDef.name} ${charDef.subtitle}`, barX + lvlBW + 5, lvlY + lvlH - 3);

    // ── Timer (visible 중앙 상단) ────────────────────────────
    const remaining = Math.max(0, totalTime - gameTime);
    const tmW = Math.round(90 * S), tmH = Math.round(24 * S);
    ctx.fillStyle = '#000000aa';
    ctx.beginPath(); ctx.roundRect(VMid - tmW / 2, barY, tmW, tmH, 5); ctx.fill();
    ctx.fillStyle = gameTime > totalTime * 0.8 ? '#ff6644' : '#fff';
    ctx.font = `bold ${Math.max(9, Math.round(15 * S))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(remaining), VMid, barY + tmH * 0.77);

    // ── Kills (visible 우측 상단) ────────────────────────────
    const klW = Math.round(76 * S), klH = Math.round(20 * S);
    ctx.fillStyle = '#000000aa';
    ctx.beginPath(); ctx.roundRect(VRight - klW - PAD, barY, klW, klH, 4); ctx.fill();
    ctx.fillStyle = '#ffcc44';
    ctx.font = `${Math.max(8, Math.round(11 * S))}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`💀 ${kills}`, VRight - PAD - 3, barY + klH * 0.77);

    ctx.textAlign = 'left';
  }

  // ── WEAPON ICONS (bottom HUD) ───────────────────────────
  drawWeaponBar(ctx, weapons, items, hudRegion = null) {
    const H = this.canvas.height;
    const W = this.canvas.width;

    const VX   = hudRegion ? hudRegion.x : 0;
    const VW   = hudRegion ? hudRegion.w : W;
    const VMid = VX + VW / 2;

    // UI 스케일 (좁은 화면에서 작게)
    const S = Math.min(1.0, VW / 280);
    const slotW = Math.round(46 * S), slotH = Math.round(46 * S);
    const gap   = Math.round(5 * S);

    const all = [...weapons.map(w => ({ ...w, isWeapon: true })), ...items.map(i => ({ ...i, isWeapon: false }))];
    const count = Math.min(all.length, 12);
    const totalW = count * (slotW + gap) - gap;
    let startX = VMid - totalW / 2;
    const y = H - slotH - 8;

    for (const slot of all) {
      ctx.fillStyle = '#000000bb';
      ctx.strokeStyle = slot.isWeapon ? slot.def.color : '#888';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(startX, y, slotW, slotH, 5); ctx.fill(); ctx.stroke();

      const iconSize = Math.round(26 * S);
      const iconX = startX + (slotW - iconSize) / 2;
      const iconY = y + Math.round(5 * S);
      const drawnIcon = SPRITES.drawItem(ctx, slot.def.id, iconX, iconY, iconSize);
      if (!drawnIcon) {
        ctx.font = `${Math.round(22 * S)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(slot.def.icon, startX + slotW / 2, y + slotH * 0.65);
      }

      ctx.fillStyle = '#ffe066';
      ctx.font = `bold ${Math.max(7, Math.round(9 * S))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${slot.level}`, startX + slotW / 2, y + slotH - 3);

      if (slot.isWeapon && slot.cooldownTimer > 0) {
        const ratio = slot.cooldownTimer / (slot.def.levels[slot.level-1].cooldown * (slot.cdMult || 1));
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.moveTo(startX + slotW / 2, y + slotH / 2);
        ctx.arc(startX + slotW / 2, y + slotH / 2, slotW * 0.43, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.closePath(); ctx.fill();
      }

      startX += slotW + gap;
    }
  }
}

// Draw character portrait on a small canvas (for character select)
function drawCharPortrait(canvas, charDef, scale = 1.15) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sprite-based portrait
  const sprScale = Math.max(1, Math.floor(Math.min(canvas.width / 16, canvas.height / 32) * 0.82));
  const dw = 16 * sprScale;
  const dh = 32 * sprScale;
  const dx = (canvas.width - dw) / 2;
  const dy = (canvas.height - dh) / 2;
  const sprId = charDef.spriteId || charDef.id;
  const drawn = SPRITES.drawChar(ctx, sprId, dx, dy, sprScale, 1, false);
  if (!drawn) {
    // Fallback: canvas-drawn character
    const R = new Renderer(canvas);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 14);
    ctx.scale(scale, scale);
    R._drawCharBody(ctx, charDef);
    ctx.restore();
  }
}
