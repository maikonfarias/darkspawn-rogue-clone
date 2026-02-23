// ============================================================
//  Darkspawn Rogue Quest — Game Over / Victory Scene
// ============================================================
import { SCENE, C } from '../data/Constants.js';
import { Music } from '../systems/ProceduralMusic.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENE.GAMEOVER }); }

  init(data) {
    this.data_in = data ?? {};
  }

  create() {
    const { width: W, height: H } = this.cameras.main;
    this.cameras.main.setBackgroundColor('#0a0a0f');
    // Ensure music is stopped (covers edge cases)
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

    this._makeBtn(W / 2, H / 2 + 140, '  PLAY AGAIN  ', '#ffd700');
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

    this._makeBtn(W / 2, H / 2 + 140, '  TRY AGAIN  ', '#ff8888');
  }

  _makeBtn(x, y, label, color) {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Courier New', fontSize: '22px', color,
      backgroundColor: '#111122', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1.0));
    btn.on('pointerdown', () => {
      this.scene.stop(SCENE.GAMEOVER);
      this.scene.start(SCENE.MENU);
    });

    this.input.keyboard.once('keydown', () => {
      this.scene.stop(SCENE.GAMEOVER);
      this.scene.start(SCENE.MENU);
    });
  }
}
