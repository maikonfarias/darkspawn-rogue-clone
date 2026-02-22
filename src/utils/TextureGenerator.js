// ============================================================
//  Darkspawn Rogue Quest — Procedural Texture Generator
// ============================================================
// Generates all game textures programmatically using Phaser Graphics
// so zero external image assets are required.

import { TILE_SIZE, C } from '../data/Constants.js';

const T = TILE_SIZE; // shorthand

/**
 * Draw a filled rect of pixels (simulated pixel art on graphics object).
 * px/py are in "pixel art" coordinates (1 unit = T/16 real pixels).
 */
function px(g, color, px, py, pw, ph) {
  const s = T / 16;
  g.fillStyle(color, 1);
  g.fillRect(px * s, py * s, pw * s, ph * s);
}

// ── Tile Textures (32×32) ─────────────────────────────────────

function genWall(scene) {
  const g = scene.make.graphics({ add: false });
  // Base stone
  g.fillStyle(0x334455, 1); g.fillRect(0, 0, T, T);
  // Brick mortar lines
  g.fillStyle(0x223344, 1);
  g.fillRect(0, 7, T, 2);
  g.fillRect(0, 15, T, 2);
  g.fillRect(0, 23, T, 2);
  // Brick separation (staggered)
  g.fillRect(15, 0, 2, 7);
  g.fillRect(7, 9, 2, 6);
  g.fillRect(20, 9, 2, 6);
  g.fillRect(10, 17, 2, 6);
  g.fillRect(22, 17, 2, 6);
  // Slight highlight top-left
  g.fillStyle(0x4a5f75, 1);
  g.fillRect(1, 1, T - 2, 1);
  g.fillRect(1, 1, 1, T - 2);
  g.generateTexture('tile-wall', T, T);
  g.destroy();
}

function genFloor(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x14141e, 1); g.fillRect(0, 0, T, T);
  // subtle stone grain
  g.fillStyle(0x1c1c28, 1);
  g.fillRect(4, 4, 8, 2);
  g.fillRect(18, 10, 6, 2);
  g.fillRect(8, 20, 10, 2);
  g.fillRect(22, 26, 5, 2);
  g.fillStyle(0x0e0e18, 1);
  g.fillRect(0, 0, T, 1);
  g.fillRect(0, 0, 1, T);
  g.generateTexture('tile-floor', T, T);
  g.destroy();
}

function genDoor(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x6b3a1f, 1); g.fillRect(0, 0, T, T);
  // Wood planks
  g.fillStyle(0x7d4a28, 1);
  g.fillRect(2, 2, T - 4, 8);
  g.fillRect(2, 12, T - 4, 8);
  g.fillRect(2, 22, T - 4, 8);
  // Metal bands
  g.fillStyle(0x888888, 1);
  g.fillRect(0, 10, T, 2);
  g.fillRect(0, 20, T, 2);
  // Keyhole
  g.fillStyle(0x222222, 1);
  g.fillCircle(T / 2, T / 2 + 4, 3);
  g.fillRect(T / 2 - 1, T / 2 + 4, 2, 5);
  g.generateTexture('tile-door', T, T);
  g.destroy();
}

function genStairsDown(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x2a2a3e, 1); g.fillRect(0, 0, T, T);
  const s = 4, steps = 4;
  for (let i = 0; i < steps; i++) {
    g.fillStyle(0x445566, 1);
    g.fillRect(i * s, i * s + 4, T - i * s * 2, s - 1);
    g.fillStyle(0x556677, 1);
    g.fillRect(i * s, i * s + 4, T - i * s * 2, 1);
  }
  // Arrow
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(T / 2 - 5, T - 8, T / 2 + 5, T - 8, T / 2, T - 3);
  g.generateTexture('tile-stairs-down', T, T);
  g.destroy();
}

