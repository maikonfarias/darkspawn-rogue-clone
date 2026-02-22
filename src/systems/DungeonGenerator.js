// ============================================================
//  Darkspawn Rogue Quest — BSP Dungeon Generator
// ============================================================
import { TILE, MAP_W, MAP_H, DUNGEON_CFG } from '../data/Constants.js';
import { rand, chance, pick, shuffle } from '../utils/Random.js';

const { MIN_ROOM_W, MIN_ROOM_H, MAX_ROOM_W, MAX_ROOM_H, BSP_MIN_SIZE } = DUNGEON_CFG;

// ── BSP Node ─────────────────────────────────────────────────
class BSPNode {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.left = null; this.right = null;
    this.room = null; // { x, y, w, h }
  }

  split() {
    if (this.left) return false;
    // Decide horizontal or vertical split
    let horizontal = chance(0.5);
    if (this.w > this.h * 1.25) horizontal = false;
    else if (this.h > this.w * 1.25) horizontal = true;

    const maxSize = horizontal ? this.h - BSP_MIN_SIZE : this.w - BSP_MIN_SIZE;
    if (maxSize <= BSP_MIN_SIZE) return false;

    const splitPos = rand(BSP_MIN_SIZE, maxSize);
    if (horizontal) {
      this.left  = new BSPNode(this.x, this.y, this.w, splitPos);
      this.right = new BSPNode(this.x, this.y + splitPos, this.w, this.h - splitPos);
    } else {
      this.left  = new BSPNode(this.x, this.y, splitPos, this.h);
      this.right = new BSPNode(this.x + splitPos, this.y, this.w - splitPos, this.h);
    }
    return true;
  }

  isLeaf() { return !this.left && !this.right; }

  createRoom() {
    if (!this.isLeaf()) {
      if (this.left) this.left.createRoom();
      if (this.right) this.right.createRoom();
      return;
    }
    const rw = rand(MIN_ROOM_W, Math.min(MAX_ROOM_W, this.w - 2));
    const rh = rand(MIN_ROOM_H, Math.min(MAX_ROOM_H, this.h - 2));
    const rx = rand(this.x + 1, this.x + this.w - rw - 1);
    const ry = rand(this.y + 1, this.y + this.h - rh - 1);
    this.room = { x: rx, y: ry, w: rw, h: rh };
  }

  getRoom() {
    if (this.room) return this.room;
    const lr = this.left?.getRoom();
    const rr = this.right?.getRoom();
    if (!lr) return rr;
    if (!rr) return lr;
    return chance(0.5) ? lr : rr;
  }

  getAllRooms() {
    const rooms = [];
    const collect = (node) => {
      if (!node) return;
      if (node.room) rooms.push(node.room);
      collect(node.left);
      collect(node.right);
    };
    collect(this);
    return rooms;
  }
}

// ── Map Grid Helpers ─────────────────────────────────────────

function createGrid(w, h, fill = TILE.WALL) {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

function inBounds(x, y, w = MAP_W, h = MAP_H) {
  return x >= 0 && y >= 0 && x < w && y < h;
}

function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.h; y++)
    for (let x = room.x; x < room.x + room.w; x++)
      grid[y][x] = TILE.FLOOR;
}

function carveHCorridor(grid, x1, x2, y) {
  const xMin = Math.min(x1, x2), xMax = Math.max(x1, x2);
  for (let x = xMin; x <= xMax; x++) {
    if (inBounds(x, y)) grid[y][x] = TILE.FLOOR;
  }
}

function carveVCorridor(grid, y1, y2, x) {
  const yMin = Math.min(y1, y2), yMax = Math.max(y1, y2);
  for (let y = yMin; y <= yMax; y++) {
    if (inBounds(x, y)) grid[y][x] = TILE.FLOOR;
  }
}

function connectRooms(grid, r1, r2) {
  const cx1 = Math.floor(r1.x + r1.w / 2);
  const cy1 = Math.floor(r1.y + r1.h / 2);
  const cx2 = Math.floor(r2.x + r2.w / 2);
  const cy2 = Math.floor(r2.y + r2.h / 2);

  if (chance(0.5)) {
    carveHCorridor(grid, cx1, cx2, cy1);
    carveVCorridor(grid, cy1, cy2, cx2);
  } else {
    carveVCorridor(grid, cy1, cy2, cx1);
    carveHCorridor(grid, cx1, cx2, cy2);
  }
  // Place a door at the junction
  if (inBounds(cx2, cy1)) grid[cy1][cx2] = TILE.DOOR;
}

