// ============================================================
//  SPRITES — 스프라이트시트 로드 및 좌표 맵
//  characters.png : 16×32px  / 30cols × 6rows
//  items.png      : 16×16px  / 4cols  × 31rows
//  vfx.png        : 다양한 크기 이펙트 아틀라스
// ============================================================

const CHAR_SW = 16, CHAR_SH = 32;   // 캐릭터 스프라이트 1프레임 크기
const ITEM_SW = 16, ITEM_SH = 16;   // 아이템 아이콘 크기

// ── 캐릭터 스프라이트 위치 [col, row] ─────────────────────
// 각 캐릭터 그룹의 3개 프레임 중 가장 선명한 standing 프레임 선택 (width=16)
const CHAR_SPRITE_MAP = {
  antonio:    [14, 0],   // 뽀끄루
  imelda:     [16, 0],   // 레프리콘
  pasqualina: [19, 0],   // 불굴의 마리
  gennaro:    [21, 0],   // 천아
  arca:       [12, 1],   // 라미엘
  porta:      [23, 1],   // 레아
  poe:        [26, 1],   // 드라큐리나
  clerici:    [16, 2],   // 알딸딸 키르케
  dommario:   [21, 2],   // 네오딤
  mortaccio:  [25, 2],   // 펜리르
  krochi:     [21, 3],   // 소완
  cavallo:    [24, 3],   // 야타 카발로
  lama:       [1,  4],   // 라마 라돈나
  exdash:     [6,  4],   // 무적의 용
  seika:      [15, 4],   // 세이카
  noa:        [24, 4],   // 노아
};

// ── 무기/아이템 아이콘 위치 [col, row] ────────────────────
// items.png 4cols × 16px: VS 무기 순서 추정
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

// ── VFX 스프라이트 위치 (vfx.png 내 절대 픽셀 좌표) ──────
// 시각 분석: 상단 대형 구체(가릭 오라), 폭발, 타격 이펙트 등
const VFX_MAP = {
  aura:       { x: 0,   y: 0,   w: 130, h: 130 },  // 대형 구체 (마늘 오라)
  explosion:  { x: 150, y: 4,   w: 42,  h: 42  },  // 폭발 스타버스트
  hit:        { x: 210, y: 10,  w: 18,  h: 18  },  // 소형 타격
  ring:       { x: 145, y: 60,  w: 30,  h: 30  },  // 링 이펙트
  bolt:       { x: 280, y: 0,   w: 16,  h: 32  },  // 번개
  water_drop: { x: 320, y: 0,   w: 16,  h: 16  },  // 물방울
  sparkle:    { x: 345, y: 5,   w: 12,  h: 12  },  // 반짝임
  fire:       { x: 370, y: 0,   w: 20,  h: 24  },  // 불꽃
  cross_vfx:  { x: 240, y: 0,   w: 22,  h: 22  },  // 십자가 이펙트
  orb:        { x: 392, y: 0,   w: 16,  h: 16  },  // 구체
};

// ── 스프라이트 로더 ────────────────────────────────────────
const SPRITES = {
  characters: null,
  items: null,
  vfx: null,
  _loaded: 0,
  _total: 3,
  _ready: false,

  load(callback) {
    const done = () => {
      if (++this._loaded >= this._total) {
        this._ready = true;
        callback && callback();
      }
    };
    ['characters', 'items', 'vfx'].forEach(key => {
      const img = new Image();
      img.onload = done;
      img.onerror = () => { console.warn(`[SPRITES] 로드 실패: img/${key}.png`); done(); };
      img.src = `img/${key}.png`;
      this[key] = img;
    });
  },

  ready() { return this._ready; },

  // ── 캐릭터 스프라이트 그리기 ────────────────────────────
  // dx,dy: 스프라이트 좌상단, scale: 확대 배율, facing: 1=오른쪽/-1=왼쪽
  drawChar(ctx, charId, dx, dy, scale = 1, facing = 1, flash = false) {
    const pos = CHAR_SPRITE_MAP[charId];
    if (!pos || !this.characters?.complete || !this.characters.naturalWidth) return false;
    const [col, row] = pos;
    const sx = col * CHAR_SW, sy = row * CHAR_SH;
    const dw = CHAR_SW * scale, dh = CHAR_SH * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (facing < 0) {
      ctx.translate(dx + dw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.characters, sx, sy, CHAR_SW, CHAR_SH, 0, dy, dw, dh);
      if (flash) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(0, dy, dw, dh);
      }
    } else {
      ctx.drawImage(this.characters, sx, sy, CHAR_SW, CHAR_SH, dx, dy, dw, dh);
      if (flash) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fillRect(dx, dy, dw, dh);
      }
    }
    ctx.restore();
    return true;
  },

  // ── 아이템 아이콘 그리기 ────────────────────────────────
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
};