function genStairsUp(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x2a2a3e, 1); g.fillRect(0, 0, T, T);
  const s = 4, steps = 4;
  for (let i = steps - 1; i >= 0; i--) {
    g.fillStyle(0x445566, 1);
    g.fillRect(i * s, i * s + 4, T - i * s * 2, s - 1);
    g.fillStyle(0x556677, 1);
    g.fillRect(i * s, i * s + 4, T - i * s * 2, 1);
  }
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(T / 2 - 5, 8, T / 2 + 5, 8, T / 2, 3);
  g.generateTexture('tile-stairs-up', T, T);
  g.destroy();
}

function genWater(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x0a1a4f, 1); g.fillRect(0, 0, T, T);
  // Wave lines
  for (let y = 0; y < 4; y++) {
    g.fillStyle(0x1a4fff, 1);
    for (let x = 0; x < 4; x++) {
      g.fillRect(x * 8 + (y % 2) * 4, y * 8 + 2, 6, 2);
    }
  }
  g.generateTexture('tile-water', T, T);
  g.destroy();
}

function genLava(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x330000, 1); g.fillRect(0, 0, T, T);
  for (let y = 0; y < 4; y++) {
    g.fillStyle(0xff4500, 1);
    for (let x = 0; x < 4; x++) {
      g.fillRect(x * 8 + (y % 2) * 4, y * 8 + 2, 6, 2);
    }
  }
  g.fillStyle(0xff8800, 1);
  g.fillCircle(8, 8, 3); g.fillCircle(24, 20, 2); g.fillCircle(16, 28, 3);
  g.generateTexture('tile-lava', T, T);
  g.destroy();
}

function genChestClosed(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x14141e, 1); g.fillRect(0, 0, T, T);
  // Chest body
  g.fillStyle(0x7d4a28, 1);
  g.fillRect(4, 10, 24, 16);
  g.fillStyle(0x6b3a1f, 1);
  g.fillRect(4, 10, 24, 6);
  // Metal bands
  g.fillStyle(0xccaa44, 1);
  g.fillRect(4, 15, 24, 2);
  g.fillRect(14, 10, 4, 16);
  // Lock
  g.fillStyle(0xffcc44, 1);
  g.fillRect(13, 13, 6, 5);
  g.fillStyle(0x221100, 1);
  g.fillCircle(16, 14, 2);
  g.generateTexture('tile-chest-closed', T, T);
  g.destroy();
}

function genChestOpen(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x14141e, 1); g.fillRect(0, 0, T, T);
  // Open chest
  g.fillStyle(0x7d4a28, 1);
  g.fillRect(4, 18, 24, 10);
  // Lid open
  g.fillStyle(0x6b3a1f, 1);
  g.fillRect(4, 6, 24, 6);
  // Gold inside
  g.fillStyle(0xffd700, 1);
  g.fillRect(6, 20, 20, 6);
  g.generateTexture('tile-chest-open', T, T);
  g.destroy();
}

function genVoid(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 1); g.fillRect(0, 0, T, T);
  g.generateTexture('tile-void', T, T);
  g.destroy();
}

// ── Character Sprites (32×32) ─────────────────────────────────

