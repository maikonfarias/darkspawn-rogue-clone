# Darkspawn Rogue Quest — Item Drop Reference

This document lists every item in the game with its drop parameters: where it can appear, its drop chance, whether it can stack, and what it is used for.

---

## Item Types & Usage

| Type       | Usage                                                                 |
|------------|-----------------------------------------------------------------------|
| `weapon`   | **Equip** (weapon slot) — increases ATK                              |
| `armor`    | **Equip** (armor slot) — increases DEF                               |
| `ring`     | **Equip** (ring slot) — grants stat bonuses                          |
| `amulet`   | **Equip** (amulet slot) — grants stat bonuses                        |
| `potion`   | **Use** — applies an immediate or timed effect                       |
| `scroll`   | **Use** — applies a one-time magical effect                          |
| `material` | **Craft** — used as ingredients in crafting recipes                  |
| `gold`     | **Currency** — added directly to your gold total                     |

---

## Complete Item List

### Weapons (Equip — weapon slot)

| ID           | Name         | ATK | Mana Bonus | Value | Weight | Notes                        |
|--------------|--------------|-----|------------|-------|--------|------------------------------|
| `fists`      | Fists        | 1   | —          | 0     | 0      | Starting weapon (no drop)    |
| `dagger`     | Dagger       | 3   | —          | 15    | 2      |                              |
| `shortSword` | Short Sword  | 5   | —          | 30    | 4      |                              |
| `longSword`  | Long Sword   | 8   | —          | 60    | 7      |                              |
| `battleAxe`  | Battle Axe   | 11  | —          | 90    | 9      |                              |
| `mageStaff`  | Mage Staff   | 6   | +10        | 75    | 5      | Also boosts max mana         |
| `warHammer`  | War Hammer   | 13  | —          | 110   | 11     |                              |
| `runicBlade` | Runic Blade  | 15  | +5         | 200   | 6      | Also boosts max mana         |

### Armor (Equip — armor slot)

| ID             | Name          | DEF | Mana Bonus | Value | Weight | Notes                        |
|----------------|---------------|-----|------------|-------|--------|------------------------------|
| `rags`         | Rags          | 0   | —          | 0     | 1      | Starting armor (no drop)     |
| `leatherArmor` | Leather Armor | 2   | —          | 20    | 4      |                              |
| `chainMail`    | Chain Mail    | 5   | —          | 50    | 8      |                              |
| `plateArmor`   | Plate Armor   | 9   | —          | 100   | 14     |                              |
| `mageRobe`     | Mage Robe     | 1   | +15        | 70    | 3      | Also boosts max mana         |
| `dragonScale`  | Dragon Armor  | 12  | —          | 250   | 10     |                              |

### Rings (Equip — ring slot)

| ID             | Name          | ATK | DEF | HP Bonus | Mana Bonus | Value | Notes |
|----------------|---------------|-----|-----|----------|------------|-------|-------|
| `ironRing`     | Iron Ring     | —   | +1  | —        | —          | 10    |       |
| `goldRing`     | Gold Ring     | —   | —   | +5       | —          | 50    |       |
| `rubyRing`     | Ruby Ring     | +2  | —   | —        | —          | 80    |       |
| `sapphireRing` | Sapphire Ring | —   | —   | —        | +10        | 80    |       |

### Amulets (Equip — amulet slot)

| ID           | Name              | ATK | DEF | HP Bonus | Mana Bonus | Value | Notes |
|--------------|-------------------|-----|-----|----------|------------|-------|-------|
| `boneAmulet` | Bone Amulet       | —   | —   | +10      | —          | 40    |       |
| `moonstone`  | Moonstone Amulet  | —   | +2  | —        | +8         | 100   |       |
| `dragonEye`  | Dragon's Eye      | +3  | —   | +15      | —          | 200   |       |

### Potions (Use — immediate or timed effect)

| ID            | Name               | Effect                              | Value | Stackable |
|---------------|--------------------|-------------------------------------|-------|-----------|
| `potionHpS`   | Health Potion (S)  | Heal 10 HP                          | 8     | Yes (1–3) |
| `potionHpM`   | Health Potion (M)  | Heal 25 HP                          | 18    | Yes (1–3) |
| `potionHpL`   | Health Potion (L)  | Heal 50 HP                          | 35    | Yes (1–3) |
| `potionMana`  | Mana Potion        | Restore 15 Mana                     | 15    | Yes (1–3) |
| `antidote`    | Antidote           | Cure poison                         | 12    | Yes (1–3) |
| `potionSpeed` | Speed Potion       | +3 SPD for 20 turns                 | 20    | Yes (1–3) |
| `potionStr`   | Strength Potion    | +3 ATK for 20 turns                 | 22    | Yes (1–3) |

