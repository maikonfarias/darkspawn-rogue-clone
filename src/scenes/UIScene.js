// ============================================================
//  Darkspawn Rogue Quest — UI Scene (HUD overlay)
//  Runs in parallel with GameScene
// ============================================================
import { SCENE, EV, C, VIS, TILE, MAP_W, MAP_H, ITEM_TYPE } from '../data/Constants.js';
import { XP_TABLE } from '../data/Constants.js';
import { SKILL_BY_ID, SKILL_TREES } from '../data/SkillData.js';
import { ITEMS, createItem } from '../data/ItemData.js';
import { getAvailableRecipes } from '../systems/CraftingSystem.js';
import { saveGame } from '../systems/SaveSystem.js';
import { Music } from '../systems/ProceduralMusic.js';
import { SFX } from '../systems/SoundEffects.js';
import { Settings } from '../systems/Settings.js';

const ACTIVE_SKILL_ORDER = ['berserkerRage','whirlwind','shadowStep','deathMark','magicBolt','fireball','iceNova','arcaneShield'];
const TARGETABLE_SKILLS  = new Set(['magicBolt','fireball','shadowStep','deathMark']);

const MM_SCALE = 2;   // pixels per tile on minimap
const MM_X    = 6;    // minimap top-left X
const MM_Y    = 6;    // minimap top-left Y
const MM_W    = MAP_W * MM_SCALE;  // 160
const MM_H    = MAP_H * MM_SCALE;  // 100

