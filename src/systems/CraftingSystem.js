// ============================================================
//  Darkspawn Rogue Quest — Crafting System
// ============================================================
import { RECIPES } from '../data/RecipeData.js';
import { createItem } from '../data/ItemData.js';

/**
 * Check if the player has all ingredients for a recipe.
 * Returns { canCraft: bool, missing: [{id, have, need}] }
 */
export function checkRecipe(player, recipe) {
  const missing = [];
  for (const ing of recipe.ingredients) {
    const have = countItem(player, ing.id);
    if (have < ing.qty) {
      missing.push({ id: ing.id, have, need: ing.qty });
    }
  }
  return { canCraft: missing.length === 0, missing };
}

/**
 * Attempt to craft a recipe. Returns { success, message, item? }
 */
export function craftItem(player, recipeId) {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return { success: false, message: 'Unknown recipe.' };

  const { canCraft, missing } = checkRecipe(player, recipe);
  if (!canCraft) {
    const m = missing.map(m => `${m.id} (${m.have}/${m.need})`).join(', ');
    return { success: false, message: `Missing: ${m}` };
  }

  // Consume ingredients
  for (const ing of recipe.ingredients) {
    removeItems(player, ing.id, ing.qty);
  }

  // Add result
  const resultItem = createItem(recipe.result.id, recipe.result.qty ?? 1);
  const added = addToInventory(player, resultItem);
  if (!added) {
    // Inventory full — put ingredients back
    for (const ing of recipe.ingredients) {
      addToInventory(player, createItem(ing.id, ing.qty));
    }
    return { success: false, message: 'Inventory full!' };
  }

  return { success: true, message: `Crafted ${resultItem.name}!`, item: resultItem };
}

/**
 * Get available recipes (all, highlighting which can be crafted).
 */
export function getAvailableRecipes(player) {
  return RECIPES.map(recipe => {
    const { canCraft, missing } = checkRecipe(player, recipe);
    return { ...recipe, canCraft, missing };
  });
}

// ── Inventory helpers ─────────────────────────────────────────

function countItem(player, itemId) {
  return player.inventory
    .filter(slot => slot?.id === itemId)
    .reduce((sum, slot) => sum + (slot.qty ?? 1), 0);
}

function removeItems(player, itemId, qty) {
  let remaining = qty;
  for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
    const slot = player.inventory[i];
    if (!slot || slot.id !== itemId) continue;
    const take = Math.min(slot.qty ?? 1, remaining);
    slot.qty = (slot.qty ?? 1) - take;
    remaining -= take;
    if (slot.qty <= 0) player.inventory[i] = null;
  }
}

export function addToInventory(player, item) {
  // Equipment items (anything with a slot) never stack — each piece occupies its own slot
  const isEquipment = !!item.slot;

  // Try stacking (non-equipment only)
  if (!isEquipment && item.qty > 0) {
    for (const slot of player.inventory) {
      if (slot?.id === item.id && slot.id !== undefined) {
        slot.qty = (slot.qty ?? 1) + (item.qty ?? 1);
        return true;
      }
    }
  }
  // Find empty slot
  const emptyIdx = player.inventory.findIndex(s => s === null);
  if (emptyIdx === -1) return false;
  player.inventory[emptyIdx] = { ...item, qty: isEquipment ? 1 : (item.qty ?? 1) };
  return true;
}

export function removeFromInventory(player, slotIndex, qty = 1) {
  const slot = player.inventory[slotIndex];
  if (!slot) return false;
  slot.qty = (slot.qty ?? 1) - qty;
  if (slot.qty <= 0) player.inventory[slotIndex] = null;
  return true;
}
