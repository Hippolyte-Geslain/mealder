import type { FlavorProfile } from './types';
import { claudeFlavorProvider } from './claude';

/**
 * Abstraction du calcul de profil de saveurs (décision D6, projectlaunch.md).
 * Implémentation actuelle : appel Claude BYOK. Quand les poids Epicure seront
 * publiés, brancher ici un provider embarqué sans toucher au reste de l'app.
 */
export interface FlavorProvider {
  computeProfile(recipeName: string, ingredientNames: string[]): Promise<FlavorProfile>;
}

export function getFlavorProvider(): FlavorProvider {
  return claudeFlavorProvider;
}
