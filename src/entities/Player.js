// ============================================================
//  Darkspawn Rogue Quest — Player Entity
// ============================================================
import { PLAYER_CFG, XP_TABLE, SLOT, ITEM_TYPE, EV } from '../data/Constants.js';
import { ITEMS, createItem } from '../data/ItemData.js';
import { addToInventory, removeFromInventory } from '../systems/CraftingSystem.js';
import { tickStatusEffects } from '../systems/CombatSystem.js';
import { computeStats } from '../systems/SkillSystem.js';

export class Player {
  constructor(events) {
    this.events = events;
    this.name = 'Hero';

    // Position
    this.x = 0;
    this.y = 0;

    // Base stats (without equipment or skill bonuses)
    this.baseStats = {
      atk:     PLAYER_CFG.BASE_ATK,
      def:     PLAYER_CFG.BASE_DEF,
      maxHp:   PLAYER_CFG.BASE_HP,   // includes level-up and skill HP bonuses
      maxMana: PLAYER_CFG.BASE_MANA, // includes level-up and skill mana bonuses
    };

    // Runtime stats
    this.stats = {
      hp:      PLAYER_CFG.BASE_HP,
      maxHp:   PLAYER_CFG.BASE_HP,
      mana:    PLAYER_CFG.BASE_MANA,
      maxMana: PLAYER_CFG.BASE_MANA,
      atk:     PLAYER_CFG.BASE_ATK,
      def:     PLAYER_CFG.BASE_DEF,
      spd:     PLAYER_CFG.BASE_SPD,
      critChance:   0.05,
      dodgeChance:  0.0,
      poisonChance: 0.0,
      bonusAtk: 0,
      bonusDef: 0,
    };

    this.level     = 1;
    this.xp        = 0;
    this.gold      = 0;
    this.skillPoints = 0;

    // Inventory: array of 24 slots (null = empty)
    this.inventory = new Array(PLAYER_CFG.INV_SLOTS).fill(null);

    // Equipment slots
    this.equipment = {
      [SLOT.WEAPON]: createItem('fists'),
      [SLOT.ARMOR]:  createItem('rags'),
      [SLOT.RING]:   null,
      [SLOT.AMULET]: null,
    };

    // Skill tree
    this.skills = new Set();

    // Status effects: [{ type, duration, ... }]
    this.statusEffects = [];

    // Turn counter (for speed-based actions)
    this.turnsSinceAction = 0;

    // Pending active skill
    this.pendingSkill = null;
  }