function genPlayer(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
  // Boots
  g.fillStyle(0x5c3d1e, 1); g.fillRect(8, 26, 5, 5); g.fillRect(19, 26, 5, 5);
  // Legs / pants
  g.fillStyle(0x2e4b8a, 1); g.fillRect(9, 19, 5, 8); g.fillRect(18, 19, 5, 8);
  // Armor body
  g.fillStyle(0x6688aa, 1); g.fillRect(8, 12, 16, 10);
  g.fillStyle(0x7799bb, 1); g.fillRect(9, 12, 14, 4); // chest highlight
  // Pauldrons
  g.fillStyle(0x7799bb, 1); g.fillRect(4, 12, 5, 5); g.fillRect(23, 12, 5, 5);
  // Neck
  g.fillStyle(0xd4a96a, 1); g.fillRect(13, 9, 6, 4);
  // Head
  g.fillStyle(0xd4a96a, 1); g.fillRect(10, 2, 12, 10);
  // Helmet
  g.fillStyle(0x6688aa, 1); g.fillRect(9, 2, 14, 5);
  g.fillStyle(0x7799bb, 1); g.fillRect(10, 2, 12, 2);
  // Eyes
  g.fillStyle(0x44aaff, 1); g.fillRect(12, 6, 3, 2); g.fillRect(17, 6, 3, 2);
  // Sword
  g.fillStyle(0xcccccc, 1); g.fillRect(25, 8, 2, 14);
  g.fillStyle(0xccaa44, 1); g.fillRect(23, 13, 6, 2);
  g.fillStyle(0x8b6914, 1); g.fillRect(25, 21, 2, 4);
  g.generateTexture('player', T, T);
  g.destroy();
}

