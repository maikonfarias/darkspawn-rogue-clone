// ============================================================
//  Darkspawn Rogue Quest — Menu Scene
// ============================================================
import { SCENE, C } from '../data/Constants.js';

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

    // Title
    this.add.text(W / 2, 80, '⚔  DARKSPAWN ROGUE QUEST  ⚔', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 125, 'Explore · Battle · Survive', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#88aacc',
    }).setOrigin(0.5);

    // Flavor text
    const lore = [
      'The ancient Dungeon Lord stirs beneath the earth.',
      'Ten floors of darkness stand between you and glory.',
      'Will you emerge victorious... or join the fallen?',
    ];
    lore.forEach((line, i) => {
      this.add.text(W / 2, 165 + i * 22, line, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#556677',
        fontStyle: 'italic',
      }).setOrigin(0.5);
    });

    // Buttons
    this._makeButton(W / 2, H / 2 + 30, '  [ NEW GAME ]  ', '#ffd700', '#221100', () => {
      this.scene.start(SCENE.GAME);
      this.scene.launch(SCENE.UI);
    });

    this._makeButton(W / 2, H / 2 + 90, '  [ HOW TO PLAY ]  ', '#88aacc', '#001122', () => {
      this._showHelp();
    });

    // Controls reference (always visible)
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

    // Version
    this.add.text(8, H - 18, 'v1.0', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#334455'
    });
  }

  update() {
    const H = this.cameras.main.height;
    for (const p of this.particles) {
      p.y += p.vy;
      if (p.y > H + 4) p.y = -4;
    }
  }

  _makeButton(x, y, label, textColor, bgColor, callback) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
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
    const panel = this.add.rectangle(W / 2, H / 2, 520, 380, 0x0d1117, 0.96)
      .setStrokeStyle(2, 0x334466);

    const helpText = [
      '═══════════════  HOW TO PLAY  ═══════════════',
      '',
      'You are a hero delving into a cursed dungeon.',
      'Reach floor 10 and defeat the Dungeon Lord!',
      '',
      '── MOVEMENT ──',
      'WASD / Arrow keys to move. Bump enemies to attack.',
      'Press > on stairs to descend, < to ascend.',
      '',
      '── ITEMS ──',
      'Press G to pick up items. Press I for inventory.',
      'Click items to use/equip them.',
      '',
      '── SKILLS ──',
      'Press K to open the skill tree (after leveling up).',
      'Three paths: Warrior, Rogue, and Mage.',
      '',
      '── CRAFTING ──',
      'Press C to craft items from materials you find.',
      '',
      '══ PRESS ANY KEY TO CLOSE ══',
    ];

    const txt = this.add.text(W / 2, H / 2, helpText.join('\n'), {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#ccddee',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown', () => {
      panel.destroy(); txt.destroy();
    });
    this.input.once('pointerdown', () => {
      panel.destroy(); txt.destroy();
    });
  }
}
