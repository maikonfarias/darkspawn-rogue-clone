// ============================================================
//  Darkspawn Rogue Quest — Crafting Recipes
// ============================================================
// Each recipe: { id, name, ingredients:[{id,qty}], result:{id,qty}, description }

export const RECIPES = [
  // ── Smelting ──────────────────────────────────────────────
  {
    id: 'smeltIron',
    name: 'Smelt Iron',
    ingredients: [{ id:'ironOre', qty:2 }],
    result: { id:'ironIngot', qty:1 },
    description: 'Smelt iron ore into a usable ingot.'
  },

  // ── Weapons ───────────────────────────────────────────────
  {
    id: 'craftDagger',
    name: 'Craft Dagger',
    ingredients: [{ id:'ironIngot', qty:1 }, { id:'wood', qty:1 }],
    result: { id:'dagger', qty:1 },
    description: 'Forge a quick dagger.'
  },
  {
    id: 'craftShortSword',
    name: 'Craft Short Sword',
    ingredients: [{ id:'ironIngot', qty:2 }, { id:'wood', qty:1 }],
    result: { id:'shortSword', qty:1 },
    description: 'Forge a reliable short sword.'
  },
  {
    id: 'craftLongSword',
    name: 'Craft Long Sword',
    ingredients: [{ id:'ironIngot', qty:3 }, { id:'wood', qty:1 }],
    result: { id:'longSword', qty:1 },
    description: 'Forge a powerful long sword.'
  },
  {
    id: 'craftBattleAxe',
    name: 'Craft Battle Axe',
    ingredients: [{ id:'ironIngot', qty:4 }, { id:'wood', qty:2 }],
    result: { id:'battleAxe', qty:1 },
    description: 'Forge a devastating battle axe.'
  },
  {
    id: 'craftStaff',
    name: 'Craft Mage Staff',
    ingredients: [{ id:'wood', qty:3 }, { id:'crystal', qty:2 }],
    result: { id:'mageStaff', qty:1 },
    description: 'Craft a staff imbued with magic.'
  },

  // ── Armor ─────────────────────────────────────────────────
  {
    id: 'craftLeatherArmor',
    name: 'Craft Leather Armor',
    ingredients: [{ id:'leatherHide', qty:3 }],
    result: { id:'leatherArmor', qty:1 },
    description: 'Craft basic leather protection.'
  },
  {
    id: 'craftChainMail',
    name: 'Craft Chain Mail',
    ingredients: [{ id:'ironIngot', qty:4 }],
    result: { id:'chainMail', qty:1 },
    description: 'Craft interlocking chain armor.'
  },
  {
    id: 'craftPlateArmor',
    name: 'Craft Plate Armor',
    ingredients: [{ id:'ironIngot', qty:6 }, { id:'leatherHide', qty:2 }],
    result: { id:'plateArmor', qty:1 },
    description: 'Craft heavy full plate armor.'
  },
  {
    id: 'craftMageRobe',
    name: 'Craft Mage Robe',
    ingredients: [{ id:'leatherHide', qty:2 }, { id:'crystal', qty:3 }],
    result: { id:'mageRobe', qty:1 },
    description: 'Craft an arcane-infused robe.'
  },

  // ── Rings & Amulets ───────────────────────────────────────
  {
    id: 'craftIronRing',
    name: 'Craft Iron Ring',
    ingredients: [{ id:'ironIngot', qty:1 }],
    result: { id:'ironRing', qty:1 },
    description: 'Forge a simple iron ring.'
  },
  {
    id: 'craftGoldRing',
    name: 'Craft Gold Ring',
    ingredients: [{ id:'ironIngot', qty:1 }, { id:'gemRuby', qty:1 }],
    result: { id:'goldRing', qty:1 },
    description: 'Craft a health-boosting ring.'
  },
  {
    id: 'craftRubyRing',
    name: 'Craft Ruby Ring',
    ingredients: [{ id:'ironIngot', qty:1 }, { id:'gemRuby', qty:1 }],
    result: { id:'rubyRing', qty:1 },
    description: 'Craft a ring that sharpens attacks.'
  },
  {
    id: 'craftBoneAmulet',
    name: 'Craft Bone Amulet',
    ingredients: [{ id:'bone', qty:3 }],
    result: { id:'boneAmulet', qty:1 },
    description: 'Carve a protective bone amulet.'
  },
  {
    id: 'craftMoonstone',
    name: 'Craft Moonstone Amulet',
    ingredients: [{ id:'bone', qty:2 }, { id:'crystal', qty:2 }],
    result: { id:'moonstone', qty:1 },
    description: 'Craft an amulet shimmering with moonlight.'
  },

  // ── Potions ───────────────────────────────────────────────
  {
    id: 'brewHpS',
    name: 'Brew Health Potion (S)',
    ingredients: [{ id:'leatherHide', qty:1 }, { id:'bone', qty:1 }],
    result: { id:'potionHpS', qty:2 },
    description: 'Brew two small healing potions.'
  },
  {
    id: 'brewHpM',
    name: 'Brew Health Potion (M)',
    ingredients: [{ id:'crystal', qty:1 }, { id:'bone', qty:2 }],
    result: { id:'potionHpM', qty:1 },
    description: 'Brew a medium healing potion.'
  },
  {
    id: 'brewMana',
    name: 'Brew Mana Potion',
    ingredients: [{ id:'crystal', qty:1 }, { id:'wood', qty:1 }],
    result: { id:'potionMana', qty:1 },
    description: 'Brew a mana restoration potion.'
  },
  {
    id: 'brewAntidote',
    name: 'Brew Antidote',
    ingredients: [{ id:'bone', qty:2 }, { id:'stone', qty:1 }],
    result: { id:'antidote', qty:2 },
    description: 'Brew two antidotes.'
  },
];
