// ============================================================
//  Darkspawn Rogue Quest — Entry Point
// ============================================================
import Phaser from 'phaser';
import { BootScene }    from './scenes/BootScene.js';
import { MenuScene }    from './scenes/MenuScene.js';
import { GameScene }    from './scenes/GameScene.js';
import { UIScene }      from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { Music }        from './systems/ProceduralMusic.js';
import { SFX }          from './systems/SoundEffects.js';

// Pause/resume all audio when the browser tab loses/gains focus
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Music.suspend();
    SFX.suspend();
  } else {
    Music.resume();
    SFX.resume();
  }
});

// Detect portrait / mobile — used by scenes to adapt their layouts
const _ua = navigator.userAgent;
const _isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(_ua);
const _isPortraitWindow = window.innerHeight > window.innerWidth;
window.PORTRAIT = _isMobileUA || _isPortraitWindow || window.innerWidth < 600;

const config = {
  type: Phaser.AUTO,
  width:  window.PORTRAIT ? 480 : 1024,
  height: window.PORTRAIT ? 854 : 700,
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
  input: {
    activePointers: 4,
  },
};

const game = new Phaser.Game(config);

// Expose for debugging
window.game = game;
