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
  // Dark gray-brown base
  g.fillStyle(0x3a3020, 1); g.fillRect(0, 0, T, T);
  // Slightly warmer grain patches
  g.fillStyle(0x4a3c24, 1);
  g.fillRect(4, 4, 8, 2);
  g.fillRect(18, 10, 6, 2);
  g.fillRect(8, 20, 10, 2);
  g.fillRect(22, 26, 5, 2);
  // Cool dark gray cracks
  g.fillStyle(0x252520, 1);
  g.fillRect(2, 14, 5, 1);
  g.fillRect(16, 6, 4, 1);
  g.fillRect(24, 20, 5, 1);
  g.fillRect(10, 28, 6, 1);
  // Gray-toned secondary variation patches
  g.fillStyle(0x2e2c24, 1);
  g.fillRect(14, 2, 6, 2);
  g.fillRect(2, 22, 4, 2);
  g.fillRect(26, 14, 4, 2);
  // Near-black border
  g.fillStyle(0x151410, 1);
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
  // Transparent background — floor tile shows through
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
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
  // Transparent background — floor tile shows through
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
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
  // Legs / worn trousers
  g.fillStyle(0x5a3e28, 1); g.fillRect(9, 19, 5, 8); g.fillRect(18, 19, 5, 8);
  // Shirt body (linen / rags)
  g.fillStyle(0xc8a070, 1); g.fillRect(8, 12, 16, 10);
  g.fillStyle(0xdcb884, 1); g.fillRect(9, 12, 14, 4); // shirt highlight
  // Sleeves (shirt, no pauldrons)
  g.fillStyle(0xc8a070, 1); g.fillRect(4, 12, 5, 5); g.fillRect(23, 12, 5, 5);
  // Neck
  g.fillStyle(0xd4a96a, 1); g.fillRect(13, 9, 6, 4);
  // Head
  g.fillStyle(0xd4a96a, 1); g.fillRect(10, 2, 12, 10);
  // Hair (no helmet on base sprite)
  g.fillStyle(0x3a2010, 1); g.fillRect(9, 2, 14, 4);
  // Eyes
  g.fillStyle(0x44aaff, 1); g.fillRect(12, 6, 3, 2); g.fillRect(17, 6, 3, 2);
  g.generateTexture('player', T, T);
  g.destroy();
}

