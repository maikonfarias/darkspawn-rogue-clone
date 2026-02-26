// ============================================================
//  Darkspawn Rogue Quest — Town Generator (fixed layout)
// ============================================================
// Generates the always-identical starting town (floor 0).
// Layout: walled-off grass area with two 5×5 buildings.
//   Building 1 (left)  — dungeon entrance: contains stairs down.
//   Building 2 (right) — elder's hut:      contains the NPC.
// ============================================================
import { TILE, MAP_W, MAP_H } from '../data/Constants.js';

// Building dimensions (outer footprint — interior is 3×3)
const BLD_W = 5;
const BLD_H = 5;

// Enclosed play-area bounds (wall border creates a smaller town)
const AREA_X = 26;   // left wall column
const AREA_Y = 16;   // top wall row
const AREA_W = 28;   // total width  (including border walls)  → right wall at x=53
const AREA_H = 18;   // total height (including border walls)  → bottom wall at y=33

// Building top-left corners (3-tile gap between the two buildings)
const B1X = 34;   // building 1 left edge  → occupies cols 34–38
const B1Y = 19;   // shared top edge
const B2X = 42;   // building 2 left edge  → occupies cols 42–46 (gap: 39–41)
const B2Y = 19;

// Centre of building 1 (used for the stairs-down endPos)
const BLD1_CX = B1X + Math.floor(BLD_W / 2);  // 36
const BLD1_CY = B1Y + Math.floor(BLD_H / 2);  // 21

// Door positions — bottom centre of each building (row = B1Y + BLD_H - 1 = 23)
const B1_DOOR_X = B1X + Math.floor(BLD_W / 2);  // 36
const B2_DOOR_X = B2X + Math.floor(BLD_W / 2);  // 44
const DOOR_Y    = B1Y + BLD_H - 1;               // 23

// Horizontal connecting path row and gate (right wall breach)
const PATH_Y = DOOR_Y + 3;                // 26 — 3 tiles south of the doors
const GATE_X = AREA_X + AREA_W - 1;      // 53 — right wall column
const GATE_Y = PATH_Y;                    // 26

// Player starting position — centred below the buildings
export const TOWN_START_X = AREA_X + Math.floor(AREA_W / 2);  // 40
export const TOWN_START_Y = B1Y + BLD_H + 5;                  // 29

// Gate position (used by GameScene to open the gate on mirror delivery)
export const TOWN_GATE_POS = { x: GATE_X, y: GATE_Y };

// ── Helpers ──────────────────────────────────────────────────

function createGrid(w, h, fill) {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

/**
 * Place a 5×5 building whose top-left corner is (bx, by).
 * Outer ring = walls; inner 3×3 = floor; centre tile = centreTile.
 * Door replaces the bottom-centre wall.
 *
 *   W W W W W
 *   W F F F W   F = floor
 *   W F C F W   C = centre tile (stairs / NPC)
 *   W F F F W
 *   W W D W W   D = DOOR
 */
function placeBuilding(grid, bx, by, centreTile) {
  const midX = Math.floor(BLD_W / 2);  // 2
  const midY = Math.floor(BLD_H / 2);  // 2
  for (let dy = 0; dy < BLD_H; dy++) {
    for (let dx = 0; dx < BLD_W; dx++) {
      const x = bx + dx;
      const y = by + dy;
      if (dy === 0 || dy === BLD_H - 1 || dx === 0 || dx === BLD_W - 1) {
        // outer ring → wall
        grid[y][x] = TILE.WALL;
      } else {
        // inner 3×3 → floor, centre gets the special tile
        grid[y][x] = (dy === midY && dx === midX) ? centreTile : TILE.FLOOR;
      }
    }
  }
  // Door at bottom-centre
  grid[by + BLD_H - 1][bx + midX] = TILE.DOOR;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Build the fixed town map and return a dungeon-compatible object.
 *
 * Returned shape matches what _loadFloor() expects:
 *   { grid, rooms, startPos, endPos, monsterSpawns, itemSpawns, chestSpawns, width, height }
 */
export function generateTown() {
  // Fill entire map with impassable forest trees
  const grid = createGrid(MAP_W, MAP_H, TILE.TREE);

  // Fill the enclosed town interior with grass (inside the wall border)
  for (let y = AREA_Y + 1; y < AREA_Y + AREA_H - 1; y++) {
    for (let x = AREA_X + 1; x < AREA_X + AREA_W - 1; x++) {
      grid[y][x] = TILE.GRASS;
    }
  }

  // Draw the surrounding wall border
  for (let x = AREA_X; x < AREA_X + AREA_W; x++) {
    grid[AREA_Y][x]              = TILE.WALL;  // top row
    grid[AREA_Y + AREA_H - 1][x] = TILE.WALL;  // bottom row
  }
  for (let y = AREA_Y; y < AREA_Y + AREA_H; y++) {
    grid[y][AREA_X]              = TILE.WALL;  // left column
    grid[y][AREA_X + AREA_W - 1] = TILE.WALL;  // right column
  }

  // Building 1 — dungeon entrance (stairs down in the centre)
  placeBuilding(grid, B1X, B1Y, TILE.STAIRS_DOWN);

  // Building 2 — elder's hut (NPC in the centre)
  placeBuilding(grid, B2X, B2Y, TILE.NPC);

  // Vertical paths from each building door southward (3 tiles)
  for (let i = 1; i <= 3; i++) {
    grid[DOOR_Y + i][B1_DOOR_X] = TILE.FLOOR;
    grid[DOOR_Y + i][B2_DOOR_X] = TILE.FLOOR;
  }

  // Horizontal connecting path at PATH_Y — from B1 door eastward to just inside right wall
  for (let x = B1_DOOR_X; x < GATE_X; x++) {
    grid[PATH_Y][x] = TILE.FLOOR;
  }

  // Gate — replace right wall tile with a closed gate (impassable until mirror delivered)
  grid[GATE_Y][GATE_X] = TILE.GATE_CLOSED;

  // Positions
  const startPos = { x: TOWN_START_X, y: TOWN_START_Y };
  const endPos   = { x: BLD1_CX, y: BLD1_CY };  // stairs-down tile

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
