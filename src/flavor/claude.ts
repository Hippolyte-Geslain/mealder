import { getApiKey } from '../utils/apiKey';
import { normalizeFlavorProfile, type FlavorProfile } from './types';
import type { FlavorProvider } from './provider';

const MODEL = 'claude-sonnet-4-6';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export type FlavorFailure = 'NO_API_KEY' | 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'SERVER' | 'PARSE' | 'UNKNOWN';

export class FlavorError extends Error {
  readonly kind: FlavorFailure;
  constructor(kind: FlavorFailure, message?: string) {
    super(message ?? kind);
    this.kind = kind;
    this.name = 'FlavorError';
  }
}

const SYSTEM_PROMPT = `Tu es un assistant culinaire pour un chef. À partir du nom d'une recette et de sa liste d'ingrédients, tu évalues son profil de saveurs.

Appelle l'outil record_flavor_profile avec ton évaluation.

Règles strictes :
- Chaque dimension est un nombre entre 0 et 1 : 0 = absente, 0.5 = présente, 1 = dominante.
- "sucre" : sucrosité perçue du plat fini.
- "sale" : salinité perçue.
- "umami" : profondeur savoureuse (viandes, champignons, fromages affinés, fermenté…).
- "gras" : richesse en matières grasses (beurre, crème, huiles, viandes grasses…).
- "piquant" : piquant/chaleur (piments, poivre, moutarde, gingembre…).
- "acide" : acidité perçue (agrumes, vinaigre, tomate, produits lactofermentés…).
- "cluster" : tradition culinaire dominante, en français, 1 à 3 mots (ex. "Française classique", "Méditerranéen", "Asiatique", "Nord-africain"). Si indéterminable, chaîne vide.
- Évalue le plat tel qu'il sera servi, pas les ingrédients crus un par un.`;

const FLAVOR_TOOL = {
  name: 'record_flavor_profile',
  description: "Enregistre le profil de saveurs évalué pour la recette fournie.",
  input_schema: {
    type: 'object',
    properties: {
      sucre: { type: 'number', description: 'Sucrosité, 0 à 1.' },
      sale: { type: 'number', description: 'Salinité, 0 à 1.' },
      umami: { type: 'number', description: 'Umami, 0 à 1.' },
      gras: { type: 'number', description: 'Richesse grasse, 0 à 1.' },
      piquant: { type: 'number', description: 'Piquant, 0 à 1.' },
      acide: { type: 'number', description: 'Acidité, 0 à 1.' },
      cluster: {
        type: 'string',
        description: 'Tradition culinaire dominante en français, 1 à 3 mots. Vide si indéterminable.',
      },
    },
    required: ['sucre', 'sale', 'umami', 'gras', 'piquant', 'acide', 'cluster'],
  },
} as const;

function classifyHttpError(status: number): FlavorFailure {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}

async function computeProfile(recipeName: string, ingredientNames: string[]): Promise<FlavorProfile> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new FlavorError('NO_API_KEY');

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [FLAVOR_TOOL],
    tool_choice: { type: 'tool', name: FLAVOR_TOOL.name },
    messages: [
      {
        role: 'user',
        content: `Recette : ${recipeName}\nIngrédients : ${ingredientNames.join(', ')}`,
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new FlavorError('NETWORK', e instanceof Error ? e.message : String(e));
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new FlavorError(classifyHttpError(res.status), `HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  let json: { content?: { type: string; name?: string; input?: unknown }[] };
  try {
    json = await res.json();
  } catch {
    throw new FlavorError('PARSE', 'invalid JSON envelope');
  }

  const toolUse = json.content?.find((c) => c.type === 'tool_use' && c.name === FLAVOR_TOOL.name);
  if (!toolUse || toolUse.input == null) {
    throw new FlavorError('PARSE', 'no tool_use content');
  }

  return normalizeFlavorProfile(toolUse.input);
}

export const claudeFlavorProvider: FlavorProvider = { computeProfile };
