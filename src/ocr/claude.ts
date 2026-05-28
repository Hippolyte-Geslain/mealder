import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { getApiKey } from '../utils/apiKey';
import type { Course } from '../db/types';

const MODEL = 'claude-sonnet-4-6';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MAX_DIM = 1568;

export type RecipeDraft = {
  name: string;
  course: Course;
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
};

export type OcrFailure =
  | 'NO_API_KEY'
  | 'NETWORK'
  | 'AUTH'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'PARSE'
  | 'UNKNOWN';

export class OcrError extends Error {
  readonly kind: OcrFailure;
  constructor(kind: OcrFailure, message?: string) {
    super(message ?? kind);
    this.kind = kind;
    this.name = 'OcrError';
  }
}

const SYSTEM_PROMPT = `Tu es un assistant qui extrait une recette à partir d'une photo (manuscrite ou imprimée, en français principalement) pour un chef.

Appelle l'outil record_recipe avec les informations extraites de la photo.

Règles strictes :
- "name" : titre de la recette en français. Si absent, génère un nom court descriptif.
- "course" : EXACTEMENT "entree", "plat" ou "dessert". En cas de doute, "plat".
- "ingredients" : une entrée par ligne d'ingrédient visible. N'invente JAMAIS d'ingrédient non présent sur la photo.
- "quantity" : nombre décimal. Omets le champ si absent ou non chiffrable.
- "unit" : unité courte en français ("g", "kg", "L", "cl", "ml", "c. à s.", "c. à c.", "pièce", "pincée", "gousse"…). Omets si absente.
- Aucun coût, aucun prix : ces champs seront remplis manuellement par le chef.
- Si la photo n'est PAS une recette, appelle record_recipe avec name="" et ingredients=[].`;

const RECIPE_TOOL = {
  name: 'record_recipe',
  description: 'Enregistre une recette extraite depuis la photo fournie par le chef.',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nom de la recette en français.' },
      course: {
        type: 'string',
        enum: ['entree', 'plat', 'dessert'],
        description: 'Type de plat. En cas de doute, "plat".',
      },
      ingredients: {
        type: 'array',
        description: 'Liste des ingrédients visibles. Ne pas inventer.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: "Nom de l'ingrédient en français." },
            quantity: { type: 'number', description: 'Omets si absent.' },
            unit: { type: 'string', description: 'Omets si absente.' },
          },
          required: ['name'],
        },
      },
    },
    required: ['name', 'course', 'ingredients'],
  },
} as const;

function classifyHttpError(status: number): OcrFailure {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}

function normalizeDraft(input: unknown): RecipeDraft {
  const validCourses: Course[] = ['entree', 'plat', 'dessert'];
  const obj = (input ?? {}) as Record<string, unknown>;
  const rawCourse = obj.course;
  const course: Course =
    typeof rawCourse === 'string' && (validCourses as string[]).includes(rawCourse)
      ? (rawCourse as Course)
      : 'plat';
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  const rawIngredients = Array.isArray(obj.ingredients) ? obj.ingredients : [];
  const ingredients = rawIngredients
    .map((raw): RecipeDraft['ingredients'][number] => {
      const i = (raw ?? {}) as Record<string, unknown>;
      const ingName = typeof i.name === 'string' ? i.name.trim() : '';
      const quantity =
        typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? i.quantity : null;
      const unit = typeof i.unit === 'string' && i.unit.trim() !== '' ? i.unit.trim() : null;
      return { name: ingName, quantity, unit };
    })
    .filter((i) => i.name !== '');
  return { name, course, ingredients };
}

async function prepareImageForOcr(photoUri: string): Promise<string> {
  const info = await ImageManipulator.manipulateAsync(photoUri, [], {});
  const longerEdge = Math.max(info.width, info.height);
  const actions: ImageManipulator.Action[] = [];
  if (longerEdge > MAX_DIM) {
    if (info.width >= info.height) {
      actions.push({ resize: { width: MAX_DIM } });
    } else {
      actions.push({ resize: { height: MAX_DIM } });
    }
  }
  const result = await ImageManipulator.manipulateAsync(photoUri, actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  console.log(
    `[OCR] image: source ${info.width}x${info.height} → out ${result.width}x${result.height}`
  );
  return result.uri;
}

export async function runRecipeOcr(photoUri: string): Promise<RecipeDraft> {
  console.log('[OCR] start', photoUri);
  const apiKey = await getApiKey();
  if (!apiKey) throw new OcrError('NO_API_KEY');

  let preparedUri: string;
  try {
    preparedUri = await prepareImageForOcr(photoUri);
  } catch (e) {
    console.warn('[OCR] resize failed:', e);
    throw new OcrError('UNKNOWN', `resize: ${e instanceof Error ? e.message : String(e)}`);
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(preparedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (e) {
    console.warn('[OCR] read failed:', e);
    throw new OcrError('UNKNOWN', `read: ${e instanceof Error ? e.message : String(e)}`);
  }
  console.log(`[OCR] base64 length: ${base64.length} (~${Math.round(base64.length / 1024)}KB)`);

  const body = {
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [RECIPE_TOOL],
    tool_choice: { type: 'tool', name: RECIPE_TOOL.name },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          { type: 'text', text: 'Extrais la recette de cette photo.' },
        ],
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
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn('[OCR] network error:', e);
    throw new OcrError('NETWORK', e instanceof Error ? e.message : String(e));
  }

  console.log('[OCR] response status:', res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[OCR] error body:', text.slice(0, 500));
    throw new OcrError(classifyHttpError(res.status), `HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  let json: {
    content?: { type: string; text?: string; name?: string; input?: unknown }[];
    stop_reason?: string;
  };
  try {
    json = await res.json();
  } catch (e) {
    throw new OcrError('PARSE', 'invalid JSON envelope');
  }

  console.log('[OCR] stop_reason:', json.stop_reason);
  const toolUse = json.content?.find((c) => c.type === 'tool_use' && c.name === RECIPE_TOOL.name);
  if (!toolUse || toolUse.input == null) {
    console.warn('[OCR] no tool_use block in:', JSON.stringify(json).slice(0, 400));
    throw new OcrError('PARSE', 'no tool_use content');
  }
  console.log('[OCR] tool input head:', JSON.stringify(toolUse.input).slice(0, 200));

  return normalizeDraft(toolUse.input);
}
