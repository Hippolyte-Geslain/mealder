import type { Course } from '../db/types';
import type { RecipeDraft } from '../ocr/claude';

const VALID_COURSES: Course[] = ['entree', 'plat', 'dessert'];

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseNumber(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function normalizeCourse(s: string): Course | null {
  const lower = s.trim().toLowerCase();
  if (lower === 'entrée' || lower === 'entree') return 'entree';
  if (lower === 'plat' || lower === 'main' || lower === 'principal') return 'plat';
  if (lower === 'dessert') return 'dessert';
  return null;
}

export function parseRecipesCsv(text: string): RecipeDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '');
  if (lines.length === 0) throw new CsvParseError('CSV vide');

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    recipe_name: header.indexOf('recipe_name'),
    course: header.indexOf('course'),
    ingredient_name: header.indexOf('ingredient_name'),
    quantity: header.indexOf('quantity'),
    unit: header.indexOf('unit'),
    cost_per_portion: header.indexOf('cost_per_portion'),
  };
  if (idx.recipe_name < 0 || idx.course < 0 || idx.ingredient_name < 0) {
    throw new CsvParseError(
      'Colonnes requises manquantes : recipe_name, course, ingredient_name'
    );
  }

  const grouped = new Map<string, RecipeDraft>();
  const order: string[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = parseLine(lines[r]);
    const recipeName = cells[idx.recipe_name]?.trim() ?? '';
    if (recipeName === '') continue;
    const course = normalizeCourse(cells[idx.course] ?? '');
    if (!course) continue;

    const key = `${recipeName}|${course}`;
    let draft = grouped.get(key);
    if (!draft) {
      draft = { name: recipeName, course, description: null, tags: [], ingredients: [] };
      grouped.set(key, draft);
      order.push(key);
    }

    const ingName = cells[idx.ingredient_name]?.trim() ?? '';
    if (ingName === '') continue;
    const quantity = idx.quantity >= 0 ? parseNumber(cells[idx.quantity] ?? '') : null;
    const unit =
      idx.unit >= 0 && cells[idx.unit]?.trim() !== '' ? cells[idx.unit].trim() : null;
    draft.ingredients.push({ name: ingName, quantity, unit });
  }

  return order.map((k) => grouped.get(k)!);
}

export { VALID_COURSES };