function genMonster(scene, id, cfg) {
  const { color, char, hp } = cfg;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);

  // Different body shapes per monster type
  switch (id) {
    case 'rat':
      // Small rat
      g.fillStyle(0x8b6914, 1);
      g.fillEllipse(16, 20, 18, 12);
      g.fillCircle(22, 14, 6);
      g.fillStyle(0xff0000, 1); g.fillCircle(24, 13, 1); g.fillCircle(22, 13, 1);
      g.fillStyle(0xffc0cb, 1);
      g.fillRect(4, 18, 2, 8); // tail
      break;

    case 'goblin':
      // Green goblin
      g.fillStyle(color, 1);
      g.fillRect(9, 14, 14, 14); // body
      g.fillCircle(16, 10, 8);   // head
      g.fillStyle(0xff0000, 1); g.fillCircle(13, 9, 2); g.fillCircle(19, 9, 2); // eyes
      g.fillStyle(0xffff00, 1); g.fillRect(12, 14, 2, 2); g.fillRect(18, 14, 2, 2); // teeth
      g.fillStyle(color, 1);
      g.fillRect(4, 15, 6, 3); // arms
      g.fillRect(22, 15, 6, 3);
      g.fillRect(9, 26, 5, 5); g.fillRect(18, 26, 5, 5); // legs
      break;

    case 'skeleton':
      // White skeleton
      g.fillStyle(0xe8e8e8, 1);
      // Skull
      g.fillCircle(16, 8, 8);
      g.fillStyle(0x111111, 1); g.fillCircle(13, 7, 2); g.fillCircle(19, 7, 2);
      // Ribcage
      g.fillStyle(0xe8e8e8, 1);
      g.fillRect(10, 15, 12, 12);
      for (let i = 0; i < 4; i++) {
        g.fillStyle(0x000000, 1);
        g.fillRect(11, 16 + i * 3, 10, 1);
      }
      // Bones for arms/legs
      g.fillStyle(0xe8e8e8, 1);
      g.fillRect(4, 15, 7, 3); g.fillRect(21, 15, 7, 3);
      g.fillRect(10, 26, 5, 5); g.fillRect(17, 26, 5, 5);
      break;

    case 'orc':
      // Dark green orc
      g.fillStyle(color, 1);
      g.fillRect(7, 13, 18, 16); // body
      g.fillCircle(16, 10, 10);  // big head
      g.fillStyle(0xff2200, 1); g.fillCircle(12, 9, 2); g.fillCircle(20, 9, 2);
      g.fillStyle(0xcccc00, 1); g.fillRect(13, 14, 2, 3); g.fillRect(17, 14, 2, 3); // tusks
      // armor
      g.fillStyle(0x555555, 1); g.fillRect(8, 16, 16, 10);
      g.fillRect(3, 13, 5, 6); g.fillRect(24, 13, 5, 6); // arms
      g.fillRect(7, 28, 6, 4); g.fillRect(19, 28, 6, 4); // legs
      break;

    case 'bat':
      // Dark bat
      g.fillStyle(0x221133, 1);
      // Wings
      g.fillTriangle(0, 20, 14, 12, 14, 22);
      g.fillTriangle(32, 20, 18, 12, 18, 22);
      // Body
      g.fillEllipse(16, 20, 10, 12);
      // Head
      g.fillEllipse(16, 12, 8, 7);
      g.fillStyle(0xff0000, 1); g.fillCircle(13, 12, 1); g.fillCircle(19, 12, 1);
      // Ears
      g.fillStyle(0x221133, 1);
      g.fillTriangle(11, 10, 14, 5, 14, 10);
      g.fillTriangle(21, 10, 18, 5, 18, 10);
      break;

    case 'spider':
      // Brown spider
      g.fillStyle(0x5c3217, 1);
      g.fillCircle(16, 18, 8); // abdomen
      g.fillCircle(16, 11, 5); // head
      g.fillStyle(0xff0000, 1);
      for (let i = 0; i < 4; i++) g.fillCircle(12 + i * 2, 10, 1); // eyes
      // 8 legs
      g.fillStyle(0x5c3217, 1);
      for (let i = 0; i < 4; i++) {
        g.fillRect(4 - i, 12 + i * 4, 12, 2);   // left legs
        g.fillRect(16 + i, 12 + i * 4, 12, 2);  // right legs
      }
      break;

    case 'troll':
      // Big gray-green troll
      g.fillStyle(0x4a7040, 1);
      g.fillRect(4, 10, 24, 20); // big body
      g.fillCircle(16, 8, 10);   // huge head
      g.fillStyle(0xff4400, 1); g.fillCircle(11, 8, 3); g.fillCircle(21, 8, 3);
      g.fillStyle(0xcccc00, 1); g.fillRect(13, 14, 2, 4); g.fillRect(17, 14, 2, 4);
      g.fillStyle(0x4a7040, 1);
      g.fillRect(0, 12, 5, 10); g.fillRect(27, 12, 5, 10); // arms
      g.fillRect(4, 28, 9, 4); g.fillRect(19, 28, 9, 4); // legs
      break;

    case 'vampire':
      // Pale vampire
      g.fillStyle(0x1a0000, 1); // dark cape
      g.fillRect(4, 14, 24, 18);
      g.fillStyle(0xf0d0c0, 1); // pale face
      g.fillCircle(16, 10, 8);
      g.fillStyle(0xff0000, 1); g.fillCircle(13, 9, 2); g.fillCircle(19, 9, 2);
      g.fillStyle(0xffffff, 1); // fangs
      g.fillRect(14, 15, 2, 3); g.fillRect(18, 15, 2, 3);
      g.fillStyle(0x550000, 1); // cape edges
      g.fillRect(4, 14, 4, 18); g.fillRect(24, 14, 4, 18);
      g.fillRect(5, 27, 22, 5); // legs
      break;

    case 'darkMage':
      // Purple mage
      g.fillStyle(0x330066, 1);
      g.fillRect(8, 14, 16, 16);
      g.fillCircle(16, 10, 8);
      g.fillStyle(0xaa44ff, 1); g.fillCircle(13, 9, 2); g.fillCircle(19, 9, 2);
      // robe
      g.fillStyle(0x220044, 1);
      g.fillRect(6, 18, 20, 14);
      // hat
      g.fillStyle(0x220044, 1);
      g.fillRect(10, 2, 12, 2);
      g.fillTriangle(11, 10, 16, 0, 21, 10);
      // staff
      g.fillStyle(0x8844ff, 1); g.fillRect(25, 6, 2, 20);
      g.fillCircle(26, 5, 4);
      break;

    case 'demon':
      // Red demon
      g.fillStyle(0x880000, 1);
      g.fillRect(6, 12, 20, 18);
      g.fillCircle(16, 8, 10);
      g.fillStyle(0xff8800, 1); g.fillCircle(12, 7, 3); g.fillCircle(20, 7, 3);
      // Horns
      g.fillStyle(0x222222, 1);
      g.fillTriangle(10, 6, 8, 0, 14, 4);
      g.fillTriangle(22, 6, 24, 0, 18, 4);
      // Wings
      g.fillStyle(0x550000, 1);
      g.fillTriangle(0, 16, 6, 10, 6, 22);
      g.fillTriangle(32, 16, 26, 10, 26, 22);
      // claws
      g.fillStyle(0x222222, 1);
      g.fillRect(0, 12, 6, 3); g.fillRect(26, 12, 6, 3);
      g.fillRect(6, 28, 8, 4); g.fillRect(18, 28, 8, 4);
      break;

    case 'dungeonLord':
      // Epic boss - large imposing figure
      g.fillStyle(0x1a0022, 1); // dark body
      g.fillRect(2, 8, 28, 22);
      g.fillCircle(16, 6, 10); // head
      g.fillStyle(0xff00ff, 1); // glowing eyes
      g.fillCircle(11, 5, 3); g.fillCircle(21, 5, 3);
      g.fillStyle(0xffffff, 1); // inner eye glow
      g.fillCircle(11, 5, 1); g.fillCircle(21, 5, 1);
      // Crown
      g.fillStyle(0xffd700, 1);
      g.fillRect(8, 0, 16, 4);
      g.fillRect(8, 0, 3, 6); g.fillRect(14, 0, 4, 7); g.fillRect(21, 0, 3, 6);
      // Armor plates
      g.fillStyle(0x4a0066, 1);
      g.fillRect(4, 12, 24, 14);
      g.fillStyle(0xffd700, 1);
      g.fillRect(4, 12, 24, 2); g.fillRect(4, 22, 24, 2);
      g.fillRect(15, 12, 2, 12); // center line
      // Wings
      g.fillStyle(0x330044, 1);
      g.fillTriangle(0, 10, 2, 4, 10, 14);
      g.fillTriangle(32, 10, 30, 4, 22, 14);
      // Legs
      g.fillStyle(0x1a0022, 1);
      g.fillRect(4, 28, 10, 4); g.fillRect(18, 28, 10, 4);
      break;
  }

  g.generateTexture(`monster-${id}`, T, T);
  g.destroy();
}

