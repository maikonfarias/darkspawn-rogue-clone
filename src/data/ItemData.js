// ============================================================
//  Darkspawn Rogue Quest — Item Definitions
// ============================================================
import { ITEM_TYPE, SLOT, C } from './Constants.js';

// Each item: { id, name, type, slot?, char, color, description,
//              atk?, def?, hpBonus?, manaBonus?, effect?, value, weight }

export const ITEMS = {
  // ── Weapons ────────────────────────────────────────────────
  fists:      { id:'fists',      name:'Fists',          type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.GRAY,    atk:1,  description:'Your bare hands.',                value:0,   weight:0  },
  dagger:     { id:'dagger',     name:'Dagger',          type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.WHITE,   atk:3,  description:'A small but fast blade.',         value:15,  weight:2  },
  shortSword: { id:'shortSword', name:'Short Sword',     type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.GRAY,    atk:5,  description:'A reliable one-handed sword.',    value:30,  weight:4  },
  longSword:  { id:'longSword',  name:'Long Sword',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.WHITE,   atk:8,  description:'A powerful two-handed blade.',    value:60,  weight:7  },
  battleAxe:  { id:'battleAxe',  name:'Battle Axe',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.ORANGE,  atk:11, description:'Heavy axe that cleaves armor.',   value:90,  weight:9  },
  mageStaff:  { id:'mageStaff',  name:'Mage Staff',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.PURPLE,  atk:6,  manaBonus:10, description:'Channels magical energy.',  value:75,  weight:5  },
  warHammer:  { id:'warHammer',  name:'War Hammer',       type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.BROWN,   atk:13, description:'A devastating blunt weapon.',     value:110, weight:11 },
  runicBlade: { id:'runicBlade', name:'Runic Blade',      type:ITEM_TYPE.WEAPON, slot:SLOT.WEAPON, char:'/', color:C.CYAN,    atk:15, manaBonus:5,  description:'Ancient sword etched with runes.', value:200, weight:6 },

  // ── Armor ──────────────────────────────────────────────────
  rags:       { id:'rags',       name:'Rags',            type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.BROWN,   def:0,  description:'Torn cloth offering no real protection.', value:0,   weight:1  },
  leatherArmor:{ id:'leatherArmor',name:'Leather Armor',  type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.BROWN,   def:2,  description:'Supple leather protection.',      value:20,  weight:4  },
  chainMail:  { id:'chainMail',  name:'Chain Mail',       type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.GRAY,    def:5,  description:'Interlocked metal rings.',        value:50,  weight:8  },
  plateArmor: { id:'plateArmor', name:'Plate Armor',      type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.WHITE,   def:9,  description:'Heavy full plate protection.',    value:100, weight:14 },
  mageRobe:   { id:'mageRobe',   name:'Mage Robe',        type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.PURPLE,  def:1,  manaBonus:15, description:'Arcane-infused robe.',    value:70,  weight:3  },
  dragonScale: { id:'dragonScale',name:'Dragon Scale',    type:ITEM_TYPE.ARMOR,  slot:SLOT.ARMOR,  char:'[', color:C.RED,     def:12, description:'Scales of a fearsome dragon.',    value:250, weight:10 },

  // ── Rings ──────────────────────────────────────────────────
  ironRing:   { id:'ironRing',   name:'Iron Ring',        type:ITEM_TYPE.RING,   slot:SLOT.RING,   char:'o', color:C.GRAY,    def:1,  description:'A plain iron ring.',              value:10,  weight:0  },
  goldRing:   { id:'goldRing',   name:'Gold Ring',        type:ITEM_TYPE.RING,   slot:SLOT.RING,   char:'o', color:C.GOLD,    hpBonus:5, description:'A golden ring that bolsters health.', value:50, weight:0 },
  rubyRing:   { id:'rubyRing',   name:'Ruby Ring',        type:ITEM_TYPE.RING,   slot:SLOT.RING,   char:'o', color:C.RED,     atk:2,  description:'A ruby ring that sharpens attacks.', value:80, weight:0 },
  sapphireRing:{ id:'sapphireRing',name:'Sapphire Ring',  type:ITEM_TYPE.RING,   slot:SLOT.RING,   char:'o', color:C.BLUE,    manaBonus:10, description:'Glows with arcane power.', value:80, weight:0 },

  // ── Amulets ────────────────────────────────────────────────
  boneAmulet: { id:'boneAmulet', name:'Bone Amulet',      type:ITEM_TYPE.AMULET, slot:SLOT.AMULET, char:'"', color:C.WHITE,   hpBonus:10, description:'Carved bone worn for protection.', value:40, weight:0 },
  moonstone:  { id:'moonstone',  name:'Moonstone Amulet', type:ITEM_TYPE.AMULET, slot:SLOT.AMULET, char:'"', color:C.CYAN,    def:2,  manaBonus:8,  description:'Shimmers with moonlight.', value:100, weight:0 },
  dragonEye:  { id:'dragonEye',  name:"Dragon's Eye",     type:ITEM_TYPE.AMULET, slot:SLOT.AMULET, char:'"', color:C.LAVA,    atk:3,  hpBonus:15,   description:'A dragon eye crystallized.', value:200, weight:0 },

  // ── Potions ────────────────────────────────────────────────
  potionHpS:  { id:'potionHpS',  name:'Health Potion (S)', type:ITEM_TYPE.POTION, char:'!', color:C.RED,    effect:{heal:10}, description:'Restores 10 HP.', value:8,  weight:1 },
  potionHpM:  { id:'potionHpM',  name:'Health Potion (M)', type:ITEM_TYPE.POTION, char:'!', color:C.RED,    effect:{heal:25}, description:'Restores 25 HP.', value:18, weight:1 },
  potionHpL:  { id:'potionHpL',  name:'Health Potion (L)', type:ITEM_TYPE.POTION, char:'!', color:C.RED,    effect:{heal:50}, description:'Restores 50 HP.', value:35, weight:1 },
  potionMana: { id:'potionMana', name:'Mana Potion',       type:ITEM_TYPE.POTION, char:'!', color:C.BLUE,   effect:{mana:15}, description:'Restores 15 Mana.', value:15, weight:1 },
  antidote:   { id:'antidote',   name:'Antidote',          type:ITEM_TYPE.POTION, char:'!', color:C.GREEN,  effect:{cure:'poison'}, description:'Cures poison.', value:12, weight:1 },
  potionSpeed:{ id:'potionSpeed',name:'Speed Potion',      type:ITEM_TYPE.POTION, char:'!', color:C.YELLOW, effect:{speed:3, duration:20}, description:'Boosts speed temporarily.', value:20, weight:1 },
  potionStr:  { id:'potionStr',  name:'Strength Potion',   type:ITEM_TYPE.POTION, char:'!', color:C.ORANGE, effect:{atk:3, duration:20}, description:'Boosts attack temporarily.', value:22, weight:1 },

  // ── Scrolls ────────────────────────────────────────────────
  scrollMap:  { id:'scrollMap',  name:'Scroll of Mapping',  type:ITEM_TYPE.SCROLL, char:'?', color:C.WHITE,  effect:{revealMap:true}, description:'Reveals the entire floor.', value:25, weight:0 },
  scrollTele: { id:'scrollTele', name:'Scroll of Teleport', type:ITEM_TYPE.SCROLL, char:'?', color:C.PURPLE, effect:{teleport:true},   description:'Teleports to a random location.', value:20, weight:0 },
  scrollId:   { id:'scrollId',   name:'Scroll of Identify', type:ITEM_TYPE.SCROLL, char:'?', color:C.CYAN,   effect:{identify:true},   description:'Identifies an unknown item.', value:15, weight:0 },
  scrollFire: { id:'scrollFire', name:'Scroll of Fire',     type:ITEM_TYPE.SCROLL, char:'?', color:C.ORANGE, effect:{fireball:true},   description:'Unleashes a fireball.', value:30, weight:0 },
  townScroll: { id:'townScroll', name:'Town Scroll',         type:ITEM_TYPE.SCROLL, char:'?', color:C.BLUE,   effect:{townPortal:true}, description:'Teleports you to town. Leaves a blue portal to return.', value:40, weight:0, singleDrop:true },

  // ── Materials (for crafting) ────────────────────────────────
  wood:       { id:'wood',       name:'Wood',              type:ITEM_TYPE.MATERIAL, char:'%', color:C.BROWN,  description:'A piece of sturdy wood.', value:2,  weight:2 },
  stone:      { id:'stone',      name:'Stone',             type:ITEM_TYPE.MATERIAL, char:'%', color:C.GRAY,   description:'A rough piece of stone.', value:1,  weight:3 },
  ironOre:    { id:'ironOre',    name:'Iron Ore',          type:ITEM_TYPE.MATERIAL, char:'%', color:C.GRAY,   description:'Raw iron ore.',           value:5,  weight:4 },
  ironIngot:  { id:'ironIngot',  name:'Iron Ingot',        type:ITEM_TYPE.MATERIAL, char:'%', color:C.WHITE,  description:'Refined iron ingot.',     value:15, weight:4 },
  leatherHide:{ id:'leatherHide',name:'Leather Hide',      type:ITEM_TYPE.MATERIAL, char:'%', color:C.BROWN,  description:'A beast\'s hide.',        value:8,  weight:2 },
  bone:       { id:'bone',       name:'Bone',              type:ITEM_TYPE.MATERIAL, char:'%', color:C.WHITE,  description:'A creature\'s bone.',     value:3,  weight:1 },
  crystal:    { id:'crystal',    name:'Magic Crystal',     type:ITEM_TYPE.MATERIAL, char:'*', color:C.CYAN,   description:'Pulsing with magic.',     value:25, weight:1 },
  dragonScale2:{ id:'dragonScale2',name:'Dragon Scale',   type:ITEM_TYPE.MATERIAL, char:'%', color:C.RED,    description:'A scale from a dragon.',  value:50, weight:2 },
  gemRuby:    { id:'gemRuby',    name:'Ruby Gem',          type:ITEM_TYPE.MATERIAL, char:'*', color:C.RED,    description:'A gleaming ruby.',        value:40, weight:0 },
  gemSapphire:{ id:'gemSapphire',name:'Sapphire Gem',      type:ITEM_TYPE.MATERIAL, char:'*', color:C.BLUE,   description:'A deep blue sapphire.',   value:40, weight:0 },

  // ── Gold ───────────────────────────────────────────────────
  gold:       { id:'gold',       name:'Gold',              type:ITEM_TYPE.GOLD,     char:'$', color:C.GOLD,   description:'Shiny gold coins.',        value:1,  weight:0 },
};

