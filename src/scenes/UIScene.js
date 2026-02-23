// ============================================================
//  Darkspawn Rogue Quest — UI Scene (HUD overlay)
//  Runs in parallel with GameScene
// ============================================================
import { SCENE, EV, C, VIS, TILE, MAP_W, MAP_H } from '../data/Constants.js';
import { XP_TABLE } from '../data/Constants.js';
import { SKILL_BY_ID } from '../data/SkillData.js';
import { saveGame } from '../systems/SaveSystem.js';
import { Music } from '../systems/ProceduralMusic.js';
import { SFX } from '../systems/SoundEffects.js';

const ACTIVE_SKILL_ORDER = ['berserkerRage','whirlwind','shadowStep','deathMark','magicBolt','fireball','iceNova','arcaneShield'];
const TARGETABLE_SKILLS  = new Set(['magicBolt','fireball','shadowStep','deathMark']);

const MM_SCALE = 2;   // pixels per tile on minimap
const MM_X    = 6;    // minimap top-left X
const MM_Y    = 6;    // minimap top-left Y
const MM_W    = MAP_W * MM_SCALE;  // 160
const MM_H    = MAP_H * MM_SCALE;  // 100

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

    this.bus.on(EV.STATS_CHANGED,  () => this._refreshStats());
    this.bus.on(EV.LOG_MSG,        (msg) => this._addLog(msg));
    this.bus.on(EV.FLOOR_CHANGED,  ({ floor }) => { this._refreshFloor(floor); this._updateMinimap(); });
    this.bus.on(EV.MINIMAP_UPDATE, () => this._updateMinimap());
    this.bus.on(EV.PAUSE_GAME,     () => this._openPauseMenu());
    this.bus.on(EV.RESUME_GAME,    () => this._closePauseMenu());
    this.bus.on(EV.STATS_CHANGED,  () => this._refreshInventory());
    this.bus.on(EV.STATS_CHANGED,  () => this._refreshSkillHotbar());
    this.bus.on('skill-selection-done', () => this._clearSkillSelection());

    // Toggle minimap with M key
    this.input.keyboard.on('keydown-M', () => this._toggleMinimap());
    // Skill hotkeys 1–8
    this.input.keyboard.on('keydown', (event) => {
      if (event.key >= '1' && event.key <= '8') {
        const idx = parseInt(event.key) - 1;
        const skillId = this._hotbarSkills?.[idx];
        if (skillId) this._useHotbarSkill(skillId);
      }
    });

    this._refreshStats();
    this._refreshInventory();
  }

  _buildHUD() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Top-right stats panel ───────────────────────────────
    const PW = 210, PH = 310;
    const PX = W - PW - 6, PY = 6;

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

    // Stats
    tx(8, 136, '──── Stats ────', '#445566', 11);
    this.atkText  = tx(8, 150, 'ATK:  5', '#ffaa44', 12);
    this.defText  = tx(8, 164, 'DEF:  2', '#88ccff', 12);
    this.spdText  = tx(8, 178, 'SPD:  4', '#ffff88', 12);
    this.goldText = tx(8, 192, 'Gold: 0', '#ffd700', 12);

    // Equipment
    tx(8, 210, '── Equipment ──', '#445566', 11);
    this.equipWpn = tx(8, 224, 'WPN: Fists', '#cccccc', 11);
    this.equipArm = tx(8, 236, 'ARM: Rags',  '#cccccc', 11);
    this.equipRng = tx(8, 248, 'RNG: None',  '#cccccc', 11);
    this.equipAmu = tx(8, 260, 'AMU: None',  '#cccccc', 11);

    // Controls hint
    tx(8, 280, '[K]kills [C]raft [P]char [I]detail', '#334455', 10);
    tx(8, 292, 'WASD  [M]ap  1–8:skills  [Space]=act', '#334455', 10);

    // ── Always-visible Inventory (below stats panel) ─────────
    this._buildInvPanel(W, PX, PY + PH);

    // ── Skill Hotbar (above log, bottom-centre) ───────────────
    this._buildSkillHotbar(W, H);

    // ── Minimap (top-left) ────────────────────────────────────
    this._buildMinimap();

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

    // ── Pause button (top-centre) ────────────────────────────
    const pauseBtn = this.add.text(W / 2, 8, '[ ❚❚ PAUSE ]', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88aacc',
      backgroundColor: '#0d1117', padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(5);
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffd700'));
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#88aacc'));
    pauseBtn.on('pointerdown', () => this.bus.emit(EV.PAUSE_GAME));
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

    this._refreshSkillHotbar();
  }

  _refreshSkillHotbar() {
    // Destroy previous slot visuals
    if (this._hotbarSlotObjects) {
      for (const o of this._hotbarSlotObjects) { try { o.destroy(); } catch (_) {} }
    }
    this._hotbarSlotObjects = [];
    this._hotbarSkills = [];

    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player || !this._hotbarSZ) return;

    const unlocked = ACTIVE_SKILL_ORDER.filter(id => gs.player.skills.has(id));
    this._hotbarSkills = unlocked;
    if (unlocked.length === 0) return;

    const SZ = this._hotbarSZ, GAP = this._hotbarGAP;
    const totalW = unlocked.length * (SZ + GAP) - GAP;
    const startX = (this._hotbarW - totalW) / 2;
    const HB_Y   = this._hotbarY;

    unlocked.forEach((skillId, i) => {
      const sx = startX + i * (SZ + GAP);
      const mana     = SKILL_BY_ID[skillId]?.active?.cost ?? 0;
      const hasMana  = gs.player.stats.mana >= mana;

      const isSelected = this._selectedSkillId === skillId;
      const bg = this.add.rectangle(sx + SZ / 2, HB_Y + SZ / 2, SZ, SZ,
        isSelected ? 0x0d2210 : (hasMana ? 0x161622 : 0x160808), 1)
        .setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0x00cc44 : (hasMana ? 0x4455aa : 0x552222))
        .setScrollFactor(0).setDepth(4).setInteractive({ useHandCursor: true });

      const icon = this.add.image(sx + SZ / 2, HB_Y + SZ / 2 - 5, `skill-${skillId}`)
        .setDisplaySize(28, 28).setScrollFactor(0).setDepth(5);
      if (!hasMana) icon.setTint(0x333333);

      // Green inner-border when selected
      if (isSelected) {
        const sel = this.add.rectangle(sx + SZ / 2, HB_Y + SZ / 2, SZ - 6, SZ - 6, 0x000000, 0)
          .setStrokeStyle(2, 0x00ff66).setScrollFactor(0).setDepth(5.5);
        this._hotbarSlotObjects.push(sel);
      }

      const numLbl = this.add.text(sx + 3, HB_Y + 2, `${i + 1}`, {
        fontFamily: 'Courier New', fontSize: '9px', color: '#6677bb',
      }).setScrollFactor(0).setDepth(5);

      const costLbl = this.add.text(sx + SZ / 2, HB_Y + SZ - 4, `${mana}mp`, {
        fontFamily: 'Courier New', fontSize: '8px',
        color: hasMana ? '#5566cc' : '#663333',
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(5);

      bg.on('pointerover', () => bg.setFillStyle(isSelected ? 0x113318 : (hasMana ? 0x222233 : 0x210d0d)));
      bg.on('pointerout',  () => bg.setFillStyle(isSelected ? 0x0d2210 : (hasMana ? 0x161622 : 0x160808)));
      bg.on('pointerdown', () => this._useHotbarSkill(skillId));

      // Tooltip on hover
      const def = SKILL_BY_ID[skillId];
      bg.on('pointerover', () => {
        bg.setFillStyle(hasMana ? 0x222233 : 0x210d0d);
        this.bus.emit(EV.LOG_MSG, { text: `[${i+1}] ${def.name} (${mana}mp) — ${def.description}`, color: '#8899cc' });
      });

      this._hotbarSlotObjects.push(bg, icon, numLbl, costLbl);
    });
  }

  _clearSkillSelection() {
    this._selectedSkillId = null;
    this._refreshSkillHotbar();
  }

  _useHotbarSkill(skillId) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs || gs.gamePaused || gs.activePanel !== 0) return;

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

    // Title
    this.add.text(IX + PW / 2, IY + 4, '─ BAG ─', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#445566',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(4);

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

      const slot = { bg, icon, qty, index: i, _selectedOnce: false };
      this._invSlots.push(slot);

      bg.on('pointerover', () => { if (slot._item) bg.setFillStyle(0x223344); });
      bg.on('pointerout',  () => bg.setFillStyle(slot._item ? 0x1e2a3a : 0x111118));
      bg.on('pointerdown', () => this._onInvSlotClick(slot));
    }
  }

  _refreshInventory() {
    if (!this._invSlots) return;
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    const inv = gs.player.inventory;

    for (const slot of this._invSlots) {
      const item = inv[slot.index];
      slot._item = item;
      slot._selectedOnce = false;

      if (item) {
        slot.bg.setFillStyle(0x1e2a3a).setStrokeStyle(1, 0x334466);
        slot.icon.setTexture(`item-${item.id ?? item.type}`).setVisible(true);
        slot.qty.setText(item.qty > 1 ? String(item.qty) : '');
      } else {
        slot.bg.setFillStyle(0x111118).setStrokeStyle(1, 0x223344);
        slot.icon.setVisible(false);
        slot.qty.setText('');
      }    }
  }

  _onInvSlotClick(slot) {
    const gs = this.scene.get(SCENE.GAME);
    if (!gs?.player) return;
    if (gs.gamePaused || gs.activePanel !== 0) return; // PANEL.NONE = 0
    const item = slot._item;
    if (!item) return;

    if (!slot._selectedOnce) {
      // First click: show info + green selection border
      slot._selectedOnce = true;
      slot.bg.setFillStyle(0x0d2210).setStrokeStyle(2, 0x00cc44);
      // Reset all other slots
      for (const s of this._invSlots) {
        if (s !== slot && s._selectedOnce) {
          s._selectedOnce = false;
          s.bg.setFillStyle(s._item ? 0x1e2a3a : 0x111118)
             .setStrokeStyle(1, s._item ? 0x334466 : 0x223344);
        }
      }
      let info = `${item.name}`;
      if (item.atk)      info += ` | ATK+${item.atk}`;
      if (item.def)      info += ` | DEF+${item.def}`;
      if (item.hpBonus)  info += ` | HP+${item.hpBonus}`;
      if (item.effect?.heal) info += ` | Heal ${item.effect.heal}`;
      info += ' — click again to use';
      this.bus.emit(EV.LOG_MSG, { text: info, color: '#88aacc' });
    } else {
      // Second click: use / equip
      slot._selectedOnce = false;
      slot.bg.setFillStyle(0x1e2a3a).setStrokeStyle(1, 0x334466);
      if (item.type === 'potion')   SFX.play('potion');
      else if (item.type === 'gold') SFX.play('coin');
      else SFX.play('equip');
      const result = gs.player.useItem(slot.index);
      if (result?.scrollEffect) gs._applyScrollEffect(result.scrollEffect);
      if (result) gs._endPlayerTurn?.();
      this._refreshInventory();
    }
  }

  // ── Minimap ─────────────────────────────────────────────

  _buildMinimap() {
    // Background panel
    this.mmBg = this.add.rectangle(
      MM_X + MM_W / 2, MM_Y + MM_H / 2,
      MM_W + 4, MM_H + 4,
      0x0d1117, 0.88
    ).setStrokeStyle(1, 0x334466).setScrollFactor(0).setDepth(10);

    // Title label
    this.mmLabel = this.add.text(MM_X, MM_Y - 12, '[ MINIMAP — M to toggle ]', {
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
    const ox  = MM_X;
    const oy  = MM_Y;

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
          if (t === TILE.WALL)          color = 0x1a2233;
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

    // Equipment
    this.equipWpn?.setText(`WPN: ${p.equipment.weapon?.name ?? 'None'}`);
    this.equipArm?.setText(`ARM: ${p.equipment.armor?.name  ?? 'None'}`);
    this.equipRng?.setText(`RNG: ${p.equipment.ring?.name   ?? 'None'}`);
    this.equipAmu?.setText(`AMU: ${p.equipment.amulet?.name ?? 'None'}`);
  }

  _refreshFloor(floor) {
    this.floorText?.setText(`Floor: ${floor}`);
  }

  _addLog({ text, color = '#ccddee' }) {
    this.logMessages.unshift({ text, color });
    if (this.logMessages.length > 10) this.logMessages.pop();

    for (let i = 0; i < this.logLines.length; i++) {
      const msg = this.logMessages[i];
      if (msg) {
        this.logLines[i].setText(msg.text).setColor(msg.color);
        this.logLines[i].setAlpha(1 - i * 0.22);
      } else {
        this.logLines[i].setText('');
      }
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
    const PW = 380, PH = 400;
    add(this.add.rectangle(W / 2, H / 2, PW, PH, 0x0a0a14, 0.97)
      .setScrollFactor(0).setDepth(51).setStrokeStyle(2, 0x334466));

    add(this.add.text(W / 2, H / 2 - 138, '❚❚  PAUSED', {
      fontFamily: 'Courier New', fontSize: '26px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(52));

    const mkBtn = (label, y, color, cb) => {
      const btn = add(this.add.text(W / 2, y, label, {
        fontFamily: 'Courier New', fontSize: '18px', color,
        backgroundColor: '#111122', padding: { x: 22, y: 9 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(52).setInteractive({ useHandCursor: true }));
      btn.on('pointerover', () => btn.setAlpha(0.75));
      btn.on('pointerout',  () => btn.setAlpha(1));
      btn.on('pointerdown', cb);
      return btn;
    };

    mkBtn('[ CONTINUE ]',    H / 2 - 50, '#44ff88', () => this.bus.emit(EV.RESUME_GAME));
    mkBtn('[ SAVE GAME ]',   H / 2 + 10, '#ffd700', () => {
      const gs = this.scene.get(SCENE.GAME);
      const ok = saveGame(gs);
      this.bus.emit(EV.LOG_MSG, {
        text: ok ? '💾 Game saved!' : '⚠ Save failed.',
        color: ok ? '#88ffcc' : '#ff8888',
      });
      this.bus.emit(EV.RESUME_GAME);
    });
    mkBtn('[ HOW TO PLAY ]', H / 2 + 70, '#88aaff', () => this._showInstructions());
    mkBtn('[ MAIN MENU ]',   H / 2 + 130, '#ff8888', () => {
      this.bus.emit(EV.RESUME_GAME);
      this.scene.stop(SCENE.UI);
      this.scene.stop(SCENE.GAME);
      this.scene.start(SCENE.MENU);
    });

    // ── Audio toggles ────────────────────────────────────────
    add(this.add.text(W / 2, H / 2 + 188, '── Audio ──', {
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
    mkToggle('♪ MUSIC: ', W / 2 - 72, () => Music.isPlaying,
      () => { if (Music.isPlaying) Music.stop(0.5); else Music.play('shallow'); });
    mkToggle('🔊 SFX: ',  W / 2 + 72, () => !SFX.muted,
      () => { SFX.muted = !SFX.muted; });

    // Escape key resumes
    this._pauseEscHandler = () => this.bus.emit(EV.RESUME_GAME);
    this.input.keyboard.on('keydown-ESC', this._pauseEscHandler);

    this._pauseItems = items;
  }

  _closePauseMenu() {
    if (!this._pauseItems) return;
    for (const o of this._pauseItems) o.destroy();
    this._pauseItems = null;
    if (this._pauseEscHandler) {
      this.input.keyboard.off('keydown-ESC', this._pauseEscHandler);
      this._pauseEscHandler = null;
    }
  }

  _showInstructions() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const items = [];
    const add = (o) => { items.push(o); return o; };

    // Overlay on top of pause menu
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(60).setInteractive());

    const PW = 860, PH = 640;
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
    const close = () => { for (const o of items) o.destroy(); };
    closeBtn.on('pointerdown', close);
    this.time.delayedCall(0, () => {
      this.input.keyboard.once('keydown-ESC', close);
    });
  }
}
