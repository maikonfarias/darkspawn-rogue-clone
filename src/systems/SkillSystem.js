// ============================================================
//  Darkspawn Rogue Quest — Skill System
// ============================================================
import { SKILL_BY_ID, SKILL_TREES } from '../data/SkillData.js';
import { applyStatus } from './CombatSystem.js';

/**
 * Check if player meets prerequisites to unlock a skill.
 */
export function canUnlock(player, skillId) {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return false;
  if (player.skills.has(skillId)) return false;     // already unlocked
  if (player.skillPoints <= 0) return false;
  if (skill.prereq && !player.skills.has(skill.prereq)) return false;
  return true;
}

/**
 * Unlock a skill for the player. Applies passive bonuses immediately.
 */
export function unlockSkill(player, skillId) {
  if (!canUnlock(player, skillId)) return false;
  const skill = SKILL_BY_ID[skillId];

  player.skills.add(skillId);
  player.skillPoints--;

  // Apply passive bonuses
  if (skill.passive) {
    const p = skill.passive;
    if (p.atk)       player.stats.bonusAtk   = (player.stats.bonusAtk  ?? 0) + p.atk;
    if (p.def)       player.stats.bonusDef   = (player.stats.bonusDef  ?? 0) + p.def;
    if (p.maxHp)     { player.baseStats.maxHp += p.maxHp; player.stats.hp += p.maxHp; }
    if (p.maxMana)   { player.baseStats.maxMana += p.maxMana; player.stats.mana += p.maxMana; }
    if (p.critChance)  player.stats.critChance  = (player.stats.critChance ?? 0.05) + p.critChance;
    if (p.dodgeChance) player.stats.dodgeChance = (player.stats.dodgeChance ?? 0)   + p.dodgeChance;
    if (p.poisonChance) player.stats.poisonChance = (player.stats.poisonChance ?? 0) + p.poisonChance;
  }

  return true;
}

/**
 * Use an active skill. Returns { success, message, cost }.
 * The caller (GameScene) handles targeting logic for skills that need it.
 */
export function useSkill(player, skillId, context = {}) {
  if (!player.skills.has(skillId)) return { success: false, message: 'Skill not unlocked.' };
  const skill = SKILL_BY_ID[skillId];
  if (!skill.active) return { success: false, message: 'Not an active skill.' };

  const cost = skill.active.cost ?? 0;
  if (player.stats.mana < cost) return { success: false, message: 'Not enough mana!' };

  player.stats.mana -= cost;

  switch (skill.active.effect) {
    case 'berserker':
      applyStatus(player, 'berserker', 1);
      return { success: true, message: 'Berserker Rage activated!' };

    case 'whirlwind':
      return { success: true, message: 'Whirlwind!', needsWhirlwind: true };

    case 'shadowStep':
      return { success: true, message: 'Shadow Step – choose destination.', needsTarget: 'shadowStep' };

    case 'deathMark':
      return { success: true, message: 'Death Mark – target an enemy.', needsTarget: 'deathMark' };

    case 'magicBolt':
      return { success: true, message: 'Magic Bolt – choose target.', needsTarget: 'magicBolt',
               baseDmg: skill.active.baseDmg };

    case 'fireball':
      return { success: true, message: 'Fireball – choose target area.', needsTarget: 'fireball',
               baseDmg: skill.active.baseDmg, radius: skill.active.radius };

    case 'iceNova':
      return { success: true, message: 'Ice Nova – all visible enemies frozen!',
               needsIceNova: true, duration: skill.active.duration };

    case 'arcaneShield':
      applyStatus(player, 'arcaneShield', skill.active.duration, { value: skill.active.shield });
      return { success: true, message: `Arcane Shield absorbs ${skill.active.shield} damage!` };

    default:
      return { success: true, message: `Used ${skill.name}.` };
  }
}

/**
 * Compute total effective stats for a player (base + bonuses + equipment).
 */
export function computeStats(player) {
  const base = player.baseStats;
  // Start from baseStats (includes level-up and skill bonuses, never equipment)
  let atk    = base.atk + (player.stats.bonusAtk ?? 0);
  let def    = base.def + (player.stats.bonusDef ?? 0);
  let maxHp  = base.maxHp;
  let maxMana = base.maxMana;

  // Equipment bonuses (added fresh each recompute — safe against double-counting)
  for (const slot of Object.values(player.equipment)) {
    if (!slot) continue;
    if (slot.atk)       atk     += slot.atk;
    if (slot.def)       def     += slot.def;
    if (slot.hpBonus)   maxHp   += slot.hpBonus;
    if (slot.manaBonus) maxMana += slot.manaBonus;
  }

  return { atk, def, maxHp, maxMana };
}
