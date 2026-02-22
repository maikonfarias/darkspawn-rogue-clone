// ============================================================
//  Darkspawn Rogue Quest — Entry Point
// ============================================================
import Phaser from 'phaser';
import { BootScene }    from './scenes/BootScene.js';
import { MenuScene }    from './scenes/MenuScene.js';
import { GameScene }    from './scenes/GameScene.js';
import { UIScene }      from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width:  1024,
  height: 700,
  backgroundColor: '#0a0a0f',
  parent: 'game-container',
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene,
    GameOverScene,
  ],
  pixelArt: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Expose for debugging
window.game = game;
