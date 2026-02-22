// ============================================================
//  Darkspawn Rogue Quest — Game Scene (Main Gameplay)
// ============================================================
import { SCENE, TILE, VIS, EV, TILE_SIZE, MAP_W, MAP_H,
         DUNGEON_CFG, ITEM_TYPE, AI, C } from '../data/Constants.js';
import { generateDungeon } from '../systems/DungeonGenerator.js';
import { computeFOV, createVisGrid, revealAll } from '../systems/FOVSystem.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { MONSTERS, FLOOR_MONSTER_TABLES } from '../data/MonsterData.js';
import { ITEMS, FLOOR_ITEM_TABLES, createItem } from '../data/ItemData.js';
import { resolveAttack, fireballDamage, magicBoltDamage, iceNova, applyStatus } from '../systems/CombatSystem.js';
import { unlockSkill, useSkill } from '../systems/SkillSystem.js';
import { craftItem, getAvailableRecipes } from '../systems/CraftingSystem.js';
import { TILE_TEXTURE } from '../utils/TextureGenerator.js';
import { rand, chance, pick, weightedPick } from '../utils/Random.js';
import { findPath } from '../systems/AStarPathfinder.js';
import { SKILL_TREES, SKILL_BY_ID } from '../data/SkillData.js';
import { RECIPES } from '../data/RecipeData.js';

const T = TILE_SIZE;