function genMonster(scene, id, cfg) {
  const { color, char, hp } = cfg;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);

  // Different body shapes per monster type
  switch (id) {
    case 'rat': {
      // Side-profile rat — thin, flat, medium gray, walking stride.

      // Tail — thin single-pixel-height lines, medium gray, curves up from rear
      g.fillStyle(0x999999, 1);
      g.fillRect(1, 19, 6, 1);   // horizontal base
      g.fillRect(1, 17, 1, 3);   // upward curl
      g.fillRect(2, 17, 2, 1);   // curl tip

      // Body — thin elongated ellipse, medium gray, flat vertical profile
      g.fillStyle(0x888888, 1);
      g.fillEllipse(15, 21, 22, 8);

      // Head — flat, slightly lighter, wedge-shaped using a short wide ellipse
      g.fillStyle(0x999999, 1);
      g.fillEllipse(25, 19, 12, 7);

      // Ear — small, flat round, slightly darker, pink inside
      g.fillStyle(0x777777, 1);
      g.fillCircle(23, 14, 3);
      g.fillStyle(0xbb6666, 1);
      g.fillCircle(23, 15, 1);

      // Eye — small red dot
      g.fillStyle(0xdd2222, 1); g.fillCircle(28, 17, 2);
      g.fillStyle(0xff9999, 1); g.fillCircle(28, 17, 1);

      // Snout — narrow pointed tip
      g.fillStyle(0x999999, 1);
      g.fillEllipse(31, 20, 5, 4);
      g.fillStyle(0xcc5555, 1); g.fillCircle(31, 21, 1); // nose

      // Whiskers
      g.fillStyle(0xbbbbbb, 1);
      g.fillRect(28, 19, 4, 1);
      g.fillRect(28, 21, 4, 1);

      // Paws — thin small ovals, same medium gray, stride pose
      g.fillStyle(0xaaaaaa, 1);
      g.fillEllipse(9,  26, 7, 3);   // rear grounded
      g.fillEllipse(18, 26, 7, 3);   // front grounded
      g.fillEllipse(6,  23, 5, 3);   // rear raised
      g.fillEllipse(22, 23, 5, 3);   // front raised
      break;
    }

    case 'goblin': {
      const GS  = 0x2e6612;   // dark green skin
      const GS2 = 0x1a3d08;   // shadow
      const GL  = 0x3a2208;   // dark leather
      const GL2 = 0x221205;   // darker leather seam
      const GE  = 0x080808;   // eye socket

      // Ears — small pointed
      g.fillStyle(GS, 1);
      g.fillTriangle(11, 12, 13, 12, 12, 7);  // left
      g.fillTriangle(19, 12, 21, 12, 20, 7);  // right
      g.fillStyle(GS2, 1);
      g.fillTriangle(12, 12, 13, 12, 12, 8);
      g.fillTriangle(19, 12, 20, 12, 20, 8);

      // Head — compact block
      g.fillStyle(GS, 1);
      g.fillRect(11, 8, 10, 9);
      g.fillRect(10, 9, 12, 7);

      // Brow ridge
      g.fillStyle(GS2, 1);
      g.fillRect(10, 11, 12, 2);

      // Eyes
      g.fillStyle(GE, 1);
      g.fillRect(11, 11, 3, 3);
      g.fillRect(18, 11, 3, 3);
      g.fillStyle(0xaa1111, 1);
      g.fillRect(12, 12, 2, 2);
      g.fillRect(19, 12, 2, 2);
      g.fillStyle(0xff6666, 1);
      g.fillRect(12, 12, 1, 1);
      g.fillRect(19, 12, 1, 1);

      // Nose
      g.fillStyle(GS2, 1);
      g.fillRect(14, 14, 4, 1);

      // Mouth + tooth
      g.fillStyle(GE, 1);
      g.fillRect(13, 15, 6, 2);
      g.fillStyle(0xcccc88, 1);
      g.fillRect(15, 15, 2, 2);

      // Neck
      g.fillStyle(GS, 1);
      g.fillRect(14, 17, 4, 2);

      // Torso — leather vest, tight
      g.fillStyle(GS, 1);
      g.fillRect(12, 19, 8, 7);
      g.fillStyle(GL, 1);
      g.fillRect(13, 19, 6, 7);
      g.fillStyle(GL2, 1);
      g.fillRect(13, 21, 6, 1);
      g.fillRect(15, 19, 2, 7);

      // Belt
      g.fillStyle(GL2, 1);
      g.fillRect(12, 26, 8, 2);
      g.fillStyle(0x666666, 1);
      g.fillRect(14, 26, 4, 2);
      g.fillStyle(0x999999, 1);
      g.fillRect(15, 27, 2, 1);

      // Arms — narrow, tight to body
      g.fillStyle(GS, 1);
      g.fillRect(9,  20, 3, 2);   // left upper arm
      g.fillRect(9,  22, 2, 4);   // left forearm
      g.fillRect(20, 20, 3, 2);   // right upper arm
      g.fillRect(21, 22, 2, 4);   // right forearm
      g.fillStyle(GS2, 1);
      g.fillRect(9,  25, 3, 2);   // left fist
      g.fillRect(21, 25, 3, 2);   // right fist

      // Legs — very short
      g.fillStyle(GS, 1);
      g.fillRect(13, 28, 3, 3);
      g.fillRect(17, 28, 3, 3);
      g.fillStyle(GS2, 1);
      g.fillRect(12, 30, 4, 1);
      g.fillRect(17, 30, 4, 1);
      break;
    }

    case 'skeleton': {
      const BONE  = 0xddd5b8; // warm cream bone
      const DARK  = 0x111111;
      const TEAL  = 0x3a6b58; // teal tunic cloth
      const TEAL2 = 0x2d5244; // darker teal shading

      // ── Skull ────────────────────────────────────────────
      g.fillStyle(BONE, 1);
      g.fillCircle(16, 8, 6);

      // Eye sockets — large solid black squares, no highlight
      g.fillStyle(DARK, 1);
      g.fillRect(11, 5, 4, 4); // left socket
      g.fillRect(17, 5, 4, 4); // right socket

      // Cheekbones / lower skull
      g.fillStyle(BONE, 1);
      g.fillRect(11, 13, 2, 2); // left cheek
      g.fillRect(19, 13, 2, 2); // right cheek

      // ── Neck ────────────────────────────────────────────
      g.fillStyle(BONE, 1);
      g.fillRect(15, 14, 2, 3);

      // ── Tunic — teal cloth panels (sides) ───────────────
      g.fillStyle(TEAL, 1);
      g.fillRect(10, 17, 4, 11); // left panel
      g.fillRect(18, 17, 4, 11); // right panel
      g.fillStyle(TEAL2, 1);
      g.fillRect(10, 24, 4, 4);  // left lower shade
      g.fillRect(18, 24, 4, 4);  // right lower shade

      // ── Ribcage — narrow centre, 4 ribs ─────────────────
      g.fillStyle(BONE, 1);
      g.fillRect(12, 17, 8, 11); // solid bone background
      g.fillStyle(0x88805a, 1);  // darker rib-gap lines
      for (let i = 0; i < 4; i++) {
        g.fillRect(12, 19 + i * 2, 8, 1);
      }

      // ── Thin bone arms — shorter ────────────────────────
      g.fillStyle(BONE, 1);
      g.fillRect(6,  18, 4, 2); // left upper arm
      g.fillRect(6,  20, 2, 3); // left forearm
      g.fillRect(22, 18, 4, 2); // right upper arm
      g.fillRect(24, 20, 2, 3); // right forearm
      // Knuckles
      g.fillRect(5,  22, 3, 2); // left hand
      g.fillRect(24, 22, 3, 2); // right hand

      // ── Lower robe — teal, covers upper legs ─────────────
      g.fillStyle(TEAL, 1);
      g.fillRect(11, 28, 10, 2);
      g.fillStyle(TEAL2, 1);
      g.fillRect(11, 29, 10, 1);

      // Bone legs — longer, clearly visible below robe
      g.fillStyle(BONE, 1);
      g.fillRect(13, 28, 2, 5); // left leg
      g.fillRect(17, 28, 2, 5); // right leg
      // Feet
      g.fillRect(12, 32, 3, 1); // left foot
      g.fillRect(17, 32, 3, 1); // right foot
      break;
    }

    case 'orc': {
      const SKIN   = 0x4a6e28; // dark olive green
      const SKIN2  = 0x3a5a1e; // shadow green
      const ARMOR  = 0x6b4218; // brown leather/shell
      const ARMOR2 = 0x4e2e0e; // dark armor seams
      const BELT   = 0xcc6622; // orange belt
      const BUCKLE = 0x999999; // grey buckle

      // ── Head — wide, rounded, squat ──────────────────────
      g.fillStyle(SKIN, 1);
      g.fillRect(10, 4, 12, 10);  // head block
      g.fillRect(9,  5, 14, 8);   // widen mid-head

      // Mohawk ridge
      g.fillStyle(SKIN2, 1);
      g.fillRect(13, 2, 6, 3);
      g.fillRect(14, 1, 4, 2);

      // Brow ridge — darker, overhanging
      g.fillStyle(SKIN2, 1);
      g.fillRect(9, 8, 14, 2);

      // Eyes — small, angry, deep-set
      g.fillStyle(0x111111, 1);
      g.fillRect(11, 9,  3, 3);
      g.fillRect(18, 9,  3, 3);
      g.fillStyle(0xdd3300, 1);
      g.fillRect(12, 10, 1, 1); // left glint
      g.fillRect(19, 10, 1, 1); // right glint

      // Tusks — upward from lower jaw
      g.fillStyle(0xd4c47a, 1);
      g.fillRect(13, 13, 2, 4); // left tusk
      g.fillRect(17, 13, 2, 4); // right tusk

      // Lower jaw
      g.fillStyle(SKIN, 1);
      g.fillRect(11, 13, 10, 3);

      // ── Neck ─────────────────────────────────────────────
      g.fillStyle(SKIN, 1);
      g.fillRect(14, 16, 4, 2);

      // ── Shell / leather chest armor ───────────────────────
      g.fillStyle(ARMOR, 1);
      g.fillRect(8, 18, 16, 10); // main chest plate

      // Armor segments (shell divisions)
      g.fillStyle(ARMOR2, 1);
      g.fillRect(8,  21, 16, 1); // horizontal seam 1
      g.fillRect(8,  24, 16, 1); // horizontal seam 2
      g.fillRect(15, 18, 1, 10); // vertical centre seam

      // Shoulder pads — slightly raised blocks
      g.fillStyle(ARMOR, 1);
      g.fillRect(5,  16, 5, 5);  // left shoulder
      g.fillRect(22, 16, 5, 5);  // right shoulder
      g.fillStyle(ARMOR2, 1);
      g.fillRect(5,  19, 5, 1);  // left pad seam
      g.fillRect(22, 19, 5, 1);  // right pad seam

      // ── Arms — thick green skin below pads ───────────────
      g.fillStyle(SKIN, 1);
      g.fillRect(4,  21, 4, 6);  // left arm
      g.fillRect(24, 21, 4, 6);  // right arm
      // Fists
      g.fillStyle(SKIN2, 1);
      g.fillRect(3,  26, 5, 3);  // left fist
      g.fillRect(24, 26, 5, 3);  // right fist

      // ── Belt ─────────────────────────────────────────────
      g.fillStyle(BELT, 1);
      g.fillRect(8, 28, 16, 3);
      g.fillStyle(BUCKLE, 1);
      g.fillRect(14, 28, 4, 3);  // buckle centre
      g.fillStyle(0x666666, 1);
      g.fillRect(15, 29, 2, 1);  // buckle pin

      // ── Legs — short, stocky ─────────────────────────────
      g.fillStyle(SKIN, 1);
      g.fillRect(9,  31, 5, 2);  // left leg
      g.fillRect(18, 31, 5, 2);  // right leg
      // Feet
      g.fillStyle(SKIN2, 1);
      g.fillRect(8,  32, 6, 1);  // left foot
      g.fillRect(18, 32, 6, 1);  // right foot
      break;
    }

    case 'bat': {
      const BW  = 0x1a0d2e; // dark wing
      const BW2 = 0x2e1650; // lighter wing membrane
      const BFR = 0x2a1a3a; // body/fur

      // Wing membranes — spread wide
      g.fillStyle(BW, 1);
      g.fillTriangle(0, 22, 12, 14, 13, 25);
      g.fillTriangle(32, 22, 20, 14, 19, 25);
      // Membrane texture (slightly lighter inner area)
      g.fillStyle(BW2, 1);
      g.fillTriangle(2, 22, 12, 16, 12, 24);
      g.fillTriangle(30, 22, 20, 16, 20, 24);
      // Wing fingers — thin dark lines
      g.fillStyle(BW, 1);
      g.fillRect(1, 16, 11, 1);
      g.fillRect(3, 19, 9,  1);
      g.fillRect(21, 16, 11, 1);
      g.fillRect(21, 19, 9,  1);

      // Body
      g.fillStyle(BFR, 1);
      g.fillEllipse(16, 22, 10, 9);

      // Head — round, between ears
      g.fillStyle(BFR, 1);
      g.fillCircle(16, 14, 5);

      // Ears — tall pointed
      g.fillStyle(BW, 1);
      g.fillTriangle(11, 14, 13, 5,  15, 13);
      g.fillTriangle(21, 14, 19, 5,  17, 13);
      // Ear inner
      g.fillStyle(0x7a2060, 1);
      g.fillTriangle(12, 13, 13, 7,  14, 13);
      g.fillTriangle(20, 13, 19, 7,  18, 13);

      // Eyes — small glowing red
      g.fillStyle(0xcc0000, 1); g.fillRect(13, 13, 2, 2);
      g.fillStyle(0xcc0000, 1); g.fillRect(18, 13, 2, 2);
      g.fillStyle(0xff6666, 1); g.fillRect(13, 13, 1, 1);
      g.fillStyle(0xff6666, 1); g.fillRect(18, 13, 1, 1);

      // Fangs
      g.fillStyle(0xeeeecc, 1);
      g.fillRect(15, 18, 1, 2);
      g.fillRect(17, 18, 1, 2);

      // Feet/claws gripping
      g.fillStyle(BW, 1);
      g.fillRect(14, 27, 1, 3); g.fillRect(17, 27, 1, 3);
      g.fillRect(13, 29, 2, 1); g.fillRect(17, 29, 2, 1);
      break;
    }

    case 'spider': {
      const SC  = 0x3d1f08; // dark brown carapace
      const SC2 = 0x5c3217; // mid brown
      const SC3 = 0x7a4a28; // highlight

      // Abdomen — smaller, pulled up
      g.fillStyle(SC, 1);
      g.fillEllipse(16, 18, 13, 9);
      // Abdomen highlight stripe
      g.fillStyle(SC3, 1);
      g.fillEllipse(16, 17, 5, 3);

      // Cephalothorax (front body)
      g.fillStyle(SC2, 1);
      g.fillEllipse(16, 13, 10, 9);

      // Eye cluster — 4 red eyes across brow
      g.fillStyle(0x111111, 1);
      g.fillRect(11, 9, 10, 4);
      g.fillStyle(0xdd1111, 1);
      g.fillRect(12, 10, 2, 2);
      g.fillRect(15, 10, 2, 2);
      g.fillRect(18, 10, 2, 2);
      // highlight glints
      g.fillStyle(0xff7777, 1);
      g.fillRect(12, 10, 1, 1);
      g.fillRect(15, 10, 1, 1);
      g.fillRect(18, 10, 1, 1);

      // Fangs / chelicerae — shorter
      g.fillStyle(SC3, 1);
      g.fillRect(14, 16, 2, 2);
      g.fillRect(17, 16, 2, 2);
      g.fillStyle(0xddcc88, 1);
      g.fillRect(14, 17, 1, 1);
      g.fillRect(18, 17, 1, 1);

      // 8 legs — each goes OUT from body side, then bends DOWN
      g.fillStyle(SC, 1);
      // Left legs: horizontal segment out, then vertical segment downward
      g.fillRect(4,  9,  7, 2);  g.fillRect(4,  11, 2, 5);  // L1
      g.fillRect(2,  12, 9, 2);  g.fillRect(2,  14, 2, 6);  // L2
      g.fillRect(3,  15, 8, 2);  g.fillRect(3,  17, 2, 6);  // L3
      g.fillRect(5,  17, 6, 2);  g.fillRect(5,  19, 2, 5);  // L4
      // Right legs (mirrored)
      g.fillRect(21, 9,  7, 2);  g.fillRect(26, 11, 2, 5);  // R1
      g.fillRect(21, 12, 9, 2);  g.fillRect(28, 14, 2, 6);  // R2
      g.fillRect(21, 15, 8, 2);  g.fillRect(27, 17, 2, 6);  // R3
      g.fillRect(21, 17, 6, 2);  g.fillRect(25, 19, 2, 5);  // R4
      break;
    }

    case 'troll': {
      const TS  = 0x4a6878; // blue-gray skin
      const TS2 = 0x334d5c; // shadow
      const TS3 = 0x6a90a8; // highlight
      const TR  = 0x5a7060; // rocky wart/hide texture

      // Hunched massive body
      g.fillStyle(TS, 1);
      g.fillRect(5, 14, 22, 15); // torso
      g.fillRect(3, 16, 26, 10); // widen mid

      // Skin texture bumps
      g.fillStyle(TS2, 1);
      g.fillRect(7,  16, 3, 2);
      g.fillRect(14, 18, 4, 2);
      g.fillRect(20, 15, 3, 2);
      g.fillStyle(TR, 1);
      g.fillRect(9,  20, 2, 2);
      g.fillRect(18, 21, 2, 2);
      g.fillRect(13, 23, 2, 2);

      // Head — huge, low-browed, sunken into shoulders
      g.fillStyle(TS, 1);
      g.fillRect(8, 5, 16, 11);
      g.fillRect(7, 7, 18, 8);

      // Brow shelf — heavy
      g.fillStyle(TS2, 1);
      g.fillRect(6, 10, 20, 3);

      // Eyes — deep orange, small under brow
      g.fillStyle(0x111111, 1);
      g.fillRect(10, 11, 4, 3);
      g.fillRect(18, 11, 4, 3);
      g.fillStyle(0xff6600, 1);
      g.fillRect(11, 12, 2, 2);
      g.fillRect(19, 12, 2, 2);

      // Nose — wide flat
      g.fillStyle(TS2, 1);
      g.fillRect(14, 14, 4, 2);

      // Jaw / underbite teeth
      g.fillStyle(TS, 1);
      g.fillRect(10, 16, 12, 3);
      g.fillStyle(0xd4c47a, 1);
      g.fillRect(12, 17, 2, 3);
      g.fillRect(15, 17, 2, 3);
      g.fillRect(18, 17, 2, 3);

      // Arms — huge, dragging near floor
      g.fillStyle(TS, 1);
      g.fillRect(0,  15, 5, 14); // left arm
      g.fillRect(27, 15, 5, 14); // right arm
      // Knuckles
      g.fillStyle(TS2, 1);
      g.fillRect(0,  27, 5, 3);
      g.fillRect(27, 27, 5, 3);
      // Rocky knuckle bumps
      g.fillStyle(TR, 1);
      g.fillRect(1, 27, 1, 2);
      g.fillRect(3, 27, 1, 2);
      g.fillRect(28, 27, 1, 2);
      g.fillRect(30, 27, 1, 2);

      // Legs — thick, splayed out
      g.fillStyle(TS, 1);
      g.fillRect(6,  29, 7, 3);
      g.fillRect(19, 29, 7, 3);
      g.fillStyle(TS2, 1);
      g.fillRect(5,  31, 9, 1);
      g.fillRect(18, 31, 9, 1);
      break;
    }

    case 'vampire': {
      const VC  = 0x0f0008; // near-black cape
      const VC2 = 0x3d0020; // deep crimson cape lining
      const VF  = 0xf0ddd0; // pale skin
      const VF2 = 0xd4b8a8; // skin shadow

      // Cape — wide, draping silhouette
      g.fillStyle(VC, 1);
      g.fillRect(5, 16, 22, 16);
      // Cape collar — raised V shape
      g.fillRect(5, 13, 5, 6);
      g.fillRect(22, 13, 5, 6);
      // Cape lining (inner crimson)
      g.fillStyle(VC2, 1);
      g.fillRect(7, 16, 4, 14);
      g.fillRect(21, 16, 4, 14);
      // Cape bottom — pointed hem
      g.fillStyle(VC, 1);
      g.fillTriangle(5, 32, 16, 26, 10, 32);
      g.fillTriangle(27, 32, 16, 26, 22, 32);

      // Slicked widow-peak hair
      g.fillStyle(0x111111, 1);
      g.fillRect(10, 2, 12, 3);
      g.fillRect(12, 1, 8, 2);
      g.fillRect(15, 0, 2, 3); // widow peak

      // Head — pale, narrow
      g.fillStyle(VF, 1);
      g.fillRect(11, 4, 10, 12);
      g.fillRect(10, 5, 12, 10);

      // Brow — slightly darker
      g.fillStyle(VF2, 1);
      g.fillRect(10, 8, 12, 2);

      // Eyes — glowing red with dark socket
      g.fillStyle(0x1a0000, 1);
      g.fillRect(11, 8, 4, 4);
      g.fillRect(17, 8, 4, 4);
      g.fillStyle(0xdd0000, 1);
      g.fillRect(12, 9, 3, 3);
      g.fillRect(18, 9, 3, 3);
      g.fillStyle(0xff8888, 1);
      g.fillRect(13, 9, 1, 1);
      g.fillRect(19, 9, 1, 1);

      // Nose — thin, sharp
      g.fillStyle(VF2, 1);
      g.fillRect(15, 12, 2, 2);

      // Mouth + fangs
      g.fillStyle(0x330000, 1);
      g.fillRect(13, 14, 6, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, 14, 2, 3); // left fang
      g.fillRect(18, 14, 2, 3); // right fang
      // Blood drip
      g.fillStyle(0xcc0000, 1);
      g.fillRect(15, 16, 1, 2);

      // Hands — pale, emerging from cape
      g.fillStyle(VF, 1);
      g.fillRect(3,  18, 4, 5);
      g.fillRect(25, 18, 4, 5);
      // Claw tips
      g.fillStyle(0xcccccc, 1);
      g.fillRect(3,  22, 1, 2); g.fillRect(5,  22, 1, 2);
      g.fillRect(25, 22, 1, 2); g.fillRect(27, 22, 1, 2);
      break;
    }

    case 'darkMage': {
      const MR  = 0x1e0038; // deep robe
      const MR2 = 0x3a006e; // robe highlight
      const MR3 = 0x5500aa; // trim/accent
      const MS  = 0xd0c0e0; // pale skin

      // Pointed hat — tall
      g.fillStyle(MR, 1);
      g.fillTriangle(16, 0, 10, 10, 22, 10);
      // Hat brim
      g.fillStyle(MR3, 1);
      g.fillRect(8, 9, 16, 3);
      // Hat band star/rune
      g.fillStyle(0xaa44ff, 1);
      g.fillRect(15, 9, 2, 3);

      // Head
      g.fillStyle(MS, 1);
      g.fillRect(11, 11, 10, 9);
      g.fillRect(10, 12, 12, 7);

      // Eyes — glowing purple
      g.fillStyle(0x111111, 1);
      g.fillRect(11, 13, 3, 3);
      g.fillRect(18, 13, 3, 3);
      g.fillStyle(0xaa44ff, 1);
      g.fillRect(12, 14, 2, 2);
      g.fillRect(19, 14, 2, 2);
      g.fillStyle(0xddaaff, 1);
      g.fillRect(12, 14, 1, 1);
      g.fillRect(19, 14, 1, 1);

      // Beard — short grey
      g.fillStyle(0xaaaaaa, 1);
      g.fillRect(13, 18, 6, 2);
      g.fillRect(14, 20, 4, 1);

      // Robe body
      g.fillStyle(MR, 1);
      g.fillRect(10, 20, 12, 11);
      g.fillRect(8,  22, 16, 8);  // wider mid
      // Robe trim
      g.fillStyle(MR3, 1);
      g.fillRect(8,  22, 2, 9);   // left trim
      g.fillRect(22, 22, 2, 9);   // right trim
      g.fillRect(8,  22, 16, 1);  // top trim
      // Robe centre rune stripe
      g.fillStyle(MR2, 1);
      g.fillRect(15, 20, 2, 11);

      // Sleeves
      g.fillStyle(MR, 1);
      g.fillRect(5,  21, 6, 4);
      g.fillRect(21, 21, 6, 4);
      // Hands — pale
      g.fillStyle(MS, 1);
      g.fillRect(4,  24, 4, 4);
      g.fillRect(24, 24, 4, 4);

      // Staff — held in left hand, tall and glowing
      g.fillStyle(0x6633aa, 1);
      g.fillRect(3, 5, 2, 22);
      // Orb on top
      g.fillStyle(0x220044, 1); g.fillCircle(4, 4, 4);
      g.fillStyle(0xcc44ff, 1); g.fillCircle(4, 4, 3);
      g.fillStyle(0xeeccff, 1); g.fillCircle(3, 3, 1);

      // Legs below robe
      g.fillStyle(MR, 1);
      g.fillRect(11, 31, 4, 1);
      g.fillRect(17, 31, 4, 1);
      break;
    }

    case 'demon': {
      const DR  = 0x6e0000; // dark crimson skin
      const DR2 = 0x9a1111; // mid red
      const DR3 = 0xcc3322; // highlight red
      const DH  = 0x1a1a1a; // horn/claw black
      const DW  = 0x3d0000; // dark wing membrane

      // Wings — leathery, spread behind body
      g.fillStyle(DW, 1);
      g.fillTriangle(0, 24, 8, 10, 10, 26);
      g.fillTriangle(32, 24, 24, 10, 22, 26);
      // Wing fingers
      g.fillStyle(DH, 1);
      g.fillRect(0, 11, 8, 1);
      g.fillRect(1, 16, 7, 1);
      g.fillRect(24, 11, 8, 1);
      g.fillRect(24, 16, 7, 1);

      // Body — muscular, wide
      g.fillStyle(DR, 1);
      g.fillRect(8, 16, 16, 14);
      g.fillRect(6, 18, 20, 10);
      // Muscle definition
      g.fillStyle(DR2, 1);
      g.fillRect(10, 17, 5, 8);
      g.fillRect(17, 17, 5, 8);
      g.fillStyle(DR3, 1);
      g.fillRect(11, 17, 2, 6);
      g.fillRect(18, 17, 2, 6);

      // Loincloth/belt
      g.fillStyle(0x111111, 1);
      g.fillRect(10, 26, 12, 4);
      g.fillStyle(DH, 1);
      g.fillRect(14, 26, 4, 4);

      // Head
      g.fillStyle(DR, 1);
      g.fillRect(10, 7, 12, 10);
      g.fillRect(9, 8, 14, 8);

      // Horns — thick, sweeping outward
      g.fillStyle(DH, 1);
      g.fillTriangle(10, 9, 7,  0, 13, 7);
      g.fillTriangle(22, 9, 25, 0, 19, 7);
      // Horn highlight
      g.fillStyle(0x555555, 1);
      g.fillRect(9, 3, 2, 5);
      g.fillRect(22, 3, 2, 5);

      // Brow ridge
      g.fillStyle(DR2, 1);
      g.fillRect(9, 11, 14, 2);

      // Eyes — orange fire glow
      g.fillStyle(0x111111, 1);
      g.fillRect(10, 11, 4, 4);
      g.fillRect(18, 11, 4, 4);
      g.fillStyle(0xff6600, 1);
      g.fillRect(11, 12, 3, 3);
      g.fillRect(19, 12, 3, 3);
      g.fillStyle(0xffcc00, 1);
      g.fillRect(12, 12, 1, 1);
      g.fillRect(20, 12, 1, 1);

      // Jaw / fanged mouth
      g.fillStyle(0x1a0000, 1);
      g.fillRect(12, 15, 8, 3);
      g.fillStyle(0xddcc88, 1);
      g.fillRect(13, 15, 2, 3);
      g.fillRect(16, 15, 2, 3);
      g.fillRect(19, 15, 2, 3);

      // Arms — muscular, clawed
      g.fillStyle(DR, 1);
      g.fillRect(3,  17, 6, 8);
      g.fillRect(23, 17, 6, 8);
      // Forearms
      g.fillStyle(DR2, 1);
      g.fillRect(3,  22, 6, 4);
      g.fillRect(23, 22, 6, 4);
      // Claws
      g.fillStyle(DH, 1);
      g.fillRect(2,  25, 2, 3); g.fillRect(5, 25, 2, 3);
      g.fillRect(23, 25, 2, 3); g.fillRect(26, 25, 2, 3);

      // Legs
      g.fillStyle(DR, 1);
      g.fillRect(9,  30, 5, 2);
      g.fillRect(18, 30, 5, 2);
      g.fillStyle(DH, 1);
      g.fillRect(8,  31, 3, 1); g.fillRect(12, 31, 3, 1);
      g.fillRect(17, 31, 3, 1); g.fillRect(21, 31, 3, 1);
      break;
    }

    case 'dungeonLord': {
      const DL  = 0x0d0018; // near-black armor
      const DL2 = 0x2a0044; // deep purple
      const DL3 = 0x5a0088; // purple highlight
      const DG  = 0xffd700; // gold trim
      const DG2 = 0xb8960a; // dark gold
      const DW  = 0x1a0030; // wing dark
      const DW2 = 0x3a0060; // wing mid

      // Wings — massive, dominating the tile
      g.fillStyle(DW, 1);
      g.fillTriangle(0, 28, 6, 4,  13, 20);
      g.fillTriangle(32, 28, 26, 4, 19, 20);
      g.fillStyle(DW2, 1);
      g.fillTriangle(1, 28, 6, 8,  11, 20);
      g.fillTriangle(31, 28, 26, 8, 21, 20);
      // Wing finger bones
      g.fillStyle(DG2, 1);
      g.fillRect(6, 5,  7, 1);
      g.fillRect(5, 10, 7, 1);
      g.fillRect(4, 16, 8, 1);
      g.fillRect(19, 5, 7, 1);
      g.fillRect(20, 10, 7, 1);
      g.fillRect(20, 16, 8, 1);

      // Crown — three spikes, gold
      g.fillStyle(DG, 1);
      g.fillRect(9, 4, 14, 3);     // base band
      g.fillRect(9, 0, 3, 5);      // left spike
      g.fillRect(14, 0, 4, 6);     // centre spike (tallest)
      g.fillRect(20, 0, 3, 5);     // right spike
      // Gems on crown
      g.fillStyle(0xff00ff, 1);
      g.fillRect(10, 1, 2, 2);
      g.fillRect(15, 0, 2, 3);
      g.fillRect(21, 1, 2, 2);

      // Head — imposing, angular
      g.fillStyle(DL2, 1);
      g.fillRect(10, 6, 12, 10);
      g.fillRect(9,  7, 14, 8);

      // Visor/face mask
      g.fillStyle(DL, 1);
      g.fillRect(10, 8, 12, 5);
      // Eye slits — magenta glow
      g.fillStyle(0xff00ff, 1);
      g.fillRect(11, 9,  4, 2);
      g.fillRect(17, 9,  4, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(12, 9,  2, 1);
      g.fillRect(18, 9,  2, 1);

      // Jaw/chin plate
      g.fillStyle(DL2, 1);
      g.fillRect(11, 13, 10, 4);
      // Gold jaw trim
      g.fillStyle(DG, 1);
      g.fillRect(10, 16, 12, 1);

      // Pauldrons — wide gold-trimmed shoulder armour
      g.fillStyle(DL2, 1);
      g.fillRect(4,  16, 7, 7);
      g.fillRect(21, 16, 7, 7);
      g.fillStyle(DG, 1);
      g.fillRect(4,  16, 7, 1); // top trim
      g.fillRect(4,  22, 7, 1); // bottom trim
      g.fillRect(21, 16, 7, 1);
      g.fillRect(21, 22, 7, 1);

      // Chest armor — layered plates
      g.fillStyle(DL, 1);
      g.fillRect(9, 17, 14, 13);
      g.fillStyle(DL2, 1);
      g.fillRect(10, 18, 12, 5);
      g.fillRect(10, 24, 12, 5);
      // Gold chest trim lines
      g.fillStyle(DG, 1);
      g.fillRect(9,  17, 14, 1);
      g.fillRect(9,  23, 14, 1);
      g.fillRect(15, 17, 2, 13); // centre line
      // Purple gem in centre
      g.fillStyle(0xcc00ff, 1); g.fillRect(14, 19, 4, 3);
      g.fillStyle(0xffffff, 1); g.fillRect(14, 19, 1, 1);

      // Gauntlets
      g.fillStyle(DL2, 1);
      g.fillRect(3,  20, 4, 7);
      g.fillRect(25, 20, 4, 7);
      g.fillStyle(DG, 1);
      g.fillRect(3,  20, 4, 1);
      g.fillRect(25, 20, 4, 1);
      // Claw fingers
      g.fillStyle(0x333333, 1);
      g.fillRect(2,  26, 2, 3); g.fillRect(5, 26, 2, 3);
      g.fillRect(25, 26, 2, 3); g.fillRect(28, 26, 2, 3);

      // Legs — armoured greaves
      g.fillStyle(DL2, 1);
      g.fillRect(10, 30, 5, 2);
      g.fillRect(17, 30, 5, 2);
      g.fillStyle(DG, 1);
      g.fillRect(10, 30, 5, 1);
      g.fillRect(17, 30, 5, 1);
      break;
    }
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
  genArmorOverlays(scene);
  genWeaponOverlays(scene);

  for (const [id, def] of Object.entries(MONSTERS)) {
    genMonster(scene, id, def);
  }
}

// ── Armor overlay textures (drawn transparently over the player sprite) ──────
function genArmorOverlay(scene, key, chestColor, hiColor, helmColor = null) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
  const a = 0.78;
  // Chest body
  g.fillStyle(chestColor, a); g.fillRect(8, 12, 16, 10);
  // Chest highlight
  g.fillStyle(hiColor, a); g.fillRect(9, 12, 14, 3);
  // Pauldrons
  g.fillStyle(chestColor, a); g.fillRect(4, 12, 5, 5); g.fillRect(23, 12, 5, 5);
  // Optional helmet
  if (helmColor !== null) {
    g.fillStyle(helmColor, a); g.fillRect(9, 2, 14, 5);
    g.fillStyle(hiColor, a * 0.7); g.fillRect(10, 2, 12, 2);
  }
  g.generateTexture(key, T, T);
  g.destroy();
}

