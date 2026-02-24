// ============================================================
//  Darkspawn Rogue Quest — Town Generator (fixed layout)
// ============================================================
// Generates the always-identical starting town (floor 0).
// Layout: green grass field with two 3×3 buildings.
//   Building 1 (left)  — dungeon entrance: contains stairs down.
//   Building 2 (right) — elder's hut:      contains the NPC.
// ============================================================
import { TILE, MAP_W, MAP_H } from '../data/Constants.js';

// Building dimensions (outer footprint)
const BLD_W = 3;
const BLD_H = 3;

// Horizontal centres of the two buildings
const BLD1_CX = Math.floor(MAP_W * 0.3);   // ≈ 24
const BLD2_CX = Math.floor(MAP_W * 0.7);   // ≈ 56
// Shared vertical centre row for both buildings
const BLD_CY   = Math.floor(MAP_H * 0.4);  // ≈ 20

// Player starting position — centred below the buildings
export const TOWN_START_X = Math.floor(MAP_W / 2);
export const TOWN_START_Y = BLD_CY + 6;

// ── Helpers ──────────────────────────────────────────────────

function createGrid(w, h, fill) {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

/**
 * Place a 3×3 building whose top-left corner is (bx, by).
 * Layout:
 *   W W W
 *   W C W   C = centre tile (passed in as `centreTile`)
 *   W D W   D = DOOR at the bottom-centre
 */
function placeBuilding(grid, bx, by, centreTile) {
  for (let dy = 0; dy < BLD_H; dy++) {
    for (let dx = 0; dx < BLD_W; dx++) {
      const x = bx + dx;
      const y = by + dy;
      if (dy === 0 || dx === 0 || dx === BLD_W - 1) {
        // top row and side columns → wall
        grid[y][x] = TILE.WALL;
      } else if (dy === BLD_H - 1) {
        // bottom-centre → door
        grid[y][x] = TILE.DOOR;
      } else {
        // interior centre
        grid[y][x] = centreTile;
      }
    }
  }
  // Bottom corners are walls
  grid[by + BLD_H - 1][bx]             = TILE.WALL;
  grid[by + BLD_H - 1][bx + BLD_W - 1] = TILE.WALL;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Build the fixed town map and return a dungeon-compatible object.
 *
 * Returned shape matches what _loadFloor() expects:
 *   { grid, rooms, startPos, endPos, monsterSpawns, itemSpawns, chestSpawns, width, height }
 */
export function generateTown() {
  const grid = createGrid(MAP_W, MAP_H, TILE.GRASS);

  // Top-left corners of both buildings
  const b1x = BLD1_CX - 1;  // centre at BLD1_CX → left edge at BLD1_CX-1
  const b1y = BLD_CY  - 1;
  const b2x = BLD2_CX - 1;
  const b2y = BLD_CY  - 1;

  // Building 1 — dungeon entrance (stairs down in the centre)
  placeBuilding(grid, b1x, b1y, TILE.STAIRS_DOWN);

  // Building 2 — elder's hut (NPC in the centre)
  placeBuilding(grid, b2x, b2y, TILE.NPC);

  // Positions
  const startPos = { x: TOWN_START_X, y: TOWN_START_Y };
  const endPos   = { x: BLD1_CX, y: BLD_CY };  // stairs-down tile

  return {
    grid,
    rooms:        [],
    startPos,
    endPos,
    monsterSpawns: [],
    itemSpawns:    [],
    chestSpawns:   [],
    width:  MAP_W,
    height: MAP_H,
  };
}