// Portrait HUD zone heights – must match _buildHUD_portrait definitions
const PORTRAIT_STATS_H  = 88;                          // top stats bar
const PORTRAIT_LOG_H    = 40;
const PORTRAIT_DPAD_H   = 140;  // skill hotbar (40px) + d-pad/button area (100px)
const PORTRAIT_BOTTOM_H = PORTRAIT_LOG_H + PORTRAIT_DPAD_H; // 180

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: SCENE.UI }); }

  create() {
    // Wait for GameScene to register itself
    this.time.delayedCall(100, () => this._init());
  }

  _init() {
    this.gameScene = this.scene.get(SCENE.GAME);
    this.bus = this.registry.get('events');
    if (!this.bus) { this.time.delayedCall(100, () => this._init()); return; }

    this._buildHUD();

    this.bus.on(EV.STATS_CHANGED,  () => { this._refreshStats(); this._refreshEquipPanel(); });
    this.bus.on(EV.LOG_MSG,        (msg) => this._addLog(msg));
    this.bus.on(EV.FLOOR_CHANGED,  ({ floor }) => { this._refreshFloor(floor); this._updateMinimap(); });
    this.bus.on(EV.MINIMAP_UPDATE, () => this._updateMinimap());
    this.bus.on(EV.PAUSE_GAME,     () => this._openPauseMenu());
    this.bus.on(EV.RESUME_GAME,    () => this._closePauseMenu());
    this.bus.on(EV.STATS_CHANGED,  () => this._refreshInventory());
    this.bus.on(EV.STATS_CHANGED,  () => this._refreshSkillHotbar());
    this.bus.on('skill-selection-done', () => this._clearSkillSelection());
    this.bus.on('world-click',          () => this._clearSelection());

    // Gamepad
    this._padPrevStart        = {}; // padIndex → wasPressed (for Start edge detect)
    this._padPrevSelect       = {}; // padIndex → wasPressed (for Select/Back button 8)
    this._pausePadPrev        = { up: false, down: false, a: false, b: false };
    this._pauseNavHeldSince   = null;
    this._pauseNavLastRepeat  = 0;
    this._pauseBtns           = null; // set when pause menu is open
    this._pauseCursor         = null;
    this._pauseSelIdx         = 0;
    this._instrClose          = null; // set when instructions overlay is open
    // Inventory pad navigation
    this._invPadMode          = false;
    this._invPadIdx           = 0;
    this._invPadNavHeld       = null;
    this._invPadNavLast       = 0;
    this._invPadNavPrev       = { up: false, down: false, left: false, right: false };
    this._invPadActionPrev    = { a: false, b: false, y: false };

    // Portrait panel overlay (panels rendered in UIScene for correct 1:1 screen coords)
    this.bus.on('panel-open',  (type) => this._showPanel(type));
    this.bus.on('panel-close', ()     => this._hidePanel());

    // Panel state
    this._panelCtr              = null;
    this._invTooltipTxt         = null;
    this._invSelectedSlot       = -1;
    this._invSelectedEquipSlot  = null;

    // Toggle minimap with M key
    this.input.keyboard.on('keydown-M', () => this._toggleMinimap());
    // Skill hotkeys 1–8 — only main-row digit keys, NOT numpad
    // (numpad digits are reserved for movement / classic roguelike controls)
    this.input.keyboard.on('keydown', (event) => {
      if (event.code.startsWith('Digit') && event.key >= '1' && event.key <= '8') {
        const idx = parseInt(event.key) - 1;
        const skillId = this._hotbarSkills?.[idx];
        if (skillId) this._useHotbarSkill(skillId);
      }
    });

    this._refreshStats();
    this._refreshInventory();
    this._refreshEquipPanel();
    // Sync floor text and minimap directly in case events fired before we were ready
    const gs = this.scene.get(SCENE.GAME);
    if (gs?.floor !== undefined) this._refreshFloor(gs.floor);
    if (gs?.grid)  this._updateMinimap();
  }

  // ── Lifecycle ────────────────────────────────────────────

  update() {
    const gp = this.input.gamepad;
    if (!gp || gp.total === 0) return;
    const DEAD = 0.4;
    let startPressed = false, selectPressed = false;
    let navUp = false, navDown = false, navLeft = false, navRight = false;
    let navA = false, navB = false;

    for (const pad of gp.gamepads) {
      if (!pad) continue;
      const pi      = pad.index;
      const prevS   = this._padPrevStart?.[pi] ?? false;
      const startNow  = !!pad.buttons[9]?.pressed;
      const selectNow = !!pad.buttons[8]?.pressed;

      // Start button — edge: toggle pause
      if (startNow && !prevS) startPressed = true;
      if (this._padPrevStart) this._padPrevStart[pi] = startNow;

      // Select/Back button — edge: toggle inventory mode
      const prevSel = this._padPrevSelect?.[pi] ?? false;
      if (selectNow && !prevSel) selectPressed = true;
      if (this._padPrevSelect) this._padPrevSelect[pi] = selectNow;

      // Navigation inputs
      const sx = pad.leftStick?.x ?? pad.axes[0]?.value ?? 0;
      const sy = pad.leftStick?.y ?? pad.axes[1]?.value ?? 0;
      if (pad.buttons[12]?.pressed || sy < -DEAD) navUp    = true;
      if (pad.buttons[13]?.pressed || sy >  DEAD) navDown  = true;
      if (pad.buttons[14]?.pressed || sx < -DEAD) navLeft  = true;
      if (pad.buttons[15]?.pressed || sx >  DEAD) navRight = true;
      if (pad.buttons[0]?.pressed) navA = true;
      if (pad.buttons[1]?.pressed) navB = true;
    }
    let navY = false;
    for (const pad of gp.gamepads) {
      if (!pad) continue;
      if (pad.buttons[3]?.pressed) navY = true;
    }

    // Start button toggles pause
    if (startPressed) {
      const gs = this.scene.get(SCENE.GAME);
      if (gs) {
        if (gs.gamePaused) this.bus.emit(EV.RESUME_GAME);
        else               this.bus.emit(EV.PAUSE_GAME);
      }
    }

    const prev = this._pausePadPrev;

    // ── Inventory pad mode ──
    if (selectPressed && !this._pauseBtns && !this._instrClose) {
      if (this._invPadMode) this._invPadDeactivate();
      else                  this._invPadActivate();
    }
    if (this._invPadMode && !this._pauseBtns && !this._instrClose) {
      const COLS  = 4;
      const total = this._invAllSlots().length;
      const now   = Date.now();
      const any   = navUp || navDown || navLeft || navRight;
      const np    = this._invPadNavPrev;
      const justU = navUp    && !np.up;
      const justD = navDown  && !np.down;
      const justL = navLeft  && !np.left;
      const justR = navRight && !np.right;
      const just  = justU || justD || justL || justR;

      if (!any) this._invPadNavHeld = null;

      let doNav = false;
      if (just) { this._invPadNavHeld = now; this._invPadNavLast = now; doNav = true; }
      else if (any && this._invPadNavHeld !== null &&
               now - this._invPadNavHeld >= 380 && now - this._invPadNavLast >= 160) {
        this._invPadNavLast = now; doNav = true;
      }

      if (doNav && total > 0) {
        let dir = 0;
        if (navLeft)  dir = -1;
        if (navRight) dir =  1;
        if (navUp)    dir = -COLS;
        if (navDown)  dir =  COLS;
        this._invPadSelectSlot(Math.max(0, Math.min(total - 1, this._invPadIdx + dir)));
      }

      this._invPadNavPrev = { up: navUp, down: navDown, left: navLeft, right: navRight };

      const ap = this._invPadActionPrev;
      if (navA && !ap.a) this._invPadAction();
      if (navB && !ap.b) this._invPadDeactivate();
      if (navY && !ap.y) this._invPadDrop();
      this._invPadActionPrev = { a: navA, b: navB, y: navY };
      return;
    }

    // ── Instructions overlay: A or B closes ──
    if (this._instrClose) {
      if ((navA && !prev.a) || (navB && !prev.b)) this._instrClose();
      this._pausePadPrev = { up: navUp, down: navDown, a: navA, b: navB };
      return;
    }

    // ── Debug menu navigation ──
    if (this._debugBtns) {
      const now2 = Date.now();
      const justUp2   = navUp   && !prev.up;
      const justDown2 = navDown && !prev.down;
      if (!navUp && !navDown) this._debugNavHeldSince = null;
      let doNav2 = false;
      if (justUp2 || justDown2) { this._debugNavHeldSince = now2; doNav2 = true; }
      else if ((navUp || navDown) && this._debugNavHeldSince !== null) {
        if (now2 - this._debugNavHeldSince >= 380 && now2 - (this._debugNavLastRepeat ?? 0) >= 160) doNav2 = true;
      }
      if (doNav2) {
        this._debugNavLastRepeat = now2;
        const dir2  = navUp ? -1 : 1;
        const next2 = (this._debugSelIdx + dir2 + this._debugBtns.length) % this._debugBtns.length;
        this._updateDebugSel(next2);
      }
      if (navA && !prev.a && this._debugBtns[this._debugSelIdx]) {
        this._debugBtns[this._debugSelIdx].action();
      }
      if (navB && !prev.b) this._debugBtns[this._debugBtns.length - 1].action(); // Back
      this._pausePadPrev = { up: navUp, down: navDown, a: navA, b: navB };
      return;
    }

    // ── Pause menu navigation ──
    if (!this._pauseBtns) {
      this._pausePadPrev = { up: navUp, down: navDown, a: navA, b: navB };
      return;
    }

    const now = Date.now();
    const justUp   = navUp   && !prev.up;
    const justDown = navDown && !prev.down;
    if (!navUp && !navDown) this._pauseNavHeldSince = null;

    let doNav = false;
    if (justUp || justDown) { this._pauseNavHeldSince = now; doNav = true; }
    else if ((navUp || navDown) && this._pauseNavHeldSince !== null) {
      if (now - this._pauseNavHeldSince >= 380 && now - this._pauseNavLastRepeat >= 160) doNav = true;
    }
    if (doNav) {
      this._pauseNavLastRepeat = now;
      const dir  = navUp ? -1 : 1;
      const next = (this._pauseSelIdx + dir + this._pauseBtns.length) % this._pauseBtns.length;
      this._updatePauseSel(next);
    }

    // A = confirm, B = close pause (same as Continue)
    if (navA && !prev.a && this._pauseBtns[this._pauseSelIdx]) {
      this._pauseBtns[this._pauseSelIdx].action();
    }
    if (navB && !prev.b) this.bus.emit(EV.RESUME_GAME);

    this._pausePadPrev = { up: navUp, down: navDown, a: navA, b: navB };
  }

  _updatePauseSel(idx) {
    this._pauseSelIdx = idx;
    this._pauseBtns.forEach((item, i) => item.obj.setAlpha(i === idx ? 1.0 : 0.45));
    const sel = this._pauseBtns[idx];
    if (sel && this._pauseCursor) {
      this._pauseCursor
        .setPosition(sel.obj.x - sel.obj.displayWidth / 2 - 10, sel.obj.y)
        .setVisible(true);
    }
  }

  // ── Inventory pad navigation ──────────────────────────────────────

  /** Flat ordered slot list: equip row first, then bag rows (4 cols each). */
  _invAllSlots() {
    return [...(this._equipSlots ?? []), ...(this._invSlots ?? [])];
  }

  _invPadActivate() {
    const gs = this.scene.get(SCENE.GAME);
    if (gs?.gamePaused || gs?.activePanel !== 0) return;
    // Cancel any active targeting before entering inventory
    if (gs?.targeting) {
      gs._cancelTargeting();
      this._clearSkillSelection?.();
    }
    this._invPadMode = true;
    this._invPadNavHeld = null;
    this._invPadNavPrev = { up: false, down: false, left: false, right: false };
    this._invPadActionPrev = { a: false, b: false, y: false };
    // Default cursor: first bag slot (after equip row)
    const equipCount = this._equipSlots?.length ?? 0;
    this._invPadIdx = equipCount;
    this._invPadSelectSlot(this._invPadIdx);
    this.bus.emit(EV.LOG_MSG, { text: 'Inventory — D-Pad: navigate  A: use/equip  Y: drop  B: close', color: '#6688aa' });
  }

  _invPadDeactivate() {
    this._invPadMode = false;
    this._clearSelection();
  }

  /** Drop the currently selected bag item onto the player's tile. Equip slots cannot be dropped directly. */
  _invPadDrop() {
    if (!this._invPadMode) return;
    const equipCount = this._equipSlots?.length ?? 0;
    if (this._invPadIdx < equipCount) return; // equip row — no drop
    const invIdx = this._invPadIdx - equipCount;
    const slot = this._invSlots?.[invIdx];
    if (!slot?._item) return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const dropped = gs.player.dropItem(invIdx);
    if (!dropped) return;
    gs.floorItems.push({ x: gs.player.x, y: gs.player.y, item: dropped });
    gs._rebuildItemSprites();
    SFX.play('equip');
    this.bus.emit(EV.LOG_MSG, { text: `Dropped ${dropped.name}.`, color: '#aaaacc' });
    gs._endPlayerTurn?.();
    // Keep pad cursor on same index; slot is now empty
    this._invPadSelectSlot(this._invPadIdx);
  }

  /** Drop the currently tooltip-selected bag item (works for both mouse and pad). */
  _dropSelectedItem() {
    if (this._invPadMode) { this._invPadDrop(); return; }
    if (!this._selSlot || this._selSrc !== 'inv') return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const dropped = gs.player.dropItem(this._selSlot.index);
    if (!dropped) return;
    gs.floorItems.push({ x: gs.player.x, y: gs.player.y, item: dropped });
    gs._rebuildItemSprites();
    gs._render();
    gs._endPlayerTurn?.();
    SFX.play('equip');
    this.bus.emit(EV.LOG_MSG, { text: `Dropped ${dropped.name}.`, color: '#aaaacc' });
    this._clearSelection();
    this._refreshInventory();
  }

  /**
   * Set the pad cursor to slot at flat index `idx`.
   * Always shows green border; shows tooltip only if the slot has an item.
   */
  _invPadSelectSlot(idx) {
    const allSlots = this._invAllSlots();
    if (!allSlots.length) return;
    this._invPadIdx = Math.max(0, Math.min(allSlots.length - 1, idx));
    const slot = allSlots[this._invPadIdx];
    const src  = this._invPadIdx < (this._equipSlots?.length ?? 0) ? 'equip' : 'inv';
    this._setSelection(slot, src);
    if (slot._item) this._showInvTooltip(slot._item);
    else            this._hideInvTooltip();
  }

  /**
   * Confirm action (A button) on the currently highlighted pad slot.
   * Performs use/equip, then re-selects the same index so the cursor stays.
   */
  _invPadAction() {
    if (!this._invPadMode) return;
    const slot = this._invAllSlots()[this._invPadIdx];
    if (!slot?._item) return;
    const src = this._invPadIdx < (this._equipSlots?.length ?? 0) ? 'equip' : 'inv';
    this._setSelection(slot, src); // ensure _selSlot / _selSrc are current
    this._doTooltipAction();       // performs action, calls _clearSelection + _refreshInventory
    // Restore pad cursor to same index (slot may now be empty)
    this._invPadMode = true;       // _doTooltipAction doesn’t touch _invPadMode
    this._invPadSelectSlot(this._invPadIdx);
  }

  _buildHUD() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Disable browser right-click context menu over the canvas
    this.input.mouse?.disableContextMenu();

    // In portrait mode, use a compact mobile-friendly layout
    if (window.PORTRAIT) {
      this._buildHUD_portrait(W, H);
      return;
    }

    // ── Top-left stats panel ────────────────────────────────
    const PW = 210, PH = 212;
    const PX = 6, PY = 6;

    this.statsBg = this.add.rectangle(PX + PW / 2, PY + PH / 2, PW, PH, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0);

    const tx = (x, y, str, color = '#ccddee', size = 13) =>
      this.add.text(PX + x, PY + y, str, {
        fontFamily: 'Courier New', fontSize: `${size}px`, color
      }).setScrollFactor(0);

    tx(8, 8, '⚔ DARKSPAWN', '#ffd700', 14);
    this.floorText = tx(8, 26, 'Floor: 1', '#88aacc', 12);

    // HP bar
    tx(8, 46, 'HP', '#ff6666', 11);
    this.hpBarBg   = this.add.rectangle(PX + 28, PY + 50, PW - 36, 10, 0x330000).setScrollFactor(0).setOrigin(0, 0);
    this.hpBarFill = this.add.rectangle(PX + 28, PY + 50, PW - 36, 10, 0xdd3333).setScrollFactor(0).setOrigin(0, 0);
    this.hpText    = tx(8, 62, 'HP: 20/20', '#ffaaaa', 11);

    // MP bar
    tx(8, 76, 'MP', '#6688ff', 11);
    this.mpBarBg   = this.add.rectangle(PX + 28, PY + 80, PW - 36, 10, 0x000033).setScrollFactor(0).setOrigin(0, 0);
    this.mpBarFill = this.add.rectangle(PX + 28, PY + 80, PW - 36, 10, 0x3355dd).setScrollFactor(0).setOrigin(0, 0);
    this.mpText    = tx(8, 92, 'MP: 10/10', '#aaaaff', 11);

    // XP bar
    tx(8, 106, 'XP', '#44cc44', 11);
    this.xpBarBg   = this.add.rectangle(PX + 28, PY + 110, PW - 36, 8, 0x002200).setScrollFactor(0).setOrigin(0, 0);
    this.xpBarFill = this.add.rectangle(PX + 28, PY + 110, PW - 36, 8, 0x33aa33).setScrollFactor(0).setOrigin(0, 0);
    this.xpText    = tx(8, 120, 'LVL 1 — 0 XP', '#88cc88', 11);

    // Stats (2×2 layout: ATK|DEF on first row, SPD|Gold on second row)
    tx(8, 136, '──── Stats ────', '#445566', 11);
    this.atkText  = tx(8,         150, 'ATK:  5', '#ffaa44', 12);
    this.defText  = tx(8 + 105,   150, 'DEF:  2', '#88ccff', 12);
    this.spdText  = tx(8,         164, 'SPD:  4', '#ffff88', 12);
    this.goldText = tx(8 + 105,   164, 'Gold: 0', '#ffd700', 12);

    // Controls hint
    tx(8, 180, '[K]kills [C]raft [P]char [I]detail', '#334455', 10);
    tx(8, 192, 'WASD  [M]ap  1–8:skills  [Space]=act', '#334455', 10);

    // ── Equipment panel (below stats panel) ─────────────────
    const equipBottom = this._buildEquipPanel(W, PX, PY + PH);

    // ── Always-visible Inventory (below equipment panel) ─────
    this._buildInvPanel(W, PX, equipBottom);

    // ── Skill Hotbar (above log, bottom-centre) ───────────────
    this._buildSkillHotbar(W, H);

    // ── Minimap (top-right) ───────────────────────────────────
    this._buildMinimap(W);

    // ── Bottom message log ──────────────────────────────────
    const LOG_H = 80, LOG_Y = H - LOG_H - 4;
    this.logBg = this.add.rectangle(W / 2, LOG_Y + LOG_H / 2, W - 4, LOG_H, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0);

    this.logLines = [];
    for (let i = 0; i < 4; i++) {
      this.logLines.push(
        this.add.text(8, LOG_Y + 8 + i * 17, '', {
          fontFamily: 'Courier New', fontSize: '12px', color: '#778899'
        }).setScrollFactor(0)
      );
    }
    this.logMessages = [];

    // ── Drag & Drop system (global pointer listeners) ────────
    this._initDragSystem();

    // ── Pause button (top-centre) ────────────────────────────
    const pauseBtn = this.add.text(W / 2, 8, '[ ❚❚ PAUSE ]', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88aacc',
      backgroundColor: '#0d1117', padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(5);
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffd700'));
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#88aacc'));
    pauseBtn.on('pointerdown', () => this.bus.emit(EV.PAUSE_GAME));

    // ── UI click-blocker zones (prevent walking through static panels) ──
    const TW_BLK = 188; // tooltip panel width
    const uiBlock = (x, y, w, h) =>
      this.add.zone(x + w / 2, y + h / 2, w, h)
        .setScrollFactor(0).setDepth(3).setInteractive();
    // Left column: stats + equip + inv only (tooltip column blocks itself when visible)
    uiBlock(PX - 6, 0, PW + 18, H);
    // Minimap (top-right)
    uiBlock(this._mmX - 12, 0, MM_W + 18, MM_Y + MM_H + 30);
    // Bottom hotbar + log
    uiBlock(0, H - 150, W, 150);
  }

  // ── Skill Hotbar ─────────────────────────────────────────

  _buildSkillHotbar(W, H) {
    const SZ = 44, GAP = 4;
    const LOG_H = 80, LOG_Y = H - LOG_H - 4;
    const HB_Y = LOG_Y - SZ - 14;
    const maxSlots = 8;
    const panelW = maxSlots * (SZ + GAP) - GAP + 16;

    // Static background panel (always visible)
    this.add.rectangle(W / 2, HB_Y + SZ / 2 + 4, panelW, SZ + 20, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(4);
    this.add.text(W / 2, HB_Y - 3, '── SKILLS ──', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#334466',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(4);

    this._hotbarSZ  = SZ;
    this._hotbarGAP = GAP;
    this._hotbarY   = HB_Y;
    this._hotbarW   = W;
    this._hotbarSkills = [];
    this._hotbarSlotObjects = [];
    this._selectedSkillId = null;  // two-click selection state
    this._skillsBadge = null;

    this._refreshSkillHotbar();
  }

  _refreshSkillHotbar() {
    // Update skill-points badge on the skills button
    if (this._skillsBadge) {
      const _gs = this.scene.get(SCENE.GAME);
      const pts = _gs?.player?.skillPoints ?? 0;
      this._skillsBadge.setText(pts > 0 ? String(pts) : '').setVisible(pts > 0);
    }
    // Destroy previous slot visuals
    if (this._hotbarSlotObjects) {
      for (const o of this._hotbarSlotObjects) { try { o.destroy(); } catch (_) {} }
    }
    this._hotbarSlotObjects = [];
    this._hotbarSkills = [];

    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player || !this._hotbarSZ) return;

    const unlocked = ACTIVE_SKILL_ORDER.filter(id => gs.player.skills.has(id));
    // 'attack' is always slot 0 — the base melee attack using the equipped weapon
    const allSlots = ['attack', ...unlocked];
    this._hotbarSkills = allSlots;
    // Clamp pad hotbar index to valid range whenever skills change
    const gs2 = this.scene.get(SCENE.GAME);
    if (gs2 && gs2._padHotbarIdx !== undefined) {
      gs2._padHotbarIdx = Math.max(0, Math.min(gs2._padHotbarIdx, allSlots.length - 1));
    }

    const SZ = this._hotbarSZ, GAP = this._hotbarGAP;
    const totalW     = allSlots.length * (SZ + GAP) - GAP;
    const centerX    = this._hotbarCenterX ?? (this._hotbarColStartX ?? 0) + (this._hotbarW - (this._hotbarColStartX ?? 0)) / 2;
    const startX     = centerX - totalW / 2;
    const HB_Y   = this._hotbarY;

    allSlots.forEach((skillId, i) => {
      const sx = startX + i * (SZ + GAP);

      const isAttack    = skillId === 'attack';
      const mana        = isAttack ? 0 : (SKILL_BY_ID[skillId]?.active?.cost ?? 0);
      const hasMana     = isAttack ? true : gs.player.stats.mana >= mana;
      const isSelected  = this._selectedSkillId === skillId;
      const isPadFocused = gs?._controllerMode && i === (gs?._padHotbarIdx ?? 0);
      // Attack slot uses orange border; skill slots use blue/red; pad-focused slot uses yellow
      const borderColor = isPadFocused
        ? (isSelected ? 0x00cc44 : 0xffdd00)
        : isAttack
          ? (isSelected ? 0x00cc44 : 0x886633)
          : (isSelected ? 0x00cc44 : (hasMana ? 0x4455aa : 0x552222));
      const fillColor = isAttack
        ? (isSelected ? 0x0d2210 : (isPadFocused ? 0x201c00 : 0x181008))
        : (isSelected ? 0x0d2210 : (isPadFocused ? 0x201c00 : (hasMana ? 0x161622 : 0x160808)));

      const bg = this.add.rectangle(sx + SZ / 2, HB_Y + SZ / 2, SZ, SZ, fillColor, 1)
        .setStrokeStyle((isSelected || isPadFocused) ? 2 : 1, borderColor)
        .setScrollFactor(0).setDepth(4).setInteractive({ useHandCursor: true });

      // Icon: attack uses equipped weapon sprite; skills use their skill icon
      const weaponId = gs.player.equipment?.weapon?.id ?? 'fists';
      const iconKey  = isAttack ? `item-${weaponId}` : `skill-${skillId}`;
      const icon = this.add.image(sx + SZ / 2, HB_Y + SZ / 2 - 5, iconKey)
        .setDisplaySize(28, 28).setScrollFactor(0).setDepth(5);
      if (!hasMana) icon.setTint(0x333333);

      // Green inner-border when skill is queued for cast
      if (isSelected) {
        const sel = this.add.rectangle(sx + SZ / 2, HB_Y + SZ / 2, SZ - 6, SZ - 6, 0x000000, 0)
          .setStrokeStyle(2, 0x00ff66).setScrollFactor(0).setDepth(5.5);
        this._hotbarSlotObjects.push(sel);
      }
      // Yellow outer glow when controller has this slot focused
      if (isPadFocused) {
        const padRing = this.add.rectangle(sx + SZ / 2, HB_Y + SZ / 2, SZ + 6, SZ + 6, 0x000000, 0)
          .setStrokeStyle(2, 0xffee00, 1).setScrollFactor(0).setDepth(3.5);
        this._hotbarSlotObjects.push(padRing);
      }

      const numLbl = this.add.text(sx + 3, HB_Y + 2, `${i + 1}`, {
        fontFamily: 'Courier New', fontSize: '9px', color: isAttack ? '#aa8844' : '#6677bb',
      }).setScrollFactor(0).setDepth(5);

      // Attack slot shows no mana cost; skill slots show Xmp
      const costLbl = isAttack
        ? null
        : this.add.text(sx + SZ / 2, HB_Y + SZ - 4, `${mana}mp`, {
            fontFamily: 'Courier New', fontSize: '8px',
            color: hasMana ? '#5566cc' : '#663333',
          }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(5);

      const hoverFill = isAttack ? 0x251a08 : (hasMana ? 0x222233 : 0x210d0d);
      const outFill   = fillColor;
      bg.on('pointerover', () => bg.setFillStyle(hoverFill));
      bg.on('pointerout',  () => bg.setFillStyle(outFill));
      bg.on('pointerdown', () => this._useHotbarSkill(skillId));

      // Tooltip on hover
      if (isAttack) {
        bg.on('pointerover', () => {
          bg.setFillStyle(hoverFill);
          this.bus.emit(EV.LOG_MSG, { text: '[1] Attack — strike nearest enemy (lowest HP). Free.', color: '#bbaa66' });
        });
      } else {
        const def = SKILL_BY_ID[skillId];
        bg.on('pointerover', () => {
          bg.setFillStyle(hoverFill);
          this.bus.emit(EV.LOG_MSG, { text: `[${i+1}] ${def.name} (${mana}mp) — ${def.description}`, color: '#8899cc' });
        });
      }

      this._hotbarSlotObjects.push(bg, icon, numLbl, ...(costLbl ? [costLbl] : []));
    });
  }

  _clearSkillSelection() {
    this._selectedSkillId = null;
    this._refreshSkillHotbar();
  }

  _useHotbarSkill(skillId) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs || gs.gamePaused || gs.activePanel !== 0) return;

    // Base attack — instant, no selection step needed
    if (skillId === 'attack') {
      this._clearSkillSelection();
      gs.useBaseAttack();
      this.time.delayedCall(50, () => this._refreshSkillHotbar());
      return;
    }

    const isTargetable = TARGETABLE_SKILLS.has(skillId);

    if (this._selectedSkillId === skillId) {
      // Same skill pressed again
      if (isTargetable) {
        gs._cancelTargeting(); // emits 'skill-selection-done' → _clearSkillSelection()
      } else {
        // Instant: cast now
        this._clearSkillSelection();
        gs.useActiveSkill(skillId);
        this.time.delayedCall(50, () => this._refreshSkillHotbar());
      }
      return;
    }

    // Cancel any previous selection without emitting the done-event
    if (this._selectedSkillId) {
      if (TARGETABLE_SKILLS.has(this._selectedSkillId)) gs._cancelTargeting(false);
      this._selectedSkillId = null;
    }

    // Pre-check mana before showing the selection
    const mana = SKILL_BY_ID[skillId]?.active?.cost ?? 0;
    if (gs.player.stats.mana < mana) {
      this.bus.emit(EV.LOG_MSG, { text: 'Not enough mana!', color: '#ff8888' });
      this._refreshSkillHotbar();
      return;
    }

    // Select the skill (show green)
    this._selectedSkillId = skillId;
    this._refreshSkillHotbar();

    const def = SKILL_BY_ID[skillId];
    const idx = ACTIVE_SKILL_ORDER.indexOf(skillId) + 1;
    if (isTargetable) {
      gs._enterTargetingMode(skillId);
      this.bus.emit(EV.LOG_MSG, { text: `${def.name} — click a tile to cast, or [${idx}] again to cancel.`, color: '#88aaff' });
    } else {
      this.bus.emit(EV.LOG_MSG, { text: `${def.name} selected — press [${idx}] again to cast.`, color: '#88aaff' });
    }
  }

  // ── Always-visible Inventory Panel ───────────────────────────

  _buildInvPanel(W, panelX, statsBottom) {
    const PW    = 210;
    const COLS  = 4;
    const SZ    = 44;   // slot size
    const GAP   = 2;
    const ROWS  = 6;    // 4×6 = 24 slots
    const INNER = COLS * SZ + (COLS - 1) * GAP;  // 182
    const PADX  = Math.floor((PW - INNER) / 2);  // centre the grid
    const PH    = 16 + 6 + ROWS * (SZ + GAP) - GAP + 8; // title + grid + padding
    const IX    = panelX;          // same left edge as stats panel
    const IY    = statsBottom + 6; // 6px gap below stats panel

    // Background
    this.add.rectangle(IX + PW / 2, IY + PH / 2, PW, PH, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(4);

    // Title + Sort button
    this.add.text(IX + PW / 2, IY + 4, '─ BAG ─', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(4);
    const sortLbl = this.add.text(IX + PW - 4, IY + 4, '[sort]', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#334455',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5).setInteractive({ useHandCursor: true });
    sortLbl.on('pointerover', () => sortLbl.setColor('#88aacc'));
    sortLbl.on('pointerout',  () => sortLbl.setColor('#334455'));
    sortLbl.on('pointerdown', () => this._sortInventory());

    // Build slot grid
    this._invSlots = [];
    for (let i = 0; i < 24; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const sx  = IX + PADX + col * (SZ + GAP);
      const sy  = IY + 22 + row * (SZ + GAP);

      const bg = this.add.rectangle(sx + SZ / 2, sy + SZ / 2, SZ, SZ, 0x111118, 1)
        .setStrokeStyle(1, 0x223344).setScrollFactor(0).setDepth(4).setInteractive();

      const icon = this.add.image(sx + SZ / 2, sy + SZ / 2 - 4, 'item-weapon')
        .setDisplaySize(26, 26).setScrollFactor(0).setDepth(5).setVisible(false);

      const qty = this.add.text(sx + SZ - 3, sy + SZ - 12, '', {
        fontFamily: 'Courier New', fontSize: '9px', color: '#aaaacc',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(5);

      const slot = { bg, icon, qty, index: i };
      this._invSlots.push(slot);

      bg.on('pointerover', () => { if (slot._item) bg.setFillStyle(0x223344); });
      bg.on('pointerout',  () => bg.setFillStyle(slot._item ? 0x1e2a3a : 0x111118));
      bg.on('pointerdown', (pointer) => {
        if (pointer.rightButtonDown()) { this._invDirectUse(slot); return; }
        this._onInvSlotClick(slot);
        this._startDragFrom(slot, 'inv', pointer);
      });
    }

    // ── Item description tooltip (appears to the right of the bag) ─
    const TW = 188;
    const TX = IX + PW + 6;
    const TY = IY;
    const ttBg = this.add.rectangle(TX + TW / 2, TY + PH / 2, TW, PH, 0x080c11, 0.95)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(6).setVisible(false)
      .setInteractive(); // blocks game clicks only when tooltip is visible
    const ttTitle = this.add.text(TX + TW / 2, TY + 6, '─ ITEM INFO ─', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttIcon = this.add.image(TX + TW / 2, TY + 52, 'item-weapon')
      .setDisplaySize(36, 36).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttName = this.add.text(TX + 8, TY + 78, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#ffd700',
      wordWrap: { width: TW - 16 },
    }).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttType = this.add.text(TX + 8, TY + 96, '', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#556677',
    }).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttStats = this.add.text(TX + 8, TY + 114, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#88aacc',
      lineSpacing: 4,
    }).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttDesc = this.add.text(TX + 8, TY + 168, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#aabbcc',
      wordWrap: { width: TW - 16 }, lineSpacing: 3,
    }).setScrollFactor(0).setDepth(7).setVisible(false);
    const ttValue = this.add.text(TX + 8, TY + PH - 68, '', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#ccaa44',
    }).setScrollFactor(0).setDepth(7).setVisible(false);
    // Action button (USE / EQUIP / UNEQUIP)
    const ttActionBtn = this.add.rectangle(TX + TW / 2, TY + PH - 38, TW - 20, 22, 0x1a3322, 1)
      .setStrokeStyle(1, 0x00cc44).setScrollFactor(0).setDepth(7).setVisible(false)
      .setInteractive({ useHandCursor: true });
    const ttActionLbl = this.add.text(TX + TW / 2, TY + PH - 38, 'USE', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#00ff88',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(8).setVisible(false);
    ttActionBtn.on('pointerover', () => ttActionBtn.setFillStyle(0x2a4432));
    ttActionBtn.on('pointerout',  () => ttActionBtn.setFillStyle(0x1a3322));
    ttActionBtn.on('pointerdown', () => this._doTooltipAction());
    // Controller badge: green Ⓐ on left side of action button (pad mode only)
    const ttABadge = this.add.text(TX + 26, TY + PH - 38, '\u24b6', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#00ff88',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(9).setVisible(false);
    // Drop hint: yellow below action button (all bag slots; Ⓨ icon only in pad mode)
    const ttYHint = this.add.text(TX + TW / 2, TY + PH - 5, 'DROP ITEM', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#ffd700',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(8).setVisible(false)
      .setInteractive({ useHandCursor: true });
    ttYHint.on('pointerover', () => ttYHint.setAlpha(0.7));
    ttYHint.on('pointerout',  () => ttYHint.setAlpha(1.0));
    ttYHint.on('pointerdown', () => this._dropSelectedItem());
    this._invTooltip = { bg: ttBg, title: ttTitle, icon: ttIcon, name: ttName,
      type: ttType, stats: ttStats, desc: ttDesc, value: ttValue,
      actionBtn: ttActionBtn, actionLbl: ttActionLbl,
      aBadge: ttABadge, yHint: ttYHint };
  }

  _refreshInventory() {
    if (!this._invSlots) return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const inv = gs.player.inventory;

    for (const slot of this._invSlots) {
      const item = inv[slot.index];
      slot._item = item;

      // Auto-clear selection if the selected item disappeared
      // (skip in pad mode — pad cursor keeps the green border on empty slots)
      if (slot === this._selSlot && !item && !this._invPadMode) {
        this._selSlot = null;
        this._selSrc  = null;
        this._hideInvTooltip();
      }

      if (item) {
        if (slot === this._selSlot) {
          slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
        } else {
          slot.bg.setFillStyle(0x1e2a3a).setStrokeStyle(1, 0x334466);
        }
        slot.icon.setTexture(`item-${item.id ?? item.type}`).setVisible(true);
        slot.qty.setText(item.qty > 1 ? String(item.qty) : '');
      } else {
        // Empty: keep green border if this is the active pad cursor slot
        if (this._invPadMode && slot === this._selSlot) {
          slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
        } else {
          slot.bg.setFillStyle(0x111118).setStrokeStyle(1, 0x223344);
        }
        slot.icon.setVisible(false);
        slot.qty.setText('');
      }
    }
  }

  _onInvSlotClick(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    if (gs.gamePaused || gs.activePanel !== 0) return;

    // Re-click same slot → deselect
    if (this._selSlot === slot) { this._clearSelection(); return; }

    // Click any slot → just select it (moves/equips happen via drag)
    if (!slot._item) { this._clearSelection(); return; }
    this._setSelection(slot, 'inv');
    this._showInvTooltip(slot._item);
  }

  _showInvTooltip(item) {
    const tt = this._invTooltip;
    if (!tt) return;
    const typeLabel = { weapon:'Weapon', armor:'Armor', ring:'Ring', amulet:'Amulet',
      potion:'Potion', scroll:'Scroll', material:'Material', gold:'Gold' };
    tt.icon.setTexture(`item-${item.id ?? item.type}`).setVisible(true);
    tt.name.setText(item.name).setVisible(true);
    tt.type.setText(typeLabel[item.type] ?? item.type ?? '').setVisible(true);
    const parts = [];
    if (item.atk)           parts.push(`ATK  +${item.atk}`);
    if (item.def)           parts.push(`DEF  +${item.def}`);
    if (item.hpBonus)       parts.push(`HP   +${item.hpBonus}`);
    if (item.manaBonus)     parts.push(`MP   +${item.manaBonus}`);
    if (item.effect?.heal)  parts.push(`Heals ${item.effect.heal} HP`);
    if (item.effect?.mana)  parts.push(`Restores ${item.effect.mana} MP`);
    if (item.effect?.atk)   parts.push(`ATK +${item.effect.atk} (temp)`);
    if (item.effect?.speed) parts.push(`SPD +${item.effect.speed} (temp)`);
    tt.stats.setText(parts.join('\n')).setVisible(parts.length > 0);
    tt.desc.setText(item.description ?? '').setVisible(!!item.description);
    tt.value.setText(item.value ? `Value: ${item.value}g` : '').setVisible(!!item.value);
    // Action button label depends on selection source
    const isEquipSrc = this._selSrc === 'equip';
    const noAction   = item.type === 'material'; // materials have no direct use action
    const lbl = isEquipSrc ? 'UNEQUIP' : (item.slot ? 'EQUIP' : (noAction ? '' : 'USE'));
    if (lbl) {
      tt.actionLbl.setText(lbl).setVisible(true);
      tt.actionBtn.setVisible(true);
      // Ⓐ badge: show in pad mode
      if (this._invPadMode) {
        tt.aBadge?.setVisible(true);
      } else {
        tt.aBadge?.setVisible(false);
      }
    } else {
      tt.actionLbl.setVisible(false);
      tt.actionBtn.setVisible(false);
      tt.aBadge?.setVisible(false);
    }
    // Drop hint: any bag slot (Ⓨ icon in pad mode, plain text for mouse)
    const isBagSlot = !isEquipSrc;
    if (isBagSlot) {
      tt.yHint?.setText(this._invPadMode ? '\u24ce  DROP ITEM' : 'DROP ITEM').setVisible(true);
    } else {
      tt.yHint?.setVisible(false);
    }
    tt.title.setVisible(true);
    tt.bg.setVisible(true);
  }

  _hideInvTooltip() {
    const tt = this._invTooltip;
    if (!tt) return;
    tt.bg.setVisible(false);
    tt.title.setVisible(false);
    tt.icon.setVisible(false);
    tt.name.setVisible(false);
    tt.type.setVisible(false);
    tt.stats.setVisible(false);
    tt.desc.setVisible(false);
    tt.value.setVisible(false);
    tt.actionBtn?.setVisible(false);
    tt.actionLbl?.setVisible(false);
    tt.aBadge?.setVisible(false);
    tt.yHint?.setVisible(false);
  }

  // ── Unified selection helpers ────────────────────────────

  /** Mark a slot as selected (green highlight, single selection across inv+equip). */
  _setSelection(slot, source) {
    // Clear previous visual
    if (this._selSlot && this._selSlot !== slot) {
      const s = this._selSlot;
      s.bg.setFillStyle(s._item ? 0x1e2a3a : 0x111118)
         .setStrokeStyle(1, s._item ? 0x334466 : 0x223344);
    }
    this._selSlot = slot;
    this._selSrc  = source;
    slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
  }

  /** Deselect and hide tooltip. */
  _clearSelection() {
    if (this._selSlot) {
      const s = this._selSlot;
      s.bg.setFillStyle(s._item ? 0x1e2a3a : 0x111118)
         .setStrokeStyle(1, s._item ? 0x334466 : 0x223344);
      this._selSlot = null;
      this._selSrc  = null;
    }
    this._hideInvTooltip();
  }

  /** Right-click an inventory slot: directly use/equip without selecting first. */
  _invDirectUse(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    if (gs.gamePaused || gs.activePanel !== 0) return;
    const item = slot._item;
    if (!item) return;
    if (item.type === 'potion')    SFX.play('potion');
    else if (item.type === 'gold') SFX.play('coin');
    else SFX.play('equip');
    const result = gs.player.useItem(slot.index);
    if (result?.scrollEffect) gs._applyScrollEffect(result.scrollEffect);
    if (result) gs._endPlayerTurn?.();
    if (this._selSlot === slot) this._clearSelection();
    else this._refreshInventory();
  }

  /** Right-click an equip slot: directly unequip without selecting first. */
  _equipDirectUnequip(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    if (gs.gamePaused || gs.activePanel !== 0) return;
    const item = slot._item;
    if (!item || item.id === 'fists' || item.id === 'rags') return;
    SFX.play('equip');
    gs.player.unequipItem(slot.slotKey);
    gs._endPlayerTurn?.();
    if (this._selSlot === slot) this._clearSelection();
    else { this._refreshEquipPanel(); this._refreshInventory(); }
  }

  /** Called by the tooltip action button: use/equip/unequip the selected item. */
  _doTooltipAction() {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player || !this._selSlot) return;
    if (gs.gamePaused || gs.activePanel !== 0) return;
    const slot = this._selSlot;
    const src  = this._selSrc;
    const item = slot._item;
    if (!item) { this._clearSelection(); return; }

    if (src === 'inv') {
      if (item.type === 'potion')    SFX.play('potion');
      else if (item.type === 'gold') SFX.play('coin');
      else SFX.play('equip');
      const result = gs.player.useItem(slot.index);
      if (result?.scrollEffect) gs._applyScrollEffect(result.scrollEffect);
      if (result) gs._endPlayerTurn?.();
      this._clearSelection();
      this._refreshInventory();
    } else if (src === 'equip') {
      SFX.play('equip');
      gs.player.unequipItem(slot.slotKey);
      gs._endPlayerTurn?.();
      this._clearSelection();
      this._refreshEquipPanel();
      this._refreshInventory();
    }
  }

  /** Sort inventory by type then name. */
  _sortInventory() {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const typeOrder = { weapon:0, armor:1, ring:2, amulet:3, potion:4, scroll:5, material:6, gold:7 };
    const inv  = gs.player.inventory;
    const items = inv.filter(Boolean).sort((a, b) => {
      const ta = typeOrder[a.type] ?? 99, tb = typeOrder[b.type] ?? 99;
      return ta !== tb ? ta - tb : (a.name ?? '').localeCompare(b.name ?? '');
    });
    for (let i = 0; i < inv.length; i++) inv[i] = items[i] ?? null;
    this._clearSelection();
    this._refreshInventory();
  }

  // ── Equipment Panel ──────────────────────────────────────

  _buildEquipPanel(W, panelX, statsBottom) {
    const PW    = 210;
    const SZ    = 44;
    const GAP   = 2;
    const COLS  = 4;
    const INNER = COLS * SZ + (COLS - 1) * GAP; // 182
    const PADX  = Math.floor((PW - INNER) / 2);  // 14
    const PH    = 16 + 6 + SZ + 8;               // 74
    const IX    = panelX;
    const IY    = statsBottom + 6;

    // Background
    this.add.rectangle(IX + PW / 2, IY + PH / 2, PW, PH, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(4);

    // Title
    this.add.text(IX + PW / 2, IY + 4, '─ EQUIPMENT ─', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(4);

    const SLOT_DEFS = [
      { key: 'weapon', label: 'WPN', shadowType: 'weapon' },
      { key: 'armor',  label: 'ARM', shadowType: 'armor'  },
      { key: 'ring',   label: 'RNG', shadowType: 'ring'   },
      { key: 'amulet', label: 'AMU', shadowType: 'amulet' },
    ];

    this._equipSlots = [];
    for (let i = 0; i < 4; i++) {
      const def = SLOT_DEFS[i];
      const sx  = IX + PADX + i * (SZ + GAP);
      const sy  = IY + 22;

      const bg = this.add.rectangle(sx + SZ / 2, sy + SZ / 2, SZ, SZ, 0x111118, 1)
        .setStrokeStyle(1, 0x223344).setScrollFactor(0).setDepth(4)
        .setInteractive({ useHandCursor: true });

      // Shadow icon — shown when slot is empty
      const shadow = this.add.image(sx + SZ / 2, sy + SZ / 2 - 4, `item-${def.shadowType}`)
        .setDisplaySize(26, 26).setScrollFactor(0).setDepth(5)
        .setAlpha(0.18).setTint(0x445566);

      // Real item icon — shown when equipped
      const icon = this.add.image(sx + SZ / 2, sy + SZ / 2 - 4, `item-${def.shadowType}`)
        .setDisplaySize(26, 26).setScrollFactor(0).setDepth(5).setVisible(false);

      // Small label below the slot
      const lbl = this.add.text(sx + SZ / 2, sy + SZ - 1, def.label, {
        fontFamily: 'Courier New', fontSize: '8px', color: '#334455',
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(5);

      const slot = { bg, shadow, icon, lbl, slotKey: def.key, _item: null };
      this._equipSlots.push(slot);

      bg.on('pointerover', () => { if (slot._item) bg.setFillStyle(0x223344); });
      bg.on('pointerout',  () => bg.setFillStyle(slot._item ? 0x1e2a3a : 0x111118));
      bg.on('pointerdown', (pointer) => {
        if (pointer.rightButtonDown()) { this._equipDirectUnequip(slot); return; }
        this._onEquipSlotClick(slot);
        this._startDragFrom(slot, 'equip', pointer);
      });
    }

    return IY + PH; // return bottom y for next panel
  }

  _refreshEquipPanel() {
    if (!this._equipSlots) return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const eq = gs.player.equipment;

    for (const slot of this._equipSlots) {
      const raw  = eq[slot.slotKey];
      // Treat placeholder fists/rags as "nothing equipped"
      const item = (raw && raw.id !== 'fists' && raw.id !== 'rags') ? raw : null;
      slot._item = item;

      // Auto-clear selection if the selected item disappeared
      // (skip in pad mode — pad cursor keeps green border on empty slots)
      if (slot === this._selSlot && !item && !this._invPadMode) {
        this._selSlot = null;
        this._selSrc  = null;
        this._hideInvTooltip();
      }

      if (item) {
        if (slot === this._selSlot) {
          slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
        } else {
          slot.bg.setFillStyle(0x1e2a3a).setStrokeStyle(1, 0x334466);
        }
        slot.icon.setTexture(`item-${item.id ?? item.type}`).setVisible(true);
        slot.shadow.setVisible(false);
      } else {
        // Empty: keep green border if this is the active pad cursor slot
        if (this._invPadMode && slot === this._selSlot) {
          slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
        } else {
          slot.bg.setFillStyle(0x111118).setStrokeStyle(1, 0x223344);
        }
        slot.icon.setVisible(false);
        slot.shadow.setVisible(true);
      }
    }
  }

  _onEquipSlotClick(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    if (gs.gamePaused || gs.activePanel !== 0) return;

    // Re-click same slot → deselect
    if (this._selSlot === slot) { this._clearSelection(); return; }

    // Click any equip slot → just select it (moves happen via drag)
    if (!slot._item) {
      const names = { weapon: 'Weapon', armor: 'Armor', ring: 'Ring', amulet: 'Amulet' };
      this.bus.emit(EV.LOG_MSG, { text: `No ${names[slot.slotKey] ?? slot.slotKey} equipped.`, color: '#556677' });
      this._clearSelection();
      return;
    }
    this._setSelection(slot, 'equip');
    this._showInvTooltip(slot._item);
  }

  // ── Minimap ─────────────────────────────────────────────

  _buildMinimap(W, startY = MM_Y) {
    const mmX = W - MM_W - 6;
    const mmY = startY;
    this._mmX = mmX;
    this._mmY = mmY;

    // Background panel
    this.mmBg = this.add.rectangle(
      mmX + MM_W / 2, mmY + MM_H / 2,
      MM_W + 4, MM_H + 4,
      0x0d1117, 0.88
    ).setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(10);

    // Title label
    this.mmLabel = this.add.text(mmX, mmY - 12, '[ MINIMAP — M to toggle ]', {
      fontFamily: 'Courier New', fontSize: '9px', color: '#334455'
    }).setScrollFactor(0).setDepth(10);

    // Graphics layer for tile pixels
    this.mmGraphics = this.add.graphics().setScrollFactor(0).setDepth(11);

    this.mmVisible = true;
  }

  _toggleMinimap() {
    this.mmVisible = !this.mmVisible;
    this.mmBg.setVisible(this.mmVisible);
    this.mmLabel.setVisible(this.mmVisible);
    this.mmGraphics.setVisible(this.mmVisible);
  }

  _updateMinimap() {
    if (!this.mmGraphics || !this.mmVisible) return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.grid || !gs?.vis || !gs?.player) return;

    const g   = this.mmGraphics;
    const S   = MM_SCALE;
    const ox  = this._mmX;
    const oy  = this._mmY;

    g.clear();

    // ── Tiles ────────────────────────────────────────────────
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const v = gs.vis[y][x];
        if (v === VIS.HIDDEN) continue;

        const t = gs.grid[y][x];
        let color;

        if (v === VIS.EXPLORED) {
          // Dim — seen but not currently lit
          // Wall tiles are skipped so they render as black background,
          // making the map layout readable (especially after scroll of mapping).
          if (t === TILE.WALL)          continue;
          else if (t === TILE.STAIRS_DOWN) color = 0x1c4444;
          else if (t === TILE.STAIRS_UP)   color = 0x443c18;
          else                             color = 0x1b2535;
        } else {
          // Bright — currently visible
          if (t === TILE.WALL)          color = 0x445566;
          else if (t === TILE.STAIRS_DOWN) color = 0x44ffee;
          else if (t === TILE.STAIRS_UP)   color = 0xffdd44;
          else if (t === TILE.LAVA)        color = 0xff4500;
          else if (t === TILE.WATER)       color = 0x1a6fff;
          else if (t === TILE.DOOR)        color = 0x8b5e3c;
          else if (t === TILE.CHEST_CLOSED) color = 0xffd700;
          else if (t === TILE.CHEST_OPEN)  color = 0x886600;
          else if (t === TILE.TRAP_VISIBLE) color = 0xff4444;
          else if (t === TILE.GRASS)       color = 0x2d6a1f;
          else if (t === TILE.NPC)         color = 0xddaaff;
          else                             color = 0x334455; // floor
        }

        g.fillStyle(color, 1);
        g.fillRect(ox + x * S, oy + y * S, S, S);
      }
    }

    // ── Floor items (gold / treasure) — visible tiles only ───
    if (gs.floorItems) {
      for (const fi of gs.floorItems) {
        if (gs.vis[fi.y]?.[fi.x] === VIS.VISIBLE) {
          g.fillStyle(0xffd700, 1);
          g.fillRect(ox + fi.x * S, oy + fi.y * S, S, S);
        }
      }
    }

    // ── Monsters — visible tiles only ───────────────────────
    if (gs.monsters) {
      for (const m of gs.monsters) {
        if (!m.isDead && gs.vis[m.y]?.[m.x] === VIS.VISIBLE) {
          g.fillStyle(0xff3333, 1);
          g.fillRect(ox + m.x * S, oy + m.y * S, S, S);
        }
      }
    }

    // ── Player — always shown ────────────────────────────────
    g.fillStyle(0x00ff88, 1);
    g.fillRect(ox + gs.player.x * S, oy + gs.player.y * S, S, S);
  }

  _refreshStats() {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const p = gs.player;

    const maxW = (this.hpBarBg?.width ?? 160);

    // HP
    const hpRatio = Math.max(0, p.stats.hp / p.stats.maxHp);
    this.hpBarFill?.setSize(maxW * hpRatio, 10);
    const hpColor = hpRatio < 0.25 ? 0xff4444 : hpRatio < 0.5 ? 0xff9944 : 0xdd3333;
    this.hpBarFill?.setFillStyle(hpColor);
    this.hpText?.setText(`HP: ${p.stats.hp}/${p.stats.maxHp}`);

    // MP
    const mpRatio = Math.max(0, p.stats.mana / p.stats.maxMana);
    this.mpBarFill?.setSize(maxW * mpRatio, 10);
    this.mpText?.setText(`MP: ${p.stats.mana}/${p.stats.maxMana}`);

    // XP
    const xpNeeded = p.xpToNext;
    const xpPrev   = XP_TABLE[p.level - 1] ?? 0;
    const xpRatio  = xpNeeded > xpPrev ? (p.xp - xpPrev) / (xpNeeded - xpPrev) : 1;
    this.xpBarFill?.setSize(maxW * Math.max(0, Math.min(1, xpRatio)), 8);
    this.xpText?.setText(`LVL ${p.level} — ${p.xp} XP`);

    // Combat stats
    this.atkText?.setText(`ATK:  ${p.stats.atk}`);
    this.defText?.setText(`DEF:  ${p.stats.def}`);
    this.spdText?.setText(`SPD:  ${p.stats.spd}`);
    this.goldText?.setText(`Gold: ${p.gold}`);

  }

  _refreshFloor(floor) {
    this.floorText?.setText(floor === 0 ? 'Town' : `Floor: ${floor}`);
  }

  _addLog({ text, color = '#ccddee' }) {
    this.logMessages.push({ text, color });
    if (this.logMessages.length > 10) this.logMessages.shift();

    const n    = this.logLines.length;
    const msgs = this.logMessages.slice(-n);
    for (let i = 0; i < n; i++) {
      const msg = msgs[i];
      if (msg) {
        this.logLines[i].setText(msg.text).setColor(msg.color);
        this.logLines[i].setAlpha(1 - (n - 1 - i) * 0.22);
      } else {
        this.logLines[i].setText('');
      }
    }
  }

  // ── Drag & Drop ─────────────────────────────────────────

  _initDragSystem() {
    this._dragSlot   = null;
    this._dragSrc    = null;
    this._dragGhost  = null;
    this._dragging   = false;
    this._dragStartX = 0;
    this._dragStartY = 0;

    this.input.on('pointermove', (p) => this._onDragMove(p));
    this.input.on('pointerup',   (p) => this._onDragEnd(p));
  }

  _startDragFrom(slot, src, pointer) {
    this._dragSlot   = slot;
    this._dragSrc    = src;
    this._dragging   = false;
    this._dragStartX = pointer.x;
    this._dragStartY = pointer.y;
  }

  _onDragMove(pointer) {
    if (!this._dragSlot || pointer.rightButtonDown()) return;
    const dx = pointer.x - this._dragStartX;
    const dy = pointer.y - this._dragStartY;
    if (!this._dragging && Math.sqrt(dx * dx + dy * dy) > 8) {
      this._dragging = true;
      const item = this._dragSlot._item;
      if (item) {
        const key = `item-${item.id ?? item.type}`;
        this._dragGhost = this.add.image(pointer.x, pointer.y, key)
          .setDisplaySize(30, 30).setScrollFactor(0).setDepth(200).setAlpha(0.8);
      }
    }
    if (this._dragGhost) this._dragGhost.setPosition(pointer.x, pointer.y);
  }

  _onDragEnd(pointer) {
    if (!this._dragSlot) return;
    const wasDragging = this._dragging;
    const srcSlot = this._dragSlot;
    const srcSrc  = this._dragSrc;
    this._cancelDrag();
    if (!wasDragging) return; // click was handled by _onInvSlotClick / _onEquipSlotClick

    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player || gs.gamePaused || gs.activePanel !== 0) return;

    // Determine drop target — inv slot?
    const invTarget = this._invSlots?.find(
      s => s !== srcSlot && this._pointerOverSlot(pointer, s)
    );
    if (invTarget) { this._dragDropOnInvSlot(srcSlot, srcSrc, invTarget, gs); return; }

    // Equip slot?
    const eqTarget = this._equipSlots?.find(
      s => s !== srcSlot && this._pointerOverSlot(pointer, s)
    );
    if (eqTarget) { this._dragDropOnEquipSlot(srcSlot, srcSrc, eqTarget, gs); return; }

    // Game world area?
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const inLeftPanel  = pointer.x < 222;
    const inBottomBar  = pointer.y > H - 150;
    const inMinimap    = pointer.x > this._mmX - 10 && pointer.y < MM_Y + MM_H + 34;
    if (!inLeftPanel && !inBottomBar && !inMinimap) {
      this._dragDropOnWorld(srcSlot, srcSrc, gs);
    }
  }

  _pointerOverSlot(pointer, slot) {
    const b = slot.bg.getBounds();
    return pointer.x >= b.left && pointer.x <= b.right
        && pointer.y >= b.top  && pointer.y <= b.bottom;
  }

  _cancelDrag() {
    if (this._dragGhost) { this._dragGhost.destroy(); this._dragGhost = null; }
    this._dragSlot  = null;
    this._dragSrc   = null;
    this._dragging  = false;
  }

  _dragDropOnInvSlot(srcSlot, srcSrc, targetSlot, gs) {
    if (srcSrc === 'inv') {
      // Swap two inventory positions
      const inv = gs.player.inventory;
      const tmp = inv[targetSlot.index];
      inv[targetSlot.index] = inv[srcSlot.index];
      inv[srcSlot.index]    = tmp;
      if (this._selSlot === srcSlot) this._clearSelection();
      this._refreshInventory();
    } else if (srcSrc === 'equip') {
      // Unequip to specific inv slot
      const eq  = gs.player.equipment;
      const eqItem = eq[srcSlot.slotKey];
      if (eqItem && eqItem.id !== 'fists' && eqItem.id !== 'rags') {
        const inv    = gs.player.inventory;
        const target = inv[targetSlot.index];
        if (!target) {
          inv[targetSlot.index] = eqItem;
          eq[srcSlot.slotKey]   = null;
          gs.player.refreshStats();
          gs._endPlayerTurn?.();
        } else if (target.slot === srcSlot.slotKey) {
          // Use equipItem so only 1 unit is taken from the stack;
          // it handles routing the previously equipped item back to inventory.
          gs.player.equipItem(targetSlot.index);
          gs._endPlayerTurn?.();
        } else {
          this.bus.emit(EV.LOG_MSG, { text: 'Cannot swap — item type mismatch.', color: '#ff8888' });
        }
      }
      if (this._selSlot === srcSlot) this._clearSelection();
      this._refreshEquipPanel();
      this._refreshInventory();
    }
  }

  _dragDropOnEquipSlot(srcSlot, srcSrc, targetSlot, gs) {
    if (srcSrc === 'inv') {
      const invItem = srcSlot._item;
      if (invItem && invItem.slot === targetSlot.slotKey) {
        gs.player.equipItem(srcSlot.index);
        gs._endPlayerTurn?.();
        SFX.play('equip');
        if (this._selSlot === srcSlot) this._clearSelection();
        this._refreshEquipPanel();
        this._refreshInventory();
      } else {
        this.bus.emit(EV.LOG_MSG, { text: 'Item cannot be equipped in that slot.', color: '#ff8888' });
      }
    } else if (srcSrc === 'equip') {
      // equip → equip: not meaningful, ignore
      this.bus.emit(EV.LOG_MSG, { text: 'Cannot move between equipment slots directly.', color: '#ff8888' });
    }
  }

  _dragDropOnWorld(srcSlot, srcSrc, gs) {
    const px = gs.player.x;
    const py = gs.player.y;
    if (srcSrc === 'inv') {
      const inv  = gs.player.inventory;
      const item = inv[srcSlot.index];
      if (!item) return;
      inv[srcSlot.index] = null;
      gs.floorItems.push({ x: px, y: py, item });
      gs._rebuildItemSprites();
      gs._render();
      gs._endPlayerTurn?.();
      SFX.play('equip');
      this.bus.emit(EV.LOG_MSG, { text: `Dropped ${item.name}.`, color: '#aabbcc' });
      if (this._selSlot === srcSlot) this._clearSelection();
      this._refreshInventory();
    } else if (srcSrc === 'equip') {
      const eq   = gs.player.equipment;
      const item = eq[srcSlot.slotKey];
      if (!item || item.id === 'fists' || item.id === 'rags') return;
      eq[srcSlot.slotKey] = null;
      gs.player.refreshStats();
      gs.floorItems.push({ x: px, y: py, item });
      gs._rebuildItemSprites();
      gs._render();
      gs._endPlayerTurn?.();
      SFX.play('equip');
      this.bus.emit(EV.LOG_MSG, { text: `Dropped ${item.name}.`, color: '#aabbcc' });
      if (this._selSlot === srcSlot) this._clearSelection();
      this._refreshEquipPanel();
      this._refreshInventory();
    }
  }

  // ── Pause Menu ───────────────────────────────────────────

  _openPauseMenu() {
    if (this._pauseItems) return; // already open

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const items = [];
    const add = (o) => { items.push(o); return o; };

    // Dark backdrop (blocks clicks on game below)
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(50).setInteractive());

    // Panel box
    const PW = 380, PH = 470;
    add(this.add.rectangle(W / 2, H / 2, PW, PH, 0x0a0a14, 0.97)
      .setScrollFactor(0).setDepth(51).setStrokeStyle(2, 0x334466));

    add(this.add.text(W / 2, H / 2 - 168, '❚❚  PAUSED', {
      fontFamily: 'Courier New', fontSize: '26px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(52));

    const mkBtn = (label, y, color, cb) => {
      const btn = add(this.add.text(W / 2, y, label, {
        fontFamily: 'Courier New', fontSize: '16px', color,
        backgroundColor: '#111122', padding: { x: 16, y: 7 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true }));
      btn.on('pointerover', () => btn.setAlpha(0.75));
      btn.on('pointerout',  () => btn.setAlpha(1));
      btn.on('pointerdown', cb);
      return btn;
    };

    Music.pause();

    const gs = this.scene.get(SCENE.GAME);
    const skillPts = gs?.player?.skillPoints ?? 0;
    const skillLabel = skillPts > 0 ? `[ SKILLS ] (${skillPts})` : '[ SKILLS ]';

    const continueAction = () => this.bus.emit(EV.RESUME_GAME);
    const saveAction = () => {
      const gs = this.scene.get(SCENE.GAME);
      const ok = saveGame(gs);
      this.bus.emit(EV.LOG_MSG, {
        text: ok ? '💾 Game saved!' : '⚠ Save failed.',
        color: ok ? '#88ffcc' : '#ff8888',
      });
      this.bus.emit(EV.RESUME_GAME);
    };
    const skillsAction = () => {
      this.bus.emit(EV.RESUME_GAME);
      const gs2 = this.scene.get(SCENE.GAME);
      if (gs2) gs2._openPanel(2); // PANEL.SKILLS = 2
    };
    const helpAction  = () => this._showInstructions();
    const debugAction = () => this._openDebugMenu();
    const menuAction  = () => {
      this.bus.emit(EV.RESUME_GAME);
      this.scene.stop(SCENE.UI);
      this.scene.stop(SCENE.GAME);
      this.scene.start(SCENE.MENU);
    };

    this._pauseBtns = [
      { obj: mkBtn('[ CONTINUE ]',    H / 2 - 90,  '#44ff88', continueAction), action: continueAction },
      { obj: mkBtn('[ SAVE GAME ]',   H / 2 - 42,  '#ffd700', saveAction),    action: saveAction     },
      { obj: mkBtn(skillLabel,         H / 2 + 6,   '#88aaff', skillsAction),  action: skillsAction   },
      { obj: mkBtn('[ HOW TO PLAY ]', H / 2 + 54,  '#88aaff', helpAction),    action: helpAction     },
      { obj: mkBtn('[ DEBUG ]',        H / 2 + 102, '#ff88ff', debugAction),   action: debugAction    },
      { obj: mkBtn('[ MAIN MENU ]',   H / 2 + 150, '#ff8888', menuAction),    action: menuAction     },
    ];

    // Gamepad cursor
    this._pauseCursor = add(this.add.text(0, 0, '►', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(53).setVisible(false));

    this._pauseSelIdx       = 0;
    this._pausePadPrev      = { up: false, down: false, a: false, b: false };
    this._pauseNavHeldSince = null;
    this._updatePauseSel(0);

    // ── Audio toggles ────────────────────────────────────────
    add(this.add.text(W / 2, H / 2 + 195, '── Audio ──', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#445566',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52));

    const mkToggle = (label, x, stateFn, action) => {
      const btn = add(this.add.text(x, H / 2 + 215, label + (stateFn() ? 'ON' : 'OFF'), {
        fontFamily: 'Courier New', fontSize: '14px', color: '#88aacc',
        backgroundColor: '#111122', padding: { x: 12, y: 7 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true }));
      btn.on('pointerover', () => btn.setAlpha(0.75));
      btn.on('pointerout',  () => btn.setAlpha(1));
      btn.on('pointerdown', () => { action(); btn.setText(label + (stateFn() ? 'ON' : 'OFF')); });
      return btn;
    };
    mkToggle('♪ MUSIC: ', W / 2 - 72, () => Music.musicEnabled,
      () => {
        if (Music.musicEnabled) {
          Music.musicEnabled = false;
          Music.pause();
        } else {
          Music.musicEnabled = true;
          if (Music.isPlaying) {
            Music.unpause();
          } else {
            Music.play(Music.themeKey ?? 'shallow');
          }
        }
        Settings.musicEnabled = Music.musicEnabled;
        Settings.save();
      });
    mkToggle('🔊 SFX: ',  W / 2 + 72, () => !SFX.muted,
      () => { SFX.muted = !SFX.muted; Settings.sfxEnabled = !SFX.muted; Settings.save(); });

    // Escape key resumes
    this._pauseEscHandler = () => this.bus.emit(EV.RESUME_GAME);
    this.input.keyboard.on('keydown-ESC', this._pauseEscHandler);

    this._pauseItems = items;
  }

  _openDebugMenu() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const items = [];
    const add = (o) => { items.push(o); return o; };

    // Overlay on top of pause menu
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(60).setInteractive());

    const PW = 340, PH = 340;
    add(this.add.rectangle(W / 2, H / 2, PW, PH, 0x080810, 0.98)
      .setScrollFactor(0).setDepth(61).setStrokeStyle(2, 0x553388));

    add(this.add.text(W / 2, H / 2 - 145, '🛠  DEBUG MENU', {
      fontFamily: 'Courier New', fontSize: '20px', color: '#ff88ff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(62));

    const gs = this.scene.get(SCENE.GAME);

    const mkDbgBtn = (label, y, cb) => {
      const btn = add(this.add.text(W / 2, y, label, {
        fontFamily: 'Courier New', fontSize: '16px', color: '#ddaaff',
        backgroundColor: '#110a22', padding: { x: 18, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true }));
      btn.on('pointerover', () => btn.setAlpha(0.75));
      btn.on('pointerout',  () => btn.setAlpha(1));
      btn.on('pointerdown', cb);
      return btn;
    };

    const townScrollAction = () => {
      if (gs?.player) {
        gs.player.pickUpItem(createItem('townScroll'));
      }
    };
    const levelUpAction = () => {
      if (gs?.player) {
        const needed = Math.max(1, gs.player.xpToNext - gs.player.xp);
        gs.player.addXP(needed);
      }
    };
    const revealFloorAction = () => {
      if (gs?.player) {
        gs.player.pickUpItem(createItem('scrollMap'));
      }
    };
    const backAction = () => {
      for (const o of items) o.destroy();
      this._debugItems  = null;
      this._debugBtns   = null;
      this._debugCursor = null;
      if (this._debugEscHandler) {
        this.input.keyboard.off('keydown-ESC', this._debugEscHandler);
        this._debugEscHandler = null;
      }
      // Restore pause navigation
      this._pauseBtns.forEach((item, i) => item.obj.setAlpha(i === this._pauseSelIdx ? 1.0 : 0.45));
    };

    this._debugBtns = [
      { obj: mkDbgBtn('[ TOWN SCROLL ]',      H / 2 - 60,  townScrollAction),  action: townScrollAction  },
      { obj: mkDbgBtn('[ LEVEL UP ]',          H / 2 - 10,  levelUpAction),     action: levelUpAction     },
      { obj: mkDbgBtn('[ SCROLL OF MAPPING ]', H / 2 + 40,  revealFloorAction), action: revealFloorAction },
      { obj: mkDbgBtn('[ BACK ]',              H / 2 + 100, backAction),         action: backAction        },
    ];

    // Gamepad cursor for debug menu
    this._debugCursor = add(this.add.text(0, 0, '►', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ffffff',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(63).setVisible(false));

    this._debugSelIdx       = 0;
    this._debugPadPrev      = { up: false, down: false, a: false, b: false };
    this._debugNavHeldSince = null;
    this._updateDebugSel(0);

    this._debugEscHandler = () => backAction();
    this.input.keyboard.on('keydown-ESC', this._debugEscHandler);

    this._debugItems = items;
  }

  _updateDebugSel(idx) {
    this._debugSelIdx = idx;
    this._debugBtns.forEach((item, i) => item.obj.setAlpha(i === idx ? 1.0 : 0.45));
    const sel = this._debugBtns[idx];
    if (sel && this._debugCursor) {
      this._debugCursor
        .setPosition(sel.obj.x - sel.obj.displayWidth / 2 - 8, sel.obj.y)
        .setVisible(true);
    }
  }

  _closePauseMenu() {
    if (!this._pauseItems) return;
    // Also clean up debug menu if it was open
    if (this._debugItems) {
      for (const o of this._debugItems) o.destroy();
      this._debugItems  = null;
      this._debugBtns   = null;
      this._debugCursor = null;
      if (this._debugEscHandler) {
        this.input.keyboard.off('keydown-ESC', this._debugEscHandler);
        this._debugEscHandler = null;
      }
    }
    for (const o of this._pauseItems) o.destroy();
    this._pauseItems  = null;
    this._pauseBtns   = null;
    this._pauseCursor = null;
    this._instrClose  = null;
    if (this._pauseEscHandler) {
      this.input.keyboard.off('keydown-ESC', this._pauseEscHandler);
      this._pauseEscHandler = null;
    }
    if (Music.musicEnabled) Music.unpause();
  }

  _showInstructions() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const items = [];
    const add = (o) => { items.push(o); return o; };

    // Overlay on top of pause menu
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(60).setInteractive());

    const PW = Math.min(860, W - 16);
    const PH = Math.min(640, H - 16);
    const PX = W / 2 - PW / 2;
    const PY = H / 2 - PH / 2;
    add(this.add.rectangle(W / 2, H / 2, PW, PH, 0x090910, 0.98)
      .setScrollFactor(0).setDepth(61).setStrokeStyle(2, 0x334466));

    const tx = (x, y, str, color = '#ccddee', size = 12) =>
      add(this.add.text(PX + x, PY + y, str, {
        fontFamily: 'Courier New', fontSize: `${size}px`, color,
      }).setScrollFactor(0).setDepth(62));

    const icon = (x, y, key) => {
      try {
        add(this.add.image(PX + x, PY + y, key).setDisplaySize(18, 18).setOrigin(0, 0).setScrollFactor(0).setDepth(62));
      } catch (_) {}
    };

    tx(PW / 2, 12, '⚔  HOW TO PLAY  ⚔', '#ffd700', 18).setOrigin(0.5, 0);
    tx(PW / 2, 36, 'Delve 10 floors deep and slay the Dungeon Lord', '#88aacc', 12).setOrigin(0.5, 0);

    const COL1 = 14, COL2 = PW / 2 + 8;
    let y = 66;

    // Left column — controls
    tx(COL1, y, '── CONTROLS ──', '#ffd700', 11); y += 18;
    const controls = [
      ['WASD / Arrows',   'Move one tile'],
      ['Space / click tile', 'Pick up / stairs / wait'],
      ['Bump enemy',      'Attack'],
      ['G',               'Pick up item'],
      ['. (period)',      'Wait a turn'],
      ['> / <',           'Use stairs down/up'],
      ['I',               'Inventory'],
      ['K',               'Skill tree'],
      ['C',               'Crafting'],
      ['P',               'Character screen'],
      ['M',               'Toggle minimap'],
      ['Click tile',      'Walk to location'],
      ['Click adj. foe',  'Attack (orthogonal)'],
      ['Escape',          'Pause menu (anywhere)'],
    ];
    for (const [key, desc] of controls) {
      tx(COL1,       y, key,  '#ffdd88', 11);
      tx(COL1 + 118, y, desc, '#99aabb', 11);
      y += 16;
    }

    y += 6;
    tx(COL1, y, '── COMBAT TIPS ──', '#ffd700', 11); y += 18;
    const tips = [
      'HP drops to 0 → you die.',
      'Potions restore HP / MP.',
      'Equipment raises ATK, DEF.',
      'Skills cost skill points (level up).',
      'Poison = damage each turn.',
      'Freeze = skip turns.',
      'Gold is auto-collected by walking over it.',
    ];
    for (const tip of tips) {
      tx(COL1, y, '• ' + tip, '#778899', 11);
      y += 15;
    }

    // Right column — legends
    let ry = 66;
    tx(COL2, ry, '── TILE LEGEND ──', '#ffd700', 11); ry += 18;
    const tiles = [
      ['tile-floor',        'Floor — safe to walk'],
      ['tile-wall',         'Wall — impassable'],
      ['tile-door',         'Door — opens on entry'],
      ['tile-stairs-down',  'Stairs ↓  — descend (>)'],
      ['tile-stairs-up',    'Stairs ↑  — ascend  (<)'],
      ['tile-water',        'Water — slows movement'],
      ['tile-lava',         'Lava — deals damage'],
      ['tile-chest-closed', 'Chest — contains loot'],
      ['tile-chest-open',   'Chest — already looted'],
    ];
    for (const [key, desc] of tiles) {
      icon(COL2, ry, key);
      tx(COL2 + 24, ry + 3, desc, '#99aabb', 11);
      ry += 20;
    }
    const trapDot = add(this.add.rectangle(PX + COL2 + 9, PY + ry + 9, 18, 18, 0xff4444, 0.7).setScrollFactor(0).setDepth(62));
    tx(COL2 + 24, ry + 3, 'Trap — watch your step!', '#99aabb', 11);
    ry += 24;

    tx(COL2, ry, '── ITEM TYPES ──', '#ffd700', 11); ry += 18;
    const itemTypes = [
      ['item-weapon',   'Weapon  — equip for ATK'],
      ['item-armor',    'Armor   — equip for DEF'],
      ['item-ring',     'Ring    — equip for bonus'],
      ['item-amulet',   'Amulet  — equip for bonus'],
      ['item-potion',   'Potion  — consumable'],
      ['item-scroll',   'Scroll  — magical effect'],
      ['item-material', 'Material — used in crafting'],
      ['item-gold',     'Gold    — auto-collected'],
    ];
    for (const [key, desc] of itemTypes) {
      icon(COL2, ry, key);
      tx(COL2 + 24, ry + 3, desc, '#99aabb', 11);
      ry += 20;
    }

    // Close button
    const closeBtn = add(this.add.text(PW / 2 + PX, PY + PH - 30, '[ BACK TO PAUSE MENU ]', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88aacc',
      backgroundColor: '#111122', padding: { x: 14, y: 6 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(62).setInteractive({ useHandCursor: true }));
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffd700'));
    closeBtn.on('pointerout',  () => closeBtn.setColor('#88aacc'));
    const close = () => {
      for (const o of items) o.destroy();
      this._instrClose = null;
    };
    this._instrClose = close;
    closeBtn.on('pointerdown', close);
    this.time.delayedCall(0, () => {
      this.input.keyboard.once('keydown-ESC', close);
    });
  }

  // ══════════════════════════════════════════════════════════
  //  Portrait / Mobile HUD
  // ══════════════════════════════════════════════════════════

  _buildHUD_portrait(W, H) {
    // ── Zone heights ─────────────────────────────────────────
    const STATS_H  = PORTRAIT_STATS_H;   // compact stats bar at top
    const LOG_H    = PORTRAIT_LOG_H;     // message log
    const DPAD_H   = PORTRAIT_DPAD_H;    // skill hotbar + d-pad + action buttons
    const BOTTOM_H = PORTRAIT_BOTTOM_H;

    const LOG_Y  = H - BOTTOM_H;
    const DPAD_Y = LOG_Y + LOG_H;

    // ── Top Stats Panel ───────────────────────────────────────
    // Reserve ~66px on the right for pause/map buttons
    const PX = 4, PY = 4, PW = W - 74, PH = STATS_H - 6;

    this.statsBg = this.add.rectangle(PX + PW / 2, PY + PH / 2, PW, PH, 0x0d1117, 0.92)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(10);

    const tx = (x, y, str, color = '#ccddee', size = 11) =>
      this.add.text(x, y, str, {
        fontFamily: 'Courier New', fontSize: `${size}px`, color,
      }).setScrollFactor(0).setDepth(11);

    // Title row
    tx(PX + 6, PY + 4, '⚔ DARKSPAWN', '#ffd700', 12);
    this.floorText = tx(W / 2, PY + 4, 'Floor: 1', '#88aacc', 11).setOrigin(0.5, 0);

    // Pause & Map buttons — each fills roughly half of the stats panel height
    // PH = STATS_H - 6 = 82px.  Each button: font 16px + paddingY 11*2 = 38px. Gap = 2px.
    const BTN_RIGHT_X  = W - 4;
    const SIDE_BTN_H   = Math.floor((PH - 2) / 2); // ~40px each
    const SIDE_PAD_Y   = Math.floor((SIDE_BTN_H - 16) / 2); // vertical padding to fill height

    const pauseBtn = this.add.text(BTN_RIGHT_X, PY + 2, '❚❚', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#88aacc',
      backgroundColor: '#1a1a2a', padding: { x: 10, y: SIDE_PAD_Y },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(13).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffd700'));
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#88aacc'));
    pauseBtn.on('pointerdown', () => this.bus.emit(EV.PAUSE_GAME));

    const mapBtn = this.add.text(BTN_RIGHT_X, PY + 2 + SIDE_BTN_H + 2, 'MAP', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#88aacc',
      backgroundColor: '#1a1a2a', padding: { x: 10, y: SIDE_PAD_Y },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(13).setInteractive({ useHandCursor: true });
    mapBtn.on('pointerover', () => mapBtn.setColor('#ffd700'));
    mapBtn.on('pointerout',  () => mapBtn.setColor('#88aacc'));
    mapBtn.on('pointerdown', () => this._toggleMinimap());

    // Bars: HP, MP, XP stacked vertically across full panel width
    const barX = PX + 22, barW = PW - 26;
    const barH = 9, xpH = 7;

    tx(PX + 4, PY + 18, 'HP', '#ff6666', 10);
    this.hpBarBg   = this.add.rectangle(barX, PY + 20, barW, barH, 0x330000).setScrollFactor(0).setDepth(11).setOrigin(0, 0);
    this.hpBarFill = this.add.rectangle(barX, PY + 20, barW, barH, 0xdd3333).setScrollFactor(0).setDepth(12).setOrigin(0, 0);

    tx(PX + 4, PY + 30, 'MP', '#6688ff', 10);
    this.mpBarBg   = this.add.rectangle(barX, PY + 32, barW, barH, 0x000033).setScrollFactor(0).setDepth(11).setOrigin(0, 0);
    this.mpBarFill = this.add.rectangle(barX, PY + 32, barW, barH, 0x3355dd).setScrollFactor(0).setDepth(12).setOrigin(0, 0);

    tx(PX + 4, PY + 42, 'XP', '#44cc44', 10);
    this.xpBarBg   = this.add.rectangle(barX, PY + 44, barW, xpH, 0x002200).setScrollFactor(0).setDepth(11).setOrigin(0, 0);
    this.xpBarFill = this.add.rectangle(barX, PY + 44, barW, xpH, 0x33aa33).setScrollFactor(0).setDepth(12).setOrigin(0, 0);

    // Text readouts line (HP | MP | LVL)
    this.hpText   = tx(PX + 4,       PY + 53, 'HP:20/20',     '#ffaaaa', 9);
    this.mpText   = tx(PX + 4 + 108, PY + 53, 'MP:10/10',     '#aaaaff', 9);
    this.xpText   = tx(PX + 4 + 220, PY + 53, 'LVL 1 — 0 XP','#88cc88', 9);

    // Stats row
    this.atkText  = tx(PX + 4,       PY + 64, 'ATK:5',  '#ffaa44', 10);
    this.defText  = tx(PX + 4 + 80,  PY + 64, 'DEF:2',  '#88ccff', 10);
    this.spdText  = tx(PX + 4 + 154, PY + 64, 'SPD:4',  '#ffff88', 10);
    this.goldText = tx(PX + 4 + 228, PY + 64, 'Gold:0', '#ffd700', 10);

    // Controls hint (very small)
    tx(PX + 4, PY + 76, 'Tap to walk · D-pad = move · [I]nv [K]ills [C]raft [P]char', '#334455', 8);

    // ── Minimap (top-right, visible by default on mobile) ─────
    this._buildMinimap(W, STATS_H + 4);
    this.mmVisible = true;

    // ── Message Log ───────────────────────────────────────────
    this.logBg = this.add.rectangle(W / 2, LOG_Y + LOG_H / 2, W - 4, LOG_H, 0x0d1117, 0.92)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(10);
    this.logLines = [];
    for (let i = 0; i < 2; i++) {
      this.logLines.push(
        this.add.text(6, LOG_Y + 5 + i * 17, '', {
          fontFamily: 'Courier New', fontSize: '11px', color: '#778899',
          wordWrap: { width: W - 12 },
        }).setScrollFactor(0).setDepth(11)
      );
    }
    this.logMessages = [];

    // ── Skill Hotbar + D-Pad + Action buttons ─────────────────
    this._buildDPad(W, DPAD_Y, DPAD_H);

    // ── UI blocker zones ──────────────────────────────────────
    // Depth must be BELOW skill hotbar buttons (depth 4) so pointerdown on skills works,
    // while still appearing in hitTestPointer to block GameScene walking through HUD.
    const uiBlock = (x, y, w, h) =>
      this.add.zone(x + w / 2, y + h / 2, w, h)
        .setScrollFactor(0).setDepth(3).setInteractive();
    uiBlock(0, 0, W, STATS_H);       // top stats
    uiBlock(0, LOG_Y, W, BOTTOM_H);  // bottom controls

    // ── Drag system (kept for completeness) ──────────────────
    this._initDragSystem();

    // Portrait mode: no always-visible inventory or equipment panels
    this._invSlots   = null;
    this._equipSlots = null;
    this._invTooltip = null;
  }

  _buildSkillHotbar_portrait(W, startY, height, colStartX = 0, explicitPanelW = 0, explicitCenterX = 0) {
    const SZ = 34, GAP = 3;
    const HB_Y   = startY + Math.floor((height - SZ) / 2);
    const maxSlots = 8;
    const availW  = W - colStartX;
    const panelW  = explicitPanelW > 0
      ? explicitPanelW
      : Math.min(maxSlots * (SZ + GAP) - GAP + 12, availW - 8);
    const centerX = explicitCenterX > 0 ? explicitCenterX : colStartX + availW / 2;

    // depth 3 — must be BELOW slot bgs (depth 4) and icons (depth 5) so they're visible
    this.add.rectangle(centerX, HB_Y + SZ / 2 + 2, panelW, SZ + 12, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(3);
    // No SKILLS label in mobile — saves vertical space

    this._hotbarSZ          = SZ;
    this._hotbarGAP         = GAP;
    this._hotbarY           = HB_Y;
    this._hotbarW           = W;
    this._hotbarColStartX   = colStartX;
    this._hotbarCenterX     = centerX;  // used by _refreshSkillHotbar for slot centering
    this._hotbarSkills     = [];
    this._hotbarSlotObjects = [];
    this._selectedSkillId  = null;
    this._skillsBadge      = null;  // accessed via SKILLS action button instead

    this._refreshSkillHotbar();
  }

  _buildDPad(W, startY, height) {
    // Layout (all within the DPAD zone):
    //  Left column : d-pad grid, centered vertically in the full zone height
    //  Right column: skill hotbar (top half) + 4 action buttons (bottom half)
    const ACTION_H = Math.floor(height * 0.40);  // ~40 % of zone for action buttons
    const HOTBAR_H = Math.floor(height * 0.30);  // ~30 % for skill hotbar
    // D-pad occupies full height on the left side
    const dpadHeight = height;

    const SZ = 32, GAP = 2;     // d-pad button size and gap
    const gridW = SZ * 3 + GAP * 2;
    const gridH = SZ * 3 + GAP * 2;
    const dpadX = 6;
    const dpadY = startY + Math.floor((dpadHeight - gridH) / 2);

    // D-pad background
    this.add.rectangle(dpadX + gridW / 2, dpadY + gridH / 2, gridW + 8, gridH + 8, 0x0d1117, 0.88)
      .setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(10);

    const DIRS = [
      { dx: -1, dy: -1, lbl: '↖', row: 0, col: 0 },
      { dx:  0, dy: -1, lbl: '↑', row: 0, col: 1 },
      { dx:  1, dy: -1, lbl: '↗', row: 0, col: 2 },
      { dx: -1, dy:  0, lbl: '←', row: 1, col: 0 },
      { dx:  0, dy:  0, lbl: '·', row: 1, col: 1 },  // centre = wait/action
      { dx:  1, dy:  0, lbl: '→', row: 1, col: 2 },
      { dx: -1, dy:  1, lbl: '↙', row: 2, col: 0 },
      { dx:  0, dy:  1, lbl: '↓', row: 2, col: 1 },
      { dx:  1, dy:  1, lbl: '↘', row: 2, col: 2 },
    ];

    for (const dir of DIRS) {
      const bx = dpadX + dir.col * (SZ + GAP) + SZ / 2;
      const by = dpadY + dir.row * (SZ + GAP) + SZ / 2;
      const isCenter = dir.dx === 0 && dir.dy === 0;

      const btnBg = this.add.rectangle(bx, by, SZ, SZ,
        isCenter ? 0x1a1a2a : 0x161622, 1)
        .setStrokeStyle(1, isCenter ? 0x556677 : 0x334466)
        .setScrollFactor(0).setDepth(11).setInteractive({ useHandCursor: true });

      this.add.text(bx, by, dir.lbl, {
        fontFamily: 'Courier New', fontSize: '16px',
        color: isCenter ? '#556677' : '#88aacc',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(12);

      let holdEvent = null;
      const doAction = () => {
        const gs = this.scene.get(SCENE.GAME);
        if (!gs || gs.gamePaused || gs.activePanel !== 0 || gs.targeting) return;
        if (isCenter) {
          gs._playerDefaultAction?.();
        } else {
          gs._playerMove(dir.dx, dir.dy);
        }
      };

      const normalFill = isCenter ? 0x1a1a2a : 0x161622;
      btnBg.on('pointerover', () => btnBg.setFillStyle(isCenter ? 0x252538 : 0x222233));
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(normalFill);
        if (holdEvent) { holdEvent.remove(false); holdEvent = null; }
      });
      btnBg.on('pointerdown', () => {
        btnBg.setFillStyle(0x334466);
        doAction();
        holdEvent = this.time.addEvent({ delay: 180, callback: doAction, loop: true });
      });
      btnBg.on('pointerup', () => {
        btnBg.setFillStyle(normalFill);
        if (holdEvent) { holdEvent.remove(false); holdEvent = null; }
      });
    }

    // ── Compute action button dimensions first so hotbar can match their width ─
    const rightColX    = dpadX + gridW + 10;   // x where the right column begins
    const BTN_GAP      = 3;
    const BTN_H        = ACTION_H - 8;
    const actionStartX = rightColX;
    const BTN_W        = Math.floor((W - actionStartX - 4 - 1 * BTN_GAP) / 2);
    const totalBtnsW   = 2 * BTN_W + 1 * BTN_GAP;  // exact width the 2 buttons span
    const btnsCenterX  = actionStartX + totalBtnsW / 2;  // shared center for hotbar alignment

    // ── Skill hotbar: same width & center as the 2 buttons ───────────────────
    const hotbarStartY = startY + height - ACTION_H - HOTBAR_H;
    this._buildSkillHotbar_portrait(W, hotbarStartY, HOTBAR_H, rightColX, totalBtnsW, btnsCenterX);
    const actionStartY = startY + height - ACTION_H + Math.floor((ACTION_H - BTN_H) / 2);

    // 2 action buttons (SKILL and CHAR moved to pause menu)
    const ACTIONS = [
      { lbl: 'INV\n[I]',   col: 0, action: () => { const gs = this.scene.get(SCENE.GAME); if (gs && !gs.gamePaused) gs._openPanel(1); } },
      { lbl: 'CRAFT\n[C]', col: 1, action: () => { const gs = this.scene.get(SCENE.GAME); if (gs && !gs.gamePaused) gs._openPanel(3); } },
    ];

    for (const act of ACTIONS) {
      const bx = actionStartX + act.col * (BTN_W + BTN_GAP) + BTN_W / 2;
      const by = actionStartY + BTN_H / 2;

      const bg = this.add.rectangle(bx, by, BTN_W, BTN_H, 0x111122, 1)
        .setStrokeStyle(1, 0x334466)
        .setScrollFactor(0).setDepth(11).setInteractive({ useHandCursor: true });

      this.add.text(bx, by, act.lbl, {
        fontFamily: 'Courier New', fontSize: '10px',
        color: '#88aacc', align: 'center',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(12);

      bg.on('pointerover', () => bg.setFillStyle(0x1a2233));
      bg.on('pointerout',  () => bg.setFillStyle(0x111122));
      bg.on('pointerdown', () => { bg.setFillStyle(0x334466); act.action(); });
      bg.on('pointerup',   () => bg.setFillStyle(0x111122));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Portrait Panel Overlay
  //  Panels are rendered here (UIScene) in screen-space (zoom=1, scroll=(0,0))
  //  instead of in GameScene to avoid camera-zoom/scroll coordinate complexity.
  // ══════════════════════════════════════════════════════════════════════════

  _showPanel(type) {
    this._hidePanel();

    const W       = this.cameras.main.width;
    const H       = this.cameras.main.height;
    const HUD_TOP = PORTRAIT_STATS_H;
    const HUD_BOT = PORTRAIT_BOTTOM_H;
    const availH  = H - HUD_TOP - HUD_BOT;
    const MARG    = 8;
    const PW      = W - MARG * 2;                         // 464 px
    const PH      = Math.min(560, availH - MARG * 2);     // ≤ 558 px
    const bx      = MARG;                                  // 8
    const by      = HUD_TOP + Math.floor((availH - PH) / 2);

    this._panelCtr = this.add.container(0, 0).setDepth(20);

    // Background
    this._pAdd(
      this.add.rectangle(bx + PW / 2, by + PH / 2, PW, PH, 0x0d1117, 0.97)
        .setStrokeStyle(2, 0x334466).setScrollFactor(0)
    );

    // Title + close button
    const TITLES = { 1: '⚔ INVENTORY', 2: '✦ SKILLS', 3: '⚒ CRAFTING', 4: '⚙ CHARACTER' };
    this._pText(bx + 12, by + 8, TITLES[type] || 'PANEL', '#ffd700', 15);
    const closeBtn = this._pText(bx + PW - 12, by + 8, '[ESC]', '#556677', 12)
      .setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      const gs = this.scene.get(SCENE.GAME);
      if (gs) gs._closePanel();
    });

    const contentY = by + 32;
    const contentH = by + PH - contentY;

    switch (type) {
      case 1: this._renderPortraitInventory(bx, contentY, PW, contentH); break;
      case 2: this._renderPortraitSkills   (bx, contentY, PW, contentH); break;
      case 3: this._renderPortraitCrafting (bx, contentY, PW, contentH); break;
      case 4: this._renderPortraitChar     (bx, contentY, PW, contentH); break;
    }
  }

  _hidePanel() {
    if (this._panelCtr) { this._panelCtr.destroy(true); this._panelCtr = null; }
    this._invTooltipTxt        = null;
    this._invSelectedSlot      = -1;
    this._invSelectedEquipSlot = null;
  }

  /** Add game object to panel container and return it. */
  _pAdd(obj) { if (this._panelCtr) this._panelCtr.add(obj); return obj; }

  /** Create and add a text object to the panel container. */
  _pText(x, y, str, color = '#ccddee', size = 12, wrap = 0) {
    const cfg = { fontFamily: 'Courier New, monospace', fontSize: `${size}px`, color };
    if (wrap) cfg.wordWrap = { width: wrap };
    return this._pAdd(this.add.text(x, y, str, cfg).setScrollFactor(0));
  }

  // ── Inventory Panel ────────────────────────────────────────────────────────

  _renderPortraitInventory(bx, by, PW, PH) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;
    this._invSelectedSlot      = -1;
    this._invSelectedEquipSlot = null;

    let curY = by;

    // ── Equipment row ──────────────────────────────────────────────────────
    this._pText(bx + 12, curY, '── Equipment ──', '#778899', 11);
    curY += 16;

    const EQ_SZ  = 50, EQ_GAP = 8;
    const EQ_LABEL_H = 13;
    const EQ_SLOTS = [
      { label: 'WPN', slot: 'weapon' },
      { label: 'ARM', slot: 'armor'  },
      { label: 'RNG', slot: 'ring'   },
      { label: 'AMU', slot: 'amulet' },
    ];
    const eqTotalW = EQ_SLOTS.length * EQ_SZ + (EQ_SLOTS.length - 1) * EQ_GAP;
    let eqX = bx + Math.floor((PW - eqTotalW) / 2);

    for (const eq of EQ_SLOTS) {
      const item  = gs.player.equipment[eq.slot];
      const bgClr = item ? 0x1e2a3a : 0x080c12;
      const bdClr = item ? 0x4455aa : 0x223344;

      this._pText(eqX + EQ_SZ / 2, curY, eq.label, '#445566', 9).setOrigin(0.5, 0);

      const box = this._pAdd(
        this.add.rectangle(eqX + EQ_SZ / 2, curY + EQ_LABEL_H + EQ_SZ / 2, EQ_SZ, EQ_SZ, bgClr)
          .setStrokeStyle(1, bdClr).setScrollFactor(0).setInteractive({ useHandCursor: true })
      );
      const _bgClr = bgClr;
      box.on('pointerover', () => box.setFillStyle(0x2a3a4a));
      box.on('pointerout',  () => box.setFillStyle(_bgClr));
      box.on('pointerdown', () => this._onInvEquipClick(eq.slot));

      if (item) {
        try {
          this._pAdd(
            this.add.image(eqX + EQ_SZ / 2, curY + EQ_LABEL_H + EQ_SZ / 2,
              `item-${item.id ?? item.type}`).setScale(0.85).setScrollFactor(0)
          );
        } catch (e) { console.warn(`[UIScene] Missing item texture: item-${item.id ?? item.type}`); }
        this._pText(eqX + EQ_SZ / 2, curY + EQ_LABEL_H + EQ_SZ + 1,
          item.name, '#aabbcc', 8).setOrigin(0.5, 0);
      } else {
        this._pText(eqX + EQ_SZ / 2, curY + EQ_LABEL_H + EQ_SZ / 2,
          '─', '#223344', 18).setOrigin(0.5, 0.5);
      }

      eqX += EQ_SZ + EQ_GAP;
    }

    curY += EQ_LABEL_H + EQ_SZ + 14; // label + slot + item-name clearance

    // ── Bag grid ────────────────────────────────────────────────────────────
    this._pText(bx + 12, curY, '── Bag ──', '#778899', 11);
    curY += 16;

    const COLS  = 6, SL_SZ = 44, SL_GAP = 5;
    const gridW = COLS * SL_SZ + (COLS - 1) * SL_GAP; // 289
    const startX = bx + Math.floor((PW - gridW) / 2);
    const ROWS   = 4; // 24 slots / 6 cols = 4 rows

    for (let i = 0; i < 24; i++) {
      const col  = i % COLS;
      const row  = Math.floor(i / COLS);
      const sx   = startX + col * (SL_SZ + SL_GAP);
      const sy   = curY   + row * (SL_SZ + SL_GAP);
      const item = gs.player.inventory[i];
      const bgC  = item ? 0x1a2233 : 0x070a0f;

      const box = this._pAdd(
        this.add.rectangle(sx + SL_SZ / 2, sy + SL_SZ / 2, SL_SZ, SL_SZ, bgC)
          .setStrokeStyle(1, 0x1e2d3a).setScrollFactor(0)
          .setInteractive({ useHandCursor: !!item })
      );
      if (item) {
        const _bgC = bgC;
        box.on('pointerover', () => box.setFillStyle(0x2a3a4a));
        box.on('pointerout',  () => box.setFillStyle(_bgC));
        box.on('pointerdown', () => this._onInvBagClick(i));
        try {
          this._pAdd(
            this.add.image(sx + SL_SZ / 2, sy + SL_SZ / 2 - 2,
              `item-${item.id ?? item.type}`).setScale(0.75).setScrollFactor(0)
          );
        } catch (e) { console.warn(`[UIScene] Missing item texture: item-${item.id ?? item.type}`); }
        if (item.qty > 1) {
          this._pText(sx + SL_SZ - 2, sy + SL_SZ - 12, String(item.qty), '#aaaacc', 9)
            .setOrigin(1, 0);
        }
      }
    }

    const bagH = ROWS * (SL_SZ + SL_GAP) - SL_GAP;
    curY += bagH + 8;

    // ── Item tooltip ────────────────────────────────────────────────────────
    const tooltipH = (by + PH) - curY - 4;
    if (tooltipH >= 24) {
      this._pAdd(
        this.add.rectangle(bx + PW / 2, curY + tooltipH / 2, PW - 12, tooltipH, 0x080c12)
          .setStrokeStyle(1, 0x1e2d3a).setScrollFactor(0)
      );
      this._invTooltipTxt = this._pText(
        bx + 14, curY + 6,
        'Tap an item or equipment slot for details.\nTap again to use / equip.',
        '#445566', 10, PW - 28
      ).setLineSpacing(2);
    }
  }

  _onInvEquipClick(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;
    const item = gs.player.equipment[slot];
    if (!item) return;

    if (this._invSelectedEquipSlot === slot) {
      SFX.play('equip');
      gs.player.unequipItem(slot);
      gs._closePanel();
      gs._openPanel(1);
      return;
    }
    this._invSelectedEquipSlot = slot;
    this._invSelectedSlot      = -1;

    let d = `${item.name}\n\n${item.description ?? ''}`;
    if (item.atk)       d += `\nATK: +${item.atk}`;
    if (item.def)       d += `\nDEF: +${item.def}`;
    if (item.hpBonus)   d += `\nHP:  +${item.hpBonus}`;
    if (item.manaBonus) d += `\nMP:  +${item.manaBonus}`;
    if (item.value)     d += `\nValue: ${item.value}g`;
    d += '\n\n[Tap again to unequip]';
    if (this._invTooltipTxt) this._invTooltipTxt.setText(d).setColor('#ccddee');
  }

  _onInvBagClick(i) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;
    const item = gs.player.inventory[i];
    if (!item) return;

    if (this._invSelectedSlot === i) {
      if (item.type === ITEM_TYPE.POTION)    SFX.play('potion');
      else if (item.type === ITEM_TYPE.GOLD) SFX.play('coin');
      else                                   SFX.play('equip');
      const result = gs.player.useItem(i);
      if (result?.scrollEffect) gs._applyScrollEffect(result.scrollEffect);
      gs._closePanel();
      gs._openPanel(1);
      return;
    }
    this._invSelectedSlot      = i;
    this._invSelectedEquipSlot = null;

    let d = `${item.name}\n\n${item.description ?? ''}`;
    if (item.atk)       d += `\nATK: +${item.atk}`;
    if (item.def)       d += `\nDEF: +${item.def}`;
    if (item.hpBonus)   d += `\nHP:  +${item.hpBonus}`;
    if (item.manaBonus) d += `\nMP:  +${item.manaBonus}`;
    d += `\nValue: ${item.value}g`;
    d += '\n\n[Tap again to use / equip]';
    if (this._invTooltipTxt) this._invTooltipTxt.setText(d).setColor('#ccddee');
  }

  // ── Skills Panel ────────────────────────────────────────────────────────────

  _renderPortraitSkills(bx, by, PW, PH) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;

    this._pText(bx + PW - 12, by, `Points: ${gs.player.skillPoints}`, '#ffd700', 13)
      .setOrigin(1, 0);

    const trees = Object.values(SKILL_TREES);
    const colW  = Math.floor((PW - 8) / trees.length);

    trees.forEach((tree, ti) => {
      const cx = bx + 4 + ti * colW;
      this._pText(cx + colW / 2, by + 16, tree.icon + ' ' + tree.name, tree.color, 12)
        .setOrigin(0.5, 0);

      tree.skills.forEach((skill, si) => {
        const CARD_H = 58;
        const sy = by + 34 + si * CARD_H;

        const unlocked  = gs.player.skills.has(skill.id);
        const canUnlock = !unlocked && gs.player.skillPoints > 0 &&
          (!skill.prereq || gs.player.skills.has(skill.prereq));

        const bgClr = unlocked ? 0x1a2a1a : canUnlock ? 0x1a1a2a : 0x070a0f;
        const bdClr = unlocked ? 0x44aa44 : canUnlock ? 0x334466  : 0x1a1a2a;

        const doUnlock = () => {
          const gs = this.scene.get(SCENE.GAME);
          if (gs) gs._tryUnlockSkill(skill.id);
        };

        const card = this._pAdd(
          this.add.rectangle(cx + colW / 2, sy + 26, colW - 6, 52, bgClr)
            .setStrokeStyle(1, bdClr).setScrollFactor(0)
            .setInteractive({ useHandCursor: canUnlock })
        );
        if (canUnlock) card.on('pointerdown', doUnlock);

        try {
          this._pAdd(
            this.add.image(cx + 12, sy + 10, `skill-${skill.id}`)
              .setDisplaySize(18, 18).setScrollFactor(0)
              .setTint(unlocked ? 0xffffff : canUnlock ? 0x8899cc : 0x444466)
          );
        } catch (e) { console.warn(`[UIScene] Missing skill texture: skill-${skill.id}`); }

        const nameClr = unlocked ? '#88ff88' : canUnlock ? '#88aacc' : '#445566';
        this._pText(cx + 26, sy + 2,  skill.name, nameClr, 9);
        this._pText(cx + 26, sy + 14,
          skill.active ? `[${skill.active.cost}mp]` : '[passive]',
          skill.active ? '#5566aa' : '#446644', 8);
        this._pText(cx + 4, sy + 28, skill.description, '#556677', 8, colW - 8);

        if (unlocked) {
          this._pText(cx + colW - 10, sy + 42, '✓', '#44ff44', 10).setOrigin(1, 0);
        } else if (canUnlock) {
          const btn = this._pText(cx + colW - 10, sy + 40, '[UNLOCK]', '#ffd700', 9)
            .setOrigin(1, 0).setInteractive({ useHandCursor: true });
          btn.on('pointerdown', doUnlock);
        }
      });
    });
  }

  // ── Crafting Panel ──────────────────────────────────────────────────────────

  _renderPortraitCrafting(bx, by, PW, PH) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;

    // Materials
    this._pText(bx + 12, by, 'Materials in inventory:', '#778899', 11);
    const matCounts = {};
    for (const slot of gs.player.inventory) {
      if (slot && slot.type === ITEM_TYPE.MATERIAL) {
        matCounts[slot.id] = (matCounts[slot.id] ?? 0) + (slot.qty ?? 1);
      }
    }
    const matStr = Object.entries(matCounts)
      .map(([id, qty]) => `${ITEMS[id]?.name ?? id}: ${qty}`).join('   ') || 'None';
    this._pText(bx + 12, by + 15, matStr, '#aabbcc', 10, PW - 24);

    // Recipes
    this._pText(bx + 12, by + 33, '── Recipes ──', '#778899', 11);

    const recipes = getAvailableRecipes(gs.player);
    const ROW_H   = 36;
    recipes.forEach((recipe, i) => {
      const ry = by + 50 + i * ROW_H;
      if (ry + ROW_H > by + PH - 2) return; // overflow guard

      const bgClr = recipe.canCraft ? 0x1a2a1a : 0x070a0f;
      const bdClr = recipe.canCraft ? 0x44aa44 : 0x1e2d3a;
      this._pAdd(
        this.add.rectangle(bx + PW / 2, ry + ROW_H / 2, PW - 12, ROW_H - 2, bgClr)
          .setStrokeStyle(1, bdClr).setScrollFactor(0)
      );

      const ingStr = recipe.ingredients
        .map(ing => `${ITEMS[ing.id]?.name ?? ing.id}×${ing.qty}`).join(', ');
      const resStr = `→ ${ITEMS[recipe.result.id]?.name ?? recipe.result.id}`;
      this._pText(bx + 14, ry + 3,  recipe.name, recipe.canCraft ? '#88ff88' : '#445566', 11);
      this._pText(bx + 14, ry + 18, ingStr + '  ' + resStr, '#556677', 9, PW - 100);

      if (recipe.canCraft) {
        const btn = this._pText(bx + PW - 14, ry + 12, '[CRAFT]', '#ffd700', 11)
          .setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          const gs = this.scene.get(SCENE.GAME);
          if (gs) gs._tryCraft(recipe.id);
        });
      }
    });

    if (recipes.length === 0) {
      this._pText(bx + 12, by + 50, 'No recipes available yet.\nFind materials to unlock crafting.',
        '#445566', 11, PW - 24);
    }
  }

  // ── Character Panel ──────────────────────────────────────────────────────────

  _renderPortraitChar(bx, by, PW, PH) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs) return;
    const p = gs.player;
    const lines = [
      `Name:    ${p.name}`,
      `Level:   ${p.level}   (XP: ${p.xp} / ${p.xpToNext})`,
      ``,
      `HP:      ${p.stats.hp} / ${p.stats.maxHp}`,
      `Mana:    ${p.stats.mana} / ${p.stats.maxMana}`,
      `Gold:    ${p.gold}`,
      ``,
      `Attack:  ${p.stats.atk}  (base ${p.baseStats.atk} + equip/skills)`,
      `Defense: ${p.stats.def}  (base ${p.baseStats.def} + equip/skills)`,
      `Speed:   ${p.stats.spd}`,
      `Crit:    ${Math.round((p.stats.critChance ?? 0.05) * 100)}%`,
      `Dodge:   ${Math.round((p.stats.dodgeChance ?? 0) * 100)}%`,
      ``,
      `── Equipment ──`,
      `Weapon:  ${p.equipment.weapon?.name ?? 'None'}`,
      `Armor:   ${p.equipment.armor?.name  ?? 'None'}`,
      `Ring:    ${p.equipment.ring?.name   ?? 'None'}`,
      `Amulet:  ${p.equipment.amulet?.name ?? 'None'}`,
      ``,
      `── Skills Unlocked ──`,
      p.skills.size ? [...p.skills].join(', ') : 'None',
    ];
    this._pText(bx + 14, by + 4, lines.join('\n'), '#ccddee', 12, PW - 28)
      .setLineSpacing(3);
  }
}
