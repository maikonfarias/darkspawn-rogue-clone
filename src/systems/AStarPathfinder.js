// ============================================================
//  Darkspawn Rogue Quest — A* Pathfinder
// ============================================================
import { MAP_W, MAP_H } from '../data/Constants.js';
import { isPassable } from './DungeonGenerator.js';

function heuristic(ax, ay, bx, by) {
  // Chebyshev distance scaled to match cost units (ortho=10, diag=14)
  const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy);
}

function idx(x, y) { return y * MAP_W + x; }

/**
 * Find shortest path from (sx,sy) to (ex,ey) on grid.
 * Returns array of {x,y} steps (excluding start, including end).
 * Returns [] if no path found.
 * @param {number[][]} grid
 * @param {number} sx
 * @param {number} sy
 * @param {number} ex
 * @param {number} ey
 * @param {Set<string>} [occupied]  - set of "x,y" strings to treat as blocked
 * @param {number} [maxDist=30]
 */
export function findPath(grid, sx, sy, ex, ey, occupied = new Set(), maxDist = 30) {
  if (sx === ex && sy === ey) return [];

  const openSet = new Set([idx(sx, sy)]);
  const cameFrom = new Map();
  const gScore = new Map([[idx(sx, sy), 0]]);
  const fScore = new Map([[idx(sx, sy), heuristic(sx, sy, ex, ey)]]);

  let iters = 0;
  const maxIter = maxDist * maxDist;

  while (openSet.size > 0) {
    if (++iters > maxIter) break;

    // Pick node in openSet with lowest fScore
    let current = -1, bestF = Infinity;
    for (const n of openSet) {
      const f = fScore.get(n) ?? Infinity;
      if (f < bestF) { bestF = f; current = n; }
    }

    const cx = current % MAP_W;
    const cy = Math.floor(current / MAP_W);

    if (cx === ex && cy === ey) {
      // Reconstruct path
      const path = [];
      let cur = current;
      while (cameFrom.has(cur)) {
        path.unshift({ x: cur % MAP_W, y: Math.floor(cur / MAP_W) });
        cur = cameFrom.get(cur);
      }
      return path;
    }

    openSet.delete(current);

    // 8-directional neighbours (orthogonal cost 10, diagonal cost 14)
    const neighbours = [
      { x: cx,     y: cy - 1, cost: 10 }, { x: cx,     y: cy + 1, cost: 10 },
      { x: cx - 1, y: cy,     cost: 10 }, { x: cx + 1, y: cy,     cost: 10 },
      { x: cx - 1, y: cy - 1, cost: 14 }, { x: cx + 1, y: cy - 1, cost: 14 },
      { x: cx - 1, y: cy + 1, cost: 14 }, { x: cx + 1, y: cy + 1, cost: 14 },
    ];

    for (const { x: nx, y: ny, cost } of neighbours) {
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      // Target tile is always passable (to allow reaching it)
      if (nx !== ex || ny !== ey) {
        if (!isPassable(grid, nx, ny)) continue;
        if (occupied.has(`${nx},${ny}`)) continue;
        // Prevent diagonal corner-cutting through walls
        if (cost === 14) {
          if (!isPassable(grid, nx, cy) || !isPassable(grid, cx, ny)) continue;
        }
      }

      const nIdx = idx(nx, ny);
      const tentativeG = (gScore.get(current) ?? Infinity) + cost;

      if (tentativeG < (gScore.get(nIdx) ?? Infinity)) {
        cameFrom.set(nIdx, current);
        gScore.set(nIdx, tentativeG);
        fScore.set(nIdx, tentativeG + heuristic(nx, ny, ex, ey));
        openSet.add(nIdx);
      }
    }
  }

  return []; // no path
}

/**
 * Return the next step toward (ex,ey) or null if blocked.
 */
export function nextStep(grid, sx, sy, ex, ey, occupied) {
  const path = findPath(grid, sx, sy, ex, ey, occupied);
  return path.length > 0 ? path[0] : null;
}
