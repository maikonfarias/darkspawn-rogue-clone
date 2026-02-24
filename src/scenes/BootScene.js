// ============================================================
//  Darkspawn Rogue Quest — Boot Scene
//  Generates all procedural textures and transitions to Menu
// ============================================================
import { SCENE } from '../data/Constants.js';
import { generateAllTextures } from '../utils/TextureGenerator.js';
import { Settings } from '../systems/Settings.js';
import { Music } from '../systems/ProceduralMusic.js';
import { SFX } from '../systems/SoundEffects.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENE.BOOT }); }

  create() {
    // Load and apply persisted audio settings before anything else
    Settings.load();
    Settings.apply(Music, SFX);

    // White background while generating
    this.cameras.main.setBackgroundColor('#0a0a0f');

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const loading = this.add.text(w / 2, h / 2 - 20, 'Generating world textures...', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#88aaff',
    }).setOrigin(0.5);

    // Generate all textures
    generateAllTextures(this);

    loading.setText('✓ Textures ready — entering the dungeon...');
    loading.setColor('#44ff88');

    this.time.delayedCall(600, () => {
      this.scene.start(SCENE.MENU);
    });
  }
}