### Scrolls (Use — one-time magical effect)

| ID           | Name                  | Effect                                         | Value | Stackable       |
|--------------|-----------------------|------------------------------------------------|-------|-----------------|
| `scrollMap`  | Scroll of Mapping     | Reveals the entire current floor               | 25    | Yes (1–3)       |
| `scrollTele` | Scroll of Teleport    | Teleports player to a random location          | 20    | Yes (1–3)       |
| `scrollId`   | Scroll of Identify    | Identifies an unknown item                     | 15    | Yes (1–3)       |
| `scrollFire` | Scroll of Fire        | Unleashes a fireball                           | 30    | Yes (1–3)       |
| `townScroll` | Town Scroll           | Teleports to town; leaves a return portal      | 40    | **No (qty = 1)**|

> **Note:** `townScroll` has `singleDrop: true` — it always spawns as a single copy, never stacked.

### Materials (Craft — used in recipes)

| ID              | Name           | Value | Stackable | Crafting Use                                          |
|-----------------|----------------|-------|-----------|-------------------------------------------------------|
| `wood`          | Wood           | 2     | Yes (1–3) | Dagger, Short/Long Sword, Battle Axe, Mage Staff      |
| `stone`         | Stone          | 1     | Yes (1–3) | Antidote (via Brew Antidote recipe)                   |
| `ironOre`       | Iron Ore       | 5     | Yes (1–3) | Smelt Iron (→ Iron Ingot)                             |
| `ironIngot`     | Iron Ingot     | 15    | Yes (1–3) | Most weapons, Chain Mail, Plate Armor, rings          |
| `leatherHide`   | Leather Hide   | 8     | Yes (1–3) | Leather Armor, Plate Armor, Mage Robe, Health Potion  |
| `bone`          | Bone           | 3     | Yes (1–3) | Bone Amulet, Moonstone Amulet, potions, Antidote      |
| `crystal`       | Magic Crystal  | 25    | Yes (1–3) | Mage Staff, Mage Robe, Moonstone Amulet, potions      |
| `dragonScale2`  | Dragon Scale   | 50    | Yes (1–3) | (Currently craft ingredient — no recipe yet)          |
| `gemRuby`       | Ruby Gem       | 40    | Yes (1–3) | Gold Ring, Ruby Ring                                  |
| `gemSapphire`   | Sapphire Gem   | 40    | Yes (1–3) | (Currently no crafting recipe)                        |

### Gold (Currency)

| ID     | Name | Notes                                                         |
|--------|------|---------------------------------------------------------------|
| `gold` | Gold | Added directly to player's gold total; amount varies by source |

---

## Drop Sources

### 1. Floor Item Spawns

Items spawn on the dungeon floor using a **weighted random table** per floor. The `weight` value is relative — an item's drop chance is `weight / total_weight_of_table`. Equipment items and `townScroll` always spawn as **qty 1**; all other items spawn as **qty 1–3**.

> **Gold piles** also spawn separately (2–4 per floor), with `5–15 × floor` gold each.

#### Floor 1 — Scripted Intro (Total weight: 14)

Floor 1 is a hand-crafted intro level. Items here are purely basic supplies; no armour or advanced gear.

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpS`      | 5      | 35.7%       |
| `wood`           | 3      | 21.4%       |
| `stone`          | 3      | 21.4%       |
| `bone`           | 2      | 14.3%       |
| `dagger`         | 1      | 7.1%        |

#### Floor 2 (Total weight: 15)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpS`      | 4      | 26.7%       |
| `wood`           | 3      | 20.0%       |
| `stone`          | 3      | 20.0%       |
| `ironOre`        | 2      | 13.3%       |
| `dagger`         | 2      | 13.3%       |
| `leatherArmor`   | 1      | 6.7%        |

#### Floor 3 (Total weight: 15)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpS`      | 3      | 20.0%       |
| `ironOre`        | 3      | 20.0%       |
| `potionHpM`      | 2      | 13.3%       |
| `wood`           | 2      | 13.3%       |
| `shortSword`     | 2      | 13.3%       |
| `leatherArmor`   | 2      | 13.3%       |
| `townScroll`     | 1      | 6.7%        |