// ── Panel states ─────────────────────────────────────────────
const PANEL = { NONE: 0, INVENTORY: 1, SKILLS: 2, CRAFTING: 3, CHAR: 4 };

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.GAME });
  }

  // ── Lifecycle ────────────────────────────────────────────

  create() {
    this.events_bus = new Phaser.Events.EventEmitter();

    // Expose bus for UIScene
    this.registry.set('events', this.events_bus);
    this.registry.set('scene', this);

    this.floor = 1;
    this.player = new Player(this.events_bus);
    this.activePanel = PANEL.NONE;
    this.pendingSkillEffect = null;
    this.targeting = false;
    this.targetCallback = null;
    this._clickPath      = [];
    this._clickWalkTimer = null;

    this._setupInput();
    this._loadFloor(this.floor);

    // Listen for events from UIScene
    this.events_bus.on(EV.PLAYER_DIED, () => this._onDeath());
    this.events_bus.on(EV.PLAYER_WIN,  () => this._onVictory());
  }

  update() {
    // Nothing time-based; everything is turn-driven
  }

  // ── Floor Loading ────────────────────────────────────────

  _loadFloor(floorNum) {
    // Clear previous floor
    if (this.tileLayer)    this.tileLayer.destroy();
    if (this.itemLayer)    this.itemLayer.destroy();
    if (this.entityLayer)  this.entityLayer.destroy();
    if (this.fogLayer)     this.fogLayer.destroy();
    if (this.overlayPanel) this.overlayPanel.destroy();
    if (this._pathGraphics) { this._pathGraphics.destroy(); this._pathGraphics = null; }
    this._cancelClickWalk();

    this.activePanel = PANEL.NONE;

    // Generate dungeon
    const dungeon = generateDungeon(floorNum);
    this.grid = dungeon.grid;
    this.rooms = dungeon.rooms;
    this.vis   = createVisGrid();

    // Place player
    this.player.x = dungeon.startPos.x;
    this.player.y = dungeon.startPos.y;

    // Spawn monsters
    this.monsters = [];
    this._spawnMonsters(dungeon, floorNum);

    // Spawn items on map (not in inventory)
    this.floorItems = []; // [{ x, y, item }]
    this._spawnItems(dungeon, floorNum);

    // Build tile visuals
    this._buildTileLayer();
    this._buildFogLayer();

    // Initial FOV
    this._updateFOV();

    // Camera follow player
    // Camera follow player — extend bounds by half the viewport on every side
    // so the camera can always keep the player perfectly centred even at map edges
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const hW   = Math.ceil(camW / 2);
    const hH   = Math.ceil(camH / 2);
    this.cameras.main.setBounds(-hW, -hH, MAP_W * T + hW * 2, MAP_H * T + hH * 2);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // Emit initial state
    this.events_bus.emit(EV.FLOOR_CHANGED, { floor: floorNum });
    this.events_bus.emit(EV.STATS_CHANGED);
    this.events_bus.emit(EV.LOG_MSG, {
      text: floorNum === 1
        ? `Welcome to the dungeon! Find the stairs (>) to descend.`
        : `Floor ${floorNum}. The air grows colder...`,
      color: '#88aacc'
    });

    if (floorNum === DUNGEON_CFG.FLOORS) {
      this.events_bus.emit(EV.LOG_MSG, {
        text: '⚠ You sense an overwhelming evil presence...', color: '#ff44ff'
      });
    }
  }

  // ── Spawning ─────────────────────────────────────────────

  _spawnMonsters(dungeon, floor) {
    const table = FLOOR_MONSTER_TABLES[floor - 1] ?? FLOOR_MONSTER_TABLES[0];
    const spawns = dungeon.monsterSpawns;

    for (const spawn of spawns) {
      // Avoid spawning on player
      if (spawn.x === this.player.x && spawn.y === this.player.y) continue;
      const monsterId = pick(table);
      const def = MONSTERS[monsterId];
      if (!def) continue;
      this.monsters.push(new Monster(def, spawn.x, spawn.y, floor));
    }

    // Guarantee boss on floor 10
    if (floor === 10) {
      const bossSpawn = dungeon.endPos;
      this.monsters.push(new Monster(MONSTERS.dungeonLord, bossSpawn.x - 2, bossSpawn.y, floor));
      this.events_bus.emit(EV.LOG_MSG, { text: '👹 DUNGEON LORD emerges!', color: '#ff00ff' });
    }
  }

  _spawnItems(dungeon, floor) {
    const tableIdx = Math.min(floor - 1, FLOOR_ITEM_TABLES.length - 1);
    const table = FLOOR_ITEM_TABLES[tableIdx];

    for (const spawn of dungeon.itemSpawns) {
      if (spawn.x === this.player.x && spawn.y === this.player.y) continue;
      const entry = weightedPick(table);
      if (!entry) continue;
      const qty = rand(1, 3);
      const item = createItem(entry.id, qty);
      this.floorItems.push({ x: spawn.x, y: spawn.y, item });
    }

    // Gold piles
    const numGold = rand(2, 4);
    for (let i = 0; i < numGold; i++) {
      const room = pick(dungeon.rooms);
      const gx = rand(room.x + 1, room.x + room.w - 2);
      const gy = rand(room.y + 1, room.y + room.h - 2);
      const amount = rand(5, 15) * floor;
      this.floorItems.push({ x: gx, y: gy, item: { ...createItem('gold'), value: amount, qty: amount } });
    }
  }

  // ── Tile Layer ────────────────────────────────────────────

  _buildTileLayer() {
    this.tileLayer   = this.add.container(0, 0);
    this.itemLayer   = this.add.container(0, 0);
    this.entityLayer = this.add.container(0, 0);

    // Create tile sprites grid
    this.tileSprites = [];
    for (let y = 0; y < MAP_H; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        const t = this.grid[y][x];
        const key = TILE_TEXTURE[String(t)] ?? 'tile-floor';
        const spr = this.add.image(x * T + T / 2, y * T + T / 2, key);
        spr.setVisible(false);
        this.tileLayer.add(spr);
        this.tileSprites[y][x] = spr;
      }
    }

    // Item sprites
    this.itemSprites = new Map();
    this._rebuildItemSprites();

    // Monster sprites
    this.monsterSprites = new Map();
    this._rebuildMonsterSprites();

    // Player sprite
    this.playerSprite = this.add.image(
      this.player.x * T + T / 2,
      this.player.y * T + T / 2,
      'player'
    );
    this.entityLayer.add(this.playerSprite);

    // HP bar above player
    this.playerHpBar = this._makeHealthBar(this.entityLayer, 0, 0, T, 4);
    this.entityLayer.add(this.playerHpBar.bg);
    this.entityLayer.add(this.playerHpBar.fill);
  }

  _buildFogLayer() {
    this.fogLayer = this.add.container(0, 0);
    this.fogSprites = [];
    for (let y = 0; y < MAP_H; y++) {
      this.fogSprites[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        const fog = this.add.image(x * T + T / 2, y * T + T / 2, 'fog-black');
        this.fogLayer.add(fog);
        this.fogSprites[y][x] = fog;
      }
    }
  }

  _makeHealthBar(container, x, y, w, h) {
    const bg   = this.add.rectangle(x, y, w, h, 0x330000).setOrigin(0, 0);
    const fill = this.add.rectangle(x, y, w, h, 0xdd3333).setOrigin(0, 0);
    return { bg, fill };
  }

  _rebuildItemSprites() {
    // Clear old
    for (const [, spr] of this.itemSprites) spr.destroy();
    this.itemSprites.clear();

    for (const fi of this.floorItems) {
      const key = `item-${fi.item.type ?? 'material'}`;
      const spr = this.add.image(fi.x * T + T / 2, fi.y * T + T / 2, key);
      spr.setScale(0.75);
      spr.setVisible(false);
      this.itemLayer.add(spr);
      this.itemSprites.set(fi, spr);
    }
  }

  _rebuildMonsterSprites() {
    for (const [, { spr, hpBg, hpFill }] of this.monsterSprites) {
      spr.destroy(); hpBg.destroy(); hpFill.destroy();
    }
    this.monsterSprites.clear();

    for (const m of this.monsters) {
      if (m.isDead) continue;
      const key = `monster-${m.id}`;
      const spr = this.add.image(m.x * T + T / 2, m.y * T + T / 2, key);
      spr.setVisible(false);
      this.entityLayer.add(spr);

      const hpBg   = this.add.rectangle(m.x * T, m.y * T, T, 4, 0x330000).setOrigin(0, 0).setVisible(false);
      const hpFill = this.add.rectangle(m.x * T, m.y * T, T, 4, 0xdd3333).setOrigin(0, 0).setVisible(false);
      this.entityLayer.add(hpBg);
      this.entityLayer.add(hpFill);

      this.monsterSprites.set(m, { spr, hpBg, hpFill });
    }
  }

  // ── FOV & Rendering ──────────────────────────────────────

  _updateFOV() {
    computeFOV(this.grid, this.vis, this.player.x, this.player.y, DUNGEON_CFG.FOV_RADIUS);
    this._render();
    this.events_bus.emit(EV.MINIMAP_UPDATE);
  }

  _render() {
    // Tiles + fog
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const v = this.vis[y][x];
        const tileSpr = this.tileSprites[y][x];
        const fogSpr  = this.fogSprites[y][x];

        if (v === VIS.HIDDEN) {
          tileSpr.setVisible(false);
          fogSpr.setTexture('fog-black').setVisible(true).setAlpha(1);
        } else if (v === VIS.EXPLORED) {
          tileSpr.setVisible(true).setAlpha(0.4);
          fogSpr.setTexture('fog-explored').setVisible(true).setAlpha(0.65);
        } else {
          tileSpr.setVisible(true).setAlpha(1);
          fogSpr.setVisible(false);
        }

        // Trap highlight
        if (v === VIS.VISIBLE && this.grid[y][x] === TILE.TRAP_VISIBLE) {
          tileSpr.setTint(0xff4444);
        } else {
          tileSpr.clearTint();
        }
      }
    }

    // Items
    for (const fi of this.floorItems) {
      const spr = this.itemSprites.get(fi);
      if (!spr) continue;
      const v = this.vis[fi.y][fi.x];
      spr.setVisible(v === VIS.VISIBLE);
    }

    // Monsters
    for (const m of this.monsters) {
      const entry = this.monsterSprites.get(m);
      if (!entry) continue;
      const { spr, hpBg, hpFill } = entry;
      if (m.isDead) {
        spr.destroy(); hpBg.destroy(); hpFill.destroy();
        this.monsterSprites.delete(m);
        continue;
      }
      const v = this.vis[m.y][m.x];
      const visible = v === VIS.VISIBLE;
      spr.setPosition(m.x * T + T / 2, m.y * T + T / 2).setVisible(visible);
      hpBg.setPosition(m.x * T, m.y * T - 6).setVisible(visible);
      const hpRatio = Math.max(0, m.stats.hp / m.stats.maxHp);
      hpFill.setPosition(m.x * T, m.y * T - 6).setSize(T * hpRatio, 4).setVisible(visible);
    }

    // Player sprite
    this.playerSprite.setPosition(this.player.x * T + T / 2, this.player.y * T + T / 2);

    // Player HP bar (below sprite)
    const pHpRatio = Math.max(0, this.player.stats.hp / this.player.stats.maxHp);
    this.playerHpBar.bg.setPosition(this.player.x * T, this.player.y * T + T - 4);
    this.playerHpBar.fill.setPosition(this.player.x * T, this.player.y * T + T - 4)
      .setSize(T * pHpRatio, 4);

    // Depth ordering
    this.entityLayer.setDepth(10);
    this.fogLayer.setDepth(20);
    if (this.overlayPanel) this.overlayPanel.setDepth(30);
  }

  // ── Input ────────────────────────────────────────────────

  _setupInput() {
    const kb = this.input.keyboard;

    // Movement keys
    const keys = kb.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      // numpad
      num8: Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT,
      num2: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      num4: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
      num6: Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX,
      num7: Phaser.Input.Keyboard.KeyCodes.NUMPAD_SEVEN,
      num9: Phaser.Input.Keyboard.KeyCodes.NUMPAD_NINE,
      num1: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      num3: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
    });

    // Repeat-delay config
    this.keyRepeat   = 180; // ms before repeat
    this.keyInterval = 100; // ms between repeats
    this.heldKeys = {};
    this.lastMoveTime = 0;

    kb.on('keydown', (event) => { this._cancelClickWalk(); this._onKeyDown(event); });
    kb.on('keyup',   (event) => { delete this.heldKeys[event.code]; });

    this.input.on('pointerdown', (ptr) => this._onPointerDown(ptr));
    this.input.on('pointerdown', (ptr) => { if (ptr.rightButtonDown()) this._cancelClickWalk(); });
  }

  _onKeyDown(event) {
    if (this.activePanel !== PANEL.NONE) {
      if (event.code === 'Escape' || event.code === 'KeyI' ||
          event.code === 'KeyK' || event.code === 'KeyC' || event.code === 'KeyP') {
        this._closePanel();
      }
      return;
    }

    if (this.targeting) {
      if (event.code === 'Escape') { this.targeting = false; return; }
      return; // mouse handles target selection
    }

    const code = event.code;
    const now = Date.now();

    // Move
    const DIR_MAP = {
      ArrowUp:  {dx:0,dy:-1}, KeyW:{dx:0,dy:-1}, Numpad8:{dx:0,dy:-1},
      ArrowDown:{dx:0,dy:1},  KeyS:{dx:0,dy:1},  Numpad2:{dx:0,dy:1},
      ArrowLeft:{dx:-1,dy:0}, KeyA:{dx:-1,dy:0}, Numpad4:{dx:-1,dy:0},
      ArrowRight:{dx:1,dy:0}, KeyD:{dx:1,dy:0},  Numpad6:{dx:1,dy:0},
      Numpad7:{dx:-1,dy:-1}, Numpad9:{dx:1,dy:-1},
      Numpad1:{dx:-1,dy:1},  Numpad3:{dx:1,dy:1},
    };

    if (DIR_MAP[code]) {
      const { dx, dy } = DIR_MAP[code];
      this._playerMove(dx, dy);
      return;
    }

    // Actions
    switch (code) {
      case 'KeyG':  this._playerPickUp(); break;
      case 'Period': this._endPlayerTurn(); break; // wait
      case 'Greater': case 'Period': break; // handled by _playerDescend
      case 'KeyI': this._openPanel(PANEL.INVENTORY); break;
      case 'KeyK': this._openPanel(PANEL.SKILLS);    break;
      case 'KeyC': this._openPanel(PANEL.CRAFTING);  break;
      case 'KeyP': this._openPanel(PANEL.CHAR);      break;
      case 'Escape': this._closePanel();              break;
    }

    // Stairs
    if (event.key === '>') this._playerDescend();
    if (event.key === '<') this._playerAscend();
  }

  // ── Player Actions ───────────────────────────────────────

  _playerMove(dx, dy) {
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    // Check bounds
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return;

    // Check for monster (bump attack)
    const monster = this.monsters.find(m => m.x === nx && m.y === ny && !m.isDead);
    if (monster) {
      this._playerAttack(monster);
      this._endPlayerTurn();
      return;
    }

    // Check tile passability
    const t = this.grid[ny][nx];
    if (t === TILE.WALL || t === TILE.VOID) return;

    // Open doors
    if (t === TILE.DOOR) {
      this.grid[ny][nx] = TILE.FLOOR;
      this.tileSprites[ny][nx].setTexture('tile-floor');
      this.events_bus.emit(EV.LOG_MSG, { text: 'You open the door.', color: '#ccaa88' });
    }

    // Step on trap
    if (t === TILE.TRAP_HIDDEN) {
      this.grid[ny][nx] = TILE.TRAP_VISIBLE;
      const dmg = rand(3, 8) + this.floor;
      this.player.stats.hp -= dmg;
      this.events_bus.emit(EV.LOG_MSG, { text: `You trigger a trap! -${dmg} HP.`, color: '#ff4444' });
    }

    // Chest
    if (t === TILE.CHEST_CLOSED) {
      this._openChest(nx, ny);
      this._endPlayerTurn();
      return;
    }

    // Move
    this.player.x = nx;
    this.player.y = ny;
    this._endPlayerTurn();
  }

  _playerAttack(monster) {
    const result = resolveAttack(this.player, monster, this.events_bus);
    if (!result.hit) return;

    let msg = `You hit ${monster.name} for ${result.damage}`;
    if (result.crit) msg += ' (CRIT!)';
    msg += '.';
    this.events_bus.emit(EV.LOG_MSG, { text: msg, color: '#ffdd44' });

    if (result.statusApplied) {
      this.events_bus.emit(EV.LOG_MSG, { text: `${monster.name} is poisoned!`, color: '#44cc44' });
    }

    // Flash monster red
    const entry = this.monsterSprites.get(monster);
    if (entry) {
      entry.spr.setTint(0xff4444);
      this.time.delayedCall(150, () => entry.spr?.clearTint?.());
    }

    if (monster.isDead) {
      this._onMonsterDeath(monster);
    }
  }

  _onMonsterDeath(monster) {
    this.events_bus.emit(EV.LOG_MSG, {
      text: `${monster.name} is slain!`,
      color: '#ffaa44'
    });

    const leveled = this.player.addXP(monster.stats.xp ?? monster.def.xp);
    if (leveled) {
      this.events_bus.emit(EV.LOG_MSG, { text: `✦ LEVEL UP! Level ${this.player.level}!`, color: '#ffd700' });
    }

    // Drop loot
    const loot = monster.rollLoot();
    for (const { id, qty } of loot) {
      this.floorItems.push({ x: monster.x, y: monster.y, item: createItem(id, qty) });
    }
    this._rebuildItemSprites();

    // Check boss death → victory
    if (monster.def.isBoss) {
      this.time.delayedCall(1000, () => {
        this.events_bus.emit(EV.PLAYER_WIN, {
          floor: this.floor,
          level: this.player.level,
          gold: this.player.gold
        });
      });
    }
  }

  _playerPickUp() {
    const fi = this.floorItems.find(f => f.x === this.player.x && f.y === this.player.y);
    if (!fi) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'Nothing to pick up.', color: '#556677' });
      return;
    }
    this.player.pickUpItem(fi.item);
    this.floorItems.splice(this.floorItems.indexOf(fi), 1);
    this._rebuildItemSprites();
    this._endPlayerTurn();
  }

  _playerDescend() {
    if (this.grid[this.player.y][this.player.x] !== TILE.STAIRS_DOWN) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'No stairs here.', color: '#556677' });
      return;
    }
    if (this.floor >= DUNGEON_CFG.FLOORS) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'This is the deepest floor.', color: '#556677' });
      return;
    }
    this.floor++;
    this._loadFloor(this.floor);
  }

  _playerAscend() {
    if (this.grid[this.player.y][this.player.x] !== TILE.STAIRS_UP) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'No upward stairs here.', color: '#556677' });
      return;
    }
    if (this.floor <= 1) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'You are already on the first floor.', color: '#556677' });
      return;
    }
    this.floor--;
    this._loadFloor(this.floor);
  }

  _openChest(x, y) {
    this.grid[y][x] = TILE.CHEST_OPEN;
    this.tileSprites[y][x].setTexture('tile-chest-open');
    const numItems = rand(1, 3);
    const tableIdx = Math.min(this.floor - 1, FLOOR_ITEM_TABLES.length - 1);
    const table = FLOOR_ITEM_TABLES[tableIdx];
    const found = [];
    for (let i = 0; i < numItems; i++) {
      const entry = weightedPick(table);
      if (entry) {
        const item = createItem(entry.id, 1);
        this.floorItems.push({ x, y, item });
        found.push(item.name);
      }
    }
    const gold = rand(10, 30) * this.floor;
    this.player.gold += gold;
    this.events_bus.emit(EV.LOG_MSG, {
      text: `Chest opened! Found: ${found.join(', ')} and ${gold} gold.`,
      color: '#ffd700'
    });
    this._rebuildItemSprites();
    this.events_bus.emit(EV.STATS_CHANGED);
  }

  // ── Monster Turns ────────────────────────────────────────

  _runMonsterTurns() {
    const ctx = {
      grid: this.grid,
      player: this.player,
      monsters: this.monsters,
      events: this.events_bus,
      vis: this.vis,
    };
    for (const m of this.monsters) {
      if (!m.isDead) m.update(ctx);
    }
    // Remove dead monsters and destroy their sprites
    this.monsters = this.monsters.filter(m => {
      if (!m.isDead) return true;
      const entry = this.monsterSprites.get(m);
      if (entry) {
        entry.spr.destroy();
        entry.hpBg.destroy();
        entry.hpFill.destroy();
        this.monsterSprites.delete(m);
      }
      return false;
    });
  }

  _endPlayerTurn() {
    this.player.onTurnEnd();

    if (this.player.isDead) {
      this.events_bus.emit(EV.PLAYER_DIED);
      return;
    }

    this._runMonsterTurns();

    if (this.player.isDead) {
      this.events_bus.emit(EV.PLAYER_DIED);
      return;
    }

    this._updateFOV();
    this.events_bus.emit(EV.STATS_CHANGED);
  }

  // ── Active Skills (targeting) ─────────────────────────────

  useActiveSkill(skillId) {
    const result = useSkill(this.player, skillId);
    if (!result.success) {
      this.events_bus.emit(EV.LOG_MSG, { text: result.message, color: '#ff8888' });
      return;
    }
    this.events_bus.emit(EV.LOG_MSG, { text: result.message, color: '#aa88ff' });
    this.events_bus.emit(EV.STATS_CHANGED);

    if (result.needsWhirlwind) {
      // Attack all adjacent monsters
      let hit = false;
      for (const m of this.monsters) {
        if (!m.isDead && Math.abs(m.x - this.player.x) <= 1 && Math.abs(m.y - this.player.y) <= 1) {
          this._playerAttack(m);
          hit = true;
        }
      }
      if (!hit) this.events_bus.emit(EV.LOG_MSG, { text: 'No adjacent enemies.', color: '#888' });
      this._endPlayerTurn();
    } else if (result.needsIceNova) {
      const visible = this.monsters.filter(m => !m.isDead && this.vis[m.y]?.[m.x] === VIS.VISIBLE);
      iceNova(visible, result.duration);
      this.events_bus.emit(EV.LOG_MSG, { text: `${visible.length} monsters frozen!`, color: '#88ddff' });
      this._endPlayerTurn();
    } else if (result.needsTarget) {
      this._startTargeting(result.needsTarget, result);
    }
  }

  _startTargeting(mode, extra) {
    this.targeting = true;
    this.targetMode = mode;
    this.targetExtra = extra;
    this.events_bus.emit(EV.LOG_MSG, { text: 'Click on target...', color: '#88ffff' });

    // Highlight cursor on hover
    this._targetCursor = this.add.rectangle(0, 0, T, T, 0xffffff, 0.25)
      .setVisible(false).setDepth(25);
    this.input.on('pointermove', this._onTargetMove, this);
  }

  _onTargetMove(ptr) {
    if (!this.targeting) return;
    const wx = this.cameras.main.scrollX + ptr.x;
    const wy = this.cameras.main.scrollY + ptr.y;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (this._targetCursor) {
      this._targetCursor.setPosition(tx * T + T / 2, ty * T + T / 2).setVisible(true);
    }
  }

  // ── Click-to-walk ─────────────────────────────────────────

  _cancelClickWalk() {
    if (this._clickWalkTimer) { this._clickWalkTimer.remove(false); this._clickWalkTimer = null; }
    this._clickPath = [];
    if (this._pathGraphics) { this._pathGraphics.clear(); }
  }

  _startClickWalk(tx, ty) {
    this._cancelClickWalk();

    const dx = tx - this.player.x;
    const dy = ty - this.player.y;

    // Orthogonally adjacent monster → attack directly, same as arrow-key bump
    const adjMonster = this.monsters.find(m => !m.isDead && m.x === tx && m.y === ty);
    if (adjMonster && Math.abs(dx) + Math.abs(dy) === 1) {
      this._playerAttack(adjMonster);
      this._endPlayerTurn();
      return;
    }

    // Build occupied set from living monsters (so path avoids them unless target)
    const occupied = new Set(
      this.monsters.filter(m => !m.isDead).map(m => `${m.x},${m.y}`)
    );

    // If clicking on a monster tile, remove it from occupied so we path to it
    occupied.delete(`${tx},${ty}`);

    const path = findPath(this.grid, this.player.x, this.player.y, tx, ty, occupied, 60);
    if (!path.length) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'No path found.', color: '#556677' });
      return;
    }

    this._clickPath = path;
    this._drawPathPreview();
    this._stepClickWalk();
  }

  _drawPathPreview() {
    if (!this._pathGraphics) {
      this._pathGraphics = this.add.graphics().setDepth(15);
    }
    this._pathGraphics.clear();
    this._pathGraphics.fillStyle(0x88ddff, 0.35);
    for (const step of this._clickPath) {
      this._pathGraphics.fillRect(step.x * T + 4, step.y * T + 4, T - 8, T - 8);
    }
  }

  _stepClickWalk() {
    if (!this._clickPath.length) { this._cancelClickWalk(); return; }

    // Cancel if a visible monster is adjacent (let player react)
    const enemyClose = this.monsters.some(m =>
      !m.isDead &&
      this.vis[m.y]?.[m.x] === VIS.VISIBLE &&
      Math.abs(m.x - this.player.x) <= 1 &&
      Math.abs(m.y - this.player.y) <= 1
    );
    if (enemyClose) { this._cancelClickWalk(); return; }

    const next = this._clickPath.shift();
    this._drawPathPreview();

    const dx = next.x - this.player.x;
    const dy = next.y - this.player.y;
    this._playerMove(dx, dy);

    // If more steps remain, schedule the next one
    if (this._clickPath.length) {
      this._clickWalkTimer = this.time.delayedCall(120, () => this._stepClickWalk());
    } else {
      this._cancelClickWalk();
    }
  }

  _onPointerDown(ptr) {
    if (ptr.rightButtonDown()) return;
    if (!this.targeting) {
      // Click-to-walk: ignore clicks over UI panels
      if (this.activePanel !== PANEL.NONE) return;

      const wx = this.cameras.main.scrollX + ptr.x;
      const wy = this.cameras.main.scrollY + ptr.y;
      const tx = Math.floor(wx / T);
      const ty = Math.floor(wy / T);

      // Must be an explored tile
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;
      if (this.vis[ty]?.[tx] === VIS.HIDDEN) return;

      this._startClickWalk(tx, ty);
      return;
    }

    // Targeting mode (skill aim): handle spell click
    const wx = this.cameras.main.scrollX + ptr.x;
    const wy = this.cameras.main.scrollY + ptr.y;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);

    if (this._targetCursor) { this._targetCursor.destroy(); this._targetCursor = null; }
    this.input.off('pointermove', this._onTargetMove, this);
    this.targeting = false;

    const mode  = this.targetMode;
    const extra = this.targetExtra;

    if (mode === 'magicBolt') {
      const m = this.monsters.find(mon => mon.x === tx && mon.y === ty && !mon.isDead);
      if (m) {
        const dmg = magicBoltDamage(this.player, m, extra.baseDmg, this.player.level);
        this.events_bus.emit(EV.LOG_MSG, { text: `Magic Bolt hits ${m.name} for ${dmg}!`, color: '#8888ff' });
        if (m.isDead) this._onMonsterDeath(m);
      } else {
        this.events_bus.emit(EV.LOG_MSG, { text: 'Missed!', color: '#888' });
      }
    } else if (mode === 'fireball') {
      const hits = fireballDamage(this.player, this.monsters, tx, ty, extra.baseDmg, this.player.level, this.events_bus);
      this.events_bus.emit(EV.LOG_MSG, { text: `Fireball! ${hits.length} enemies hit.`, color: '#ff8800' });
      for (const { entity } of hits) {
        if (entity.isDead) this._onMonsterDeath(entity);
      }
    } else if (mode === 'shadowStep') {
      if (this.vis[ty]?.[tx] === VIS.VISIBLE && this.grid[ty][tx] !== TILE.WALL) {
        this.player.x = tx; this.player.y = ty;
        this.events_bus.emit(EV.LOG_MSG, { text: 'Shadow Step!', color: '#88ff88' });
      }
    } else if (mode === 'deathMark') {
      const m = this.monsters.find(mon => mon.x === tx && mon.y === ty && !mon.isDead);
      if (m) {
        applyStatus(m, 'deathMark', 10);
        this.events_bus.emit(EV.LOG_MSG, { text: `${m.name} is marked for death!`, color: '#ff44ff' });
      }
    }

    this._endPlayerTurn();
  }

  // ── UI Panels ────────────────────────────────────────────

  _openPanel(panel) {
    if (this.activePanel === panel) { this._closePanel(); return; }
    this._closePanel();
    this.activePanel = panel;

    const cam = this.cameras.main;
    const W = cam.width, H = cam.height;

    switch (panel) {
      case PANEL.INVENTORY: this._renderInventoryPanel(W, H); break;
      case PANEL.SKILLS:    this._renderSkillsPanel(W, H);    break;
      case PANEL.CRAFTING:  this._renderCraftingPanel(W, H);  break;
      case PANEL.CHAR:      this._renderCharPanel(W, H);      break;
    }
  }

  _closePanel() {
    this.activePanel = PANEL.NONE;
    if (this.overlayPanel) { this.overlayPanel.destroy(); this.overlayPanel = null; }
  }

  _panelBase(W, H, title) {
    const PW = 580, PH = 440;
    const px = cam => cam.scrollX + (W - PW) / 2;
    const py = cam => cam.scrollY + (H - PH) / 2;
    const cam = this.cameras.main;
    const bx = cam.scrollX + (W - PW) / 2;
    const by = cam.scrollY + (H - PH) / 2;

    this.overlayPanel = this.add.container(0, 0).setDepth(30);

    const bg = this.add.rectangle(bx + PW / 2, by + PH / 2, PW, PH, 0x0d1117, 0.97)
      .setStrokeStyle(2, 0x334466);
    const titleTxt = this.add.text(bx + 12, by + 10, title, {
      fontFamily: 'Courier New', fontSize: '18px', color: '#ffd700'
    });
    const closeTxt = this.add.text(bx + PW - 12, by + 10, '[ESC]', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#556677'
    }).setOrigin(1, 0).setInteractive().on('pointerdown', () => this._closePanel());

    this.overlayPanel.add([bg, titleTxt, closeTxt]);
    return { bx, by, PW, PH, panel: this.overlayPanel };
  }

  // ── Inventory Panel ──────────────────────────────────────

  _renderInventoryPanel(W, H) {
    const { bx, by, PW, PH, panel } = this._panelBase(W, H, '⚔ INVENTORY');
    const COLS = 6, SLOT_SIZE = 44, GAP = 4;
    const startX = bx + 12, startY = by + 40;
    this._selectedSlot = -1;
    this._invDetailText = null;

    // Equipment section
    this._addText(panel, bx + 12, by + 38, '── Equipment ──', '#888899', 12);
    const eqSlots = [
      { label: 'WPN', slot: 'weapon', x: bx + 12, y: by + 52 },
      { label: 'ARM', slot: 'armor',  x: bx + 70, y: by + 52 },
      { label: 'RNG', slot: 'ring',   x: bx + 128, y: by + 52 },
      { label: 'AMU', slot: 'amulet', x: bx + 186, y: by + 52 },
    ];
    for (const eq of eqSlots) {
      const item = this.player.equipment[eq.slot];
      const clr = item ? 0x334466 : 0x1a1a2a;
      const box = this.add.rectangle(eq.x + SLOT_SIZE / 2, eq.y + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, clr)
        .setStrokeStyle(1, 0x445577).setInteractive();
      this._addText(panel, eq.x + 2, eq.y + 2, eq.label, '#445566', 9);
      if (item) {
        const icon = this.add.image(eq.x + SLOT_SIZE / 2, eq.y + SLOT_SIZE / 2, `item-${item.type}`)
          .setScale(0.9);
        panel.add([box, icon]);
      } else {
        panel.add(box);
      }
      box.on('pointerdown', () => {
        if (item) { this.player.unequipItem(eq.slot); this._openPanel(PANEL.INVENTORY); }
      });
    }

    // Inventory grid
    this._addText(panel, bx + 12, by + 105, '── Bag (click to use/equip) ──', '#888899', 12);
    for (let i = 0; i < 24; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const ix = startX + col * (SLOT_SIZE + GAP);
      const iy = by + 120 + row * (SLOT_SIZE + GAP);
      const item = this.player.inventory[i];
      const clr = item ? 0x1e2a3a : 0x111118;
      const box = this.add.rectangle(ix + SLOT_SIZE / 2, iy + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, clr)
        .setStrokeStyle(1, 0x334455).setInteractive();
      panel.add(box);
      if (item) {
        const icon = this.add.image(ix + SLOT_SIZE / 2, iy + SLOT_SIZE / 2 - 6, `item-${item.type}`)
          .setScale(0.75);
        const qtyTxt = this.add.text(ix + SLOT_SIZE - 4, iy + SLOT_SIZE - 14,
          item.qty > 1 ? String(item.qty) : '', {
            fontFamily: 'Courier New', fontSize: '10px', color: '#aaaacc'
          }).setOrigin(1, 0);
        panel.add([icon, qtyTxt]);
        box.on('pointerdown', () => this._onInventorySlotClick(i, bx, by, PW, PH, panel));
        box.on('pointerover', () => box.setFillColor(0x2a3a4a));
        box.on('pointerout',  () => box.setFillColor(clr));
      }
    }

    // Detail panel on right
    this._invDetailText = this.add.text(bx + COLS * (SLOT_SIZE + GAP) + 20, by + 120, 'Select an item', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#778899',
      wordWrap: { width: 160 }, lineSpacing: 4
    });
    panel.add(this._invDetailText);
  }

  _onInventorySlotClick(i, bx, by, PW, PH, panel) {
    const item = this.player.inventory[i];
    if (!item) return;

    // Show detail
    let detail = `${item.name}\n\n${item.description}\n\n`;
    if (item.atk)  detail += `ATK: +${item.atk}\n`;
    if (item.def)  detail += `DEF: +${item.def}\n`;
    if (item.hpBonus)   detail += `HP: +${item.hpBonus}\n`;
    if (item.manaBonus) detail += `MP: +${item.manaBonus}\n`;
    detail += `\nValue: ${item.value}g`;
    detail += `\n\n[Click again to use/equip]`;

    if (this._invDetailText) {
      const COLS = 6, SLOT_SIZE = 44, GAP = 4;
      this._invDetailText.setPosition(
        bx + COLS * (SLOT_SIZE + GAP) + 20, by + 120
      ).setText(detail).setColor('#ccddee');
    }

    if (this._selectedSlot === i) {
      // Second click: use/equip
      const result = this.player.useItem(i);
      if (result?.scrollEffect) {
        this._applyScrollEffect(result.scrollEffect);
      }
      this._closePanel();
      this._openPanel(PANEL.INVENTORY);
    } else {
      this._selectedSlot = i;
    }
  }

  _applyScrollEffect(eff) {
    if (eff.revealMap) { revealAll(this.vis, this.grid); this._render(); }
    if (eff.teleport) {
      const room = pick(this.rooms);
      this.player.x = Math.floor(room.x + room.w / 2);
      this.player.y = Math.floor(room.y + room.h / 2);
      this._updateFOV();
    }
    if (eff.fireball) {
      this._startTargeting('fireball', { baseDmg: 15, radius: 1 });
    }
  }

  // ── Skills Panel ─────────────────────────────────────────

  _renderSkillsPanel(W, H) {
    const { bx, by, PW, PH, panel } = this._panelBase(W, H, '✦ SKILLS');
    this._addText(panel, bx + PW - 12, by + 38, `Points: ${this.player.skillPoints}`, '#ffd700', 14)
      .setOrigin(1, 0);

    const trees = Object.values(SKILL_TREES);
    const colW = (PW - 24) / trees.length;

    trees.forEach((tree, ti) => {
      const cx = bx + 12 + ti * colW;
      // Tree header
      this._addText(panel, cx + colW / 2, by + 55, tree.icon + ' ' + tree.name, tree.color, 15)
        .setOrigin(0.5, 0);

      tree.skills.forEach((skill, si) => {
        const sy = by + 85 + si * 68;
        const unlocked = this.player.skills.has(skill.id);
        const canUnlockSkill = !unlocked && this.player.skillPoints > 0 &&
          (!skill.prereq || this.player.skills.has(skill.prereq));

        const bg = this.add.rectangle(cx + colW / 2, sy + 25, colW - 8, 60,
          unlocked ? 0x1a2a1a : canUnlockSkill ? 0x1a1a2a : 0x111118)
          .setStrokeStyle(1, unlocked ? 0x44aa44 : canUnlockSkill ? 0x334466 : 0x222233)
          .setInteractive();
        panel.add(bg);

        const nameClr = unlocked ? '#88ff88' : canUnlockSkill ? '#88aacc' : '#445566';
        this._addText(panel, cx + 4, sy + 4, skill.name, nameClr, 11);
        this._addText(panel, cx + 4, sy + 18, skill.description, '#667788', 9, colW - 12);

        if (unlocked) {
          this._addText(panel, cx + colW - 6, sy + 50, '✓', '#44ff44', 11).setOrigin(1, 0);
        } else if (canUnlockSkill) {
          const btn = this._addText(panel, cx + colW - 6, sy + 48, '[UNLOCK]', '#ffd700', 11).setOrigin(1, 0)
            .setInteractive();
          btn.on('pointerdown', () => {
            if (unlockSkill(this.player, skill.id)) {
              this.events_bus.emit(EV.LOG_MSG, { text: `Unlocked: ${skill.name}!`, color: '#ffd700' });
              this._openPanel(PANEL.SKILLS);
            }
          });
          panel.add(btn);
        }

        // Active skill use button
        if (skill.active && unlocked) {
          const useBtn = this._addText(panel, cx + 4, sy + 48, `[USE ${skill.active.cost}MP]`, '#88aaff', 10)
            .setInteractive();
          useBtn.on('pointerdown', () => {
            this._closePanel();
            this.useActiveSkill(skill.id);
          });
          panel.add(useBtn);
        }
      });
    });
  }

  // ── Crafting Panel ────────────────────────────────────────

  _renderCraftingPanel(W, H) {
    const { bx, by, PW, PH, panel } = this._panelBase(W, H, '⚒ CRAFTING');
    this._addText(panel, bx + 12, by + 38, 'Materials in inventory:', '#778899', 12);

    // Show materials
    const matCounts = {};
    for (const slot of this.player.inventory) {
      if (slot && slot.type === ITEM_TYPE.MATERIAL) {
        matCounts[slot.id] = (matCounts[slot.id] ?? 0) + (slot.qty ?? 1);
      }
    }
    const matStr = Object.entries(matCounts).map(([id, qty]) =>
      `${ITEMS[id]?.name ?? id}: ${qty}`).join('  ');
    this._addText(panel, bx + 12, by + 52, matStr || 'None', '#aabbcc', 11, PW - 24);

    // Recipes
    const recipes = getAvailableRecipes(this.player);
    this._addText(panel, bx + 12, by + 72, '── Recipes ──', '#888899', 12);

    recipes.forEach((recipe, i) => {
      const ry = by + 88 + i * 34;
      if (ry + 32 > by + PH - 10) return; // overflow guard

      const clr = recipe.canCraft ? 0x1a2a1a : 0x111118;
      const bg = this.add.rectangle(bx + PW / 2, ry + 15, PW - 24, 30, clr)
        .setStrokeStyle(1, recipe.canCraft ? 0x44aa44 : 0x222233).setInteractive();
      panel.add(bg);

      const ingStr = recipe.ingredients.map(ing => `${ITEMS[ing.id]?.name ?? ing.id}×${ing.qty}`).join(', ');
      const resStr = `→ ${ITEMS[recipe.result.id]?.name ?? recipe.result.id}`;
      this._addText(panel, bx + 16, ry + 4, recipe.name, recipe.canCraft ? '#88ff88' : '#556677', 12);
      this._addText(panel, bx + 16, ry + 18, ingStr + '  ' + resStr, '#667788', 10, PW - 120);

      if (recipe.canCraft) {
        const btn = this._addText(panel, bx + PW - 16, ry + 10, '[CRAFT]', '#ffd700', 13).setOrigin(1, 0.5)
          .setInteractive();
        btn.on('pointerdown', () => {
          const result = craftItem(this.player, recipe.id);
          this.events_bus.emit(EV.LOG_MSG, { text: result.message, color: result.success ? '#ffd700' : '#ff8888' });
          this.events_bus.emit(EV.STATS_CHANGED);
          this._openPanel(PANEL.CRAFTING);
        });
        panel.add(btn);
      }
    });
  }

  // ── Character Panel ───────────────────────────────────────

  _renderCharPanel(W, H) {
    const { bx, by, PW, PH, panel } = this._panelBase(W, H, '⚙ CHARACTER');
    const p = this.player;
    const lines = [
      `Name:     ${p.name}`,
      `Level:    ${p.level}  (XP: ${p.xp} / ${p.xpToNext})`,
      `HP:       ${p.stats.hp} / ${p.stats.maxHp}`,
      `Mana:     ${p.stats.mana} / ${p.stats.maxMana}`,
      `Gold:     ${p.gold}`,
      '',
      `Attack:   ${p.stats.atk}  (base ${p.baseStats.atk} + bonus ${p.stats.bonusAtk ?? 0} + equip)`,
      `Defense:  ${p.stats.def}  (base ${p.baseStats.def} + bonus ${p.stats.bonusDef ?? 0} + equip)`,
      `Speed:    ${p.stats.spd}`,
      `Crit:     ${Math.round((p.stats.critChance ?? 0.05) * 100)}%`,
      `Dodge:    ${Math.round((p.stats.dodgeChance ?? 0) * 100)}%`,
      '',
      '── Equipment ──',
      `Weapon:   ${p.equipment.weapon?.name ?? 'None'}`,
      `Armor:    ${p.equipment.armor?.name  ?? 'None'}`,
      `Ring:     ${p.equipment.ring?.name   ?? 'None'}`,
      `Amulet:   ${p.equipment.amulet?.name ?? 'None'}`,
      '',
      '── Skills Unlocked ──',
      p.skills.size ? [...p.skills].join(', ') : 'None',
      '',
      '── Status Effects ──',
      p.statusEffects.length
        ? p.statusEffects.map(e => `${e.type}(${e.duration})`).join(', ')
        : 'None',
    ];
    this._addText(panel, bx + 24, by + 40, lines.join('\n'), '#ccddee', 13, PW - 48)
      .setLineSpacing(5);
  }

  // ── Helpers ───────────────────────────────────────────────

  _addText(panel, x, y, str, color = '#ccddee', size = 13, wrapWidth = 0) {
    const cfg = {
      fontFamily: 'Courier New, monospace',
      fontSize: `${size}px`,
      color: String(color),
    };
    if (wrapWidth) cfg.wordWrap = { width: wrapWidth };
    const t = this.add.text(x, y, str, cfg);
    if (panel) panel.add(t);
    return t;
  }

  _onDeath() {
    this.scene.stop(SCENE.UI);
    this.scene.start(SCENE.GAMEOVER, {
      won: false,
      floor: this.floor,
      level: this.player.level,
      gold: this.player.gold,
    });
  }

  _onVictory() {
    this.scene.stop(SCENE.UI);
    this.scene.start(SCENE.GAMEOVER, {
      won: true,
      floor: this.floor,
      level: this.player.level,
      gold: this.player.gold,
    });
  }
}
