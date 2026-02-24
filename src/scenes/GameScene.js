// ============================================================
//  Darkspawn Rogue Quest — Game Scene (Main Gameplay)
// ============================================================
import { SCENE, TILE, VIS, EV, TILE_SIZE, MAP_W, MAP_H,
         DUNGEON_CFG, ITEM_TYPE, AI, C, DIR4 } from '../data/Constants.js';
import { generateDungeon } from '../systems/DungeonGenerator.js';
import { generateTown } from '../systems/TownGenerator.js';
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
import { saveGame, loadGame } from '../systems/SaveSystem.js';
import { Music, themeForFloor } from '../systems/ProceduralMusic.js';
import { SFX } from '../systems/SoundEffects.js';

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

    this.floor = 0; // 0 = town, 1-10 = dungeon floors
    this.player = new Player(this.events_bus);
    this.activePanel = PANEL.NONE;
    this.pendingSkillEffect = null;
    this.targeting = false;
    this.targetCallback = null;
    this.gamePaused = false;
    this.floorCache = new Map(); // stores saved floor state keyed by floor number
    this._floorStartPos = null;
    this._floorEndPos   = null;
    this._clickPath      = [];
    this._clickWalkTimer = null;
    this._prevVisibleMonsters = new Set();

    this._setupInput();

    // Load from save if requested by MenuScene
    const savedData = this.scene.settings.data?.loadSave ? loadGame() : null;
    if (savedData) {
      this._loadSave(savedData);
    } else {
      this._loadFloor(this.floor);
    }

    // Start dungeon music (user already clicked a button to reach this scene)
    Music.play(themeForFloor(this.floor));

    // Listen for events from UIScene
    this.events_bus.on(EV.PLAYER_DIED,  () => this._onDeath());
    this.events_bus.on(EV.PLAYER_WIN,   () => this._onVictory());
    this.events_bus.on(EV.PAUSE_GAME,   () => { this.gamePaused = true; });
    this.events_bus.on(EV.RESUME_GAME,  () => { this.gamePaused = false; });
    this.events_bus.on('float-dmg', ({ x, y, dmg, color }) => this._showDamageNumber(x, y, dmg, color));

    // Persistent graphics layers for status icons and AoE preview
    this._statusIconGraphics = this.add.graphics().setDepth(22);
    this._aoeGraphics        = this.add.graphics().setDepth(8);
    // Pulse animation for status icon visibility
    this.tweens.add({
      targets: this._statusIconGraphics,
      alpha: 0.5, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  update() {
    if (this.activePanel !== PANEL.NONE || this.targeting || this.gamePaused) return;

    const now = Date.now();
    for (const [code, pressTime] of Object.entries(this.heldKeys)) {
      const dir = this.moveKeys[code];
      if (!dir) continue;
      const held = now - pressTime;
      if (held >= this.keyRepeat && now - this.lastMoveTime >= this.keyInterval) {
        this._playerMove(dir.dx, dir.dy);
        this.lastMoveTime = now;
        break;
      }
    }
  }

  // ── Floor Loading ────────────────────────────────────────

  _loadFloor(floorNum, fromBelow = false) {
    // Clear previous floor
    if (this.tileLayer)    this.tileLayer.destroy();
    if (this.itemLayer)    this.itemLayer.destroy();
    if (this.entityLayer)  this.entityLayer.destroy();
    if (this.fogLayer)     this.fogLayer.destroy();
    if (this.overlayPanel) this.overlayPanel.destroy();
    if (this._pathGraphics) { this._pathGraphics.destroy(); this._pathGraphics = null; }
    if (this._statusIconGraphics) this._statusIconGraphics.clear();
    if (this._aoeGraphics) this._aoeGraphics.clear();
    this._cancelClickWalk();

    this.activePanel = PANEL.NONE;
    this._prevVisibleMonsters = new Set(); // reset so new floor monsters trigger roar

    // ── Restore cached floor or generate fresh ──────────────
    const cached = this.floorCache.get(floorNum);
    if (cached) {
      this.grid           = cached.grid;
      this.rooms          = cached.rooms;
      this.vis            = cached.vis;
      this.monsters       = cached.monsters;
      this.floorItems     = cached.floorItems;
      this._floorStartPos = cached.startPos;
      this._floorEndPos   = cached.endPos;
      // Place player at the stair they came through
      const pos = fromBelow ? cached.endPos : cached.startPos;
      this.player.x = pos.x;
      this.player.y = pos.y;
    } else if (floorNum === 0) {
      // Generate the fixed starting town
      const town = generateTown();
      this.grid           = town.grid;
      this.rooms          = town.rooms;
      this.vis            = createVisGrid();
      this._floorStartPos = town.startPos;
      this._floorEndPos   = town.endPos;
      // Player always starts at the town's designated start position
      const pos = fromBelow ? town.endPos : town.startPos;
      this.player.x = pos.x;
      this.player.y = pos.y;
      this.monsters   = [];
      this.floorItems = [];
    } else {
      // Generate dungeon
      const dungeon = generateDungeon(floorNum);
      this.grid           = dungeon.grid;
      this.rooms          = dungeon.rooms;
      this.vis            = createVisGrid();
      this._floorStartPos = dungeon.startPos;
      this._floorEndPos   = dungeon.endPos;
      // Place player at the stair they came through
      const pos = fromBelow ? dungeon.endPos : dungeon.startPos;
      this.player.x = pos.x;
      this.player.y = pos.y;
      // Spawn monsters
      this.monsters = [];
      this._spawnMonsters(dungeon, floorNum);
      // Spawn items on map (not in inventory)
      this.floorItems = []; // [{ x, y, item }]
      this._spawnItems(dungeon, floorNum);
    }

    // Build tile visuals
    this._buildTileLayer();
    this._buildFogLayer();

    // Initial FOV
    this._updateFOV();

    // Camera follow player
    // Camera follow player — extend bounds by half the viewport on every side
    // so the camera can always keep the player perfectly centred even at map edges
    const zoom  = window.PORTRAIT ? 1.5 : 1;
    const camW = Math.ceil(this.cameras.main.width  / zoom);
    const camH = Math.ceil(this.cameras.main.height / zoom);
    const hW   = Math.ceil(camW / 2);
    const hH   = Math.ceil(camH / 2);
    this.cameras.main.setBounds(-hW, -hH, MAP_W * T + hW * 2, MAP_H * T + hH * 2);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(zoom);

    // Emit initial state
    this.events_bus.emit(EV.FLOOR_CHANGED, { floor: floorNum });
    this.events_bus.emit(EV.STATS_CHANGED);
    this.events_bus.emit(EV.LOG_MSG, {
      text: floorNum === 0 && !cached
        ? `Welcome to town! Enter the left building to start your adventure.`
        : floorNum === 0
          ? `You return to town.`
          : floorNum === 1 && !cached
            ? `Floor ${floorNum}. The dungeon stretches before you...`
            : cached
              ? `You return to floor ${floorNum}.`
              : `Floor ${floorNum}. The air grows colder...`,
      color: floorNum === 0 ? '#88cc88' : '#88aacc'
    });

    if (floorNum === DUNGEON_CFG.FLOORS) {
      this.events_bus.emit(EV.LOG_MSG, {
        text: '⚠ You sense an overwhelming evil presence...', color: '#ff44ff'
      });
    }

    // Adapt music atmosphere to the new floor depth
    Music.setTheme(themeForFloor(floorNum));
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
      const def = ITEMS[entry.id];
      // Equipment items should never stack — always qty 1
      const qty = def?.slot ? 1 : rand(1, 3);
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
      this.floorItems.push({ x: gx, y: gy, item: { ...createItem('gold'), value: amount } });
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
      const key = `item-${fi.item.id ?? fi.item.type ?? 'material'}`;
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
    const _nowVisible = new Set();
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
      if (visible) {
        _nowVisible.add(m);
        if (!this._prevVisibleMonsters.has(m)) SFX.play('roar'); // new monster spotted
      }
      spr.setPosition(m.x * T + T / 2, m.y * T + T / 2).setVisible(visible);
      hpBg.setPosition(m.x * T, m.y * T - 6).setVisible(visible);
      const hpRatio = Math.max(0, m.stats.hp / m.stats.maxHp);
      hpFill.setPosition(m.x * T, m.y * T - 6).setSize(T * hpRatio, 4).setVisible(visible);
    }
    this._prevVisibleMonsters = _nowVisible;

    // Player sprite
    this.playerSprite.setPosition(this.player.x * T + T / 2, this.player.y * T + T / 2);

    // Player HP bar (below sprite)
    const pHpRatio = Math.max(0, this.player.stats.hp / this.player.stats.maxHp);
    this.playerHpBar.bg.setPosition(this.player.x * T, this.player.y * T + T - 4);
    this.playerHpBar.fill.setPosition(this.player.x * T, this.player.y * T + T - 4)
      .setSize(T * pHpRatio, 4);

    // Status icons (burn / poison)
    if (this._statusIconGraphics) {
      this._statusIconGraphics.clear();
      this._drawStatusIcons(this.player.x, this.player.y, this.player.statusEffects);
      for (const m of this.monsters) {
        if (!m.isDead && this.vis[m.y]?.[m.x] === VIS.VISIBLE) {
          this._drawStatusIcons(m.x, m.y, m.statusEffects);
        }
      }
    }

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

    // Repeat-delay config for hold-to-walk
    this.keyRepeat   = 180; // ms of hold before repeat starts
    this.keyInterval = 100; // ms between repeated moves while held
    this.heldKeys    = {};  // code -> timestamp of first press (ms)
    this.lastMoveTime = 0;  // timestamp of most recent held-key move (ms)

    // Direction map used by both _onKeyDown and the hold-to-walk update loop
    this.moveKeys = {
      ArrowUp:    { dx: 0, dy: -1 }, KeyW:    { dx: 0, dy: -1 }, Numpad8: { dx: 0,  dy: -1 },
      ArrowDown:  { dx: 0, dy:  1 }, KeyS:    { dx: 0, dy:  1 }, Numpad2: { dx: 0,  dy:  1 },
      ArrowLeft:  { dx: -1, dy: 0 }, KeyA:    { dx: -1, dy: 0 }, Numpad4: { dx: -1, dy:  0 },
      ArrowRight: { dx:  1, dy: 0 }, KeyD:    { dx:  1, dy: 0 }, Numpad6: { dx:  1, dy:  0 },
      Numpad7: { dx: -1, dy: -1 }, Numpad9: { dx: 1, dy: -1 },
      Numpad1: { dx: -1, dy:  1 }, Numpad3: { dx: 1, dy:  1 },
    };

    kb.on('keydown', (event) => {
      this._cancelClickWalk();
      if (!this.heldKeys[event.code]) this.heldKeys[event.code] = Date.now();
      this._onKeyDown(event);
    });
    kb.on('keyup',   (event) => { delete this.heldKeys[event.code]; });

    this.input.on('pointerdown', (ptr) => this._onPointerDown(ptr));
    this.input.on('pointerdown', (ptr) => { if (ptr.rightButtonDown()) this._cancelClickWalk(); });
  }

  _onKeyDown(event) {
    if (this.gamePaused) return;

    // Escape always opens pause menu (closing any open panel/targeting first)
    if (event.code === 'Escape') {
      if (this.activePanel !== PANEL.NONE) this._closePanel();
      if (this.targeting) { this._cancelTargeting(); }
      this.events_bus.emit(EV.PAUSE_GAME);
      return;
    }

    if (this.activePanel !== PANEL.NONE) {
      if (event.code === 'KeyI' ||
          event.code === 'KeyK' || event.code === 'KeyC' || event.code === 'KeyP') {
        this._closePanel();
      }
      return;
    }

    if (this.targeting) {
      return; // mouse handles target selection
    }

    const code = event.code;
    const now = Date.now();

    // Move
    if (this.moveKeys[code]) {
      const { dx, dy } = this.moveKeys[code];
      this._playerMove(dx, dy);
      return;
    }

    // Actions
    switch (code) {
      case 'Space':  this._playerDefaultAction(); break;
      case 'KeyG':  this._playerPickUp(); break;
      case 'Period': this._endPlayerTurn(); break; // wait
      case 'Greater': case 'Period': break; // handled by _playerDescend
      case 'KeyI': this._openPanel(PANEL.INVENTORY); break;
      case 'KeyK': this._openPanel(PANEL.SKILLS);    break;
      case 'KeyC': this._openPanel(PANEL.CRAFTING);  break;
      case 'KeyP': this._openPanel(PANEL.CHAR);                    break;
      case 'Escape': this.events_bus.emit(EV.PAUSE_GAME);            break;
    }

    // Stairs
    if (event.key === '>') this._playerDescend();
    if (event.key === '<') this._playerAscend();
  }

  // ── Player Actions ───────────────────────────────────────

  _playerMove(dx, dy) {
    // Diagonal = 2 orthogonal turns (horizontal first, then vertical)
    if (dx !== 0 && dy !== 0) {
      this._playerMove(dx, 0);
      if (!this.player.isDead) this._playerMove(0, dy);
      return;
    }

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
    if (t === TILE.WALL || t === TILE.VOID || t === TILE.NPC) return;

    // Open doors
    if (t === TILE.DOOR) {
      this.grid[ny][nx] = TILE.FLOOR;
      this.tileSprites[ny][nx].setTexture('tile-floor');
      SFX.play('door');
      this.events_bus.emit(EV.LOG_MSG, { text: 'You open the door.', color: '#ccaa88' });
    }

    // Step on trap
    if (t === TILE.TRAP_HIDDEN) {
      this.grid[ny][nx] = TILE.TRAP_VISIBLE;
      const dmg = rand(3, 8) + this.floor;
      this.player.stats.hp -= dmg;
      this._showDamageNumber(this.player.x, this.player.y, dmg, '#ff3333');
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

    // Check for adjacent NPC in town
    this._checkNPCAdjacency();

    // Auto-pickup all items on this tile
    const itemsHere = this.floorItems.filter(f => f.x === nx && f.y === ny);
    for (const fi of itemsHere) {
      if (fi.item.type === ITEM_TYPE.GOLD)   SFX.play('coin');
      else if (fi.item.type === ITEM_TYPE.POTION) SFX.play('potion');
      else SFX.play('equip');
      this.player.pickUpItem(fi.item);
      this.floorItems.splice(this.floorItems.indexOf(fi), 1);
    }
    if (itemsHere.length > 0) this._rebuildItemSprites();

    this._endPlayerTurn();
  }

  _playerAttack(monster) {
    const result = resolveAttack(this.player, monster, this.events_bus);
    if (!result.hit) return;

    SFX.play('swing');
    this._showDamageNumber(monster.x, monster.y, result.damage, result.crit ? '#ff6600' : '#ffee33');

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

  /** Space / click-own-tile: pick up item → use stairs → wait */
  _playerDefaultAction() {
    const px = this.player.x, py = this.player.y;

    // 1. Pick up an item here (non-gold gets priority; gold is auto-collected on walk)
    const fi = this.floorItems.find(f => f.x === px && f.y === py);
    if (fi) {
      this._playerPickUp();
      return;
    }

    // 2. Use stairs
    const tile = this.grid[py][px];
    if (tile === TILE.STAIRS_DOWN) { this._playerDescend(); return; }
    if (tile === TILE.STAIRS_UP)   { this._playerAscend();  return; }

    // 3. Wait a turn
    this.events_bus.emit(EV.LOG_MSG, { text: 'You wait.', color: '#556677' });
    this._endPlayerTurn();
  }

  _playerPickUp() {
    const fi = this.floorItems.find(f => f.x === this.player.x && f.y === this.player.y);
    if (!fi) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'Nothing to pick up.', color: '#556677' });
      return;
    }
    if (fi.item.type === ITEM_TYPE.GOLD)        SFX.play('coin');
    else if (fi.item.type === ITEM_TYPE.POTION) SFX.play('potion');
    else SFX.play('equip');
    this.player.pickUpItem(fi.item);
    this.floorItems.splice(this.floorItems.indexOf(fi), 1);
    this._rebuildItemSprites();
    this._endPlayerTurn();
  }

  /** Show NPC dialogue when player stands adjacent to the town elder. */
  _checkNPCAdjacency() {
    const { x, y } = this.player;
    for (const { dx, dy } of DIR4) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H &&
          this.grid[ny][nx] === TILE.NPC) {
        this.events_bus.emit(EV.LOG_MSG, {
          text: '🧙 Elder: "Stay a while and listen..."',
          color: '#ddaaff',
        });
        return;
      }
    }
  }

  _saveCurrentFloor() {
    if (!this.grid) return;
    this.floorCache.set(this.floor, {
      grid:       this.grid,
      rooms:      this.rooms,
      vis:        this.vis,
      monsters:   this.monsters.filter(m => !m.isDead),
      floorItems: this.floorItems,
      startPos:   this._floorStartPos,
      endPos:     this._floorEndPos,
    });
  }

  /** Restore full game state from a save object returned by loadGame(). */
  _loadSave(data) {
    // ── Restore floor cache (already deserialized as a Map) ──
    this.floorCache = data.floorCache;
    this.floor      = data.floor;

    // ── Restore player fields ─────────────────────────────────
    const p  = this.player;
    const sp = data.player;
    p.name          = sp.name ?? 'Hero';
    p.x             = sp.x;
    p.y             = sp.y;
    p.baseStats     = { ...sp.baseStats };
    Object.assign(p.stats, sp.stats);
    p.level         = sp.level;
    p.xp            = sp.xp;
    p.gold          = sp.gold;
    p.skillPoints   = sp.skillPoints;
    p.inventory     = sp.inventory.map(it => it ? { ...it } : null);
    p.equipment     = Object.fromEntries(
      Object.entries(sp.equipment).map(([k, v]) => [k, v ? { ...v } : null])
    );
    p.skills        = new Set(sp.skills);
    p.statusEffects = sp.statusEffects.map(e => ({ ...e }));
    p.refreshStats();

    // ── Load the saved floor from cache ───────────────────────
    // _loadFloor will override player position to the stair pos;
    // we correct it immediately after.
    this._loadFloor(data.floor);

    // ── Restore exact saved position ──────────────────────────
    this.player.x = sp.x;
    this.player.y = sp.y;
    if (this.playerSprite) {
      this.playerSprite.setPosition(sp.x * T + T / 2, sp.y * T + T / 2);
    }
    // Recompute FOV from actual position
    this._updateFOV();

    this.events_bus.emit(EV.LOG_MSG, {
      text: `Save loaded — ${data.floor === 0 ? 'Town' : `Floor ${data.floor}`}. Welcome back!`,
      color: '#88ffcc',
    });
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
    SFX.play('stairs-down');
    this._saveCurrentFloor();
    this.floor++;
    this._loadFloor(this.floor, false);
  }

  _playerAscend() {
    if (this.grid[this.player.y][this.player.x] !== TILE.STAIRS_UP) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'No upward stairs here.', color: '#556677' });
      return;
    }
    if (this.floor <= 0) {
      this.events_bus.emit(EV.LOG_MSG, { text: 'You are already in town.', color: '#556677' });
      return;
    }
    SFX.play('stairs-up');
    this._saveCurrentFloor();
    this.floor--;
    this._loadFloor(this.floor, true);
  }

  _openChest(x, y) {
    SFX.play('chest');
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
      if (!m.isDead) {
        m.update(ctx);
        // Killed by status effect (burn/poison) during this tick — award XP + log
        if (m.isDead) this._onMonsterDeath(m);
      }
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
      SFX.play('skill-whirlwind');
      this._playSkillAnimation('whirlwind', this.player.x, this.player.y);
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
      SFX.play('skill-iceNova');
      this._playSkillAnimation('iceNova', this.player.x, this.player.y);
      const visible = this.monsters.filter(m => !m.isDead && this.vis[m.y]?.[m.x] === VIS.VISIBLE);
      iceNova(visible, result.duration);
      this.events_bus.emit(EV.LOG_MSG, { text: `${visible.length} monsters frozen!`, color: '#88ddff' });
      this._endPlayerTurn();
    } else if (result.needsTarget) {
      this._startTargeting(result.needsTarget, result);
    } else {
      // immediate non-targeting actives (berserkerRage, arcaneShield)
      SFX.play(`skill-${skillId === 'berserkerRage' ? 'berserker' : skillId === 'arcaneShield' ? 'arcaneShield' : skillId}`);
      this._playSkillAnimation(skillId, this.player.x, this.player.y);
      this._endPlayerTurn();
    }
  }

  /** Play a visual effect for a skill at tile (tx, ty). Player tile used for origin of projectiles. */
  _playSkillAnimation(skillId, tx, ty) {
    const px = this.player.x * T + T / 2;
    const py = this.player.y * T + T / 2;
    const sx = tx * T + T / 2;
    const sy = ty * T + T / 2;

    switch (skillId) {
      case 'magicBolt': {
        // Blue bolt projectile → impact flash
        const bolt = this.add.circle(px, py, 5, 0x4499ff).setDepth(30);
        this.tweens.add({ targets: bolt, x: sx, y: sy, duration: 160, ease: 'Linear',
          onComplete: () => {
            bolt.destroy();
            const flash = this.add.circle(sx, sy, 8, 0xaaddff, 0.9).setDepth(30);
            this.tweens.add({ targets: flash, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 220,
              onComplete: () => flash.destroy() });
          }
        });
        break;
      }
      case 'fireball': {
        // Orange projectile → expanding explosion
        const proj = this.add.circle(px, py, 7, 0xff6600).setDepth(30);
        this.tweens.add({ targets: proj, x: sx, y: sy, duration: 180, ease: 'Linear',
          onComplete: () => {
            proj.destroy();
            const boom = this.add.circle(sx, sy, 12, 0xff4400, 0.9).setDepth(30);
            const glow = this.add.circle(sx, sy, 22, 0xff8800, 0.5).setDepth(29);
            this.tweens.add({ targets: [boom, glow], scaleX: 2.8, scaleY: 2.8, alpha: 0, duration: 380,
              onComplete: () => { boom.destroy(); glow.destroy(); } });
          }
        });
        break;
      }
      case 'iceNova': {
        // Twin expanding rings from player
        const ring1 = this.add.circle(sx, sy, 10, 0x66eeff, 0.85).setDepth(30);
        const ring2 = this.add.circle(sx, sy, 6, 0xaaffff, 0.60).setDepth(30);
        this.tweens.add({ targets: ring1, scaleX: 7, scaleY: 7, alpha: 0, duration: 520, ease: 'Quad.out',
          onComplete: () => ring1.destroy() });
        this.time.delayedCall(90, () => {
          this.tweens.add({ targets: ring2, scaleX: 5, scaleY: 5, alpha: 0, duration: 420, ease: 'Quad.out',
            onComplete: () => ring2.destroy() });
        });
        break;
      }
      case 'arcaneShield': {
        // Pulsing purple ring around player
        const g = this.add.graphics().setDepth(30);
        let alpha = 1.0;
        const pulse = this.time.addEvent({ delay: 60, repeat: 8, callback: () => {
          g.clear();
          g.lineStyle(3, 0xbb66ff, alpha);
          g.strokeCircle(px, py, 22);
          g.lineStyle(1, 0xdd99ff, alpha * 0.5);
          g.strokeCircle(px, py, 30);
          alpha -= 0.1;
          if (alpha <= 0) { g.destroy(); pulse.remove(); }
        }});
        break;
      }
      case 'berserkerRage': {
        // Red expanding burst around player
        const g = this.add.graphics().setDepth(30);
        g.fillStyle(0xff2200, 0.55);
        g.fillCircle(px, py, 28);
        this.tweens.add({ targets: g, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 380,
          onComplete: () => g.destroy() });
        break;
      }
      case 'whirlwind': {
        // Spinning ring that expands briefly
        const g = this.add.graphics().setDepth(30);
        let angle = 0;
        const spin = this.time.addEvent({ delay: 28, repeat: 14, callback: () => {
          g.clear();
          g.lineStyle(2.5, 0x88ff44, 0.9 - angle / 400);
          g.strokeCircle(px, py, 24 + angle * 0.3);
          g.lineStyle(1.5, 0xccff88, 0.6 - angle / 600);
          g.strokeCircle(px, py, 16 + angle * 0.2);
          angle += 26;
          if (angle > 360) { g.destroy(); spin.remove(); }
        }});
        break;
      }
      case 'shadowStep': {
        // Dark fade at origin → bright appear at destination
        const orig = this.add.circle(px, py, 20, 0x111133, 0.75).setDepth(30);
        this.tweens.add({ targets: orig, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 220,
          onComplete: () => orig.destroy() });
        this.time.delayedCall(100, () => {
          const dest = this.add.circle(sx, sy, 20, 0x4466ff, 0.7).setDepth(30);
          this.tweens.add({ targets: dest, scaleX: 0.2, scaleY: 0.2, alpha: 0, duration: 300,
            onComplete: () => dest.destroy() });
        });
        break;
      }
      case 'deathMark': {
        // Dark-purple flash on target
        const g = this.add.graphics().setDepth(30);
        g.fillStyle(0x990099, 0.75);
        g.fillCircle(sx, sy, 18);
        this.tweens.add({ targets: g, scaleX: 1.9, scaleY: 1.9, alpha: 0, duration: 420,
          onComplete: () => g.destroy() });
        break;
      }
      default: break;
    }
  }

  // ── Targeting ───────────────────────────────────────────────────────────────

  /**
   * Enter visual targeting mode for a pre-selected skill.
   * MP is NOT consumed here — it is consumed when the player confirms the tile.
   */
  _enterTargetingMode(skillId) {
    this._cancelTargeting(false);
    const def = SKILL_BY_ID[skillId];
    this.targeting = true;
    this.targetMode = skillId;
    this.targetExtra = {
      skillId,
      pendingCast: true,
      baseDmg:  def?.active?.baseDmg,
      radius:   def?.active?.radius,
      duration: def?.active?.duration,
    };
    this._targetCursor = this.add.rectangle(0, 0, T, T, 0x44ff88, 0.22)
      .setVisible(false).setDepth(25);
    this.input.on('pointermove', this._onTargetMove, this);
  }

  // ── Floating damage numbers ─────────────────────────────────────────────────

  _showDamageNumber(tileX, tileY, amount, color = '#ffee33') {
    const wx = tileX * T + T / 2;
    const wy = tileY * T;
    const txt = this.add.text(wx, wy, String(amount), {
      fontFamily: 'Courier New',
      fontSize: '14px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(40);
    this.tweens.add({
      targets: txt,
      y: wy - 28,
      alpha: 0,
      duration: 900,
      ease: 'Quad.out',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Status icon drawing ────────────────────────────────────────────────────

  /** Draw small coloured dots in the bottom-right corner of a tile for each active DoT. */
  _drawStatusIcons(tx, ty, effects) {
    if (!effects?.length || !this._statusIconGraphics) return;
    const g = this._statusIconGraphics;
    let i = 0;
    for (const eff of effects) {
      let color = null;
      if (eff.type === 'burn')   color = 0xff6600;
      if (eff.type === 'poison') color = 0x22dd44;
      if (color === null) continue;
      // Stack dots upward from bottom-right corner of the tile
      g.fillStyle(color, 1);
      g.fillRect(tx * T + T - 7, ty * T + T - 7 - i * 8, 6, 6);
      i++;
    }
  }

  // ── Targeting ───────────────────────────────────────────────────────────────

  _cancelTargeting(emitEvent = true) {
    if (this._targetCursor) { this._targetCursor.destroy(); this._targetCursor = null; }
    this.input.off('pointermove', this._onTargetMove, this);
    this.targeting = false;
    if (this._aoeGraphics) this._aoeGraphics.clear();
    if (emitEvent) this.events_bus?.emit('skill-selection-done');
  }

  _startTargeting(mode, extra) {
    this._cancelTargeting(false); // clear any previous targeting session
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
    const zoom = this.cameras.main.zoom;
    const wx = this.cameras.main.scrollX + ptr.x / zoom;
    const wy = this.cameras.main.scrollY + ptr.y / zoom;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
    if (this._targetCursor) {
      this._targetCursor.setPosition(tx * T + T / 2, ty * T + T / 2).setVisible(true);
    }
    // Fireball AoE preview (radius 1 = 3×3 tiles)
    if (this._aoeGraphics) {
      this._aoeGraphics.clear();
      if (this.targetMode === 'fireball') {
        this._aoeGraphics.lineStyle(1, 0xff8800, 0.7);
        this._aoeGraphics.fillStyle(0xff5500, 0.18);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            this._aoeGraphics.fillRect((tx + dx) * T, (ty + dy) * T, T, T);
            this._aoeGraphics.strokeRect((tx + dx) * T, (ty + dy) * T, T, T);
          }
        }
      }
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

    // Clicking own tile → default context action
    if (dx === 0 && dy === 0) {
      this._playerDefaultAction();
      return;
    }

    // Adjacent monster (any of 8 directions) → attack directly
    const adjMonster = this.monsters.find(m => !m.isDead && m.x === tx && m.y === ty);
    if (adjMonster && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
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

    // If the next step is occupied by a visible monster, attack it and cancel the walk.
    const next = this._clickPath[0];
    const blockedByMonster = this.monsters.find(m =>
      !m.isDead &&
      this.vis[m.y]?.[m.x] === VIS.VISIBLE &&
      m.x === next.x && m.y === next.y
    );
    if (blockedByMonster) {
      this._cancelClickWalk();
      this._playerAttack(blockedByMonster);
      this._endPlayerTurn();
      return;
    }

    this._clickPath.shift();
    this._drawPathPreview();

    const dx = next.x - this.player.x;
    const dy = next.y - this.player.y;
    this._playerMove(dx, dy);

    // If the player didn't reach the expected tile (e.g., bump-attacked a monster
    // that wasn't visible yet, or was blocked by a chest), cancel the walk.
    if (this.player.x !== next.x || this.player.y !== next.y) {
      this._cancelClickWalk();
      return;
    }

    // If more steps remain, schedule the next one
    if (this._clickPath.length) {
      this._clickWalkTimer = this.time.delayedCall(120, () => this._stepClickWalk());
    } else {
      this._cancelClickWalk();
    }
  }

  _onPointerDown(ptr) {
    if (ptr.rightButtonDown()) return;
    if (this._panelJustClosed) return;  // panel button click should not propagate to walk
    // Block if pointer is over any UIScene interactive element (slots, buttons, zones)
    const ui = this.scene.get(SCENE.UI);
    if (ui?.input.hitTestPointer(ptr).length > 0) return;
    if (!this.targeting) {
      // Click-to-walk: ignore clicks over UI panels
      if (this.activePanel !== PANEL.NONE) return;

      const zoom = this.cameras.main.zoom;
      const wx = this.cameras.main.scrollX + ptr.x / zoom;
      const wy = this.cameras.main.scrollY + ptr.y / zoom;
      const tx = Math.floor(wx / T);
      const ty = Math.floor(wy / T);

      // Must be an explored tile
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;
      if (this.vis[ty]?.[tx] === VIS.HIDDEN) return;

      this._startClickWalk(tx, ty);
      this.events_bus.emit('world-click');
      return;
    }

    // Targeting mode (skill aim): handle spell click
    const zoom = this.cameras.main.zoom;
    const wx = this.cameras.main.scrollX + ptr.x / zoom;
    const wy = this.cameras.main.scrollY + ptr.y / zoom;
    const tx = Math.floor(wx / T), ty = Math.floor(wy / T);

    if (this._targetCursor) { this._targetCursor.destroy(); this._targetCursor = null; }
    this.input.off('pointermove', this._onTargetMove, this);
    this.targeting = false;
    if (this._aoeGraphics) this._aoeGraphics.clear();

    const mode = this.targetMode;
    let   extra = this.targetExtra;

    // If skill was pre-selected (MP not yet spent), consume mana now
    if (extra?.pendingCast) {
      const res = useSkill(this.player, extra.skillId);
      if (!res.success) {
        this.events_bus.emit(EV.LOG_MSG, { text: res.message, color: '#ff8888' });
        this.events_bus.emit('skill-selection-done');
        return;
      }
      this.events_bus.emit(EV.LOG_MSG, { text: res.message, color: '#aa88ff' });
      this.events_bus.emit(EV.STATS_CHANGED);
      extra = { ...extra, ...res, pendingCast: false };
    }

    if (mode === 'magicBolt') {
      SFX.play('skill-magicBolt');
      this._playSkillAnimation('magicBolt', tx, ty);
      const m = this.monsters.find(mon => mon.x === tx && mon.y === ty && !mon.isDead);
      if (m) {
        const dmg = magicBoltDamage(this.player, m, extra.baseDmg, this.player.level);
        this._showDamageNumber(m.x, m.y, dmg, '#88aaff');
        this.events_bus.emit(EV.LOG_MSG, { text: `Magic Bolt hits ${m.name} for ${dmg}!`, color: '#8888ff' });
        if (m.isDead) this._onMonsterDeath(m);
      } else {
        this.events_bus.emit(EV.LOG_MSG, { text: 'Missed!', color: '#888' });
      }
    } else if (mode === 'fireball') {
      SFX.play('skill-fireball');
      this._playSkillAnimation('fireball', tx, ty);
      const hits = fireballDamage(this.player, this.monsters, tx, ty, extra.baseDmg, this.player.level, this.events_bus);
      this.events_bus.emit(EV.LOG_MSG, { text: `Fireball! ${hits.length} enemies hit.`, color: '#ff8800' });
      for (const { entity, damage } of hits) {
        this._showDamageNumber(entity.x, entity.y, damage, '#ff6600');
        if (entity.isDead) this._onMonsterDeath(entity);
      }
    } else if (mode === 'shadowStep') {
      if (this.vis[ty]?.[tx] === VIS.VISIBLE && this.grid[ty][tx] !== TILE.WALL) {
        SFX.play('skill-shadowStep');
        this._playSkillAnimation('shadowStep', tx, ty);
        this.player.x = tx; this.player.y = ty;
        this.events_bus.emit(EV.LOG_MSG, { text: 'Shadow Step!', color: '#88ff88' });
      }
    } else if (mode === 'deathMark') {
      const m = this.monsters.find(mon => mon.x === tx && mon.y === ty && !mon.isDead);
      if (m) {
        SFX.play('skill-deathMark');
        this._playSkillAnimation('deathMark', tx, ty);
        applyStatus(m, 'deathMark', 10);
        this.events_bus.emit(EV.LOG_MSG, { text: `${m.name} is marked for death!`, color: '#ff44ff' });
      }
    }

    this.events_bus.emit('skill-selection-done'); // notify UIScene to clear hotbar selection
    this._endPlayerTurn();
  }

  // ── UI Panels ────────────────────────────────────────────

  _openPanel(panel) {
    if (this.activePanel === panel) { this._closePanel(); return; }
    this._closePanel();
    this.activePanel = panel;

    const cam = this.cameras.main;
    cam.stopFollow(); // keep the game world still while panel is open

    if (window.PORTRAIT) {
      // Portrait mode: UIScene renders the panel overlay in screen-space (no zoom issues)
      this.events_bus.emit('panel-open', panel);
      return;
    }

    // Desktop mode: render panel in GameScene (camera zoom=1, world == screen)
    // Snap camera to player so panel sits at a stable screen position
    if (this.playerSprite) {
      const sf = 1 / cam.zoom;
      cam.setScroll(
        this.playerSprite.x - cam.width * sf / 2,
        this.playerSprite.y - cam.height * sf / 2,
      );
    }

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
    if (window.PORTRAIT) {
      this.events_bus?.emit('panel-close');
    }
    // Resume camera follow now that the panel is closed
    if (this.playerSprite) {
      this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);
    }
    // Prevent the same click from immediately triggering click-to-walk
    this._panelJustClosed = true;
    this.time.delayedCall(80, () => { this._panelJustClosed = false; });
  }

  _panelBase(W, H, title) {
    const cam  = this.cameras.main;
    const zoom = cam.zoom;
    const sf   = 1 / zoom;  // world-units per screen-pixel

    // In portrait mode the UIScene HUD overlaps the game canvas:
    //   PORTRAIT_HUD_TOP    matches _buildHUD_portrait STATS_H (88px top stats bar)
    //   PORTRAIT_HUD_BOTTOM matches _buildHUD_portrait BOTTOM_H (LOG_H+HOTBAR_H+DPAD_H = 192px)
    // Constrain the panel to the visible game area so it is never hidden behind the HUD.
    const PORTRAIT_HUD_TOP    = 88;   // px — keep in sync with UIScene _buildHUD_portrait STATS_H
    const PORTRAIT_HUD_BOTTOM = 192;  // px — keep in sync with UIScene _buildHUD_portrait BOTTOM_H
    const PANEL_MARGIN        = 20;   // px — minimum breathing room around the panel edges
    const hudTop    = window.PORTRAIT ? PORTRAIT_HUD_TOP    : 0;
    const hudBottom = window.PORTRAIT ? PORTRAIT_HUD_BOTTOM : 0;
    const availH    = H - hudTop - hudBottom;  // screen pixels available between the two HUD bars

    const PW   = Math.round(Math.min(560, W - PANEL_MARGIN) * sf);
    const PH   = Math.round(Math.min(440, availH - PANEL_MARGIN) * sf);
    const bx   = cam.scrollX + (W * sf - PW) / 2;
    const by   = cam.scrollY + (hudTop + (availH - PH * zoom) / 2) * sf;
    this._panelSf = sf;

    this.overlayPanel = this.add.container(0, 0).setDepth(30);

    const bg = this.add.rectangle(bx + PW / 2, by + PH / 2, PW, PH, 0x0d1117, 0.97)
      .setStrokeStyle(Math.max(1, Math.round(2 * sf)), 0x334466);
    const titleTxt = this.add.text(bx + Math.round(12 * sf), by + Math.round(10 * sf), title, {
      fontFamily: 'Courier New', fontSize: `${Math.round(18 * sf)}px`, color: '#ffd700'
    });
    const closeTxt = this.add.text(bx + PW - Math.round(12 * sf), by + Math.round(10 * sf), '[ESC]', {
      fontFamily: 'Courier New', fontSize: `${Math.round(14 * sf)}px`, color: '#556677'
    }).setOrigin(1, 0).setInteractive().on('pointerdown', () => this._closePanel());

    this.overlayPanel.add([bg, titleTxt, closeTxt]);
    return { bx, by, PW, PH, sf, panel: this.overlayPanel };
  }

  // ── Inventory Panel ──────────────────────────────────────

  _renderInventoryPanel(W, H) {
    const { bx, by, PW, PH, sf, panel } = this._panelBase(W, H, '⚔ INVENTORY');
    const SZ   = Math.round(44 * sf), GAP = Math.round(4 * sf);
    const COLS = window.PORTRAIT ? 4 : 6;
    const startX = bx + Math.round(12 * sf), startY = by + Math.round(40 * sf);
    this._selectedSlot = -1;
    this._selectedEquipSlot = null;
    this._invDetailText = null;

    // Equipment section
    this._addText(panel, bx + 12*sf, by + 38*sf, '── Equipment ──', '#888899', 12);
    const eqGap = Math.round(58 * sf);
    const eqSlots = [
      { label: 'WPN', slot: 'weapon', x: bx + 12*sf,                     y: by + 52*sf },
      { label: 'ARM', slot: 'armor',  x: bx + 12*sf + eqGap,             y: by + 52*sf },
      { label: 'RNG', slot: 'ring',   x: bx + 12*sf + eqGap * 2,         y: by + 52*sf },
      { label: 'AMU', slot: 'amulet', x: bx + 12*sf + eqGap * 3,         y: by + 52*sf },
    ];
    for (const eq of eqSlots) {
      const item = this.player.equipment[eq.slot];
      const clr = item ? 0x334466 : 0x1a1a2a;
      const box = this.add.rectangle(eq.x + SZ / 2, eq.y + SZ / 2, SZ, SZ, clr)
        .setStrokeStyle(Math.max(1, sf), 0x445577).setInteractive();
      this._addText(panel, eq.x + 2*sf, eq.y + 2*sf, eq.label, '#445566', 9);
      if (item) {
        const icon = this.add.image(eq.x + SZ / 2, eq.y + SZ / 2, `item-${item.id ?? item.type}`)
          .setScale(0.9 * sf);
        panel.add([box, icon]);
      } else {
        panel.add(box);
      }
      box.on('pointerdown', () => {
        if (!item) return;
        if (this._selectedEquipSlot === eq.slot) {
          // Second click: unequip
          SFX.play('equip');
          this.player.unequipItem(eq.slot);
          this._openPanel(PANEL.INVENTORY);
        } else {
          // First click: show item details
          this._selectedEquipSlot = eq.slot;
          this._selectedSlot = -1;  // clear any bag selection
          let detail = `${item.name}\n\n${item.description ?? ''}\n\n`;
          if (item.atk)      detail += `ATK: +${item.atk}\n`;
          if (item.def)      detail += `DEF: +${item.def}\n`;
          if (item.hpBonus)  detail += `HP: +${item.hpBonus}\n`;
          if (item.manaBonus) detail += `MP: +${item.manaBonus}\n`;
          if (item.value)    detail += `\nValue: ${item.value}g`;
          detail += '\n\n[Click again to unequip]';
          if (this._invDetailText) this._invDetailText.setText(detail).setColor('#ccddee');
        }
      });
    }

    // Inventory grid
    this._addText(panel, bx + 12*sf, by + 105*sf, '── Bag (click to use/equip) ──', '#888899', 12);
    for (let i = 0; i < 24; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const ix = startX + col * (SZ + GAP);
      const iy = by + 120*sf + row * (SZ + GAP);
      const item = this.player.inventory[i];
      const clr = item ? 0x1e2a3a : 0x111118;
      const box = this.add.rectangle(ix + SZ / 2, iy + SZ / 2, SZ, SZ, clr)
        .setStrokeStyle(Math.max(1, sf), 0x334455).setInteractive();
      panel.add(box);
      if (item) {
        const icon = this.add.image(ix + SZ / 2, iy + SZ / 2 - 6*sf, `item-${item.id ?? item.type}`)
          .setScale(0.75 * sf);
        const qtyTxt = this.add.text(ix + SZ - 4*sf, iy + SZ - 14*sf,
          item.qty > 1 ? String(item.qty) : '', {
            fontFamily: 'Courier New', fontSize: `${Math.round(10 * sf)}px`, color: '#aaaacc'
          }).setOrigin(1, 0);
        panel.add([icon, qtyTxt]);
        box.on('pointerdown', () => this._onInventorySlotClick(i, bx, by, PW, PH, panel, sf));
        box.on('pointerover', () => box.setFillColor(0x2a3a4a));
        box.on('pointerout',  () => box.setFillColor(clr));
      }
    }

    // Detail panel on right (only if space available)
    const detailX = startX + COLS * (SZ + GAP) + 20*sf;
    if (detailX < bx + PW - 10*sf) {
      this._invDetailText = this.add.text(detailX, by + 120*sf, 'Select an item', {
        fontFamily: 'Courier New', fontSize: `${Math.round(13 * sf)}px`, color: '#778899',
        wordWrap: { width: Math.round(160 * sf) }, lineSpacing: 4
      });
      panel.add(this._invDetailText);
    }
  }

  _onInventorySlotClick(i, bx, by, PW, PH, panel, sf = 1) {
    const item = this.player.inventory[i];
    if (!item) return;

    // Clear any equipment selection
    this._selectedEquipSlot = null;

    // Show detail
    let detail = `${item.name}\n\n${item.description ?? ''}\n\n`;
    if (item.atk)  detail += `ATK: +${item.atk}\n`;
    if (item.def)  detail += `DEF: +${item.def}\n`;
    if (item.hpBonus)   detail += `HP: +${item.hpBonus}\n`;
    if (item.manaBonus) detail += `MP: +${item.manaBonus}\n`;
    detail += `\nValue: ${item.value}g`;
    detail += `\n\n[Click again to use/equip]`;

    if (this._invDetailText) {
      const COLS = window.PORTRAIT ? 4 : 6;
      const SZ = Math.round(44 * sf), GAP = Math.round(4 * sf);
      const detailX = bx + 12*sf + COLS * (SZ + GAP) + 20*sf;
      this._invDetailText.setPosition(detailX, by + 120*sf).setText(detail).setColor('#ccddee');
    }

    if (this._selectedSlot === i) {
      // Second click: use/equip — play matching pickup sound first
      const item = this.player.inventory[i];
      if (item) {
        if (item.type === ITEM_TYPE.POTION)  SFX.play('potion');
        else if (item.type === ITEM_TYPE.GOLD) SFX.play('coin');
        else SFX.play('equip');
      }
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
    const { bx, by, PW, PH, sf, panel } = this._panelBase(W, H, '✦ SKILLS');
    this._addText(panel, bx + PW - 12*sf, by + 38*sf, `Points: ${this.player.skillPoints}`, '#ffd700', 14)
      .setOrigin(1, 0);

    const trees = Object.values(SKILL_TREES);
    const colW = (PW - 24*sf) / trees.length;

    trees.forEach((tree, ti) => {
      const cx = bx + 12*sf + ti * colW;
      // Tree header
      this._addText(panel, cx + colW / 2, by + 55*sf, tree.icon + ' ' + tree.name, tree.color, 15)
        .setOrigin(0.5, 0);

      tree.skills.forEach((skill, si) => {
        const cardH = Math.round(68 * sf);
        const sy = by + 85*sf + si * cardH;
        const unlocked = this.player.skills.has(skill.id);
        const canUnlockSkill = !unlocked && this.player.skillPoints > 0 &&
          (!skill.prereq || this.player.skills.has(skill.prereq));

        const tryUnlock = () => {
          if (unlockSkill(this.player, skill.id)) {
            this.events_bus.emit(EV.LOG_MSG, { text: `Unlocked: ${skill.name}!`, color: '#ffd700' });
            this.events_bus.emit(EV.STATS_CHANGED); // refresh skill hotbar immediately
            this._openPanel(PANEL.SKILLS);
          }
        };

        const bg = this.add.rectangle(cx + colW / 2, sy + Math.round(25 * sf), colW - 8*sf, Math.round(60 * sf),
          unlocked ? 0x1a2a1a : canUnlockSkill ? 0x1a1a2a : 0x111118)
          .setStrokeStyle(Math.max(1, sf), unlocked ? 0x44aa44 : canUnlockSkill ? 0x334466 : 0x222233)
          .setInteractive();
        if (canUnlockSkill) bg.on('pointerdown', tryUnlock);
        panel.add(bg);

        // Skill icon
        const iconSz = Math.round(22 * sf);
        const icon = this.add.image(cx + 16*sf, sy + 12*sf, `skill-${skill.id}`)
          .setDisplaySize(iconSz, iconSz);
        if (!unlocked) icon.setTint(0x444466);
        panel.add(icon);

        const nameClr = unlocked ? '#88ff88' : canUnlockSkill ? '#88aacc' : '#445566';
        this._addText(panel, cx + 32*sf, sy + 3*sf, skill.name, nameClr, 11);

        // Type tag: Active (cost) or Passive
        const isActive = !!skill.active;
        const typeStr = isActive ? `[Active ${skill.active.cost}mp]` : '[Passive]';
        this._addText(panel, cx + 32*sf, sy + 15*sf, typeStr, isActive ? '#5566aa' : '#446644', 9);

        // Description spanning full card width below the icon row
        this._addText(panel, cx + 4*sf, sy + 30*sf, skill.description, '#667788', 9, colW - 12*sf);

        if (unlocked) {
          this._addText(panel, cx + colW - 6*sf, sy + 50*sf, '✓', '#44ff44', 11).setOrigin(1, 0);
        } else if (canUnlockSkill) {
          const btn = this._addText(panel, cx + colW - 6*sf, sy + 48*sf, '[UNLOCK]', '#ffd700', 11).setOrigin(1, 0)
            .setInteractive();
          btn.on('pointerdown', tryUnlock);
          panel.add(btn);
        }
      });
    });
  }

  // ── Crafting Panel ────────────────────────────────────────

  _renderCraftingPanel(W, H) {
    const { bx, by, PW, PH, sf, panel } = this._panelBase(W, H, '⚒ CRAFTING');
    this._addText(panel, bx + 12*sf, by + 38*sf, 'Materials in inventory:', '#778899', 12);

    // Show materials
    const matCounts = {};
    for (const slot of this.player.inventory) {
      if (slot && slot.type === ITEM_TYPE.MATERIAL) {
        matCounts[slot.id] = (matCounts[slot.id] ?? 0) + (slot.qty ?? 1);
      }
    }
    const matStr = Object.entries(matCounts).map(([id, qty]) =>
      `${ITEMS[id]?.name ?? id}: ${qty}`).join('  ');
    this._addText(panel, bx + 12*sf, by + 52*sf, matStr || 'None', '#aabbcc', 11, PW - 24*sf);

    // Recipes
    const recipes = getAvailableRecipes(this.player);
    this._addText(panel, bx + 12*sf, by + 72*sf, '── Recipes ──', '#888899', 12);

    const rowH = Math.round(34 * sf);
    recipes.forEach((recipe, i) => {
      const ry = by + 88*sf + i * rowH;
      if (ry + Math.round(32 * sf) > by + PH - 10*sf) return; // overflow guard

      const clr = recipe.canCraft ? 0x1a2a1a : 0x111118;
      const bg = this.add.rectangle(bx + PW / 2, ry + Math.round(15 * sf), PW - 24*sf, Math.round(30 * sf), clr)
        .setStrokeStyle(Math.max(1, sf), recipe.canCraft ? 0x44aa44 : 0x222233).setInteractive();
      panel.add(bg);

      const ingStr = recipe.ingredients.map(ing => `${ITEMS[ing.id]?.name ?? ing.id}×${ing.qty}`).join(', ');
      const resStr = `→ ${ITEMS[recipe.result.id]?.name ?? recipe.result.id}`;
      this._addText(panel, bx + 16*sf, ry + 4*sf, recipe.name, recipe.canCraft ? '#88ff88' : '#556677', 12);
      this._addText(panel, bx + 16*sf, ry + 18*sf, ingStr + '  ' + resStr, '#667788', 10, PW - 120*sf);

      if (recipe.canCraft) {
        const btn = this._addText(panel, bx + PW - 16*sf, ry + 10*sf, '[CRAFT]', '#ffd700', 13).setOrigin(1, 0.5)
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
    const { bx, by, PW, PH, sf, panel } = this._panelBase(W, H, '⚙ CHARACTER');
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
    this._addText(panel, bx + 24*sf, by + 40*sf, lines.join('\n'), '#ccddee', 13, PW - 48*sf)
      .setLineSpacing(Math.round(5 * sf));
  }

  // ── Helpers ───────────────────────────────────────────────

  _addText(panel, x, y, str, color = '#ccddee', size = 13, wrapWidth = 0) {
    const sf = this._panelSf ?? 1;
    const cfg = {
      fontFamily: 'Courier New, monospace',
      fontSize: `${Math.round(size * sf)}px`,
      color: String(color),
    };
    if (wrapWidth) cfg.wordWrap = { width: Math.round(wrapWidth * sf) };
    const t = this.add.text(x, y, str, cfg);
    if (panel) panel.add(t);
    return t;
  }

  /** Called by UIScene portrait skill panel to unlock a skill. */
  _tryUnlockSkill(skillId) {
    if (unlockSkill(this.player, skillId)) {
      this.events_bus.emit(EV.LOG_MSG, { text: `Unlocked: ${SKILL_BY_ID[skillId]?.name}!`, color: '#ffd700' });
      this.events_bus.emit(EV.STATS_CHANGED);
      this._closePanel();
      this._openPanel(PANEL.SKILLS);
    }
  }

  /** Called by UIScene portrait crafting panel to craft an item. */
  _tryCraft(recipeId) {
    const result = craftItem(this.player, recipeId);
    this.events_bus.emit(EV.LOG_MSG, { text: result.message, color: result.success ? '#ffd700' : '#ff8888' });
    this.events_bus.emit(EV.STATS_CHANGED);
    this._closePanel();
    this._openPanel(PANEL.CRAFTING);
  }

  _onDeath() {
    Music.stop(2.0);
    this.scene.stop(SCENE.UI);
    this.scene.start(SCENE.GAMEOVER, {
      won: false,
      floor: this.floor,
      level: this.player.level,
      gold: this.player.gold,
    });
  }

  _onVictory() {
    Music.stop(2.0);
    this.scene.stop(SCENE.UI);
    this.scene.start(SCENE.GAMEOVER, {
      won: true,
      floor: this.floor,
      level: this.player.level,
      gold: this.player.gold,
    });
  }
}