#### Floor 4 (Total weight: 13)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpM`      | 3      | 23.1%       |
| `leatherHide`    | 3      | 23.1%       |
| `ironIngot`      | 2      | 15.4%       |
| `antidote`       | 2      | 15.4%       |
| `chainMail`      | 1      | 7.7%        |
| `scrollMap`      | 1      | 7.7%        |
| `townScroll`     | 1      | 7.7%        |

#### Floor 5 (Total weight: 12)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpM`      | 3      | 25.0%       |
| `ironIngot`      | 3      | 25.0%       |
| `potionMana`     | 2      | 16.7%       |
| `crystal`        | 1      | 8.3%        |
| `longSword`      | 1      | 8.3%        |
| `scrollTele`     | 1      | 8.3%        |
| `townScroll`     | 1      | 8.3%        |

#### Floor 6 (Total weight: 13)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpL`      | 2      | 15.4%       |
| `potionMana`     | 2      | 15.4%       |
| `crystal`        | 2      | 15.4%       |
| `bone`           | 2      | 15.4%       |
| `ironRing`       | 2      | 15.4%       |
| `battleAxe`      | 1      | 7.7%        |
| `boneAmulet`     | 1      | 7.7%        |
| `townScroll`     | 1      | 7.7%        |

#### Floor 7 — Magic Tier (Total weight: 14)

Floor 7 blends the gem/plate tier and the magic gear tier since floors 8–10 are unchanged.

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpL`      | 3      | 21.4%       |
| `crystal`        | 2      | 14.3%       |
| `scrollFire`     | 2      | 14.3%       |
| `gemRuby`        | 1      | 7.1%        |
| `plateArmor`     | 1      | 7.1%        |
| `mageStaff`      | 1      | 7.1%        |
| `mageRobe`       | 1      | 7.1%        |
| `goldRing`       | 1      | 7.1%        |
| `moonstone`      | 1      | 7.1%        |
| `townScroll`     | 1      | 7.1%        |

#### Floor 8 (Total weight: 11)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpL`      | 3      | 27.3%       |
| `potionMana`     | 3      | 27.3%       |
| `dragonScale2`   | 2      | 18.2%       |
| `warHammer`      | 1      | 9.1%        |
| `dragonEye`      | 1      | 9.1%        |
| `townScroll`     | 1      | 9.1%        |

#### Floor 9 (Total weight: 10)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpL`      | 4      | 40.0%       |
| `scrollFire`     | 2      | 20.0%       |
| `runicBlade`     | 1      | 10.0%       |
| `dragonScale`    | 1      | 10.0%       |
| `dragonEye`      | 1      | 10.0%       |
| `townScroll`     | 1      | 10.0%       |

#### Floor 10 — Boss Floor (Total weight: 6)

| Item             | Weight | Drop Chance |
|------------------|--------|-------------|
| `potionHpL`      | 4      | 66.7%       |
| `runicBlade`     | 1      | 16.7%       |
| `dragonScale`    | 1      | 16.7%       |

> No `townScroll` on floor 10.

---

### 2. Monster Loot Drops

Each monster has a loot table. Every entry is rolled **independently** with its own `chance` (0.0–1.0 = 0%–100%). Gold entries roll a random quantity in the given range `[min, max]`.

