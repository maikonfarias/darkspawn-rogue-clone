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

function genGrass(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x2d6a1f, 1); g.fillRect(0, 0, T, T);
  // Grass tufts
  g.fillStyle(0x3a8426, 1);
  g.fillRect(3, 5, 3, 5); g.fillRect(12, 2, 2, 6); g.fillRect(22, 8, 3, 4);
  g.fillRect(6, 18, 2, 5); g.fillRect(18, 15, 3, 5); g.fillRect(27, 20, 2, 4);
  g.fillRect(2, 26, 3, 4); g.fillRect(14, 24, 2, 5); g.fillRect(25, 28, 3, 3);
  g.fillStyle(0x4aaa30, 1);
  g.fillRect(4, 4, 1, 4); g.fillRect(13, 1, 1, 5); g.fillRect(23, 7, 1, 3);
  g.fillRect(7, 17, 1, 4); g.fillRect(19, 14, 1, 4); g.fillRect(28, 19, 1, 3);
  g.generateTexture('tile-grass', T, T);
  g.destroy();
}

function genNPC(scene) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
  // Robe / body
  g.fillStyle(0x663399, 1); g.fillRect(8, 14, 16, 14);
  g.fillStyle(0x7744bb, 1); g.fillRect(9, 14, 14, 5);
  // Hood / head
  g.fillStyle(0xd4a96a, 1); g.fillRect(10, 5, 12, 10);
  g.fillStyle(0x553388, 1); g.fillRect(8, 2, 16, 8);
  // Eyes
  g.fillStyle(0xffd700, 1); g.fillRect(12, 9, 3, 2); g.fillRect(17, 9, 3, 2);
  // Staff
  g.fillStyle(0x8b6914, 1); g.fillRect(3, 4, 2, 24);
  g.fillStyle(0x44ddff, 1); g.fillCircle(4, 4, 4);
  g.generateTexture('tile-npc', T, T);
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
  const I = 24;

  const genItem = (key, drawFn) => {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x000000, 0); g.fillRect(0, 0, I, I);
    drawFn(g);
    g.generateTexture(`item-${key}`, I, I);
    g.destroy();
  };

  // ─── Fallback type-based textures (used by legend/tooltip) ───

  genItem('weapon', g => {
    g.fillStyle(0xcccccc, 1); g.fillRect(11, 3, 3, 14);
    g.fillStyle(0xccaa44, 1); g.fillRect(7, 11, 11, 2);
    g.fillStyle(0x8b5e3c, 1); g.fillRect(11, 17, 3, 5);
  });
  genItem('armor', g => {
    g.fillStyle(0x6688aa, 1); g.fillRect(4, 4, 16, 16);
    g.fillStyle(0x7799bb, 1); g.fillRect(5, 5, 14, 6);
    g.fillStyle(0x445566, 1); g.fillRect(4, 4, 16, 2);
    g.fillRect(4, 4, 2, 16); g.fillRect(18, 4, 2, 16);
  });
  genItem('potion', g => {
    g.fillStyle(0x553311, 1); g.fillRect(10, 3, 5, 3);
    g.fillStyle(0xaaaaff, 1); g.fillRect(9, 6, 7, 3);
    g.fillStyle(0x8888ff, 1); g.fillEllipse(12, 16, 14, 14);
    g.fillStyle(0xaaaaff, 1); g.fillRect(10, 9, 5, 5);
    g.fillStyle(0xffffff, 1); g.fillRect(16, 12, 2, 4);
  });
  genItem('scroll', g => {
    g.fillStyle(0xf5deb3, 1); g.fillRect(6, 4, 12, 16);
    g.fillStyle(0xd4a96a, 1); g.fillRect(4, 4, 4, 16); g.fillRect(16, 4, 4, 16);
    g.fillStyle(0x884400, 1);
    for (let i = 0; i < 4; i++) g.fillRect(8, 7 + i * 3, 8, 1);
  });
  genItem('ring', g => {
    g.lineStyle(3, 0xccaa44, 1); g.strokeCircle(12, 13, 6);
    g.fillStyle(0xff4444, 1); g.fillCircle(12, 7, 3);
  });
  genItem('amulet', g => {
    g.lineStyle(2, 0xccaa44, 1); g.strokeCircle(12, 15, 6);
    g.fillStyle(0x44aaff, 1); g.fillCircle(12, 9, 4);
    g.fillStyle(0xffffff, 1); g.fillCircle(11, 8, 1);
    g.lineStyle(1, 0xccaa44, 1); g.strokeRect(11, 3, 2, 4);
  });
  genItem('material', g => {
    g.fillStyle(0x888888, 1); g.fillRect(5, 8, 14, 10);
    g.fillStyle(0xaaaaaa, 1); g.fillRect(5, 8, 14, 3);
    g.fillStyle(0x666666, 1); g.fillRect(5, 15, 14, 3);
  });
  genItem('gold', g => {
    g.fillStyle(0xffd700, 1); g.fillCircle(12, 12, 9);
    g.fillStyle(0xccaa00, 1); g.fillCircle(12, 12, 7);
    g.fillStyle(0xffd700, 1);
    g.fillRect(11, 8, 2, 8); g.fillRect(8, 11, 8, 2);
  });

  // ─── WEAPONS ─────────────────────────────────────────────────

  // fists — clenched knuckles view
  genItem('fists', g => {
    g.fillStyle(0xcc9966, 1); g.fillRect(6, 9, 12, 8);   // knuckles row
    g.fillStyle(0xbb8855, 1);
    for (let i = 0; i < 4; i++) g.fillRect(7 + i * 3, 8, 2, 2); // knuckle bumps
    g.fillStyle(0xaa7744, 1); g.fillRect(6, 17, 12, 4);   // palm
    g.fillStyle(0xdd9977, 1); g.fillRect(7, 10, 10, 4);   // finger highlight
  });

  // dagger — thin, narrow blade
  genItem('dagger', g => {
    g.fillStyle(0xbbbbbb, 1); g.fillRect(11, 2, 2, 1);    // tip
    g.fillStyle(0xcccccc, 1); g.fillRect(10, 3, 4, 9);    // blade wide
    g.fillStyle(0x999999, 1); g.fillRect(11, 3, 2, 9);    // blade center shading
    g.fillStyle(0xccaa33, 1); g.fillRect(8, 12, 8, 2);    // crossguard (small)
    g.fillStyle(0x7a3020, 1); g.fillRect(11, 14, 2, 6);   // handle
    g.fillStyle(0x888844, 1); g.fillRect(10, 20, 4, 2);   // pommel
  });

  // shortSword — medium straight
  genItem('shortSword', g => {
    g.fillStyle(0xdddddd, 1); g.fillRect(10, 2, 4, 12);
    g.fillStyle(0xaaaaaa, 1); g.fillRect(11, 2, 2, 12);
    g.fillStyle(0xbbbb44, 1); g.fillRect(6, 13, 12, 2);   // guard
    g.fillStyle(0x8b5030, 1); g.fillRect(11, 15, 2, 6);
    g.fillStyle(0x999955, 1); g.fillRect(10, 21, 4, 2);
  });

  // longSword — tall, wide guard
  genItem('longSword', g => {
    g.fillStyle(0xe8e8e8, 1); g.fillRect(10, 1, 4, 14);
    g.fillStyle(0xbbbbbb, 1); g.fillRect(11, 1, 2, 14);
    g.fillStyle(0xaaaa44, 1); g.fillRect(4, 14, 16, 2);   // wide guard
    g.fillStyle(0x7a4a2a, 1); g.fillRect(11, 16, 2, 6);
    g.fillStyle(0x888844, 1); g.fillRect(9, 22, 6, 2);
  });

  // battleAxe — broad axe head on handle
  genItem('battleAxe', g => {
    g.fillStyle(0x6b3a1f, 1); g.fillRect(11, 5, 2, 18);   // handle
    g.fillStyle(0x888888, 1);                               // axe head (stacked rects)
    g.fillRect(9, 4, 8, 2);
    g.fillRect(7, 6, 10, 2);
    g.fillRect(5, 8, 12, 2);
    g.fillRect(6, 10, 10, 2);
    g.fillRect(8, 12, 8, 2);
    g.fillRect(10, 14, 5, 2);
    g.fillStyle(0xaaaaaa, 1); g.fillRect(7, 6, 2, 8);     // edge highlight
    g.fillStyle(0x555555, 1); g.fillRect(15, 7, 2, 6);    // back edge shadow
  });

  // mageStaff — orb on wooden staff
  genItem('mageStaff', g => {
    g.fillStyle(0x7b4a20, 1); g.fillRect(11, 8, 2, 16);   // staff
    g.fillStyle(0x5533aa, 1); g.fillCircle(12, 6, 5);     // outer orb
    g.fillStyle(0x9966ff, 1); g.fillCircle(12, 6, 3);     // inner orb
    g.fillStyle(0xddaaff, 1); g.fillRect(10, 3, 2, 2);    // shine
    g.fillStyle(0x442288, 1); g.fillRect(10, 7, 4, 2);    // orb base collar
  });

  // warHammer — large flat metal head
  genItem('warHammer', g => {
    g.fillStyle(0x5a3010, 1); g.fillRect(11, 10, 2, 13);  // handle
    g.fillStyle(0x777777, 1); g.fillRect(4, 3, 16, 9);    // head
    g.fillStyle(0x999999, 1); g.fillRect(4, 3, 16, 2);    // top face
    g.fillStyle(0x555555, 1); g.fillRect(4, 10, 16, 2);   // bottom shadow
    g.fillStyle(0x666666, 1); g.fillRect(9, 5, 6, 5);     // center recess
    g.fillStyle(0x444444, 1); g.fillRect(5, 5, 2, 3); g.fillRect(17, 5, 2, 3); // side rivets
  });

  // runicBlade — glowing teal/cyan sword
  genItem('runicBlade', g => {
    g.fillStyle(0x006666, 1); g.fillRect(9, 1, 6, 13);    // glow halo
    g.fillStyle(0x00cccc, 1); g.fillRect(10, 1, 4, 13);   // blade
    g.fillStyle(0x00ffff, 1); g.fillRect(11, 1, 2, 13);   // edge
    g.fillStyle(0x336655, 1); g.fillRect(5, 13, 14, 2);   // guard
    g.fillStyle(0x224433, 1); g.fillRect(11, 15, 2, 7);   // handle
    g.fillStyle(0x88ffff, 1);                               // rune marks
    g.fillRect(11, 3, 2, 1); g.fillRect(11, 6, 2, 1); g.fillRect(11, 9, 2, 1);
  });

  // ─── ARMOR ───────────────────────────────────────────────────

  // rags — torn cloth strips
  genItem('rags', g => {
    g.fillStyle(0x6b4820, 1); g.fillRect(5, 3, 14, 16);
    g.fillStyle(0x8b6030, 1); g.fillRect(5, 3, 14, 1);    // top edge
    g.fillStyle(0x4a2e0a, 1);                               // torn bottom strips
    g.fillRect(5, 16, 3, 5); g.fillRect(10, 17, 4, 4); g.fillRect(16, 15, 3, 6);
    g.fillStyle(0x8b6030, 1);                               // stitching
    g.fillRect(5, 8, 14, 1); g.fillRect(11, 3, 2, 12);
    g.fillStyle(0x2a1500, 1);                               // holes
    g.fillRect(7, 6, 3, 2); g.fillRect(14, 11, 3, 2);
  });

  // leatherArmor — brown vest
  genItem('leatherArmor', g => {
    g.fillStyle(0x8b5e3c, 1); g.fillRect(4, 3, 16, 17);
    g.fillStyle(0xaa7755, 1); g.fillRect(5, 4, 5, 8); g.fillRect(14, 4, 5, 8); // chest panels
    g.fillStyle(0x6b4020, 1); g.fillRect(9, 3, 6, 4);     // neckline
    g.fillStyle(0x4a2a10, 1); g.fillRect(4, 16, 16, 2);   // belt
    g.fillStyle(0xccaa44, 1); g.fillRect(10, 16, 4, 2);   // buckle
    g.fillStyle(0x6b4020, 1); g.fillRect(11, 4, 2, 11);   // seam
  });

  // chainMail — blue-gray interlocked rings pattern
  genItem('chainMail', g => {
    g.fillStyle(0x607080, 1); g.fillRect(3, 2, 18, 20);
    g.fillStyle(0x7a8898, 1);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const ox = (row % 2) * 2;
        g.fillRect(4 + col * 3 + ox, 3 + row * 3, 2, 2);
      }
    }
    g.fillStyle(0x4e5f70, 1); g.fillRect(2, 2, 3, 6); g.fillRect(19, 2, 3, 6); // pauldrons
    g.fillStyle(0x8aaabb, 1); g.fillRect(2, 2, 3, 1); g.fillRect(19, 2, 3, 1);
  });

  // plateArmor — silver, imposing
  genItem('plateArmor', g => {
    g.fillStyle(0x8a9ba8, 1); g.fillRect(3, 3, 18, 18);
    g.fillStyle(0xb0c0cc, 1); g.fillRect(8, 2, 8, 4);     // gorget
    g.fillStyle(0x7a8b98, 1); g.fillRect(11, 5, 2, 14);   // chest split
    g.fillStyle(0xbcccd8, 1); g.fillRect(4, 3, 7, 7); g.fillRect(13, 3, 7, 7); // pauldrons
    g.fillStyle(0xd0e0e8, 1); g.fillRect(4, 3, 7, 2); g.fillRect(13, 3, 7, 2); // top shine
    g.fillStyle(0x6a7b88, 1); g.fillRect(3, 14, 18, 2); g.fillRect(3, 18, 18, 2); // bands
    g.fillStyle(0xc8d8e0, 1); g.fillRect(9, 7, 6, 5);     // breastplate boss
  });

  // mageRobe — purple with gold trim
  genItem('mageRobe', g => {
    g.fillStyle(0x552288, 1); g.fillRect(4, 2, 16, 18);
    g.fillStyle(0x441177, 1); g.fillRect(2, 14, 20, 8);   // skirt
    g.fillStyle(0x331155, 1); g.fillRect(9, 2, 6, 4);     // neckline
    g.fillStyle(0xccaa33, 1);                               // gold trim
    g.fillRect(4, 2, 16, 1); g.fillRect(2, 14, 20, 1); g.fillRect(11, 3, 2, 10);
    g.fillStyle(0xddccff, 1);                               // star ornament
    g.fillRect(8, 7, 2, 4); g.fillRect(7, 8, 4, 2);
  });

  // dragonScale — red, scaly pattern
  genItem('dragonScale', g => {
    g.fillStyle(0x771111, 1); g.fillRect(3, 3, 18, 18);
    g.fillStyle(0x993333, 1);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const ox = (row % 2) * 2;
        g.fillRect(4 + col * 3 + ox, 4 + row * 4, 4, 3);
      }
    }
    g.fillStyle(0xaa4444, 1);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const ox = (row % 2) * 2;
        g.fillRect(4 + col * 3 + ox, 4 + row * 4, 4, 1); // scale highlight
      }
    }
    g.fillStyle(0xbb1111, 1); g.fillRect(2, 3, 3, 4); g.fillRect(19, 3, 3, 4); // spikes
    g.fillStyle(0xdd3333, 1); g.fillRect(2, 3, 2, 2); g.fillRect(20, 3, 2, 2);
  });

  // ─── POTIONS ─────────────────────────────────────────────────

  // Helper — thin vial (narrow, tall)
  const thinVial = (g, liquid, cork) => {
    g.fillStyle(cork,    1); g.fillRect(11, 2, 2, 3);      // cork
    g.fillStyle(0xccddcc,1); g.fillRect(11, 5, 2, 2);      // neck
    g.fillStyle(0xddeedd,1); g.fillRect(9, 7, 6, 13);      // glass body
    g.fillStyle(liquid,  1); g.fillRect(10, 8, 4, 11);     // liquid
    g.fillStyle(0xffffff,1); g.fillRect(10, 9, 1, 5);      // shine
    g.fillStyle(0x99aa99,1); g.fillRect(9, 7, 1, 13); g.fillRect(14, 7, 1, 13); // edges
  };
  // Helper — round flask (medium)
  const roundFlask = (g, liquid, cork) => {
    g.fillStyle(cork,    1); g.fillRect(10, 2, 4, 3);
    g.fillStyle(0xccddcc,1); g.fillRect(10, 5, 4, 3);      // neck
    g.fillStyle(0xddeedd,1); g.fillEllipse(12, 15, 14, 13);// glass
    g.fillStyle(liquid,  1); g.fillEllipse(12, 16, 12, 11);// liquid
    g.fillStyle(0xffffff,1); g.fillRect(6, 12, 2, 5);      // shine
  };
  // Helper — large square flask
  const squareFlask = (g, liquid, cork) => {
    g.fillStyle(0x888855,1); g.fillRect(8, 1, 8, 2);       // metal cap
    g.fillStyle(cork,    1); g.fillRect(9, 3, 6, 3);
    g.fillStyle(0xbbccbb,1); g.fillRect(8, 6, 8, 2);       // neck
    g.fillStyle(0xddeedd,1); g.fillRect(2, 8, 20, 13);     // glass body
    g.fillStyle(liquid,  1); g.fillRect(3, 9, 18, 11);     // liquid
    g.fillStyle(0xffffff,1); g.fillRect(3, 9, 2, 8);       // shine
    g.fillStyle(0x99aa99,1); g.fillRect(2, 8, 1, 13); g.fillRect(21, 8, 1, 13);
    g.fillRect(2, 21, 20, 1);
    g.fillStyle(0xffffff,1); g.fillRect(5, 13, 14, 4);     // label band
    g.fillStyle(liquid,  1); g.fillRect(11, 13, 2, 4); g.fillRect(6, 14, 12, 2); // cross
  };

  genItem('potionHpS',  g => thinVial(g,   0xdd2222, 0x7b3a20));
  genItem('potionHpM',  g => roundFlask(g,  0xcc1111, 0x7b3a20));
  genItem('potionHpL',  g => squareFlask(g, 0xdd1111, 0x7b3a20));
  genItem('potionMana', g => roundFlask(g,  0x2233cc, 0x202060));
  genItem('antidote',   g => thinVial(g,   0x22aa22, 0x2a5520));
  genItem('potionSpeed',g => thinVial(g,   0xddcc00, 0x5a5010));
  genItem('potionStr',  g => roundFlask(g,  0xdd6600, 0x6a3010));

  // ─── SCROLLS (color-coded by effect) ─────────────────────────

  const mkScroll = (g, textColor) => {
    g.fillStyle(0xf5deb3, 1); g.fillRect(6, 4, 12, 16);
    g.fillStyle(0xd4a96a, 1); g.fillRect(4, 4, 4, 16); g.fillRect(16, 4, 4, 16);
    g.fillStyle(textColor, 1);
    for (let i = 0; i < 4; i++) g.fillRect(8, 7 + i * 3, 8, 1);
  };
  genItem('scrollMap',  g => mkScroll(g, 0x888800));
  genItem('scrollTele', g => mkScroll(g, 0x7733bb));
  genItem('scrollId',   g => mkScroll(g, 0x2288aa));
  genItem('scrollFire', g => mkScroll(g, 0xcc4400));
  genItem('townScroll', g => mkScroll(g, 0x1155dd));

  // ─── RINGS (band + gem color) ─────────────────────────────────

  const mkRing = (g, band, gem) => {
    g.lineStyle(3, band, 1); g.strokeCircle(12, 14, 6);
    g.fillStyle(gem, 1); g.fillCircle(12, 8, 3);
    g.fillStyle(0xffffff, 1); g.fillCircle(11, 7, 1);    // shine
  };
  genItem('ironRing',     g => mkRing(g, 0x888888, 0x555566));
  genItem('goldRing',     g => mkRing(g, 0xddaa00, 0xffd700));
  genItem('rubyRing',     g => mkRing(g, 0xbbaa44, 0xcc1122));
  genItem('sapphireRing', g => mkRing(g, 0xbbaa44, 0x1133cc));

  // ─── AMULETS (pendant + gem color) ───────────────────────────

  const mkAmulet = (g, chain, gem, shine) => {
    g.lineStyle(2, chain, 1); g.strokeCircle(12, 16, 5);
    g.fillStyle(gem,    1); g.fillCircle(12, 9, 4);
    g.fillStyle(shine,  1); g.fillCircle(11, 8, 1);
    g.lineStyle(1, chain, 1); g.strokeRect(11, 2, 2, 5);
  };
  genItem('boneAmulet', g => mkAmulet(g, 0xbbbbaa, 0xeeeedd, 0xffffff));
  genItem('moonstone',  g => mkAmulet(g, 0xbbaa88, 0x44cccc, 0xaaffff));
  genItem('dragonEye',  g => mkAmulet(g, 0xbb6622, 0xee3311, 0xff8866));

  // ─── MATERIALS ───────────────────────────────────────────────

  // wood — planks
  genItem('wood', g => {
    g.fillStyle(0x8b5e3c, 1); g.fillRect(2, 5, 20, 14);
    g.fillStyle(0xa07040, 1); g.fillRect(2, 5, 20, 4);    // top plank face
    g.fillStyle(0x7a4e2a, 1); g.fillRect(2, 9, 20, 1);    // gap
    g.fillStyle(0x9a6535, 1); g.fillRect(2, 10, 20, 4);   // mid plank
    g.fillStyle(0x7a4e2a, 1); g.fillRect(2, 14, 20, 1);   // gap
    g.fillStyle(0x8b5e3c, 1); g.fillRect(2, 15, 20, 4);   // bottom
    g.fillStyle(0x6a3e1c, 1);                               // grain
    g.fillRect(5, 5, 1, 4); g.fillRect(13, 5, 1, 4);
    g.fillRect(7, 10, 1, 4); g.fillRect(17, 10, 1, 4);
  });

  // stone — rough oval rock
  genItem('stone', g => {
    g.fillStyle(0x888888, 1); g.fillEllipse(12, 13, 17, 13);
    g.fillStyle(0xaaaaaa, 1); g.fillEllipse(11, 12, 12, 8); // highlight
    g.fillStyle(0x666666, 1); g.fillEllipse(14, 17, 8, 5);  // shadow
    g.fillStyle(0x555555, 1); g.fillRect(8, 12, 1, 4); g.fillRect(13, 10, 1, 3); // cracks
  });

  // ironOre — rusty lumpy cluster
  genItem('ironOre', g => {
    g.fillStyle(0x606060, 1); g.fillEllipse(10, 14, 12, 10);
    g.fillStyle(0x6a5050, 1); g.fillEllipse(15, 11, 10, 8); // rust lump
    g.fillStyle(0x888080, 1); g.fillEllipse(11, 12, 7, 6);  // highlight
    g.fillStyle(0x8a7060, 1); g.fillRect(13, 9, 2, 2);      // ore specks
    g.fillStyle(0xaa6644, 1); g.fillRect(7, 14, 2, 2);      // rust fleck
  });

  // ironIngot — polished bar
  genItem('ironIngot', g => {
    g.fillStyle(0x707880, 1); g.fillRect(3, 8, 18, 9);
    g.fillStyle(0x90a0aa, 1); g.fillRect(3, 8, 18, 3);      // top face
    g.fillStyle(0x505860, 1); g.fillRect(3, 14, 18, 3);     // bottom shadow
    g.fillStyle(0x808898, 1); g.fillRect(2, 9, 1, 8); g.fillRect(21, 9, 1, 8); // sides
    g.fillStyle(0xbcc8d0, 1); g.fillRect(5, 9, 2, 2);       // glint
  });

  // leatherHide — tan pelt shape
  genItem('leatherHide', g => {
    g.fillStyle(0xaa8855, 1); g.fillEllipse(12, 13, 17, 12);
    g.fillStyle(0xcc9966, 1); g.fillEllipse(12, 12, 11, 7); // lighter center
    g.fillStyle(0x9a7a45, 1);                                // fur patches
    g.fillRect(5, 10, 4, 3); g.fillRect(15, 10, 4, 3); g.fillRect(9, 15, 6, 3);
    g.fillStyle(0x776633, 1); g.fillRect(8, 18, 2, 3); g.fillRect(14, 18, 2, 3); // leg stubs
  });

  // bone — recognisable bone shape
  genItem('bone', g => {
    g.fillStyle(0xddddcc, 1); g.fillRect(10, 6, 4, 12);      // shaft
    g.fillStyle(0xeeeecc, 1); g.fillEllipse(12, 5, 8, 7);    // top knob
    g.fillStyle(0xeeeecc, 1); g.fillEllipse(12, 19, 8, 7);   // bottom knob
    g.fillStyle(0xffffff, 1); g.fillRect(11, 7, 1, 10);      // shine
    g.fillStyle(0xbbbbaa, 1); g.fillRect(13, 7, 1, 10);      // shadow
  });

  // crystal — faceted gem spike
  genItem('crystal', g => {
    g.fillStyle(0x44eeee, 1); g.fillRect(11, 1, 2, 4);       // top spike
    g.fillStyle(0x33cccc, 1); g.fillRect(9, 5, 6, 4);
    g.fillStyle(0x22aaaa, 1); g.fillRect(8, 9, 8, 4);
    g.fillStyle(0x1f9999, 1); g.fillRect(9, 13, 6, 4);
    g.fillStyle(0x1a8888, 1); g.fillRect(11, 17, 2, 4);      // bottom tip
    g.fillStyle(0x88ffff, 1); g.fillRect(11, 6, 2, 7);       // inner glow
    g.fillStyle(0x1e8899, 1); g.fillRect(8, 9, 3, 8);        // dark left facet
  });

  // dragonScale2 (material) — single curved scale
  genItem('dragonScale2', g => {
    g.fillStyle(0x991111, 1); g.fillEllipse(12, 14, 16, 14);
    g.fillStyle(0xcc2222, 1); g.fillEllipse(12, 12, 13, 8);  // upper lighter
    g.fillStyle(0x771111, 1); g.fillRect(3, 16, 18, 4);      // flat base
    g.fillStyle(0xdd3333, 1); g.fillRect(11, 6, 2, 8);       // ridge
    g.fillStyle(0xff6666, 1); g.fillRect(9, 8, 2, 3);        // shine
  });

  // gemRuby — faceted cut gem
  genItem('gemRuby', g => {
    g.fillStyle(0xcc2233, 1); g.fillRect(7, 6, 10, 6);       // table (top flat)
    g.fillStyle(0xaa1122, 1); g.fillRect(5, 10, 4, 6);       // left pavilion
    g.fillStyle(0xdd3344, 1); g.fillRect(15, 10, 4, 6);      // right pavilion
    g.fillStyle(0x881122, 1); g.fillRect(7, 16, 10, 3);
    g.fillRect(9, 19, 6, 2); g.fillRect(11, 21, 2, 1);       // bottom tip
    g.fillStyle(0xff8899, 1); g.fillRect(9, 7, 6, 2);        // table shine
    g.fillStyle(0xbb1f33, 1);
    g.fillRect(7, 3, 4, 3); g.fillRect(13, 3, 4, 3);         // crown facets
    g.fillRect(11, 2, 2, 2);
  });

  // gemSapphire — same cut, deep blue
  genItem('gemSapphire', g => {
    g.fillStyle(0x1133bb, 1); g.fillRect(7, 6, 10, 6);
    g.fillStyle(0x0a2299, 1); g.fillRect(5, 10, 4, 6);
    g.fillStyle(0x2244cc, 1); g.fillRect(15, 10, 4, 6);
    g.fillStyle(0x0a1a88, 1); g.fillRect(7, 16, 10, 3);
    g.fillRect(9, 19, 6, 2); g.fillRect(11, 21, 2, 1);
    g.fillStyle(0x6688ff, 1); g.fillRect(9, 7, 6, 2);
    g.fillStyle(0x0f2faa, 1);
    g.fillRect(7, 3, 4, 3); g.fillRect(13, 3, 4, 3);
    g.fillRect(11, 2, 2, 2);
  });
}

