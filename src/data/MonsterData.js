// ============================================================
//  Darkspawn Rogue Quest — Monster Definitions
// ============================================================
import { C } from './Constants.js';

// Each def: { id, name, char, color, hp, atk, def, spd, xp,
//             floorMin, floorMax, loot, aiType, description }
// aiType: 'normal' | 'ranged' | 'boss' | 'coward'

export const MONSTERS = {
  rat: {
    id:'rat', name:'Giant Rat', char:'r', color:C.BROWN,
    hp:4,  atk:2,  def:0, spd:5, xp:5,
    floorMin:2, floorMax:4,
    loot:[{ id:'bone', chance:0.4 }],
    aiType:'normal',
    description:'A large aggressive rat.'
  },
  goblin: {
    id:'goblin', name:'Goblin', char:'g', color:C.GREEN,
    hp:8,  atk:4,  def:1, spd:4, xp:15,
    floorMin:2, floorMax:5,
    loot:[{ id:'wood', chance:0.3 }, { id:'potionHpS', chance:0.2 }, { id:'gold', chance:0.5, qty:[3,10] }],
    aiType:'normal',
    description:'A sneaky green goblin.'
  },
  skeleton: {
    id:'skeleton', name:'Skeleton', char:'s', color:C.WHITE,
    hp:12, atk:5,  def:2, spd:3, xp:25,
    floorMin:3, floorMax:7,
    loot:[{ id:'bone', chance:0.6 }, { id:'ironOre', chance:0.2 }],
    aiType:'normal',
    description:'Undead bones that refuse to stay dead.'
  },
  orc: {
    id:'orc', name:'Orc Warrior', char:'o', color:0x556b2f,
    hp:18, atk:7,  def:3, spd:3, xp:40,
    floorMin:4, floorMax:8,
    loot:[{ id:'ironOre', chance:0.4 }, { id:'leatherHide', chance:0.3 }, { id:'gold', chance:0.6, qty:[5,15] }],
    aiType:'normal',
    description:'A brutish orc warrior.'
  },
  bat: {
    id:'bat', name:'Cave Bat', char:'b', color:C.DARK_GRAY,
    hp:6,  atk:3,  def:0, spd:6, xp:12,
    floorMin:3, floorMax:6,
    loot:[{ id:'bone', chance:0.2 }],
    aiType:'normal',
    description:'A fast-moving cave bat.'
  },
  spider: {
    id:'spider', name:'Giant Spider', char:'S', color:0x8b4513,
    hp:14, atk:6,  def:1, spd:5, xp:30,
    floorMin:4, floorMax:7,
    loot:[{ id:'leatherHide', chance:0.4 }, { id:'antidote', chance:0.1 }],
    aiType:'poison',
    description:'A venomous spider the size of a dog.',
    statusOnHit:{ type:'poison', duration:10, chance:0.4 }
  },
  troll: {
    id:'troll', name:'Cave Troll', char:'T', color:0x5f8b5a,
    hp:35, atk:10, def:5, spd:2, xp:80,
    floorMin:6, floorMax:9,
    loot:[{ id:'ironIngot', chance:0.5 }, { id:'potionHpM', chance:0.3 }, { id:'gold', chance:0.8, qty:[10,25] }],
    aiType:'normal',
    description:'A massive regenerating cave troll.'
  },
  vampire: {
    id:'vampire', name:'Vampire', char:'V', color:C.DARK_RED,
    hp:28, atk:9,  def:4, spd:5, xp:90,
    floorMin:7, floorMax:9,
    loot:[{ id:'gemRuby', chance:0.2 }, { id:'crystal', chance:0.3 }, { id:'gold', chance:0.9, qty:[15,35] }],
    aiType:'lifesteal',
    description:'A cunning undead that drains life.',
    lifesteal:0.3
  },
  darkMage: {
    id:'darkMage', name:'Dark Mage', char:'M', color:C.PURPLE,
    hp:22, atk:12, def:2, spd:3, xp:100,
    floorMin:7, floorMax:9,
    loot:[{ id:'crystal', chance:0.5 }, { id:'mageStaff', chance:0.1 }, { id:'scrollFire', chance:0.3 }],
    aiType:'ranged',
    description:'A dark mage who casts deadly spells.'
  },
  demon: {
    id:'demon', name:'Demon', char:'D', color:C.LAVA,
    hp:45, atk:14, def:8, spd:4, xp:150,
    floorMin:8, floorMax:10,
    loot:[{ id:'dragonScale2', chance:0.3 }, { id:'gemRuby', chance:0.3 }, { id:'crystal', chance:0.4 }, { id:'gold', chance:1, qty:[25,60] }],
    aiType:'normal',
    description:'A fiery demon from the depths.'
  },
  dungeonLord: {
    id:'dungeonLord', name:'Dungeon Lord', char:'L', color:C.PINK,
    hp:150, atk:18, def:12, spd:3, xp:5000,
    floorMin:10, floorMax:10,
    loot:[{ id:'runicBlade', chance:1 }, { id:'dragonScale', chance:1 }, { id:'dragonEye', chance:1 }, { id:'gold', chance:1, qty:[100,200] }],
    aiType:'boss',
    description:'The immortal Dungeon Lord. Defeat him to win!',
    isBoss: true
  },
  vantus: {
    id:'vantus', name:'Vantus', char:'V', color:C.PURPLE,
    hp:140, atk:16, def:10, spd:3, xp:500,
    floorMin:10, floorMax:10,
    loot:[{ id:'dragonEye', chance:0.6 }, { id:'gold', chance:1, qty:[80,150] }],
    aiType:'boss',
    description:'Your shadow given form. It wears your face.',
    isBoss: true
  },

  // ── Jungle Monsters ─────────────────────────────────────────
  wildApe: {
    id:'wildApe', name:'Wild Ape', char:'A', color:0x8b5a2b,
    hp:20, atk:8, def:3, spd:4, xp:40,
    floorMin:1, floorMax:10,
    loot:[{ id:'bone', chance:0.3 }, { id:'leatherHide', chance:0.3 }, { id:'gold', chance:0.4, qty:[2,8] }],
    aiType:'normal',
    description:'A powerful ape that charges without warning.'
  },
  giantMosquito: {
    id:'giantMosquito', name:'Giant Mosquito', char:'q', color:0x6b2fa0,
    hp:9, atk:5, def:0, spd:7, xp:18,
    floorMin:1, floorMax:10,
    loot:[{ id:'antidote', chance:0.15 }],
    aiType:'poison',
    description:'A buzzing nightmare the size of a crow.',
    statusOnHit:{ type:'poison', duration:8, chance:0.35 }
  },
  poisonSnake: {
    id:'poisonSnake', name:'Poison Snake', char:'n', color:0x3a8c14,
    hp:12, atk:7, def:1, spd:5, xp:28,
    floorMin:1, floorMax:10,
    loot:[{ id:'antidote', chance:0.2 }, { id:'leatherHide', chance:0.2 }],
    aiType:'poison',
    description:'A brightly-coloured snake whose bite is deadly.',
    statusOnHit:{ type:'poison', duration:12, chance:0.5 }
  },
  tribalHunter: {
    id:'tribalHunter', name:'Tribal Hunter', char:'H', color:0xd4a96a,
    hp:22, atk:10, def:3, spd:4, xp:55,
    floorMin:4, floorMax:10,
    loot:[{ id:'tribalSpear', chance:0.08 }, { id:'barkArmor', chance:0.05 }, { id:'gold', chance:0.7, qty:[6,18] }],
    aiType:'ranged',
    description:'A skilled hunter of the deep jungle tribes.'
  },
  beetle: {
    id:'beetle', name:'Titan Beetle', char:'B', color:0x2a4c10,
    hp:65, atk:7, def:9, spd:1, xp:75,
    floorMin:4, floorMax:10,
    loot:[{ id:'ironOre', chance:0.4 }, { id:'gemRuby', chance:0.1 }, { id:'gold', chance:0.5, qty:[4,12] }],
    aiType:'normal',
    description:'A massive beetle with an almost impenetrable shell.'
  },
  mandrake: {
    id:'mandrake', name:'Mandrake', char:'P', color:0x2c8c14,
    hp:25, atk:9, def:5, spd:2, xp:60,
    floorMin:4, floorMax:10,
    loot:[{ id:'crystal', chance:0.3 }, { id:'potionHpS', chance:0.25 }],
    aiType:'normal',
    description:'A carnivorous plant that screams and strikes.'
  },
  deadTree: {
    id:'deadTree', name:'Dead Tree', char:'X', color:0x5a4a30,
    hp:45, atk:8, def:7, spd:1, xp:70,
    floorMin:7, floorMax:10,
    loot:[{ id:'wood', chance:0.6 }, { id:'bone', chance:0.3 }],
    aiType:'normal',
    description:'An ancient cursed tree animated by dark jungle spirits.'
  },
  witchDoctor: {
    id:'witchDoctor', name:'Witch Doctor', char:'W', color:0xff6622,
    hp:240, atk:20, def:12, spd:3, xp:2000,
    floorMin:10, floorMax:10,
    loot:[{ id:'tribalSpear', chance:1 }, { id:'barkArmor', chance:1 }, { id:'gemRuby', chance:1 }, { id:'gold', chance:1, qty:[150,300] }],
    aiType:'boss',
    description:'Master of the jungle. His curses can kill from afar.',
    isBoss: true
  },
};

