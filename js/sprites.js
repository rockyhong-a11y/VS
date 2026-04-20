// ============================================================
//  SPRITES — 스프라이트시트 로드 및 좌표 맵
//  characters.png : 16×32px  / 30cols × 6rows  (fallback)
//  items.png      : 16×16px  / 4cols  × 31rows
//  vfx.png        : 다양한 크기 이펙트 아틀라스
//  img/chars/ID_sheet.png : 캐릭터별 수평 스프라이트시트 (RGBA)
// ============================================================

const CHAR_SW = 16, CHAR_SH = 32;   // 기존 스프라이트시트 1프레임 크기
const ITEM_SW = 16, ITEM_SH = 16;   // 아이템 아이콘 크기

// ── 캐릭터별 스프라이트시트 메타 [프레임W, 프레임H, 프레임수] ──
const CHAR_FRAME_MAP = {
  mari:    [96,  148, 4],
  neodim:  [108, 144, 6],
  death:   [164, 200, 3],
  pokerou: [104, 136, 5],
  fenrir:  [104, 148, 4],
  lama:    [140, 200, 7],
  sowan:   [100, 148, 7],
  lea:     [84,  136, 4],
};

// ── 무기/아이템 아이콘 위치 [col, row] ────────────────────────
const ITEM_SPRITE_MAP = {
  whip:          [0, 0],
  magicWand:     [1, 0],  arrow: [1, 0],
  runetracer:    [2, 0],
  kingBible:     [3, 0],  magicOrb: [3, 0],
  fireWand:      [0, 1],
  garlic:        [1, 1],
  holyWater:     [2, 1],
  lightningRing: [3, 1],  thunder: [3, 1],
  gun:           [0, 2],  bullet: [0, 2],
  sword:         [1, 2],
  cross:         [2, 2],
  bone:          [3, 2],
  cherryBomb:    [0, 3],
  ebonyWings:    [1, 3],
  explosion:     [2, 3],
};

// ── VFX 스프라이트 위치 (vfx.png 내 절대 픽셀 좌표) ──────────
const VFX_MAP = {
  aura:       { x: 0,   y: 0,   w: 130, h: 130 },
  explosion:  { x: 150, y: 4,   w: 42,  h: 42  },
  hit:        { x: 210, y: 10,  w: 18,  h: 18  },
  ring:       { x: 145, y: 60,  w: 30,  h: 30  },
  bolt:       { x: 280, y: 0,   w: 16,  h: 32  },
  water_drop: { x: 320, y: 0,   w: 16,  h: 16  },
  sparkle:    { x: 345, y: 5,   w: 12,  h: 12  },
  fire:       { x: 370, y: 0,   w: 20,  h: 24  },
  cross_vfx:  { x: 240, y: 0,   w: 22,  h: 22  },
  orb:        { x: 392, y: 0,   w: 16,  h: 16  },
};

// ── 스프라이트 로더 ──────────────────────────────────────────
const SPRITES = {
  characters: null,   // fallback 스프라이트시트
  items: null,
  vfx: null,
  charSheets: {},     // { id: HTMLImageElement } 캐릭터별 시트
  _loaded: 0,
  _total: 0,
  _ready: false,

  load(callback) {
    // 로드할 파일 수: items + vfx + 8개 캐릭터 시트 (characters.png는 옵션)
    const charIds = Object.keys(CHAR_FRAME_MAP);
    this._total = 2 + charIds.length;  // items, vfx, + N charSheets
    this._loaded = 0;

    const done = () => {
      if (++this._loaded >= this._total) {
        this._ready = true;
        callback && callback();
      }
    };

    // items, vfx
    ['items', 'vfx'].forEach(key => {
      const img = new Image();
      img.onload = done;
      img.onerror = () => { console.warn(`[SPRITES] 로드 실패: img/${key}.png`); done(); };
      img.src = `img/${key}.png`;
      this[key] = img;
    });

    // 캐릭터별 수평 스프라이트시트
    charIds.forEach(id => {
      const img = new Image();
      img.onload = done;
      img.onerror = () => { console.warn(`[SPRITES] 캐릭터시트 로드 실패: ${id}`); done(); };
      img.src = `img/chars/${id}_sheet.png`;
      this.charSheets[id] = img;
    });
  },

  ready() { return this._ready; },

  // ── 캐릭터 스프라이트 그리기 ──────────────────────────────
  // frameIdx: 애니메이션 프레임 인덱스 (0~N-1)
  // targetH: 캔버스에 그릴 목표 높이 (px). 0이면 원본 크기
  drawChar(ctx, charId, dx, dy, targetH = 80, facing = 1, flash = false, frameIdx = 0) {
    const meta = CHAR_FRAME_MAP[charId];
    const sheet = this.charSheets[charId];
    if (!meta || !sheet?.complete || !sheet.naturalWidth) return false;

    const [fw, fh, fc] = meta;
    const fi = Math.floor(frameIdx) % fc;
    const sx = fw * fi;
    const scale = targetH / fh;
    const dw = Math.round(fw * scale);
    const dh = Math.round(fh * scale);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (facing < 0) {
      ctx.translate(dx + dw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, sx, 0, fw, fh, 0, dy, dw, dh);
      if (flash) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(0, dy, dw, dh);
      }
    } else {
      ctx.drawImage(sheet, sx, 0, fw, fh, dx, dy, dw, dh);
      if (flash) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(dx, dy, dw, dh);
      }
    }
    ctx.restore();
    return true;
  },

  // ── 아이템 아이콘 그리기 ──────────────────────────────────
  drawItem(ctx, weaponId, dx, dy, size = 16) {
    const pos = ITEM_SPRITE_MAP[weaponId];
    if (!pos || !this.items?.complete || !this.items.naturalWidth) return false;
    const [col, row] = pos;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.items,
      col * ITEM_SW, row * ITEM_SH, ITEM_SW, ITEM_SH,
      dx, dy, size, size
    );
    return true;
  },

  // ── VFX 스프라이트 그리기 ────────────────────────────────
  drawVfx(ctx, vfxId, dx, dy, dw, dh, alpha = 1) {
    const v = VFX_MAP[vfxId];
    if (!v || !this.vfx?.complete || !this.vfx.naturalWidth) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.vfx, v.x, v.y, v.w, v.h, dx, dy, dw, dh);
    ctx.restore();
    return true;
  },

  // ── 캐릭터 프레임 수 반환 ─────────────────────────────────
  frameCount(charId) {
    return CHAR_FRAME_MAP[charId]?.[2] ?? 1;
  },

  // ── 캐릭터 원본 비율 (w/h) ───────────────────────────────
  charAspect(charId) {
    const m = CHAR_FRAME_MAP[charId];
    return m ? m[0] / m[1] : 0.5;
  },
};
