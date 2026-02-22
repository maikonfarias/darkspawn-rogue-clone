// ============================================================
//  Darkspawn Rogue Quest — Skill Definitions
// ============================================================
// Three trees: Warrior, Rogue, Mage
// Each skill: { id, name, tree, tier, prereq?, description,
//               passive?, active?, cost (mana if active) }

export const SKILL_TREES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    color: '#ff6644',
    icon: '⚔️',
    skills: [
      {
        id: 'powerStrike', name: 'Power Strike', tier: 1, prereq: null,
        description: '+3 attack damage.',
        passive: { atk: 3 },
      },
      {
        id: 'shieldWall', name: 'Shield Wall', tier: 1, prereq: null,
        description: '+3 defense.',
        passive: { def: 3 },
      },
      {
        id: 'toughness', name: 'Toughness', tier: 2, prereq: 'shieldWall',
        description: '+20 max HP.',
        passive: { maxHp: 20 },
      },
      {
        id: 'berserkerRage', name: 'Berserker Rage', tier: 2, prereq: 'powerStrike',
        description: 'Active: Deal double attack damage next hit. (8 mana)',
        active: { effect: 'berserker', duration: 1, cost: 8 },
      },
      {
        id: 'whirlwind', name: 'Whirlwind', tier: 3, prereq: 'berserkerRage',
        description: 'Active: Attack all adjacent monsters. (12 mana)',
        active: { effect: 'whirlwind', cost: 12 },
      },
    ],
  },

  rogue: {
    id: 'rogue',
    name: 'Rogue',
    color: '#44ff88',
    icon: '🗡️',
    skills: [
      {
        id: 'criticalStrike', name: 'Critical Strike', tier: 1, prereq: null,
        description: '+15% critical hit chance (×2 damage).',
        passive: { critChance: 0.15 },
      },
      {
        id: 'evasion', name: 'Evasion', tier: 1, prereq: null,
        description: '+10% chance to dodge attacks.',
        passive: { dodgeChance: 0.10 },
      },
      {
        id: 'poisonBlade', name: 'Poison Blade', tier: 2, prereq: 'criticalStrike',
        description: 'Attacks have 30% chance to poison enemies.',
        passive: { poisonChance: 0.30 },
      },
      {
        id: 'shadowStep', name: 'Shadow Step', tier: 2, prereq: 'evasion',
        description: 'Active: Teleport to any visible empty tile. (10 mana)',
        active: { effect: 'shadowStep', cost: 10 },
      },
      {
        id: 'deathMark', name: 'Death Mark', tier: 3, prereq: 'poisonBlade',
        description: 'Active: Mark a monster — it takes 50% more damage. (15 mana)',
        active: { effect: 'deathMark', cost: 15 },
      },
    ],
  },

  mage: {
    id: 'mage',
    name: 'Mage',
    color: '#8866ff',
    icon: '🔮',
    skills: [
      {
        id: 'arcaneKnowledge', name: 'Arcane Knowledge', tier: 1, prereq: null,
        description: '+15 max mana.',
        passive: { maxMana: 15 },
      },
      {
        id: 'magicBolt', name: 'Magic Bolt', tier: 1, prereq: null,
        description: 'Active: Fire a bolt dealing 10+level damage. (4 mana)',
        active: { effect: 'magicBolt', baseDmg: 10, cost: 4 },
      },
      {
        id: 'fireball', name: 'Fireball', tier: 2, prereq: 'magicBolt',
        description: 'Active: Explosion hitting 3×3 area for 8+level damage. (10 mana)',
        active: { effect: 'fireball', baseDmg: 8, cost: 10, radius: 1 },
      },
      {
        id: 'iceNova', name: 'Ice Nova', tier: 2, prereq: 'arcaneKnowledge',
        description: 'Active: Freeze all visible monsters for 2 turns. (12 mana)',
        active: { effect: 'iceNova', cost: 12, duration: 2 },
      },
      {
        id: 'arcaneShield', name: 'Arcane Shield', tier: 3, prereq: 'iceNova',
        description: 'Active: Absorb up to 20 damage for 10 turns. (15 mana)',
        active: { effect: 'arcaneShield', shield: 20, duration: 10, cost: 15 },
      },
    ],
  },
};

// Flat list for easy lookup
export const ALL_SKILLS = Object.values(SKILL_TREES).flatMap(t => t.skills);
export const SKILL_BY_ID = Object.fromEntries(ALL_SKILLS.map(s => [s.id, s]));
