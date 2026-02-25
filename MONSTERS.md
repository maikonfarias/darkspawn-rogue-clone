# Darkspawn Rogue Quest — Monster Reference

This document lists every monster in the game with its stats, floor range, AI behaviour, special abilities, and loot drops.

---

## Stat Glossary

| Stat  | Meaning                                        |
|-------|------------------------------------------------|
| HP    | Hit points — how much damage the monster can take |
| ATK   | Attack — base melee damage                     |
| DEF   | Defense — reduces incoming damage              |
| SPD   | Speed — determines action frequency (higher = faster) |
| XP    | Experience points awarded on kill              |

---

## Monster List

| ID            | Name         | Char | HP  | ATK | DEF | SPD | XP   | Floors | AI Type   |
|---------------|--------------|------|-----|-----|-----|-----|------|--------|-----------|
| `rat`         | Giant Rat    | `r`  | 4   | 2   | 0   | 5   | 5    | 2–4    | normal    |
| `goblin`      | Goblin       | `g`  | 8   | 4   | 1   | 4   | 15   | 2–5    | normal    |
| `bat`         | Cave Bat     | `b`  | 6   | 3   | 0   | 6   | 12   | 3–6    | normal    |
| `skeleton`    | Skeleton     | `s`  | 12  | 5   | 2   | 3   | 25   | 3–7    | normal    |
| `spider`      | Giant Spider | `S`  | 14  | 6   | 1   | 5   | 30   | 4–7    | poison    |
| `orc`         | Orc Warrior  | `o`  | 18  | 7   | 3   | 3   | 40   | 4–8    | normal    |
| `troll`       | Cave Troll   | `T`  | 35  | 10  | 5   | 2   | 80   | 6–9    | normal    |
| `vampire`     | Vampire      | `V`  | 28  | 9   | 4   | 5   | 90   | 7–9    | lifesteal |
| `darkMage`    | Dark Mage    | `M`  | 22  | 12  | 2   | 3   | 100  | 7–9    | ranged    |
| `demon`       | Demon        | `D`  | 45  | 14  | 8   | 4   | 150  | 8–10   | normal    |
| `dungeonLord` | Dungeon Lord | `L`  | 150 | 18  | 12  | 3   | 5000 | 10     | boss      |

---

## Monster Details

### Giant Rat
*A large aggressive rat.*

> **Note:** Floor 1 always spawns exactly 1 rat via the scripted intro level; random spawns begin on floor 2.

- **Floors:** 2–4
- **AI:** normal — moves toward the player and attacks in melee.
- **Special:** none.

### Goblin
*A sneaky green goblin.*

- **Floors:** 2–5
- **AI:** normal — moves toward the player and attacks in melee.
- **Special:** none.

### Cave Bat
*A fast-moving cave bat.*

- **Floors:** 3–6
- **AI:** normal — moves toward the player and attacks in melee. Its high SPD (6) makes it one of the fastest enemies in early floors.
- **Special:** none.

### Skeleton
*Undead bones that refuse to stay dead.*

- **Floors:** 3–7
- **AI:** normal — moves toward the player and attacks in melee.
- **Special:** none.

### Giant Spider
*A venomous spider the size of a dog.*

- **Floors:** 4–7
- **AI:** poison — melee attacker that inflicts **Poison** on hit.
- **Special:** Each melee hit has a **40% chance** to apply **Poison** (lasts 10 turns).

### Orc Warrior
*A brutish orc warrior.*

- **Floors:** 4–8
- **AI:** normal — moves toward the player and attacks in melee.
- **Special:** none.

### Cave Troll
*A massive regenerating cave troll.*

- **Floors:** 6–9
- **AI:** normal — slow (SPD 2) but hits hard and has high HP.
- **Special:** none.

### Vampire
*A cunning undead that drains life.*

- **Floors:** 7–9
- **AI:** lifesteal — heals itself for **30%** of the damage it deals.
- **Special:** Each hit restores HP equal to 30% of damage dealt.

### Dark Mage
*A dark mage who casts deadly spells.*

- **Floors:** 7–9
- **AI:** ranged — attacks from a distance instead of closing into melee.
- **Special:** none (high ATK of 12 compensates for low DEF and HP).

### Demon
*A fiery demon from the depths.*

- **Floors:** 8–10
- **AI:** normal — high HP, ATK, and DEF make this one of the toughest non-boss enemies.
- **Special:** none.

