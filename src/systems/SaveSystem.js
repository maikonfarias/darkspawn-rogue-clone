// ============================================================
//  Darkspawn Rogue Quest — Save / Load System (localStorage)
// ============================================================
import { Monster } from '../entities/Monster.js';
import { MONSTERS } from '../data/MonsterData.js';

const SAVE_KEY = 'darkspawn_save';

// ── Serialise ─────────────────────────────────────────────────

function serializePlayer(p) {
  return {
    x: p.x, y: p.y,
    name: p.name,
    baseStats:     { ...p.baseStats },
    stats:         { ...p.stats },
    level:         p.level,
    xp:            p.xp,
    gold:          p.gold,
    skillPoints:   p.skillPoints,
    inventory:     p.inventory.map(it => it ? { ...it } : null),
    equipment:     Object.fromEntries(
      Object.entries(p.equipment).map(([k, v]) => [k, v ? { ...v } : null])
    ),
    skills:        [...p.skills],
    statusEffects: p.statusEffects.map(e => ({ ...e })),
  };
}

function serializeMonster(m) {
  return {
    id:                m.id,
    x:                 m.x,
    y:                 m.y,
    floor:             m.floor,
    stats:             { ...m.stats },
    aiState:           m.aiState,
    alertCooldown:     m.alertCooldown,
    lastKnownPlayerPos: m.lastKnownPlayerPos ? { ...m.lastKnownPlayerPos } : null,
    statusEffects:     m.statusEffects.map(e => ({ ...e })),
    turnAcc:           m.turnAcc,
  };
}

function serializeFloorEntry(entry) {
  return {
    grid:       entry.grid.map(row => [...row]),
    rooms:      entry.rooms,
    vis:        entry.vis.map(row => [...row]),
    monsters:   entry.monsters.map(serializeMonster),
    floorItems: entry.floorItems.map(fi => ({ x: fi.x, y: fi.y, item: { ...fi.item } })),
    startPos:   entry.startPos ? { ...entry.startPos } : null,
    endPos:     entry.endPos   ? { ...entry.endPos }   : null,
  };
}

// ── Deserialise ───────────────────────────────────────────────

function deserializeMonster(data) {
  const def = MONSTERS[data.id];
  if (!def) return null;
  const m = new Monster(def, data.x, data.y, data.floor);
  // Overwrite with saved state
  m.stats             = { ...data.stats };
  m.aiState           = data.aiState;
  m.alertCooldown     = data.alertCooldown;
  m.lastKnownPlayerPos = data.lastKnownPlayerPos ? { ...data.lastKnownPlayerPos } : null;
  m.statusEffects     = data.statusEffects.map(e => ({ ...e }));
  m.turnAcc           = data.turnAcc;
  return m;
}

function deserializeFloorEntry(data) {
  return {
    grid:       data.grid.map(row => [...row]),
    rooms:      data.rooms,
    vis:        data.vis.map(row => [...row]),
    monsters:   data.monsters.map(deserializeMonster).filter(Boolean),
    floorItems: data.floorItems.map(fi => ({ x: fi.x, y: fi.y, item: { ...fi.item } })),
    startPos:   data.startPos ? { ...data.startPos } : null,
    endPos:     data.endPos   ? { ...data.endPos }   : null,
  };
}

// ── Public API ────────────────────────────────────────────────

/** Persist full game state to localStorage. Returns true on success. */
export function saveGame(gs) {
  try {
    // Save the current floor into cache first so it's included
    gs._saveCurrentFloor();

    const floorCacheObj = {};
    for (const [k, v] of gs.floorCache) {
      floorCacheObj[k] = serializeFloorEntry(v);
    }

    const save = {
      version:    2,
      timestamp:  Date.now(),
      floor:      gs.floor,
      player:     serializePlayer(gs.player),
      floorCache: floorCacheObj,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

/** Return parsed save data, or null if none exists. */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (!save?.version) return null;

    // Deserialize floor cache
    const floorCache = new Map();
    for (const [k, v] of Object.entries(save.floorCache)) {
      floorCache.set(Number(k), deserializeFloorEntry(v));
    }

    return { ...save, floorCache };
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

/** Return true if a valid save exists. */
export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

/** Wipe the save. */
export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

/** Human-readable timestamp for the save. */
export function saveTimestamp() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const { timestamp, floor } = JSON.parse(raw);
    const d = new Date(timestamp);
    return `${floor === 0 ? 'Town' : `Floor ${floor}`} — ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch { return null; }
}
