// ============================================================
//  Darkspawn Rogue Quest — Constants
// ============================================================

export const TILE_SIZE = 32;   // pixels per tile
export const MAP_W     = 80;   // tiles wide
export const MAP_H     = 50;   // tiles tall

// ── Tile Types ───────────────────────────────────────────────
export const TILE = Object.freeze({
  VOID:         -1,
  WALL:          0,
  FLOOR:         1,
  DOOR:          2,
  STAIRS_DOWN:   3,
  STAIRS_UP:     4,
  WATER:         5,
  LAVA:          6,
  CHEST_CLOSED:  7,
  CHEST_OPEN:    8,
  TRAP_HIDDEN:   9,
  TRAP_VISIBLE: 10,
  GRASS:        11,
  NPC:          12,
  TREE:         13,  // impassable forest tree (outside town walls)
  GATE_CLOSED:  14,  // town gate — opens when shadow mirror is delivered
});

// ── FOV States ───────────────────────────────────────────────
export const VIS = Object.freeze({
  HIDDEN:   0,
  EXPLORED: 1,
  VISIBLE:  2,
});

// ── Item Types ───────────────────────────────────────────────
export const ITEM_TYPE = Object.freeze({
  WEAPON:   'weapon',
  ARMOR:    'armor',
  RING:     'ring',
  AMULET:   'amulet',
  POTION:   'potion',
  SCROLL:   'scroll',
  MATERIAL: 'material',
  GOLD:     'gold',
  QUEST:    'quest',
});

// ── Equipment Slots ──────────────────────────────────────────
export const SLOT = Object.freeze({
  WEAPON: 'weapon',
  ARMOR:  'armor',
  RING:   'ring',
  AMULET: 'amulet',
});

// ── Monster AI States ────────────────────────────────────────
export const AI = Object.freeze({
  IDLE:   'idle',
  ALERT:  'alert',
  CHASE:  'chase',
  ATTACK: 'attack',
  FLEE:   'flee',
});

// ── Scene Keys ───────────────────────────────────────────────
export const SCENE = Object.freeze({
  BOOT:     'BootScene',
  MENU:     'MenuScene',
  GAME:     'GameScene',
  UI:       'UIScene',
  GAMEOVER: 'GameOverScene',
});

// ── Events ───────────────────────────────────────────────────
export const EV = Object.freeze({
  PLAYER_MOVED:    'playerMoved',
  PLAYER_DIED:     'playerDied',
  PLAYER_WIN:      'playerWin',
  TURN_END:        'turnEnd',
  FLOOR_CHANGED:   'floorChanged',
  LOG_MSG:         'logMsg',
  STATS_CHANGED:   'statsChanged',
  OPEN_INVENTORY:  'openInventory',
  OPEN_SKILLS:     'openSkills',
  OPEN_CRAFTING:   'openCrafting',
  OPEN_CHAR:       'openChar',
  CLOSE_PANEL:     'closePanel',
  MINIMAP_UPDATE:  'minimapUpdate',
  PAUSE_GAME:      'pauseGame',
  RESUME_GAME:     'resumeGame',
});

// ── Dungeon Config ───────────────────────────────────────────
export const DUNGEON_CFG = Object.freeze({
  FLOORS:          10,
  MIN_ROOM_W:       5,
  MIN_ROOM_H:       5,
  MAX_ROOM_W:      15,
  MAX_ROOM_H:      12,
  BSP_MIN_SIZE:     8,
  FOV_RADIUS:       8,
  MAX_MONSTERS_BASE: 5,
  MAX_ITEMS_BASE:    2,
});

// ── Player Config ────────────────────────────────────────────
export const PLAYER_CFG = Object.freeze({
  BASE_HP:     20,
  BASE_ATK:     5,
  BASE_DEF:     2,
  BASE_SPD:     4,
  BASE_MANA:   10,
  INV_SLOTS:   24,
  FOV_RADIUS:   8,
});

// ── XP per level ─────────────────────────────────────────────
export const XP_TABLE = [
  0, 100, 250, 500, 900, 1500, 2400, 3700, 5600, 8200,
  12000, 17000, 24000, 33000, 45000, 60000, 80000, 105000, 140000, 185000
];

// ── Colors (Phaser hex numbers) ──────────────────────────────
export const C = Object.freeze({
  BLACK:       0x000000,
  WHITE:       0xffffff,
  GRAY:        0x888888,
  DARK_GRAY:   0x333344,
  WALL:        0x445566,
  WALL_LIT:    0x7788aa,
  FLOOR:       0x1a1a2a,
  FLOOR_LIT:   0x2a2a3a,
  PLAYER:      0x88ddff,
  GOLD:        0xffd700,
  RED:         0xff4444,
  GREEN:       0x44dd44,
  BLUE:        0x4488ff,
  PURPLE:      0xaa44ff,
  ORANGE:      0xff8800,
  CYAN:        0x44ffee,
  PINK:        0xff66bb,
  BROWN:       0x8b5e3c,
  TEAL:        0x228b7a,
  YELLOW:      0xffee44,
  DARK_RED:    0x880000,
  DARK_GREEN:  0x006600,
  DARK_BLUE:   0x000088,
  LAVA:        0xff4500,
  WATER:       0x1a4fff,
  HP_BAR:      0xdd3333,
  MP_BAR:      0x3355dd,
  XP_BAR:      0x33aa33,
  BG_DARK:     0x0a0a0f,
  PANEL_BG:    0x111122,
  PANEL_BORDER:0x334466,
  TEXT:        0xddddee,
  TEXT_DIM:    0x778899,
  TEXT_GOLD:   0xffd700,
});

// ── Directions ───────────────────────────────────────────────
export const DIR8 = [
  { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 1 },  { dx: 1, dy: 1 },
];
export const DIR4 = [
  { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
  { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
];