| Monster         | Floor Range | Loot Entry      | Drop Chance | Qty              |
|-----------------|-------------|-----------------|-------------|------------------|
| Giant Rat       | 2–4         | `bone`          | 40%         | 1                |
| Goblin          | 2–5         | `wood`          | 30%         | 1                |
|                 |             | `potionHpS`     | 20%         | 1                |
|                 |             | `gold`          | 50%         | 3–10             |
| Skeleton        | 3–7         | `bone`          | 60%         | 1                |
|                 |             | `ironOre`       | 20%         | 1                |
| Orc Warrior     | 4–8         | `ironOre`       | 40%         | 1                |
|                 |             | `leatherHide`   | 30%         | 1                |
|                 |             | `gold`          | 60%         | 5–15             |
| Cave Bat        | 3–6         | `bone`          | 20%         | 1                |
| Giant Spider    | 4–7         | `leatherHide`   | 40%         | 1                |
|                 |             | `antidote`      | 10%         | 1                |
| Cave Troll      | 6–9         | `ironIngot`     | 50%         | 1                |
|                 |             | `potionHpM`     | 30%         | 1                |
|                 |             | `gold`          | 80%         | 10–25            |
| Vampire         | 7–9         | `gemRuby`       | 20%         | 1                |
|                 |             | `crystal`       | 30%         | 1                |
|                 |             | `gold`          | 90%         | 15–35            |
| Dark Mage       | 7–9         | `crystal`       | 50%         | 1                |
|                 |             | `mageStaff`     | 10%         | 1                |
|                 |             | `scrollFire`    | 30%         | 1                |
| Demon           | 8–10        | `dragonScale2`  | 30%         | 1                |
|                 |             | `gemRuby`       | 30%         | 1                |
|                 |             | `crystal`       | 40%         | 1                |
|                 |             | `gold`          | 100%        | 25–60            |
| Dungeon Lord    | 10 only     | `runicBlade`    | 100%        | 1 (guaranteed)   |
|                 |             | `dragonScale`   | 100%        | 1 (guaranteed)   |
|                 |             | `dragonEye`     | 100%        | 1 (guaranteed)   |
|                 |             | `gold`          | 100%        | 100–200          |

> **Note:** Monster loot entries are each rolled independently, so a monster can drop multiple items in one kill.

---

### 3. Chests

Chests use the same floor item table as floor spawns. Opening a chest grants:
- **1–3 items** (each picked randomly by weight from the current floor's table, qty = 1).
- **Gold:** `10–30 × floor` gold added directly to the player's total.

---

### 4. Stack Rules Summary

| Category   | Stackable?            | Spawn Qty      |
|------------|-----------------------|----------------|
| Weapons    | No (qty always 1)     | 1              |
| Armor      | No (qty always 1)     | 1              |
| Rings      | No (qty always 1)     | 1              |
| Amulets    | No (qty always 1)     | 1              |
| Potions    | Yes                   | 1–3 (floor)    |
| Scrolls    | Yes (except Town)     | 1–3 (floor)    |
| Town Scroll| No (`singleDrop`)     | 1              |
| Materials  | Yes                   | 1–3 (floor)    |
| Gold       | N/A (direct currency) | 5–15 × floor   |

---

### 5. Crafting Recipes Reference

| Recipe                  | Ingredients                         | Result              |
|-------------------------|-------------------------------------|---------------------|
| Smelt Iron              | 2× Iron Ore                         | 1× Iron Ingot       |
| Craft Dagger            | 1× Iron Ingot + 1× Wood             | 1× Dagger           |
| Craft Short Sword       | 2× Iron Ingot + 1× Wood             | 1× Short Sword      |
| Craft Long Sword        | 3× Iron Ingot + 1× Wood             | 1× Long Sword       |
| Craft Battle Axe        | 4× Iron Ingot + 2× Wood             | 1× Battle Axe       |
| Craft Mage Staff        | 3× Wood + 2× Magic Crystal          | 1× Mage Staff       |
| Craft Leather Armor     | 3× Leather Hide                     | 1× Leather Armor    |
| Craft Chain Mail        | 4× Iron Ingot                       | 1× Chain Mail       |
| Craft Plate Armor       | 6× Iron Ingot + 2× Leather Hide     | 1× Plate Armor      |
| Craft Mage Robe         | 2× Leather Hide + 3× Magic Crystal  | 1× Mage Robe        |
| Craft Iron Ring         | 1× Iron Ingot                       | 1× Iron Ring        |
| Craft Gold Ring         | 1× Iron Ingot + 1× Ruby Gem         | 1× Gold Ring        |
| Craft Ruby Ring         | 1× Iron Ingot + 1× Ruby Gem         | 1× Ruby Ring        |
| Craft Bone Amulet       | 3× Bone                             | 1× Bone Amulet      |
| Craft Moonstone Amulet  | 2× Bone + 2× Magic Crystal          | 1× Moonstone Amulet |
| Brew Health Potion (S)  | 1× Leather Hide + 1× Bone           | 2× Health Potion (S)|
| Brew Health Potion (M)  | 1× Magic Crystal + 2× Bone          | 1× Health Potion (M)|
| Brew Mana Potion        | 1× Magic Crystal + 1× Wood          | 1× Mana Potion      |
| Brew Antidote           | 2× Bone + 1× Stone                  | 2× Antidote         |