  /** Recompute effective stats from base + skills + equipment */
  refreshStats() {
    const comp = computeStats(this);
    this.stats.atk  = comp.atk;
    this.stats.def  = comp.def;
    // Cap HP/mana to new max
    this.stats.maxHp   = comp.maxHp;
    this.stats.maxMana = comp.maxMana;
    this.stats.hp   = Math.min(this.stats.hp,   this.stats.maxHp);
    this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);
    this.events.emit(EV.STATS_CHANGED);
  }

  // ── Leveling ─────────────────────────────────────────────

  addXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.level < XP_TABLE.length - 1 && this.xp >= XP_TABLE[this.level]) {
      this.level++;
      leveled = true;
      this.onLevelUp();
    }
    if (leveled) this.events.emit(EV.STATS_CHANGED);
    return leveled;
  }

  onLevelUp() {
    // Stat increases (update baseStats so equipment bonus isn't double-counted)
    this.baseStats.maxHp   += 5;
    this.baseStats.maxMana += 3;
    this.baseStats.atk     += 1;
    this.baseStats.def     += 1;
    // Skill point every 2 levels
    if (this.level % 2 === 0) this.skillPoints++;
    this.refreshStats();
    // Full restore on level up
    this.stats.hp   = this.stats.maxHp;
    this.stats.mana = this.stats.maxMana;
    this.events.emit(EV.LOG_MSG, {
      text: `Level up! Now level ${this.level}!`,
      color: '#ffd700'
    });
  }

  get xpToNext() {
    return XP_TABLE[this.level] ?? 999999;
  }

  // ── Inventory ────────────────────────────────────────────

  pickUpItem(item) {
    if (item.type === ITEM_TYPE.GOLD) {
      this.gold += item.value * (item.qty ?? 1);
      this.events.emit(EV.LOG_MSG, { text: `Picked up ${item.value * (item.qty ?? 1)} gold.`, color: '#ffd700' });
      this.events.emit(EV.STATS_CHANGED);
      return true;
    }
    const ok = addToInventory(this, item);
    if (ok) {
      this.events.emit(EV.LOG_MSG, { text: `Picked up ${item.name}.`, color: '#ccccff' });
      this.events.emit(EV.STATS_CHANGED);
    } else {
      this.events.emit(EV.LOG_MSG, { text: 'Inventory full!', color: '#ff8888' });
    }
    return ok;
  }

  dropItem(slotIndex) {
    const item = this.inventory[slotIndex];
    if (!item) return null;
    removeFromInventory(this, slotIndex);
    this.events.emit(EV.STATS_CHANGED);
    return item;
  }

  useItem(slotIndex) {
    const item = this.inventory[slotIndex];
    if (!item) return false;

    if (item.type === ITEM_TYPE.POTION) {
      const eff = item.effect ?? {};
      if (eff.heal) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + eff.heal);
        this.events.emit(EV.LOG_MSG, { text: `Drank ${item.name}. +${eff.heal} HP.`, color: '#ff6666' });
      }
      if (eff.mana) {
        this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + eff.mana);
        this.events.emit(EV.LOG_MSG, { text: `Drank ${item.name}. +${eff.mana} MP.`, color: '#6666ff' });
      }
      if (eff.atk && eff.duration) {
        this.statusEffects.push({ type: 'atkBuff', duration: eff.duration, value: eff.atk });
        this.stats.atk += eff.atk;
        this.events.emit(EV.LOG_MSG, { text: `${item.name}! ATK +${eff.atk} for ${eff.duration} turns.`, color: '#ff8800' });
      }
      if (eff.speed && eff.duration) {
        this.statusEffects.push({ type: 'spdBuff', duration: eff.duration, value: eff.speed });
        this.stats.spd += eff.speed;
        this.events.emit(EV.LOG_MSG, { text: `Speed Potion! SPD +${eff.speed} for ${eff.duration} turns.`, color: '#ffff44' });
      }
      if (eff.cure) {
        this.statusEffects = this.statusEffects.filter(e => e.type !== eff.cure);
        this.events.emit(EV.LOG_MSG, { text: `Cured ${eff.cure}!`, color: '#44ff44' });
      }
      removeFromInventory(this, slotIndex);
      this.events.emit(EV.STATS_CHANGED);
      return { consumed: true };
    }

    if (item.type === ITEM_TYPE.SCROLL) {
      const eff = item.effect ?? {};
      removeFromInventory(this, slotIndex);
      this.events.emit(EV.STATS_CHANGED);
      return { consumed: true, scrollEffect: eff };
    }

    // Equippable
    if (item.slot) {
      this.equipItem(slotIndex);
      return { equipped: true };
    }

    return false;
  }

  equipItem(slotIndex) {
    const item = this.inventory[slotIndex];
    if (!item || !item.slot) return false;

    // Swap old equipped item back to inventory
    const old = this.equipment[item.slot];
    this.equipment[item.slot] = item;
    this.inventory[slotIndex] = old; // may be null

    this.events.emit(EV.LOG_MSG, { text: `Equipped ${item.name}.`, color: '#88ddff' });
    this.refreshStats();
    return true;
  }

  unequipItem(slot) {
    const item = this.equipment[slot];
    if (!item) return false;
    const added = addToInventory(this, item);
    if (!added) {
      this.events.emit(EV.LOG_MSG, { text: 'Inventory full!', color: '#ff8888' });
      return false;
    }
    this.equipment[slot] = null;
    this.refreshStats();
    return true;
  }

  // ── Turn ─────────────────────────────────────────────────

  onTurnEnd() {
    const msgs = tickStatusEffects(this);
    for (const m of msgs) this.events.emit(EV.LOG_MSG, m);

    // Expire timed buffs
    this.statusEffects = this.statusEffects.filter(eff => {
      if (eff.type === 'atkBuff' && eff.duration <= 0) {
        this.stats.atk -= eff.value;
        return false;
      }
      if (eff.type === 'spdBuff' && eff.duration <= 0) {
        this.stats.spd -= eff.value;
        return false;
      }
      return true;
    });

    // Small mana regen
    if (this.stats.mana < this.stats.maxMana) {
      this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + 1);
    }

    this.events.emit(EV.STATS_CHANGED);
  }

  get isDead() { return this.stats.hp <= 0; }
}
