import { getRecipe, listRecipes, setRecipeFlavor } from '../db/recipes';
import { getApiKey } from '../utils/apiKey';
import { getFlavorProvider } from './provider';
import { FlavorError } from './claude';
import { flavorInputKey } from './types';

/**
 * Calcule (ou recalcule) le profil de saveurs d'une recette et le met en cache
 * en base. No-op silencieux si la recette n'a pas d'ingrédients, si le profil
 * en cache est à jour, ou si aucune clé API n'est configurée (dégradation
 * gracieuse : l'UI masque alors les éléments de saveur).
 *
 * @returns true si un profil est désormais en cache pour la recette.
 */
export async function refreshRecipeFlavor(recipeId: string): Promise<boolean> {
  const recipe = await getRecipe(recipeId);
  if (!recipe) return false;
  const names = recipe.ingredients.map((i) => i.name.trim()).filter((n) => n !== '');
  if (names.length === 0) return false;

  const inputKey = flavorInputKey(recipe.name, names);
  if (recipe.flavor && recipe.flavorInput === inputKey) return true;

  if (!(await getApiKey())) return false;

  const profile = await getFlavorProvider().computeProfile(recipe.name, names);
  await setRecipeFlavor(recipeId, profile, inputKey);
  return true;
}

/** Variante fire-and-forget pour les flux de sauvegarde/import. */
export function refreshRecipeFlavorInBackground(recipeId: string): void {
  refreshRecipeFlavor(recipeId).catch((e) => {
    console.warn('[flavor] refresh failed:', e instanceof Error ? e.message : e);
  });
}

export function refreshRecipesFlavorInBackground(recipeIds: string[]): void {
  (async () => {
    for (const id of recipeIds) {
      try {
        await refreshRecipeFlavor(id);
      } catch (e) {
        if (e instanceof FlavorError && e.kind === 'NO_API_KEY') return;
        console.warn('[flavor] refresh failed:', e instanceof Error ? e.message : e);
      }
    }
  })();
}

export type BackfillResult = { computed: number; failed: number; total: number };

/**
 * Calcule séquentiellement les profils manquants de toute la bibliothèque
 * (action "Calculer les profils manquants" dans Réglages).
 */
export async function backfillFlavors(
  onProgress?: (done: number, total: number) => void
): Promise<BackfillResult> {
  const recipes = await listRecipes();
  const pending = recipes.filter((r) => r.flavor == null && r.ingredients.length > 0);
  let computed = 0;
  let failed = 0;
  for (const recipe of pending) {
    try {
      if (await refreshRecipeFlavor(recipe.id)) {
        computed++;
      } else {
        failed++;
      }
    } catch (e) {
      if (e instanceof FlavorError && e.kind === 'NO_API_KEY') throw e;
      failed++;
    }
    onProgress?.(computed + failed, pending.length);
  }
  return { computed, failed, total: pending.length };
}
