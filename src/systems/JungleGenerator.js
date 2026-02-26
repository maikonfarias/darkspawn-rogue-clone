// ============================================================
//  Darkspawn Rogue Quest — Jungle Generator
// ============================================================
// Generates jungle levels: tree walls, grass floors.
// Travel direction is west → east.
//   JUNGLE_ENTRY on the left edge  → return to previous level / town
//   JUNGLE_EXIT  on the right edge → advance to next jungle level
// ============================================================
import { TILE, MAP_W, MAP_H } from '../data/Constants.js';
import { rand, chance, pick } from '../utils/Random.js';

// ── Config ────────────────────────────────────────────────────
const MARGIN   = 3;   // tree border around map edges
const MIN_ROOMS = 5;
const MAX_ROOMS = 8;
const MIN_W = 6;  const MAX_W = 14;
const MIN_H = 5;  const MAX_H = 10;

// ── Helpers ───────────────────────────────────────────────────

function createGrid(w, h, fill) {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

/** Carve a rectangular room with TILE.GRASS. */
function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++)
      if (inBounds(x, y)) grid[y][x] = TILE.GRASS;
}

/** Carve a horizontal grass corridor. */
function carveH(grid, x1, x2, y) {
  const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
  for (let x = xMin; x <= xMax; x++)
    if (inBounds(x, y)) grid[y][x] = TILE.GRASS;
}

/** Carve a vertical grass corridor. */
function carveV(grid, y1, y2, x) {
  const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
  for (let y = yMin; y <= yMax; y++)
    if (inBounds(x, y)) grid[y][x] = TILE.GRASS;
}

/** Connect two rooms with an L-shaped grass corridor. */
function connectRooms(grid, r1, r2) {
  const cx1 = Math.floor(r1.x + r1.w / 2);
  const cy1 = Math.floor(r1.y + r1.h / 2);
  const cx2 = Math.floor(r2.x + r2.w / 2);
  const cy2 = Math.floor(r2.y + r2.h / 2);
  if (chance(0.5)) {
    carveH(grid, cx1, cx2, cy1);
    carveV(grid, cy1, cy2, cx2);
  } else {
    carveV(grid, cy1, cy2, cx1);
    carveH(grid, cx1, cx2, cy2);
  }
}

// ── Main Generator ────────────────────────────────────────────

/**
 * Generate a jungle level.
 * @param {number} jungleFloor  1–10
 * @returns dungeon-compatible object
 */
export function generateJungle(jungleFloor) {
  // Start with solid forest
  const grid = createGrid(MAP_W, MAP_H, TILE.TREE);

  const numRooms = rand(MIN_ROOMS, MAX_ROOMS);
  const rooms = [];

  // Usable play area
  const areaX = MARGIN + 2;
  const areaY = MARGIN;
  const areaW = MAP_W - MARGIN * 2 - 4;  // leave room for entry/exit corridors
  const areaH = MAP_H - MARGIN * 2;

  // Divide the usable width into column zones, one room per zone
  const zoneW = Math.floor(areaW / numRooms);

  for (let i = 0; i < numRooms; i++) {
    const zoneX = areaX + i * zoneW;
    const rw = rand(MIN_W, Math.min(MAX_W, zoneW - 2));
    const rh = rand(MIN_H, Math.min(MAX_H, areaH - 2));
    const rx = rand(zoneX + 1, zoneX + zoneW - rw - 1);
    const ry = rand(areaY + 1, areaY + areaH - rh - 1);
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
  }

  // Sort rooms west to east by centre x
  rooms.sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));

  // Carve rooms
  for (const room of rooms) carveRoom(grid, room);

  // Connect adjacent rooms sequentially (west → east chain)
  for (let i = 0; i < rooms.length - 1; i++) {
    connectRooms(grid, rooms[i], rooms[i + 1]);
  }

  // ── Entry / Exit ──────────────────────────────────────────

  const firstRoom = rooms[0];
  const lastRoom  = rooms[rooms.length - 1];

  const entryY = Math.floor(firstRoom.y + firstRoom.h / 2);
  const exitY  = Math.floor(lastRoom.y  + lastRoom.h  / 2);

  // Carve a short corridor from left map edge to first room
  const entryX = MARGIN;
  carveH(grid, entryX, firstRoom.x, entryY);
  grid[entryY][entryX] = TILE.JUNGLE_ENTRY;   // left-edge passage tile

  // Carve a short corridor from last room to right map edge
  const exitX = MAP_W - 1 - MARGIN;
  carveH(grid, lastRoom.x + lastRoom.w - 1, exitX, exitY);
  // On floor 10 the exit is sealed until the Witch Doctor is defeated
  if (jungleFloor < 10) {
    grid[exitY][exitX] = TILE.JUNGLE_EXIT;     // right-edge passage tile
  }

  // Player start position: one tile right of the entry arch
  const startPos = { x: entryX + 1, y: entryY };
  // End pos for caching (where player lands when retreating from next floor)
  const endPos   = { x: exitX - 1, y: exitY };

  // ── Scatter chests in random rooms (not first or last) ────
  const chestSpawns = [];
  const midRooms = rooms.slice(1, rooms.length - 1);
  for (const room of midRooms) {
    if (chance(0.35)) {
      chestSpawns.push({
        x: rand(room.x + 1, room.x + room.w - 2),
        y: rand(room.y + 1, room.y + room.h - 2),
      });
    }
  }

  // Place chest tiles
  for (const cs of chestSpawns) {
    grid[cs.y][cs.x] = TILE.CHEST_CLOSED;
  }

  // ── Monster spawns: random grass tiles in rooms ───────────
  const monsterSpawns = [];
  const maxMonsters = 4 + jungleFloor;
  const candidateRooms = rooms.slice(1); // skip start room

  for (let i = 0; i < maxMonsters * 2 && monsterSpawns.length < maxMonsters; i++) {
    const room = pick(candidateRooms);
    const mx = rand(room.x + 1, room.x + room.w - 2);
    const my = rand(room.y + 1, room.y + room.h - 2);
    // Avoid duplicates and endPos
    const conflict = monsterSpawns.some(s => s.x === mx && s.y === my)
      || (mx === endPos.x && my === endPos.y);
    if (!conflict) monsterSpawns.push({ x: mx, y: my });
  }

  // ── Item spawns: random grass tiles ───────────────────────
  const itemSpawns = [];
  const maxItems = 2 + Math.floor(jungleFloor / 2);
  for (let i = 0; i < maxItems * 3 && itemSpawns.length < maxItems; i++) {
    const room = pick(rooms);
    const ix = rand(room.x + 1, room.x + room.w - 2);
    const iy = rand(room.y + 1, room.y + room.h - 2);
    const conflict = itemSpawns.some(s => s.x === ix && s.y === iy)
      || monsterSpawns.some(s => s.x === ix && s.y === iy);
    if (!conflict) itemSpawns.push({ x: ix, y: iy });
  }

  return {
    grid,
    rooms,
    startPos,
    endPos,
    monsterSpawns,
    itemSpawns,
    chestSpawns,
    forcedMonsters: [],
    forcedItems:    [],
    width:  MAP_W,
    height: MAP_H,
  };
}