// ── Item Sprites (24×24) ──────────────────────────────────────

function genItemTextures(scene) {
  const I = 24; // item sprite size

  const genItem = (key, drawFn) => {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x000000, 0); g.fillRect(0, 0, I, I);
    drawFn(g);
    g.generateTexture(`item-${key}`, I, I);
    g.destroy();
  };

  // Generic weapon (sword shape)
  genItem('weapon', g => {
    g.fillStyle(0xcccccc, 1);
    g.fillRect(11, 3, 3, 14);
    g.fillStyle(0xccaa44, 1); g.fillRect(7, 11, 11, 2);
    g.fillStyle(0x8b5e3c, 1); g.fillRect(11, 17, 3, 5);
  });

  // Generic armor (shield/breastplate)
  genItem('armor', g => {
    g.fillStyle(0x6688aa, 1);
    g.fillRect(4, 4, 16, 16);
    g.fillStyle(0x7799bb, 1); g.fillRect(5, 5, 14, 6);
    g.fillStyle(0x445566, 1); g.fillRect(4, 4, 16, 2);
    g.fillRect(4, 4, 2, 16); g.fillRect(18, 4, 2, 16);
  });

  // Potion
  genItem('potion', g => {
    g.fillStyle(0x553311, 1); // cork
    g.fillRect(10, 3, 5, 3);
    g.fillStyle(0xaaaaff, 1); // glass top
    g.fillRect(9, 6, 7, 3);
    g.fillStyle(0x8888ff, 1); // body with liquid
    g.fillEllipse(12, 16, 14, 14);
    g.fillStyle(0xaaaaff, 1);
    g.fillRect(10, 9, 5, 5);
    g.fillStyle(0xffffff, 1); // shine
    g.fillRect(16, 12, 2, 4);
  });

  // Gold coin
  genItem('gold', g => {
    g.fillStyle(0xffd700, 1); g.fillCircle(12, 12, 9);
    g.fillStyle(0xccaa00, 1); g.fillCircle(12, 12, 7);
    g.fillStyle(0xffd700, 1);
    g.fillRect(11, 8, 2, 8); g.fillRect(8, 11, 8, 2); // $ sign
  });

  // Material / resource
  genItem('material', g => {
    g.fillStyle(0x888888, 1);
    g.fillRect(5, 8, 14, 10);
    g.fillStyle(0xaaaaaa, 1); g.fillRect(5, 8, 14, 3);
    g.fillStyle(0x666666, 1); g.fillRect(5, 15, 14, 3);
  });

  // Scroll
  genItem('scroll', g => {
    g.fillStyle(0xf5deb3, 1); // parchment
    g.fillRect(6, 4, 12, 16);
    g.fillStyle(0xd4a96a, 1);
    g.fillRect(4, 4, 4, 16); g.fillRect(16, 4, 4, 16); // rolled ends
    g.fillStyle(0x884400, 1);
    for (let i = 0; i < 4; i++) g.fillRect(8, 7 + i * 3, 8, 1); // text lines
  });

  // Ring
  genItem('ring', g => {
    g.lineStyle(3, 0xccaa44, 1);
    g.strokeCircle(12, 13, 6);
    g.fillStyle(0xff4444, 1); g.fillCircle(12, 7, 3); // gem
  });

  // Amulet
  genItem('amulet', g => {
    g.lineStyle(2, 0xccaa44, 1);
    g.strokeCircle(12, 15, 6);
    g.fillStyle(0x44aaff, 1); g.fillCircle(12, 9, 4); // gem
    g.fillStyle(0xffffff, 1); g.fillCircle(11, 8, 1); // shine
    // chain
    g.lineStyle(1, 0xccaa44, 1);
    g.strokeRect(11, 3, 2, 4);
  });
}

