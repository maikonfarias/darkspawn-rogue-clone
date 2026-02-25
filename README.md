# Darkspawn Rogue Quest

A procedurally generated roguelike RPG built with [Phaser 3](https://phaser.io/) and [Vite](https://vitejs.dev/).

## Overview

Descend through 10 dungeon floors, battle monsters, collect loot, craft equipment, and develop your character through a skill tree. Survive long enough to defeat the **Dungeon Lord** on the final floor.

## Features

- **Procedurally generated dungeons** — every run produces a new map layout
- **Three skill trees** — Warrior ⚔️, Rogue 🗡️, and Mage 🔮
- **Equipment & crafting** — weapons, armor, rings, amulets, potions, scrolls, and materials
- **Turn-based combat** — with status effects such as Poison, Burn, Freeze, and more
- **10 dungeon floors** — including a boss floor with guaranteed rare drops

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Install & Run

```bash
npm install
npm run dev
```

Then open your browser at the local address printed in the terminal (e.g. `http://localhost:5173`).

### Build for Production

```bash
npm run build
```

## How to Play

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move / attack adjacent monsters |
| `I` | Open inventory |
| `S` | Open skill tree |
| `C` | Open crafting menu |
| `G` | Pick up item on floor |
| `>` | Descend staircase |

## Documentation

- [Skills Reference](SKILLS.md) — full details on all 15 skills across the Warrior, Rogue, and Mage trees
- [Item Drops Reference](ITEM_DROPS.md) — complete item list with drop tables, monster loot, chests, and crafting recipes

## Tech Stack

| Technology | Role |
|------------|------|
| [Phaser 3](https://phaser.io/) | Game engine |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