// ── Skill Icons (24×24) ──────────────────────────────────────

function genSkillIcons(scene) {
  const I = 24;
  const genSkill = (key, drawFn) => {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x000000, 0); g.fillRect(0, 0, I, I);
    drawFn(g);
    g.generateTexture(`skill-${key}`, I, I);
    g.destroy();
  };

  // berserkerRage — red flaming fist
  genSkill('berserkerRage', g => {
    g.fillStyle(0x660000, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0xdd2200, 1); g.fillCircle(12, 12, 8);
    g.fillStyle(0xff4400, 1); g.fillRect(9, 4, 3, 8); g.fillRect(13, 5, 3, 7); g.fillRect(7, 8, 2, 4);
    g.fillStyle(0xffcc00, 1); g.fillRect(10, 4, 2, 6);
    g.fillStyle(0x882200, 1); g.fillRect(8, 14, 8, 6);
    g.fillStyle(0xaa4422, 1); g.fillRect(8, 14, 8, 2);
    g.fillStyle(0x663300, 1); g.fillRect(9, 16, 2, 4); g.fillRect(12, 16, 2, 4);
  });

  // whirlwind — green spinning vortex
  genSkill('whirlwind', g => {
    g.fillStyle(0x113311, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x226622, 1); g.fillCircle(12, 12, 7);
    g.fillStyle(0x44cc44, 1);
    g.fillRect(8, 4, 4, 4); g.fillRect(14, 8, 4, 4); g.fillRect(12, 15, 4, 4); g.fillRect(5, 11, 4, 4);
    g.fillStyle(0xaaffaa, 1);
    g.fillRect(9, 4, 2, 2); g.fillRect(16, 9, 2, 2); g.fillRect(12, 17, 2, 2); g.fillRect(5, 12, 2, 2);
    g.fillStyle(0xccff44, 1); g.fillCircle(12, 12, 3);
    g.fillStyle(0xffffff, 1); g.fillCircle(12, 12, 1);
  });

  // shadowStep — dark teleport portal
  genSkill('shadowStep', g => {
    g.fillStyle(0x111133, 1); g.fillCircle(12, 14, 9);
    g.fillStyle(0x2233aa, 1); g.fillCircle(12, 14, 7);
    g.fillStyle(0x4466ff, 1); g.fillCircle(12, 14, 4);
    g.fillStyle(0x88aaff, 1); g.fillCircle(12, 14, 2);
    g.fillStyle(0x4455bb, 1);
    g.fillRect(3, 7, 5, 1); g.fillRect(2, 5, 4, 1); g.fillRect(4, 10, 3, 1);
    g.fillStyle(0x8899cc, 1);
    g.fillRect(3, 7, 2, 1); g.fillRect(2, 5, 2, 1);
  });

  // deathMark — purple skull
  genSkill('deathMark', g => {
    g.fillStyle(0x220022, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0xaa44ff, 1); g.fillCircle(12, 10, 7);
    g.fillStyle(0x220022, 1); g.fillCircle(9, 9, 2); g.fillCircle(15, 9, 2);
    g.fillRect(11, 12, 2, 2);
    g.fillStyle(0xaa44ff, 1); g.fillRect(7, 16, 10, 3);
    g.fillStyle(0x220022, 1); g.fillRect(9, 16, 2, 3); g.fillRect(13, 16, 2, 3);
    g.fillStyle(0xdd88ff, 1); g.fillRect(9, 6, 3, 2); g.fillRect(13, 6, 3, 2);
  });

  // magicBolt — blue lightning bolt
  genSkill('magicBolt', g => {
    g.fillStyle(0x001133, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x113366, 1); g.fillCircle(12, 12, 8);
    g.fillStyle(0x4499ff, 1);
    g.fillRect(13, 2, 4, 9);
    g.fillRect(8, 9, 9, 4);
    g.fillRect(7, 13, 4, 9);
    g.fillStyle(0xaaddff, 1);
    g.fillRect(14, 3, 2, 6); g.fillRect(8, 14, 2, 6);
    g.fillStyle(0xffffff, 1); g.fillRect(14, 3, 1, 2); g.fillRect(8, 14, 1, 2);
  });

  // fireball — blazing orb
  genSkill('fireball', g => {
    g.fillStyle(0x440000, 1); g.fillCircle(12, 13, 10);
    g.fillStyle(0xaa2200, 1); g.fillCircle(12, 13, 8);
    g.fillStyle(0xff5500, 1); g.fillCircle(12, 13, 6);
    g.fillStyle(0xff9900, 1); g.fillCircle(12, 13, 4);
    g.fillStyle(0xffee00, 1); g.fillCircle(12, 13, 2);
    g.fillStyle(0xff4400, 1);
    g.fillRect(9, 3, 3, 6); g.fillRect(13, 2, 2, 7); g.fillRect(7, 6, 2, 5);
    g.fillStyle(0xff8800, 1); g.fillRect(10, 3, 2, 4); g.fillRect(14, 3, 1, 4);
  });

  // iceNova — cyan snowflake
  genSkill('iceNova', g => {
    g.fillStyle(0x002233, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x004455, 1); g.fillCircle(12, 12, 8);
    g.fillStyle(0x44ccee, 1);
    g.fillRect(2, 11, 20, 2); g.fillRect(11, 2, 2, 20);
    g.fillRect(5, 5, 2, 2); g.fillRect(17, 5, 2, 2); g.fillRect(5, 17, 2, 2); g.fillRect(17, 17, 2, 2);
    g.fillStyle(0x88eeff, 1);
    g.fillRect(2, 11, 3, 1); g.fillRect(19, 11, 3, 1); g.fillRect(11, 2, 1, 3); g.fillRect(11, 19, 1, 3);
    g.fillStyle(0xffffff, 1); g.fillCircle(12, 12, 2);
  });

  // arcaneShield — purple shield with arcane eye
  genSkill('arcaneShield', g => {
    g.fillStyle(0x1a0033, 1); g.fillRect(5, 2, 14, 17);
    g.fillRect(5, 19, 14, 1); g.fillRect(7, 20, 10, 1); g.fillRect(9, 21, 6, 1); g.fillRect(11, 22, 2, 1);
    g.fillStyle(0xaa44ff, 1);
    g.fillRect(5, 2, 14, 1); g.fillRect(5, 2, 1, 18); g.fillRect(18, 2, 1, 18);
    g.fillStyle(0x7722cc, 1); g.fillCircle(12, 11, 5);
    g.fillStyle(0xcc88ff, 1); g.fillCircle(12, 11, 3);
    g.fillStyle(0xffffff, 1); g.fillCircle(11, 10, 1);
    g.fillStyle(0xdd99ff, 1); g.fillRect(4, 18, 16, 1);
  });

  // powerStrike — glowing orange sword (warrior passive +atk)
  genSkill('powerStrike', g => {
    g.fillStyle(0x331100, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0xbbbbbb, 1); g.fillRect(11, 2, 3, 14);
    g.fillStyle(0xffffff, 1); g.fillRect(11, 2, 1, 12);
    g.fillStyle(0xaa8800, 1); g.fillRect(7, 14, 11, 3);
    g.fillStyle(0xffcc00, 1); g.fillRect(7, 14, 11, 1);
    g.fillStyle(0x663300, 1); g.fillRect(11, 17, 3, 5);
    g.fillStyle(0xff6600, 1); g.fillRect(12, 2, 1, 4); g.fillRect(10, 4, 1, 2);
  });

  // shieldWall — blue kite shield (warrior passive +def)
  genSkill('shieldWall', g => {
    g.fillStyle(0x001133, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x2244aa, 1); g.fillRect(6, 3, 12, 14);
    g.fillRect(7, 17, 10, 2); g.fillRect(9, 19, 6, 2); g.fillRect(11, 21, 2, 1);
    g.fillStyle(0x4466cc, 1); g.fillRect(7, 4, 10, 12);
    g.fillStyle(0x88aaff, 1); g.fillRect(11, 4, 2, 12); g.fillRect(7, 9, 10, 2);
    g.fillStyle(0xffffff, 1); g.fillRect(11, 8, 2, 1);
  });

  // toughness — red heart with HP cross (warrior passive +maxHp)
  genSkill('toughness', g => {
    g.fillStyle(0x330000, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(9, 9, 4); g.fillCircle(15, 9, 4);
    g.fillRect(5, 9, 14, 6);
    g.fillRect(6, 15, 12, 2); g.fillRect(8, 17, 8, 2); g.fillRect(10, 19, 4, 2); g.fillRect(11, 21, 2, 1);
    g.fillStyle(0xff4444, 1); g.fillCircle(8, 8, 2); g.fillCircle(14, 8, 2);
    g.fillStyle(0xff9999, 1); g.fillRect(8, 7, 2, 1);
    g.fillStyle(0xffffff, 1); g.fillRect(11, 10, 2, 6); g.fillRect(9, 12, 6, 2);
  });

  // criticalStrike — dagger over starburst (rogue passive +crit)
  genSkill('criticalStrike', g => {
    g.fillStyle(0x221100, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0xffcc00, 1);
    g.fillRect(11, 2, 2, 20); g.fillRect(2, 11, 20, 2);
    g.fillRect(5, 5, 2, 2); g.fillRect(17, 5, 2, 2); g.fillRect(5, 17, 2, 2); g.fillRect(17, 17, 2, 2);
    g.fillStyle(0xdddddd, 1); g.fillRect(11, 2, 2, 13);
    g.fillStyle(0xffffff, 1); g.fillRect(11, 2, 1, 11);
    g.fillStyle(0xaa8800, 1); g.fillRect(8, 13, 8, 2);
    g.fillStyle(0x553300, 1); g.fillRect(11, 15, 2, 6);
    g.fillStyle(0x885500, 1); g.fillRect(10, 20, 4, 2);
  });

  // evasion — silhouette with motion blur (rogue passive +dodge)
  genSkill('evasion', g => {
    g.fillStyle(0x001122, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x224455, 1);
    g.fillRect(2, 8, 9, 2); g.fillRect(2, 12, 7, 2); g.fillRect(2, 16, 9, 2);
    g.fillStyle(0x44aacc, 1);
    g.fillRect(3, 8, 6, 1); g.fillRect(3, 12, 4, 1); g.fillRect(3, 16, 5, 1);
    g.fillStyle(0x88ddff, 1); g.fillCircle(16, 6, 3);
    g.fillRect(14, 9, 4, 5);
    g.fillRect(13, 14, 2, 5); g.fillRect(16, 14, 2, 5);
    g.fillStyle(0xaaeeff, 1); g.fillCircle(16, 5, 1);
  });

  // poisonBlade — green dagger with drips (rogue passive +poison)
  genSkill('poisonBlade', g => {
    g.fillStyle(0x001100, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x669922, 1); g.fillRect(11, 2, 3, 14);
    g.fillStyle(0xaaffaa, 1); g.fillRect(11, 2, 1, 12);
    g.fillStyle(0xccff33, 1); g.fillRect(11, 2, 2, 2);
    g.fillStyle(0x446622, 1); g.fillRect(7, 14, 11, 3);
    g.fillStyle(0x223311, 1); g.fillRect(11, 17, 3, 5);
    g.fillStyle(0x44ff66, 1);
    g.fillCircle(8, 11, 2); g.fillCircle(16, 9, 2); g.fillCircle(7, 17, 1);
    g.fillStyle(0x88ff88, 1); g.fillRect(8, 10, 1, 1); g.fillRect(16, 8, 1, 1);
  });

  // arcaneKnowledge — open tome with rune (mage passive +mana)
  genSkill('arcaneKnowledge', g => {
    g.fillStyle(0x110033, 1); g.fillCircle(12, 12, 10);
    g.fillStyle(0x2233aa, 1); g.fillRect(5, 4, 14, 17);
    g.fillStyle(0x110055, 1); g.fillRect(5, 4, 2, 17);
    g.fillStyle(0xddddff, 1); g.fillRect(8, 5, 10, 15);
    g.fillStyle(0x8866ff, 1);
    g.fillRect(11, 7, 2, 9); g.fillRect(9, 11, 6, 2);
    g.fillRect(9, 7, 2, 2); g.fillRect(13, 7, 2, 2);
    g.fillStyle(0xcc99ff, 1); g.fillRect(11, 7, 1, 1);
    g.fillStyle(0xffcc44, 1); g.fillRect(18, 10, 2, 4);
    g.fillStyle(0x553300, 1); g.fillRect(5, 20, 14, 1);
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

function genTownPortal(scene) {
  const g = scene.make.graphics({ add: false });
  // Dark background
  g.fillStyle(0x000011, 1); g.fillRect(0, 0, T, T);
  // Outer glow ring (deep blue)
  g.fillStyle(0x002299, 1); g.fillEllipse(T / 2, T / 2, T - 4, T - 4);
  // Mid swirl (bright blue)
  g.fillStyle(0x1155ff, 1); g.fillEllipse(T / 2, T / 2, T - 10, T - 10);
  // Inner ring (lighter)
  g.fillStyle(0x5599ff, 1); g.fillEllipse(T / 2, T / 2, T - 18, T - 18);
  // Bright core
  g.fillStyle(0xaaccff, 1); g.fillEllipse(T / 2, T / 2, T - 24, T - 24);
  // White center
  g.fillStyle(0xffffff, 1); g.fillEllipse(T / 2, T / 2, 8, 8);
  g.generateTexture('town-portal', T, T);
  g.destroy();
}

export function generateAllTextures(scene) {
  genVoid(scene);
  genWall(scene);
  genFloor(scene);
  genGrass(scene);
  genNPC(scene);
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
  genSkillIcons(scene);
  genTownPortal(scene);

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
  '11': 'tile-grass',
  '12': 'tile-npc',
};
