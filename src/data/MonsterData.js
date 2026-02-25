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
  ['troll', 'vampire', 'darkMage', 'demon'],                  // 9
  ['demon', 'dungeonLord'],                                   // 10 (boss)
];
