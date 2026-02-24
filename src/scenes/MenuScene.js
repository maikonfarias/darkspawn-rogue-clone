// ============================================================
//  Darkspawn Rogue Quest — Menu Scene
// ============================================================
import { SCENE, C } from '../data/Constants.js';
import { hasSave, saveTimestamp } from '../systems/SaveSystem.js';
import { Music } from '../systems/ProceduralMusic.js';
import { SFX } from '../systems/SoundEffects.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: SCENE.MENU }); }

  create() {
    const { width: W, height: H } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0a0a0f');

    // Animated background — small pixel particles
    this.particles = [];
    for (let i = 0; i < 80; i++) {
      const p = this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        2, 2,
        Phaser.Math.RND.pick([0x334466, 0x223355, 0x445577, 0x112233])
      );
      p.alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      p.vy = Phaser.Math.FloatBetween(0.2, 1.0);
      this.particles.push(p);
    }

    const portrait = !!window.PORTRAIT;
    const titleY   = portrait ? 60  : 80;
    const subtitleY = portrait ? 105 : 125;
    const loreY    = portrait ? 140 : 165;

    // Title
    this.add.text(W / 2, titleY, '⚔  DARKSPAWN ROGUE QUEST  ⚔', {
      fontFamily: 'Courier New, monospace',
      fontSize: portrait ? '22px' : '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, subtitleY, 'Explore · Battle · Survive', {
      fontFamily: 'Courier New, monospace',
      fontSize: portrait ? '13px' : '16px',
      color: '#88aacc',
    }).setOrigin(0.5);

    // Flavor text
    const lore = [
      'The ancient Dungeon Lord stirs beneath the earth.',
      'Ten floors of darkness stand between you and glory.',
      'Will you emerge victorious... or join the fallen?',
    ];
    lore.forEach((line, i) => {
      this.add.text(W / 2, loreY + i * (portrait ? 18 : 22), line, {
        fontFamily: 'Courier New, monospace',
        fontSize: portrait ? '11px' : '13px',
        color: '#556677',
        fontStyle: 'italic',
      }).setOrigin(0.5);
    });

    // Buttons
    const hasSaveFile = hasSave();
    const btnBaseY    = portrait ? H / 2 - 20 : H / 2;
    const btnOffset   = hasSaveFile ? (portrait ? 30 : 35) : 0;
    const btnFontSize = portrait ? '16px' : '20px';

    if (hasSaveFile) {
      const ts = saveTimestamp();
      this._makeButton(W / 2, btnBaseY - 30, '  [ CONTINUE ]  ', '#88ffcc', '#001a10', btnFontSize, () => {
        Music.stop(1.5);
        this.scene.start(SCENE.GAME, { loadSave: true });
        this.scene.launch(SCENE.UI);
      });
      if (ts) {
        this.add.text(W / 2, btnBaseY + 6, ts, {
          fontFamily: 'Courier New', fontSize: '11px', color: '#445544',
        }).setOrigin(0.5);
      }
    }

    this._makeButton(W / 2, btnBaseY + 30 + btnOffset, '  [ NEW GAME ]  ', '#ffd700', '#221100', btnFontSize, () => {
      Music.stop(1.5);
      this.scene.start(SCENE.GAME, { loadSave: false });
      this.scene.launch(SCENE.UI);
    });

    this._makeButton(W / 2, btnBaseY + 90 + btnOffset, '  [ HOW TO PLAY ]  ', '#88aacc', '#001122', btnFontSize, () => {
      this._showHelp();
    });

    // Controls reference (desktop only — shown as inline hint on portrait)
    if (!portrait) {
      const controls = [
        'MOVE: WASD / Arrow Keys    ATTACK: Bump into enemy',
        'PICK UP: G                 WAIT: . (period)',
        'USE STAIRS: > or <         INVENTORY: I',
        'SKILLS: K                  CRAFTING: C     CHAR: P',
      ];
      controls.forEach((line, i) => {
        this.add.text(W / 2, H - 100 + i * 18, line, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: '#445566',
        }).setOrigin(0.5);
      });
    } else {
      this.add.text(W / 2, H - 54, 'Use D-Pad or tap to move · Tap buttons to act', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#445566',
      }).setOrigin(0.5);
    }

    // Version
    this.add.text(8, H - 18, 'v1.0', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#334455'
    });

    // ── Audio toggle buttons (bottom-right) ─────────────────
    const mkAudioBtn = (x, y, labelFn, onClick) => {
      const btn = this.add.text(x, y, labelFn(), {
        fontFamily: 'Courier New', fontSize: '12px', color: '#556677',
        backgroundColor: '#0d1117', padding: { x: 8, y: 4 },
      }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor('#88aacc'));
      btn.on('pointerout',  () => btn.setColor('#556677'));
      btn.on('pointerdown', () => { onClick(); btn.setText(labelFn()); });
      return btn;
    };
    mkAudioBtn(W - 6,       H - 6, () => `♪ MUSIC: ${Music.isPlaying ? 'ON' : 'OFF'}`,
      () => { if (Music.isPlaying) Music.stop(0.5); else Music.play('menu'); });
    mkAudioBtn(W - 6 - 130, H - 6, () => `🔊 SFX: ${SFX.muted ? 'OFF' : 'ON'}`,
      () => { SFX.muted = !SFX.muted; });

    // Start ambient menu music on first pointer interaction
    // (required by browser autoplay policy)
    this.input.once('pointerdown', () => {
      if (!Music.isPlaying) Music.play('menu');
    });
    // Also try immediately in case the context was already unlocked
    Music.play('menu');
  }

  update() {
    const H = this.cameras.main.height;
    for (const p of this.particles) {
      p.y += p.vy;
      if (p.y > H + 4) p.y = -4;
    }
  }

  _makeButton(x, y, label, textColor, bgColor, fontSize, callback) {
    // Support old 5-arg signature (no fontSize)
    if (typeof fontSize === 'function') { callback = fontSize; fontSize = '20px'; }
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace',
      fontSize,
      color: textColor,
      backgroundColor: bgColor,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1.0));
    btn.on('pointerdown', callback);

    // Also support Enter key on first button
    if (label.includes('NEW')) {
      const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      enter.on('down', callback);
      const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      space.on('down', callback);
    }

    return btn;
  }

  _showHelp() {
    const { width: W, height: H } = this.cameras.main;

    // Dim overlay
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);

    // Panel — clamped to screen size for portrait mode
    const PW = Math.min(700, W - 16);
    const PH = Math.min(610, H - 16);
    const PX = W / 2 - PW / 2, PY = H / 2 - PH / 2;
    const panel = this.add.rectangle(W / 2, H / 2, PW, PH, 0x0a0a14, 0.98)
      .setStrokeStyle(2, 0x334466);

    const created = [overlay, panel];

    const tx = (x, y, str, color = '#ccddee', size = 12) => {
      const t = this.add.text(PX + x, PY + y, str, {
        fontFamily: 'Courier New', fontSize: `${size}px`, color,
      });
      created.push(t);
      return t;
    };

    const icon = (x, y, key) => {
      try {
        const img = this.add.image(PX + x, PY + y, key).setDisplaySize(18, 18).setOrigin(0, 0);
        created.push(img);
      } catch (_) { /* texture might not exist in menu context */ }
    };

    // ── Title ──────────────────────────────────────────────
    tx(PW / 2, 14, '⚔  HOW TO PLAY  ⚔', '#ffd700', 18).setOrigin(0.5, 0);
    tx(PW / 2, 38, 'Delve 10 floors deep and slay the Dungeon Lord', '#88aacc', 12).setOrigin(0.5, 0);

    const COL1 = 14, COL2 = PW / 2 + 8;
    let y = 68;

    // ─── Left column ────────────────────────────────────────
    tx(COL1, y, '── CONTROLS ──', '#ffd700', 11); y += 18;
    const controls = [
      ['WASD / Arrows', 'Move one tile'],
      ['Space / click tile', 'Pick up / stairs / wait'],
      ['Bump enemy',    'Attack'],
      ['G',             'Pick up item'],
      ['. (period)',    'Wait a turn'],
      ['> / <',         'Use stairs'],
      ['I',             'Inventory'],
      ['K',             'Skill tree'],
      ['C',             'Crafting'],
      ['P',             'Character'],
      ['M',             'Toggle minimap'],
      ['Click tile',    'Walk to location'],
      ['Click adj. foe','Attack (orthogonal)'],
      ['Esc',           'Close panel / Pause'],
    ];
    for (const [key, desc] of controls) {
      tx(COL1,      y, key,  '#ffdd88', 11);
      tx(COL1 + 112, y, desc, '#99aabb', 11);
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
    ];
    for (const tip of tips) {
      tx(COL1, y, '• ' + tip, '#778899', 11);
      y += 15;
    }

    // ─── Right column — tile & item legend ──────────────────
    let ry = 68;
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
    // Trap: no separate texture — rendered as tinted floor at runtime
    const trapDot = this.add.rectangle(PX + COL2 + 9, PY + ry + 9, 18, 18, 0xff4444, 0.7);
    created.push(trapDot);
    tx(COL2 + 24, ry + 3, 'Trap  — watch your step!', '#99aabb', 11);
    ry += 20;

    ry += 4;
    tx(COL2, ry, '── ENTITY LEGEND ──', '#ffd700', 11); ry += 18;
    const entities = [
      ['player',           '#00ff88', 'You'],
      ['monster-goblin',   '#44dd44', 'Monster'],
      [null,               '#ffd700', 'Item / Gold on floor'],
      [null,               '#ff3333', 'Monster (minimap)'],
    ];
    for (const [key, color, desc] of entities) {
      if (key) {
        icon(COL2, ry, key);
      } else {
        const dot = this.add.rectangle(PX + COL2 + 9, PY + ry + 9, 14, 14, parseInt(color.replace('#',''), 16), 1);
        created.push(dot);
      }
      tx(COL2 + 24, ry + 3, desc, '#99aabb', 11);
      ry += 20;
    }

    ry += 4;
    tx(COL2, ry, '── ITEM TYPES ──', '#ffd700', 11); ry += 18;
    const items = [
      ['item-weapon',   'Weapon  — equip for ATK'],
      ['item-armor',    'Armor   — equip for DEF'],
      ['item-ring',     'Ring    — equip for bonus'],
      ['item-amulet',   'Amulet  — equip for bonus'],
      ['item-potion',   'Potion  — consumable'],
      ['item-scroll',   'Scroll  — magical effect'],
      ['item-material', 'Material — used in crafting'],
      ['item-gold',     'Gold    — currency'],
    ];
    for (const [key, desc] of items) {
      icon(COL2, ry, key);
      tx(COL2 + 24, ry + 3, desc, '#99aabb', 11);
      ry += 20;
    }

    // ── Close hint ──────────────────────────────────────────
    tx(PW / 2, PH - 22, '[ Press any key or click to close ]', '#334455', 11).setOrigin(0.5, 0);

    const close = () => { for (const o of created) o.destroy(); };

    // Defer by one frame so the click that opened the panel
    // doesn't immediately trigger the close listener.
    this.time.delayedCall(0, () => {
      this.input.keyboard.once('keydown', close);
      this.input.once('pointerdown', close);
    });
  }
}
