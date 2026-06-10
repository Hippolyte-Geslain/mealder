import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getApiKey } from '../utils/apiKey';
import { OcrError, type RecipeDraft } from './claude';
import type { Course } from '../db/types';

const MODEL = 'claude-sonnet-4-6';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const SOFT_MAX_BYTES = 30 * 1024 * 1024;

const SYSTEM_PROMPT = `Tu es un assistant qui extrait une LISTE de recettes à partir d'un PDF (livre de recettes, fiches, manuscrites ou imprimées, en français principalement) pour un chef.

Appelle l'outil record_recipes avec toutes les recettes trouvées dans le document.

Règles strictes :
- Une recette par page ou section claire du PDF. Ne fusionne pas plusieurs recettes.
- "name" : titre de la recette en français. Si absent, génère un nom court descriptif.
- "course" : EXACTEMENT "entree", "plat" ou "dessert". En cas de doute, "plat".
- "ingredients" : une entrée par ligne d'ingrédient visible. N'invente JAMAIS d'ingrédient non présent.
- "quantity" : nombre décimal. Omets le champ si absent.
- "unit" : unité courte en français. Omets si absente.
- Aucun coût, aucun prix : ces champs seront remplis manuellement.
- Si le PDF ne contient aucune recette, retourne {"recipes": []}.`;

const RECIPES_TOOL = {
  name: 'record_recipes',
  description: 'Enregistre une liste de recettes extraites du PDF fourni.',
  input_schema: {
    type: 'object',
    properties: {
      recipes: {
        type: 'array',
        description: 'Une entrée par recette détectée dans le document.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom de la recette en français.' },
            course: {
              type: 'string',
              enum: ['entree', 'plat', 'dessert'],
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
          required: ['name', 'course', 'ingredients'],
        },
      },
    },
    required: ['recipes'],
  },
} as const;

function classifyHttpError(status: number): OcrError['kind'] {
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}

function normalizeDrafts(input: unknown): RecipeDraft[] {
  const obj = (input ?? {}) as Record<string, unknown>;
  const arr = Array.isArray(obj.recipes) ? obj.recipes : [];
  const validCourses: Course[] = ['entree', 'plat', 'dessert'];
  return arr
    .map((raw): RecipeDraft => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const name = typeof r.name === 'string' ? r.name.trim() : '';
      const rawCourse = r.course;
      const course: Course =
        typeof rawCourse === 'string' && (validCourses as string[]).includes(rawCourse)
          ? (rawCourse as Course)
          : 'plat';
      const rawIng = Array.isArray(r.ingredients) ? r.ingredients : [];
      const ingredients = rawIng
        .map((rawI) => {
          const i = (rawI ?? {}) as Record<string, unknown>;
          const ingName = typeof i.name === 'string' ? i.name.trim() : '';
          const quantity =
            typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? i.quantity : null;
          const unit = typeof i.unit === 'string' && i.unit.trim() !== '' ? i.unit.trim() : null;
          return { name: ingName, quantity, unit };
        })
        .filter((i) => i.name !== '');
      return { name, course, ingredients };
    })
    .filter((d) => d.name !== '' || d.ingredients.length > 0);
}

// Web : pas d'expo-file-system ; l'URI du DocumentPicker (blob:) se lit via
// fetch + FileReader.
async function readPdfWeb(pdfUri: string): Promise<{ base64: string; size: number }> {
  const blob = await (await fetch(pdfUri)).blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), size: blob.size };
}

async function readPdfNative(pdfUri: string): Promise<{ base64: string; size: number }> {
  const info = await FileSystem.getInfoAsync(pdfUri);
  if (!info.exists) throw new OcrError('UNKNOWN', 'PDF not found');
  const size = 'size' in info ? info.size : 0;
  const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { base64, size };
}

export async function runBatchRecipeOcr(pdfUri: string): Promise<RecipeDraft[]> {
  console.log('[PDF-OCR] start', pdfUri);
  const apiKey = await getApiKey();
  if (!apiKey) throw new OcrError('NO_API_KEY');

  let base64: string;
  let size: number;
  try {
    ({ base64, size } = await (Platform.OS === 'web'
      ? readPdfWeb(pdfUri)
      : readPdfNative(pdfUri)));
  } catch (e) {
    if (e instanceof OcrError) throw e;
    throw new OcrError('UNKNOWN', `read: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (size > SOFT_MAX_BYTES) {
    throw new OcrError(
      'UNKNOWN',
      `PDF trop volumineux (${Math.round(size / 1024 / 1024)} Mo). Maximum 30 Mo.`
    );
  }
  console.log(`[PDF-OCR] size: ${Math.round(size / 1024)}KB`);

  const body = {
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [RECIPES_TOOL],
    tool_choice: { type: 'tool', name: RECIPES_TOOL.name },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          { type: 'text', text: 'Extrais toutes les recettes du PDF.' },
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
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new OcrError('NETWORK', e instanceof Error ? e.message : String(e));
  }

  console.log('[PDF-OCR] status:', res.status);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[PDF-OCR] error body:', text.slice(0, 500));
    throw new OcrError(classifyHttpError(res.status), `HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  let json: {
    content?: { type: string; name?: string; input?: unknown }[];
    stop_reason?: string;
  };
  try {
    json = await res.json();
  } catch {
    throw new OcrError('PARSE', 'invalid JSON envelope');
  }

  const toolUse = json.content?.find(
    (c) => c.type === 'tool_use' && c.name === RECIPES_TOOL.name
  );
  if (!toolUse || toolUse.input == null) {
    console.warn('[PDF-OCR] no tool_use in:', JSON.stringify(json).slice(0, 400));
    throw new OcrError('PARSE', 'no tool_use content');
  }

  const drafts = normalizeDrafts(toolUse.input);
  console.log(`[PDF-OCR] extracted ${drafts.length} recipes`);
  return drafts;
}