// Helper: create item instance from definition
export function createItem(id, qty = 1) {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item id: ${id}`);
  return { ...def, qty, identified: true };
}

// Weighted random item tables per floor
export const FLOOR_ITEM_TABLES = [
  // floor 1
  [{ id:'potionHpS', weight:4 }, { id:'wood', weight:3 }, { id:'stone', weight:3 }, { id:'ironOre', weight:2 }, { id:'dagger', weight:2 }, { id:'leatherArmor', weight:1 }],
  // floor 2
  [{ id:'potionHpS', weight:3 }, { id:'potionHpM', weight:2 }, { id:'ironOre', weight:3 }, { id:'wood', weight:2 }, { id:'shortSword', weight:2 }, { id:'leatherArmor', weight:2 }, { id:'townScroll', weight:1 }],
  // floor 3
  [{ id:'potionHpM', weight:3 }, { id:'ironIngot', weight:2 }, { id:'leatherHide', weight:3 }, { id:'chainMail', weight:1 }, { id:'antidote', weight:2 }, { id:'scrollMap', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 4
  [{ id:'potionHpM', weight:3 }, { id:'potionMana', weight:2 }, { id:'ironIngot', weight:3 }, { id:'crystal', weight:1 }, { id:'longSword', weight:1 }, { id:'scrollTele', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 5
  [{ id:'potionHpL', weight:2 }, { id:'potionMana', weight:2 }, { id:'crystal', weight:2 }, { id:'bone', weight:2 }, { id:'battleAxe', weight:1 }, { id:'ironRing', weight:2 }, { id:'boneAmulet', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 6
  [{ id:'potionHpL', weight:3 }, { id:'crystal', weight:3 }, { id:'gemRuby', weight:1 }, { id:'gemSapphire', weight:1 }, { id:'plateArmor', weight:1 }, { id:'goldRing', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 7
  [{ id:'potionHpL', weight:3 }, { id:'scrollFire', weight:2 }, { id:'mageStaff', weight:1 }, { id:'mageRobe', weight:1 }, { id:'rubyRing', weight:1 }, { id:'moonstone', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 8
  [{ id:'potionHpL', weight:3 }, { id:'potionMana', weight:3 }, { id:'warHammer', weight:1 }, { id:'dragonScale2', weight:2 }, { id:'dragonEye', weight:1 }, { id:'townScroll', weight:1 }],
  // floor 9
  [{ id:'potionHpL', weight:4 }, { id:'runicBlade', weight:1 }, { id:'dragonScale', weight:1 }, { id:'dragonEye', weight:1 }, { id:'scrollFire', weight:2 }, { id:'townScroll', weight:1 }],
  // floor 10 (boss)
  [{ id:'potionHpL', weight:4 }, { id:'runicBlade', weight:1 }, { id:'dragonScale', weight:1 }],
];
