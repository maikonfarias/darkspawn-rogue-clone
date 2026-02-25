// ============================================================
//  Darkspawn Rogue Quest — Game Over / Victory Scene
// ============================================================
import { SCENE, C } from '../data/Constants.js';
import { Music } from '../systems/ProceduralMusic.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENE.GAMEOVER }); }

  init(data) {
    this.data_in = data ?? {};
    this._btns           = [];   // [{ obj, action }]
    this._selIdx         = 0;
    this._controllerMode = false;
    this._padPrevNav     = { up: false, down: false, a: false };
    this._padNavHeldSince   = null;
    this._padNavLastRepeat  = 0;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0a0a0f');
    Music.stop(1.5);

    const won   = this.data_in.won   ?? false;
    const floor = this.data_in.floor ?? 1;
    const level = this.data_in.level ?? 1;
    const gold  = this.data_in.gold  ?? 0;

    // Background particles
    for (let i = 0; i < 60; i++) {
      const p = this.add.rectangle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        2, 2, won ? 0xffd700 : 0x441111
      ).setAlpha(Phaser.Math.FloatBetween(0.1, 0.6));
      this.tweens.add({
        targets: p,
        y: won ? '-=200' : '+=200',
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    }

    if (won) {
      this._renderVictory(W, H, floor, level, gold);
    } else {
      this._renderDeath(W, H, floor, level, gold);
    }

    // Gamepad cursor ► (hidden until controller used)
    this._cursor = this.add.text(0, 0, '►', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(10).setVisible(false);

    // Ⓐ hint
    this._padHint = this.add.text(W / 2, H - 30, '\u24b6  CONFIRM', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#00ff88',
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    // Deactivate controller mode on mouse/keyboard
    this.input.on('pointermove',  () => this._deactivateControllerMode());
    this.input.on('pointerdown',  () => this._deactivateControllerMode());
    this.input.keyboard.on('keydown', (e) => {
      this._deactivateControllerMode();
      if (this._btns.length > 0) { this._btns[0].action(); }
    });

    this._updateSel(0);
  }

  update() {
    if (!this._btns.length) return;
    const gp = this.input.gamepad;
    if (!gp || gp.total === 0) return;

    const DEAD = 0.4;
    let navUp = false, navDown = false, navA = false;
    for (const pad of gp.gamepads) {
      if (!pad) continue;
      const sy = pad.leftStick?.y ?? pad.axes[1]?.value ?? 0;
      if (pad.buttons[12]?.pressed || sy < -DEAD) navUp   = true;
      if (pad.buttons[13]?.pressed || sy >  DEAD) navDown = true;
      if (pad.buttons[0]?.pressed) navA = true;
    }

    const anyInput = navUp || navDown || navA;
    const prev = this._padPrevNav;
    const now  = Date.now();

    if (anyInput && !this._controllerMode) {
      this._activateControllerMode();
      this._padPrevNav = { up: navUp, down: navDown, a: navA };
      return;
    }
    if (!this._controllerMode) {
      this._padPrevNav = { up: navUp, down: navDown, a: navA };
      return;
    }

    // D-pad / stick navigation
    const justUp   = navUp   && !prev.up;
    const justDown = navDown && !prev.down;
    if (!navUp && !navDown) this._padNavHeldSince = null;

    let doNav = false;
    if (justUp || justDown) { this._padNavHeldSince = now; doNav = true; }
    else if ((navUp || navDown) && this._padNavHeldSince !== null) {
      const held = now - this._padNavHeldSince;
      if (held >= 380 && now - this._padNavLastRepeat >= 160) doNav = true;
    }

    if (doNav) {
      this._padNavLastRepeat = now;
      const dir  = navUp ? -1 : 1;
      this._updateSel((this._selIdx + dir + this._btns.length) % this._btns.length);
    }

    if (navA && !prev.a) this._btns[this._selIdx]?.action();

    this._padPrevNav = { up: navUp, down: navDown, a: navA };
  }

  _activateControllerMode() {
    if (this._controllerMode) return;
    this._controllerMode = true;
    this._updateSel(this._selIdx);
    if (this._padHint) this._padHint.setVisible(true);
  }

  _deactivateControllerMode() {
    if (!this._controllerMode) return;
    this._controllerMode = false;
    this._btns.forEach(b => b.obj.setAlpha(1.0));
    if (this._cursor)  this._cursor.setVisible(false);
    if (this._padHint) this._padHint.setVisible(false);
  }

  _updateSel(idx) {
    this._selIdx = idx;
    if (!this._controllerMode) return;
    this._btns.forEach((b, i) => b.obj.setAlpha(i === idx ? 1.0 : 0.45));
    const sel = this._btns[idx];
    if (sel && this._cursor) {
      this._cursor
        .setPosition(sel.obj.x - sel.obj.displayWidth / 2 - 10, sel.obj.y)
        .setVisible(true);
    }
  }

  _renderVictory(W, H, floor, level, gold) {
    this.add.text(W / 2, H / 2 - 140, '🏆', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 70, 'VICTORY!', {
      fontFamily: 'Courier New', fontSize: '48px', color: '#ffd700',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 10,
      'You defeated the Dungeon Lord and claimed\nthe ancient treasure of Darkspawn!', {
        fontFamily: 'Courier New', fontSize: '16px', color: '#ccddee', align: 'center'
      }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 50, [
      `Floor Reached:  ${floor}`,
      `Final Level:    ${level}`,
      `Gold Collected: ${gold}`,
    ].join('\n'), {
      fontFamily: 'Courier New', fontSize: '15px', color: '#88aacc', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    this._makeBtn(W / 2, H / 2 + 140, '  PLAY AGAIN  ', '#ffd700', () => {
      this.scene.stop(SCENE.GAMEOVER);
      this.scene.start(SCENE.MENU);
    });
  }

  _renderDeath(W, H, floor, level, gold) {
    this.add.text(W / 2, H / 2 - 140, '💀', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 70, 'YOU DIED', {
      fontFamily: 'Courier New', fontSize: '48px', color: '#ff4444',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 10,
      'The darkness claimed you.\nYour bones join the countless others...', {
        fontFamily: 'Courier New', fontSize: '16px', color: '#998877', align: 'center'
      }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 50, [
      `Reached Floor:  ${floor} / 10`,
      `Final Level:    ${level}`,
      `Gold Collected: ${gold}`,
    ].join('\n'), {
      fontFamily: 'Courier New', fontSize: '15px', color: '#667788', align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    const cp = this.data_in.checkpoint;
    if (cp) {
      this._makeBtn(W / 2, H / 2 + 120, '  RETRY FLOOR  ', '#88ffaa', () => {
        this.scene.stop(SCENE.GAMEOVER);
        this.scene.start(SCENE.GAME, { checkpoint: cp });
        this.scene.launch(SCENE.UI);
      });
      this._makeBtn(W / 2, H / 2 + 185, '  TRY AGAIN  ', '#ff8888', () => {
        this.scene.stop(SCENE.GAMEOVER);
        this.scene.start(SCENE.MENU);
      });
    } else {
      this._makeBtn(W / 2, H / 2 + 140, '  TRY AGAIN  ', '#ff8888', () => {
        this.scene.stop(SCENE.GAMEOVER);
        this.scene.start(SCENE.MENU);
      });
    }
  }

  _makeBtn(x, y, label, color, action) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Courier New', fontSize: '22px', color,
      backgroundColor: '#111122', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { if (!this._controllerMode) btn.setAlpha(0.8); });
    btn.on('pointerout',  () => { if (!this._controllerMode) btn.setAlpha(1.0); });
    btn.on('pointerdown', () => action());

    this._btns.push({ obj: btn, action });
  }
}
