// ============================================================
//  Darkspawn Rogue Quest — Field of View (Recursive Shadowcasting)
// ============================================================
import { TILE, VIS, MAP_W, MAP_H } from '../data/Constants.js';

// Multipliers for each octant transformation
const OCTANT_MULT = [
  [ 1,  0,  0, -1, -1,  0,  0,  1],
  [ 0,  1, -1,  0,  0, -1,  1,  0],
  [ 0,  1,  1,  0,  0, -1, -1,  0],
  [ 1,  0,  0,  1, -1,  0,  0, -1],
];

function isOpaque(grid, x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  return grid[y][x] === TILE.WALL || grid[y][x] === TILE.VOID || grid[y][x] === TILE.DOOR;
}

function castLight(vis, grid, cx, cy, row, startSlope, endSlope, radius, xx, xy, yx, yy) {
  if (startSlope < endSlope) return;
  const radiusSq = radius * radius;
  let nextStartSlope = startSlope;
  let blocked = false;

  for (let distance = row; distance <= radius && !blocked; distance++) {
    const deltaY = -distance;
    for (let deltaX = -distance; deltaX <= 0; deltaX++) {
      const lSlope = (deltaX - 0.5) / (deltaY + 0.5);
      const rSlope = (deltaX + 0.5) / (deltaY - 0.5);
      if (startSlope < rSlope) continue;
      if (endSlope > lSlope) break;

      const sax = deltaX * xx + deltaY * xy;
      const say = deltaX * yx + deltaY * yy;
      const ax = cx + sax, ay = cy + say;

      if (ax < 0 || ay < 0 || ax >= MAP_W || ay >= MAP_H) continue;

      if (deltaX * deltaX + deltaY * deltaY < radiusSq) {
        if (vis[ay][ax] !== VIS.VISIBLE) vis[ay][ax] = VIS.VISIBLE;
      }

      if (blocked) {
        if (isOpaque(grid, ax, ay)) {
          nextStartSlope = rSlope;
        } else {
          blocked = false;
          startSlope = nextStartSlope;
        }
      } else if (isOpaque(grid, ax, ay)) {
        blocked = true;
        nextStartSlope = rSlope;
        castLight(vis, grid, cx, cy, distance + 1, startSlope, lSlope, radius, xx, xy, yx, yy);
      }
    }
    if (blocked) break;
  }
}

/**
 * Compute FOV using recursive shadowcasting.
 * @param {number[][]} grid  - tile grid
 * @param {number[][]} vis   - visibility grid (modified in place)
 * @param {number} cx        - center x
 * @param {number} cy        - center y
 * @param {number} radius    - view radius in tiles
 */
export function computeFOV(grid, vis, cx, cy, radius) {
  // Reset visible → explored
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      if (vis[y][x] === VIS.VISIBLE) vis[y][x] = VIS.EXPLORED;

  // Mark origin
  vis[cy][cx] = VIS.VISIBLE;

  // Cast for all 8 octants
  for (let oct = 0; oct < 8; oct++) {
    castLight(
      vis, grid, cx, cy,
      1, 1.0, 0.0, radius,
      OCTANT_MULT[0][oct], OCTANT_MULT[1][oct],
      OCTANT_MULT[2][oct], OCTANT_MULT[3][oct]
    );
  }
}

/** Create a fresh visibility grid (all HIDDEN) */
export function createVisGrid(w = MAP_W, h = MAP_H) {
  return Array.from({ length: h }, () => new Array(w).fill(VIS.HIDDEN));
}

/** Reveal entire map (used by scroll of mapping) */
export function revealAll(vis, grid) {
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      if (grid[y][x] !== TILE.VOID)
        vis[y][x] = VIS.EXPLORED;
}
