// ============================================================
//  Darkspawn Rogue Quest — Random Utilities
// ============================================================

// Seeded LCG for reproducible dungeons
export class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
  }
  next() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }
  int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  float(min = 0, max = 1) { return this.next() * (max - min) + min; }
  bool(chance = 0.5) { return this.next() < chance; }
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// Global RNG (reseeded per dungeon floor)
export const rng = new SeededRandom();

// Convenience wrappers
export const rand  = (min, max) => rng.int(min, max);
export const randF = (min, max) => rng.float(min, max);
export const chance = (pct)     => rng.bool(pct);
export const pick  = (arr)      => rng.pick(arr);

// Weighted pick: table is [{id, weight}] or [{id, qty}] — uses first numeric field
export function weightedPick(table) {
  const entries = table.map(e => {
    const w = e.weight ?? e.chance ?? e.qty ?? 1;
    return { ...e, _w: typeof w === 'number' ? w : 1 };
  });
  const total = entries.reduce((s, e) => s + e._w, 0);
  let r = rng.float(0, total);
  for (const e of entries) {
    r -= e._w;
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
}

// Clamp
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Manhattan distance
export const manhattan = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

// Euclidean distance
export const euclidean = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

// Shuffle array in place (uses global rng)
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
