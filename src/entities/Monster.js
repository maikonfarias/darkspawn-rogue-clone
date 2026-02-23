// ============================================================
//  Darkspawn Rogue Quest — Monster Entity
// ============================================================
import { AI, VIS, EV, DIR4 } from '../data/Constants.js';
import { rand, chance, pick } from '../utils/Random.js';
import { nextStep } from '../systems/AStarPathfinder.js';
import { resolveAttack, tickStatusEffects } from '../systems/CombatSystem.js';
import { isPassable } from '../systems/DungeonGenerator.js';
import { SFX } from '../systems/SoundEffects.js';

export class Monster {
  constructor(def, x, y, floorNum) {
    this.def = def;
    this.id  = def.id;
    this.name = def.name;
    this.x = x;
    this.y = y;
    this.floor = floorNum;

    // Scale stats slightly with floor depth
    const scale = 1 + (floorNum - def.floorMin) * 0.15;
    this.stats = {
      hp:    Math.floor(def.hp * scale),
      maxHp: Math.floor(def.hp * scale),
      atk:   Math.max(1, Math.floor((def.atk + rand(0, 2)) * scale)),
      def:   def.def,
    };

    this.aiState = AI.IDLE;
    this.lastKnownPlayerPos = null;
    this.wanderTarget = null;
    this.statusEffects = [];
    this.alertCooldown = 0;

    // Speed: monsters with lower spd skip turns more often
    this.spd     = def.spd ?? 3;
    this.turnAcc = 0; // accumulated turn counter
  }

  get isDead() { return this.stats.hp <= 0; }

  /**
   * Main AI tick. Returns true if the monster acted (for turn management).
   * @param {object} ctx - { grid, player, monsters, events, vis }
   */
  update(ctx) {
    const { grid, player, monsters, events, vis } = ctx;

    // Status effects: freeze/stun skip turn
    const msgs = tickStatusEffects(this);
    for (const m of msgs) events.emit(EV.LOG_MSG, m);
    if (this.isDead) return false;

    if (this.statusEffects.some(e => e.type === 'freeze' || e.type === 'stun')) {
      return true; // turn consumed but no action
    }

    // Speed check: slow monsters skip some turns
    this.turnAcc += this.spd;
    if (this.turnAcc < 4) return false;
    this.turnAcc -= 4;

    // Can we see the player? (symmetric FOV — if player sees this monster's tile, monster sees player)
    const canSeePlayer = vis[this.y]?.[this.x] === VIS.VISIBLE &&
                         this._inRange(player.x, player.y, 8);

    // Update AI state
    switch (this.aiState) {
      case AI.IDLE:
        if (canSeePlayer) {
          this.aiState = AI.ALERT;
          this.alertCooldown = 3;
          events.emit(EV.LOG_MSG, { text: `${this.name} spots you!`, color: '#ffaa44' });
        }
        break;

      case AI.ALERT:
        if (canSeePlayer) {
          this.lastKnownPlayerPos = { x: player.x, y: player.y };
          this.aiState = AI.CHASE;
        } else {
          this.alertCooldown--;
          if (this.alertCooldown <= 0) this.aiState = AI.IDLE;
        }
        break;

      case AI.CHASE:
        if (canSeePlayer) {
          this.lastKnownPlayerPos = { x: player.x, y: player.y };
        } else if (!this.lastKnownPlayerPos) {
          this.aiState = AI.IDLE;
        }
        break;
    }

    // Flee if HP < 25%
    if (this.stats.hp < this.stats.maxHp * 0.25 && this.def.aiType !== 'boss') {
      this.aiState = AI.FLEE;
    }

    // Execute action based on state
    if (this._isAdjacent(player.x, player.y)) {
      this._attack(player, events);
    } else {
      this._move(ctx);
    }

    return true;
  }

  _isAdjacent(px, py) {
    return Math.abs(this.x - px) <= 1 && Math.abs(this.y - py) <= 1 &&
           !(this.x === px && this.y === py);
  }

  _inRange(px, py, range) {
    return Math.abs(this.x - px) <= range && Math.abs(this.y - py) <= range;
  }

  _attack(player, events) {
    // Ranged monsters keep distance and use ranged attack
    if (this.def.aiType === 'ranged' && !this._isAdjacent(player.x, player.y)) return;

    const result = resolveAttack(this, player, events);
    if (!result.hit) return;

    SFX.play('hit');

    let msg = `${this.name} hits you for ${result.damage} damage`;
    if (result.crit) msg += ' (CRITICAL!)';
    msg += '.';
    events.emit(EV.LOG_MSG, { text: msg, color: '#ff6666' });

    if (result.statusApplied) {
      events.emit(EV.LOG_MSG, { text: `You are ${result.statusApplied}!`, color: '#44cc44' });
    }

    events.emit(EV.STATS_CHANGED);
  }

  _move(ctx) {
    const { grid, player, monsters } = ctx;
    const occupied = new Set(
      monsters
        .filter(m => m !== this && !m.isDead)
        .map(m => `${m.x},${m.y}`)
    );
    occupied.add(`${player.x},${player.y}`);

    let target = null;

    if (this.aiState === AI.FLEE) {
      // Move away from player
      target = this._fleeTarget(player, grid, occupied);
    } else if (this.aiState === AI.CHASE && this.lastKnownPlayerPos) {
      // Move toward last known player position
      target = nextStep(grid, this.x, this.y,
        this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y, occupied);
      // Reached last known pos — go back to alert
      if (!target && this.x === this.lastKnownPlayerPos?.x && this.y === this.lastKnownPlayerPos?.y) {
        this.lastKnownPlayerPos = null;
        this.aiState = AI.ALERT;
        this.alertCooldown = 5;
      }
    } else {
      // Idle wander
      target = this._wanderStep(grid, occupied);
    }

    if (target && isPassable(grid, target.x, target.y)) {
      this.x = target.x;
      this.y = target.y;
    }
  }

  _fleeTarget(player, grid, occupied) {
    // Pick direction furthest from player
    let bestDist = -1, best = null;
    for (const d of DIR4) {
      const nx = this.x + d.dx, ny = this.y + d.dy;
      if (!isPassable(grid, nx, ny) || occupied.has(`${nx},${ny}`)) continue;
      const dist = Math.abs(nx - player.x) + Math.abs(ny - player.y);
      if (dist > bestDist) { bestDist = dist; best = { x: nx, y: ny }; }
    }
    return best;
  }

  _wanderStep(grid, occupied) {
    // Occasionally pick new wander target
    if (!this.wanderTarget || (this.x === this.wanderTarget.x && this.y === this.wanderTarget.y)) {
      if (chance(0.3)) {
        const d = pick(DIR4);
        this.wanderTarget = { x: this.x + d.dx * rand(2, 5), y: this.y + d.dy * rand(2, 5) };
      } else {
        return null; // stay put
      }
    }
    return nextStep(grid, this.x, this.y, this.wanderTarget.x, this.wanderTarget.y, occupied, 10);
  }

  /** Generate loot from this monster's table */
  rollLoot() {
    const items = [];
    for (const entry of (this.def.loot ?? [])) {
      if (chance(entry.chance)) {
        const qty = Array.isArray(entry.qty)
          ? rand(entry.qty[0], entry.qty[1])
          : (entry.qty ?? 1);
        items.push({ id: entry.id, qty });
      }
    }
    return items;
  }
}
