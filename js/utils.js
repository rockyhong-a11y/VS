// ============================================================
//  UTILITIES
// ============================================================

function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function distSq(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function normalize(dx, dy) {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return '#' + ((1 << 24) | (rr << 16) | (rg << 8) | rb).toString(16).slice(1);
}

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Spawn position: random edge of visible area
function randomSpawnPos(camX, camY, cw, ch, margin = 80) {
  const side = randomInt(0, 3);
  let x, y;
  switch (side) {
    case 0: x = camX - margin; y = camY + randomInRange(0, ch); break;
    case 1: x = camX + cw + margin; y = camY + randomInRange(0, ch); break;
    case 2: x = camX + randomInRange(0, cw); y = camY - margin; break;
    case 3: x = camX + randomInRange(0, cw); y = camY + ch + margin; break;
  }
  x = clamp(x, 0, WORLD_W);
  y = clamp(y, 0, WORLD_H);
  return { x, y };
}

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple pool class
class Pool {
  constructor(create) {
    this._create = create;
    this._pool = [];
    this.active = [];
  }
  get(...args) {
    const obj = this._pool.pop() || this._create(...args);
    this.active.push(obj);
    return obj;
  }
  release(obj) {
    const i = this.active.indexOf(obj);
    if (i !== -1) this.active.splice(i, 1);
    this._pool.push(obj);
  }
  releaseAll() {
    for (const o of this.active) this._pool.push(o);
    this.active = [];
  }
}