function connectBSP(grid, node) {
  if (!node || node.isLeaf()) return;
  connectBSP(grid, node.left);
  connectBSP(grid, node.right);
  const r1 = node.left?.getRoom();
  const r2 = node.right?.getRoom();
  if (r1 && r2) connectRooms(grid, r1, r2);
}

// Center of a room
function center(room) {
  return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
}

// Random floor tile inside a room (not center, for variety)
function randInRoom(room) {
  return {
    x: rand(room.x + 1, room.x + room.w - 2),
    y: rand(room.y + 1, room.y + room.h - 2),
  };
}

// ── Main Generator ───────────────────────────────────────────

export function generateDungeon(floor) {
  const grid = createGrid(MAP_W, MAP_H);

  // Build BSP tree
  const root = new BSPNode(0, 0, MAP_W, MAP_H);
  const iterations = 5;
  let nodes = [root];
  for (let i = 0; i < iterations; i++) {
    const next = [];
    for (const n of nodes) {
      if (n.split()) next.push(n.left, n.right);
      else next.push(n);
    }
    nodes = next;
  }

  root.createRoom();
  connectBSP(grid, root);

  const rooms = root.getAllRooms();
  // Carve all rooms into grid
  for (const r of rooms) carveRoom(grid, r);

  // Shuffle rooms for random start/end
  const shuffled = shuffle([...rooms]);

  // Stairs up in first room (or skip on floor 1)
  const startRoom = shuffled[0];
  const startPos = center(startRoom);
  if (floor > 1) {
    grid[startPos.y][startPos.x] = TILE.STAIRS_UP;
  }

  // Stairs down in last room
  const endRoom = shuffled[shuffled.length - 1];
  const endPos = center(endRoom);
  grid[endPos.y][endPos.x] = TILE.STAIRS_DOWN;

  // Monster spawn points (not in start/end rooms)
  const monsterRooms = shuffled.slice(1, -1);
  const maxMonsters = DUNGEON_CFG.MAX_MONSTERS_BASE + Math.floor(floor * 1.5);
  const monsterSpawns = [];
  for (let i = 0; i < maxMonsters; i++) {
    if (monsterRooms.length === 0) break;
    const room = pick(monsterRooms);
    monsterSpawns.push(randInRoom(room));
  }

  // Item spawn points
  const maxItems = DUNGEON_CFG.MAX_ITEMS_BASE + Math.floor(floor * 0.8);
  const itemSpawns = [];
  for (let i = 0; i < maxItems; i++) {
    const room = pick(shuffled);
    itemSpawns.push(randInRoom(room));
  }

  // Treasure chests (1–2 per floor)
  const numChests = rand(1, 2);
  const chestSpawns = [];
  for (let i = 0; i < numChests; i++) {
    const room = pick(monsterRooms.length ? monsterRooms : shuffled);
    const pos = randInRoom(room);
    grid[pos.y][pos.x] = TILE.CHEST_CLOSED;
    chestSpawns.push(pos);
  }

  // Hidden traps (rare)
  const numTraps = rand(0, 3);
  for (let i = 0; i < numTraps; i++) {
    const room = pick(monsterRooms.length ? monsterRooms : shuffled);
    const pos = randInRoom(room);
    if (grid[pos.y][pos.x] === TILE.FLOOR) {
      grid[pos.y][pos.x] = TILE.TRAP_HIDDEN;
    }
  }

  return {
    grid,
    rooms: shuffled,
    startPos,
    endPos,
    monsterSpawns,
    itemSpawns,
    chestSpawns,
    width: MAP_W,
    height: MAP_H,
  };
}

// Passability check used by pathfinders
export function isPassable(grid, x, y) {
  if (!inBounds(x, y)) return false;
  const t = grid[y][x];
  return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.STAIRS_DOWN ||
         t === TILE.STAIRS_UP || t === TILE.CHEST_OPEN ||
         t === TILE.TRAP_HIDDEN || t === TILE.TRAP_VISIBLE;
}

export function isWalkable(grid, x, y) {
  // same as passable but excludes chests
  if (!inBounds(x, y)) return false;
  const t = grid[y][x];
  return t === TILE.FLOOR || t === TILE.DOOR || t === TILE.STAIRS_DOWN ||
         t === TILE.STAIRS_UP || t === TILE.TRAP_HIDDEN || t === TILE.TRAP_VISIBLE;
}