function genArmorOverlays(scene) {
  genArmorOverlay(scene, 'armor-overlay-leather', 0x8b5e3c, 0xb07848);
  genArmorOverlay(scene, 'armor-overlay-chain',   0x888888, 0xaaaaaa);
  genArmorOverlay(scene, 'armor-overlay-plate',   0xc8c8d8, 0xeeeeee, 0xc8c8d8);
  genArmorOverlay(scene, 'armor-overlay-robe',    0x7733cc, 0xaa44ff);
  genArmorOverlay(scene, 'armor-overlay-dragon',  0xcc2222, 0xff5555, 0xcc2222);
}

// ── Weapon overlay textures ──────────────────────────────────────────────────
function genWeaponOverlay(scene, key, drawFn) {
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0); g.fillRect(0, 0, T, T);
  drawFn(g);
  g.generateTexture(key, T, T);
  g.destroy();
}

function genWeaponOverlays(scene) {
  // dagger — short blade, right side
  genWeaponOverlay(scene, 'weapon-overlay-dagger', g => {
    g.fillStyle(0xdddddd, 1); g.fillRect(25, 14, 2, 8);  // blade
    g.fillStyle(0x998855, 1); g.fillRect(24, 18, 4, 1);  // guard
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 19, 2, 4);  // handle
  });

  // short sword
  genWeaponOverlay(scene, 'weapon-overlay-shortsword', g => {
    g.fillStyle(0xcccccc, 1); g.fillRect(25, 8, 2, 13);  // blade
    g.fillStyle(0xccaa44, 1); g.fillRect(23, 14, 6, 2);  // guard
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 16, 2, 5);  // handle
  });

  // long sword — taller blade, silver tint
  genWeaponOverlay(scene, 'weapon-overlay-longsword', g => {
    g.fillStyle(0xe0e0f0, 1); g.fillRect(25, 4, 2, 17);  // blade
    g.fillStyle(0xccaa44, 1); g.fillRect(23, 13, 6, 2);  // guard
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 15, 2, 5);  // handle
    g.fillStyle(0xffffff, 0.5); g.fillRect(25, 4, 1, 8); // edge glint
  });

  // battle axe — large orange head, wooden handle right side
  genWeaponOverlay(scene, 'weapon-overlay-battleaxe', g => {
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 12, 2, 14); // handle
    g.fillStyle(0xcc7733, 1); g.fillRect(21, 8, 7, 9);   // head
    g.fillStyle(0xddaa55, 1); g.fillRect(22, 9, 5, 5);   // highlight
  });

  // mage staff — tall staff on left side, orb at tip
  genWeaponOverlay(scene, 'weapon-overlay-magestaff', g => {
    g.fillStyle(0x8855aa, 1); g.fillRect(5, 6, 2, 22);   // staff body
    g.fillStyle(0xaa44ff, 1); g.fillCircle(6, 5, 4);     // orb
    g.fillStyle(0xddaaff, 0.7); g.fillCircle(5, 4, 2);   // orb glint
  });

  // war hammer — wide head, thick handle right side
  genWeaponOverlay(scene, 'weapon-overlay-warhammer', g => {
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 14, 2, 13); // handle
    g.fillStyle(0x888899, 1); g.fillRect(20, 7, 9, 8);   // head
    g.fillStyle(0xaaaacc, 1); g.fillRect(21, 8, 7, 3);   // highlight
  });

  // runic blade — cyan glowing sword
  genWeaponOverlay(scene, 'weapon-overlay-runicblade', g => {
    g.fillStyle(0x44ffcc, 1); g.fillRect(25, 4, 2, 17);  // blade
    g.fillStyle(0x00bbff, 1); g.fillRect(23, 13, 6, 2);  // guard
    g.fillStyle(0x8b6914, 1); g.fillRect(25, 15, 2, 5);  // handle
    g.fillStyle(0xaaffee, 0.6); g.fillRect(25, 4, 1, 8); // glow
  });
}

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