### Dungeon Lord *(Boss)*
*The immortal Dungeon Lord. Defeat him to win!*

- **Floors:** 10 only
- **AI:** boss — unique boss behaviour.
- **Special:** Defeating the Dungeon Lord ends the game. He has the highest stats in the game and is guaranteed to drop three powerful items plus a large gold reward.

---

## Floor Spawn Tables

The table below shows which monsters can appear on each floor.

| Floor | Monsters                                                          |
|-------|-------------------------------------------------------------------|
| 1     | Giant Rat *(scripted — 1 rat via intro level)*                    |
| 2     | Giant Rat, Goblin                                                 |
| 3     | Giant Rat, Goblin, Cave Bat, Skeleton                             |
| 4     | Giant Rat, Cave Bat, Skeleton, Giant Spider, Orc Warrior          |
| 5     | Cave Bat, Skeleton, Giant Spider, Orc Warrior                     |
| 6     | Cave Bat, Skeleton, Giant Spider, Orc Warrior, Cave Troll         |
| 7     | Orc Warrior, Cave Troll, Vampire, Dark Mage                       |
| 8     | Orc Warrior, Cave Troll, Vampire, Dark Mage, Demon               |
| 9     | Cave Troll, Vampire, Dark Mage, Demon                             |
| 10    | Demon, **Dungeon Lord** *(boss)*                                  |

---

## Loot Drops

Every loot entry is rolled **independently** when the monster dies. `chance` is the probability for that specific entry (0–100%). Gold entries produce a random amount in the `[min, max]` range.

| Monster      | Loot Item         | Drop Chance | Qty       |
|--------------|-------------------|-------------|-----------|
| Giant Rat    | Floors 2–4  | `bone`            | 40%         | 1         |
| Goblin       | Floors 2–5  | `wood`            | 30%         | 1         |
|              |             | `potionHpS`       | 20%         | 1         |
|              |             | `gold`            | 50%         | 3–10      |
| Cave Bat     | Floors 3–6  | `bone`            | 20%         | 1         |
| Skeleton     | Floors 3–7  | `bone`            | 60%         | 1         |
|              |             | `ironOre`         | 20%         | 1         |
| Giant Spider | Floors 4–7  | `leatherHide`     | 40%         | 1         |
|              |             | `antidote`        | 10%         | 1         |
| Orc Warrior  | Floors 4–8  | `ironOre`         | 40%         | 1         |
|              |             | `leatherHide`     | 30%         | 1         |
|              |             | `gold`            | 60%         | 5–15      |
| Cave Troll   | Floors 6–9  | `ironIngot`       | 50%         | 1         |
|              |             | `potionHpM`       | 30%         | 1         |
|              |             | `gold`            | 80%         | 10–25     |
| Vampire      | Floors 7–9  | `gemRuby`         | 20%         | 1         |
|              |             | `crystal`         | 30%         | 1         |
|              |             | `gold`            | 90%         | 15–35     |
| Dark Mage    | Floors 7–9  | `crystal`         | 50%         | 1         |
|              |             | `mageStaff`       | 10%         | 1         |
|              |             | `scrollFire`      | 30%         | 1         |
| Demon        | Floors 8–10 | `dragonScale2`    | 30%         | 1         |
|              |             | `gemRuby`         | 30%         | 1         |
|              |             | `crystal`         | 40%         | 1         |
|              |             | `gold`            | 100%        | 25–60     |
| Dungeon Lord | Floor 10    | `runicBlade`      | 100%        | 1 (guaranteed) |
|              |             | `dragonScale`     | 100%        | 1 (guaranteed) |
|              |             | `dragonEye`       | 100%        | 1 (guaranteed) |
|              |             | `gold`            | 100%        | 100–200   |

> **Note:** Multiple loot entries can drop from a single kill because each entry is rolled independently.

---

## AI Type Reference

| AI Type    | Behaviour                                                                 |
|------------|---------------------------------------------------------------------------|
| `normal`   | Chases and attacks the player in melee.                                   |
| `poison`   | Same as normal, but applies Poison on hit (Giant Spider: 40% chance, 10 turns). |
| `lifesteal`| Same as normal, but heals for 30% of damage dealt (Vampire).             |
| `ranged`   | Attacks the player from range instead of closing into melee (Dark Mage).  |
| `boss`     | Unique boss AI with enhanced behaviour (Dungeon Lord).                    |
