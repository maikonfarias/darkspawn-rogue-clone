// ============================================================
//  Darkspawn Rogue Quest — Combat System
// ============================================================
import { rand, chance } from '../utils/Random.js';
import { EV } from '../data/Constants.js';

// Status effect durations
const STATUS_DURATION = {
  poison: 10,
  burn:   6,
  stun:   2,
  freeze: 2,
  bleed:  8,
};

/**
 * Resolve an attack from attacker to defender.
 * Returns { hit, damage, crit, statusApplied, absorbed }
 * @param {object} attacker - entity with .stats (atk, critChance, dodgeChance, poisonChance, berserker)
 * @param {object} defender - entity with .stats (def, dodge, arcaneShield, deathMark)
 * @param {Phaser.Events.EventEmitter} events
 */
export function resolveAttack(attacker, defender, events) {
  // Dodge check
  const dodgeChance = (defender.stats.dodgeChance ?? 0);
  if (chance(dodgeChance)) {
    events?.emit(EV.LOG_MSG, { text: `${defender.name} dodges!`, color: '#88ff88' });
    return { hit: false, damage: 0, crit: false };
  }

  // Base damage
  let dmg = Math.max(1,
    attacker.stats.atk + rand(-2, 2) - defender.stats.def
  );

  // Death mark (Rogue skill) — 50% more damage
  if (defender.statusEffects?.some(e => e.type === 'deathMark')) {
    dmg = Math.floor(dmg * 1.5);
  }

  // Berserker rage (Warrior skill) — double damage
  let isBerserker = false;
  if (attacker.statusEffects?.some(e => e.type === 'berserker')) {
    dmg *= 2;
    isBerserker = true;
    // Remove berserker after use
    attacker.statusEffects = attacker.statusEffects.filter(e => e.type !== 'berserker');
  }

  // Critical hit
  const critChance = attacker.stats.critChance ?? 0.05;
  const crit = chance(critChance);
  if (crit) dmg = Math.floor(dmg * 2);

  // Arcane shield absorb
  let absorbed = 0;
  const shield = attacker.statusEffects?.find(e => e.type === 'arcaneShield');
  if (!shield) {
    const defShield = defender.statusEffects?.find(e => e.type === 'arcaneShield');
    if (defShield) {
      absorbed = Math.min(dmg, defShield.value);
      defShield.value -= absorbed;
      dmg -= absorbed;
      if (defShield.value <= 0) {
        defender.statusEffects = defender.statusEffects.filter(e => e.type !== 'arcaneShield');
      }
    }
  }

  dmg = Math.max(0, dmg);

  // Lifesteal
  if (attacker.def?.lifesteal) {
    const heal = Math.floor(dmg * attacker.def.lifesteal);
    attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + heal);
  }

  // Apply damage
  defender.stats.hp -= dmg;

  // Status effects from attacker
  let statusApplied = null;
  if (dmg > 0) {
    // Poison from skill or monster
    const poisonChance = attacker.stats.poisonChance ?? attacker.def?.statusOnHit?.chance ?? 0;
    if (poisonChance > 0 && chance(poisonChance)) {
      applyStatus(defender, 'poison', STATUS_DURATION.poison);
      statusApplied = 'poison';
    }
  }

  return { hit: true, damage: dmg, crit, statusApplied, absorbed };
}

/**
 * Apply a status effect to an entity.
 */
export function applyStatus(entity, type, duration, extra = {}) {
  if (!entity.statusEffects) entity.statusEffects = [];
  // Refresh if already present
  const existing = entity.statusEffects.find(e => e.type === type);
  if (existing) {
    existing.duration = Math.max(existing.duration, duration);
    Object.assign(existing, extra);
    return;
  }
  entity.statusEffects.push({ type, duration, ...extra });
}

/**
 * Tick all status effects on entity (call once per turn).
 * Returns log messages.
 */
export function tickStatusEffects(entity, events = null) {
  if (!entity.statusEffects || entity.statusEffects.length === 0) return [];
  const msgs = [];

  entity.statusEffects = entity.statusEffects.filter(eff => {
    eff.duration--;

    if (eff.type === 'poison') {
      const dmg = rand(1, 3);
      entity.stats.hp -= dmg;
      msgs.push({ text: `${entity.name} takes ${dmg} poison damage.`, color: '#44cc44' });
      events?.emit('float-dmg', { x: entity.x, y: entity.y, dmg, color: '#44cc44' });
    }
    if (eff.type === 'burn') {
      const dmg = rand(2, 5);
      entity.stats.hp -= dmg;
      msgs.push({ text: `${entity.name} burns for ${dmg} damage.`, color: '#ff8800' });
      events?.emit('float-dmg', { x: entity.x, y: entity.y, dmg, color: '#ff8800' });
    }
    if (eff.type === 'bleed') {
      const dmg = rand(1, 2);
      entity.stats.hp -= dmg;
      msgs.push({ text: `${entity.name} bleeds for ${dmg}.`, color: '#dd3333' });
      events?.emit('float-dmg', { x: entity.x, y: entity.y, dmg, color: '#dd3333' });
    }

    return eff.duration > 0;
  });

  return msgs;
}

/**
 * Fire a fireball centered on (tx, ty), radius 1.
 * Returns list of {entity, damage} hits.
 */
export function fireballDamage(attacker, monsters, tx, ty, baseDmg, level, events) {
  const hits = [];
  const total = baseDmg + level;
  for (const m of monsters) {
    if (Math.abs(m.x - tx) <= 1 && Math.abs(m.y - ty) <= 1) {
      m.stats.hp -= total;
      applyStatus(m, 'burn', 4);
      hits.push({ entity: m, damage: total });
    }
  }
  return hits;
}

/**
 * Magic bolt damage to a single target.
 */
export function magicBoltDamage(attacker, target, baseDmg, level) {
  const total = baseDmg + level + rand(0, 3);
  target.stats.hp -= total;
  return total;
}

/**
 * Ice nova — freeze all visible monsters.
 */
export function iceNova(monsters, duration) {
  for (const m of monsters) {
    applyStatus(m, 'freeze', duration);
  }
}
