export const FLAVOR_AXES = ['sucre', 'sale', 'umami', 'gras', 'piquant', 'acide'] as const;

export type FlavorAxis = (typeof FLAVOR_AXES)[number];

export type FlavorProfile = {
  /** Score 0–1 par axe sensoriel. */
  axes: Record<FlavorAxis, number>;
  /** Tradition culinaire dominante (libellé court en français), ou null. */
  cluster: string | null;
};

function clamp01(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function normalizeFlavorProfile(input: unknown): FlavorProfile {
  const obj = (input ?? {}) as Record<string, unknown>;
  const axes = {} as Record<FlavorAxis, number>;
  for (const axis of FLAVOR_AXES) {
    axes[axis] = clamp01(obj[axis]);
  }
  const rawCluster = obj.cluster;
  const cluster =
    typeof rawCluster === 'string' && rawCluster.trim() !== '' ? rawCluster.trim() : null;
  return { axes, cluster };
}

export function parseFlavorProfile(json: string | null): FlavorProfile | null {
  if (!json) return null;
  try {
    return normalizeFlavorProfile(JSON.parse(json));
  } catch {
    return null;
  }
}

export function serializeFlavorProfile(profile: FlavorProfile): string {
  return JSON.stringify({ ...profile.axes, cluster: profile.cluster });
}

/**
 * Deterministic key of the inputs a profile was computed from; stored alongside
 * the cached profile so a recipe edit that changes the ingredients triggers a
 * recompute while a cosmetic edit (photo, cost) does not.
 */
export function flavorInputKey(recipeName: string, ingredientNames: string[]): string {
  const names = ingredientNames
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n !== '')
    .sort();
  return `${recipeName.trim().toLowerCase()}|${names.join(';')}`;
}