// Which monsters can appear per floor
export const FLOOR_MONSTER_TABLES = [
  ['rat', 'goblin'],                                          // 1 (scripted intro — generateFloor1 overrides spawns)
  ['rat', 'goblin'],                                          // 2
  ['rat', 'goblin', 'bat', 'skeleton'],                       // 3
  ['rat', 'bat', 'skeleton', 'spider', 'orc'],                // 4
  ['bat', 'skeleton', 'spider', 'orc'],                       // 5
  ['bat', 'skeleton', 'spider', 'orc', 'troll'],              // 6
  ['orc', 'troll', 'vampire', 'darkMage'],                    // 7
  ['orc', 'troll', 'vampire', 'darkMage', 'demon'],           // 8
  ['troll', 'vampire', 'darkMage'],                          // 9
  [],                                                         // 10 — Vantus spawns as dedicated boss; floor has no random monsters
];
// Jungle monster tables (jungle floors 1\u201310; index = jungleFloor - 1)
export const JUNGLE_MONSTER_TABLES = [
  ['wildApe', 'giantMosquito', 'poisonSnake'],                // J1
  ['wildApe', 'giantMosquito', 'poisonSnake'],                // J2
  ['wildApe', 'giantMosquito', 'poisonSnake'],                // J3
  ['wildApe', 'tribalHunter', 'beetle', 'mandrake'],          // J4
  ['wildApe', 'tribalHunter', 'beetle', 'mandrake'],          // J5
  ['tribalHunter', 'beetle', 'mandrake', 'poisonSnake'],      // J6
  ['tribalHunter', 'beetle', 'mandrake', 'deadTree'],         // J7
  ['tribalHunter', 'beetle', 'mandrake', 'deadTree'],         // J8
  ['beetle', 'deadTree', 'mandrake', 'tribalHunter'],         // J9
  [],                                                         // J10 \u2014 Witch Doctor boss, no random spawns
];