// ── Particle / effect textures ────────────────────────────────

function genEffects(scene) {
  // Particle dot
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4);
  g.generateTexture('particle-dot', 8, 8);
  g.destroy();
}

// ── FOG overlay ───────────────────────────────────────────────

function genFog(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 1); g.fillRect(0, 0, T, T);
  g.generateTexture('fog-black', T, T);
  const g2 = scene.make.graphics({ add: false });
  g2.fillStyle(0x000000, 0.65); g2.fillRect(0, 0, T, T);
  g2.generateTexture('fog-explored', T, T);
  g2.destroy();
}

// ── Master generator ─────────────────────────────────────────

import { MONSTERS } from '../data/MonsterData.js';

export function generateAllTextures(scene) {
  genVoid(scene);
  genWall(scene);
  genFloor(scene);
  genDoor(scene);
  genStairsDown(scene);
  genStairsUp(scene);
  genWater(scene);
  genLava(scene);
  genChestClosed(scene);
  genChestOpen(scene);
  genPlayer(scene);
  genFog(scene);
  genEffects(scene);
  genItemTextures(scene);

  for (const [id, def] of Object.entries(MONSTERS)) {
    genMonster(scene, id, def);
  }
}

// Tile key → texture key map
export const TILE_TEXTURE = {
  '-1': 'tile-void',
  '0':  'tile-wall',
  '1':  'tile-floor',
  '2':  'tile-door',
  '3':  'tile-stairs-down',
  '4':  'tile-stairs-up',
  '5':  'tile-water',
  '6':  'tile-lava',
  '7':  'tile-chest-closed',
  '8':  'tile-chest-open',
  '9':  'tile-floor',   // hidden trap looks like floor
  '10': 'tile-floor',   // visible trap (tinted at render time)
};
