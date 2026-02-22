// ============================================================
//  Darkspawn Rogue Quest — UI Scene (HUD overlay)
//  Runs in parallel with GameScene
// ============================================================
import { SCENE, EV, C, VIS, TILE, MAP_W, MAP_H } from '../data/Constants.js';
import { XP_TABLE } from '../data/Constants.js';

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

    // Toggle minimap with M key
    this.input.keyboard.on('keydown-M', () => this._toggleMinimap());
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
    tx(8, 280, '[I]nv [K]ill [C]raft [P]', '#334455', 10);
    tx(8, 292, 'WASD/Arrows  [M]inimap', '#334455', 10);

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
}
