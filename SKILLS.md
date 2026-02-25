# Darkspawn Rogue Quest — Skill Reference

There are **15 skills** across three trees: **Warrior**, **Rogue**, and **Mage**.

Each skill costs **1 skill point** to unlock. The player starts with 1 skill point and earns an additional point every 2 levels.

---

## Warrior Tree ⚔️

*Theme: melee power, survivability, and area attacks.*

| Skill | Tier | Prerequisite | Type | MP Cost | Effect |
|---|---|---|---|---|---|
| Power Strike | 1 | — | Passive | — | +3 attack damage |
| Shield Wall | 1 | — | Passive | — | +3 defense |
| Toughness | 2 | Shield Wall | Passive | — | +20 max HP |
| Berserker Rage | 2 | Power Strike | Active | 8 | Next hit deals double damage |
| Whirlwind | 3 | Berserker Rage | Active | 12 | Attack all 8 adjacent monsters |

### Warrior Skill Details

#### Power Strike (Tier 1 — Passive)
- Adds +3 to base attack, which feeds into every melee hit.
- Base damage formula: `max(1, atk + rand(-2, 2) - defender.def)`.

#### Shield Wall (Tier 1 — Passive)
- Adds +3 to base defense, reducing all incoming melee damage.

#### Toughness (Tier 2 — Passive, requires Shield Wall)
- Increases `maxHp` by 20 and immediately heals the player for 20 HP.

#### Berserker Rage (Tier 2 — Active, requires Power Strike, costs 8 MP)
- Applies the **berserker** status for 1 hit.
- On the next attack, damage is doubled **after** the normal damage formula (and before critical hit multiplication).
- The status is consumed on the first hit it affects.

#### Whirlwind (Tier 3 — Active, requires Berserker Rage, costs 12 MP)
- Performs a normal melee attack against every monster in the 8 tiles immediately surrounding the player.
- Each hit uses the standard damage formula independently.

---

## Rogue Tree 🗡️

*Theme: precision, evasion, debuffs, and mobility.*

| Skill | Tier | Prerequisite | Type | MP Cost | Effect |
|---|---|---|---|---|---|
| Critical Strike | 1 | — | Passive | — | +15% critical hit chance (×2 damage) |
| Evasion | 1 | — | Passive | — | +10% dodge chance |
| Poison Blade | 2 | Critical Strike | Passive | — | 30% chance to poison on hit |
| Shadow Step | 2 | Evasion | Active | 10 | Teleport to any visible empty tile |
| Death Mark | 3 | Poison Blade | Active | 15 | Target takes 50% more damage |

### Rogue Skill Details

#### Critical Strike (Tier 1 — Passive)
- Adds +15% critical hit chance.
- The player starts with 5% crit chance, so this raises it to **20%**.
- Critical hits multiply final damage by **×2**.

#### Evasion (Tier 1 — Passive)
- Adds +10% dodge chance. A dodge causes the incoming attack to deal **0 damage**.

#### Poison Blade (Tier 2 — Passive, requires Critical Strike)
- Each melee hit that deals damage has a **30% chance** to apply **Poison** to the target.
- **Poison** deals `rand(1, 3)` damage per turn for **10 turns**.

#### Shadow Step (Tier 2 — Active, requires Evasion, costs 10 MP)
- Instantly teleports the player to any visible, passable tile on the current floor.
- Triggers a targeting mode in the UI to select the destination.

#### Death Mark (Tier 3 — Active, requires Poison Blade, costs 15 MP)
- Applies the **deathMark** status to one targeted enemy.
- While marked, the enemy takes **+50% damage** from all sources (including spells and Whirlwind).
- Triggers a targeting mode to select the enemy.

---

## Mage Tree 🔮

*Theme: ranged spells, crowd control, and arcane defense.*

| Skill | Tier | Prerequisite | Type | MP Cost | Effect |
|---|---|---|---|---|---|
| Arcane Knowledge | 1 | — | Passive | — | +15 max mana |
| Magic Bolt | 1 | — | Active | 4 | Single-target bolt: 10 + level (+ 0–3) damage |
| Fireball | 2 | Magic Bolt | Active | 10 | 3×3 explosion: 8 + level damage + burn |
| Ice Nova | 2 | Arcane Knowledge | Active | 12 | Freeze all visible enemies for 2 turns |
| Arcane Shield | 3 | Ice Nova | Active | 15 | Absorb up to 20 damage for 10 turns |

### Mage Skill Details

#### Arcane Knowledge (Tier 1 — Passive)
- Increases `maxMana` by 15 and immediately grants 15 MP.
- The player starts with 10 max mana; this raises it to **25**.
- Mana regenerates at +1 per turn naturally.

#### Magic Bolt (Tier 1 — Active, costs 4 MP)
- Fires a bolt at a single targeted visible monster.
- **Damage:** `10 + player.level + rand(0, 3)` (bypasses the normal ATK/DEF formula).
- Example at level 1: 11–14 damage.

#### Fireball (Tier 2 — Active, requires Magic Bolt, costs 10 MP)
- Explodes at the chosen tile, hitting every monster within **1 tile** (3×3 area, 9 tiles).
- **Damage:** `8 + player.level` to each monster in the area (bypasses ATK/DEF).
- Also applies **Burn** (4 turns, `rand(2, 5)` damage/turn) to each hit monster.
- Example at level 5: 13 direct damage, plus 8–20 burn over 4 turns.

#### Ice Nova (Tier 2 — Active, requires Arcane Knowledge, costs 12 MP)
- Applies **Freeze** to all currently visible monsters for **2 turns**.
- Frozen monsters cannot act until the effect expires.

#### Arcane Shield (Tier 3 — Active, requires Ice Nova, costs 15 MP)
- Applies a damage-absorbing shield that blocks up to **20 total damage**.
- Lasts **10 turns** or until all 20 shield points are consumed, whichever comes first.
- Absorbed damage does not reduce the player's HP.

---

## Status Effects Reference

The following status effects are produced by skills:

| Status | Source | Duration | Per-turn Damage | Notes |
|---|---|---|---|---|
| Berserker | Berserker Rage | 1 hit | — | Doubles next melee hit damage; consumed on use |
| Poison | Poison Blade | 10 turns | rand(1, 3) | Applied on hit with 30% chance |
| Burn | Fireball | 4 turns | rand(2, 5) | Applied to all monsters in blast radius |
| Freeze | Ice Nova | 2 turns | — | Prevents monster from acting |
| Death Mark | Death Mark | Until removed | — | Enemy takes ×1.5 damage from all sources |
| Arcane Shield | Arcane Shield | 10 turns or 20 HP absorbed | — | Absorbs incoming damage before HP |

---

## Skill Point Acquisition

| Source | Points |
|---|---|
| Game start | 1 |
| Every even level (2, 4, 6, …) | +1 |

Maximum level is 19, providing up to **10 skill points** over a full playthrough — enough to unlock 10 of the 15 available skills.

---

## Prerequisite Tree Diagram

```
WARRIOR              ROGUE                MAGE
────────             ─────────            ──────────
Power Strike         Critical Strike      Arcane Knowledge
     │                      │                    │
Berserker Rage        Poison Blade           Ice Nova
     │                      │                    │
 Whirlwind             Death Mark          Arcane Shield

Shield Wall           Evasion             Magic Bolt
     │                    │                    │
 Toughness           Shadow Step           Fireball
```
