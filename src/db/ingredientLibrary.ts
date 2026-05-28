import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from './client';
import { ensureDeviceOwnerId } from './owner';
import { uuid } from '../utils/uuid';
import type { IngredientInput } from './recipes';

export type LibraryEntry = {
  id: string;
  name: string;
  defaultUnit: string | null;
  defaultCostPerPortion: number;
};

type LibraryRow = {
  id: string;
  owner_id: string;
  name: string;
  normalized_name: string;
  default_unit: string | null;
  default_cost_per_portion: number;
  updated_at: number;
};

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase();
}

function toEntry(r: LibraryRow): LibraryEntry {
  return {
    id: r.id,
    name: r.name,
    defaultUnit: r.default_unit,
    defaultCostPerPortion: r.default_cost_per_portion,
  };
}

export async function searchLibrary(prefix: string, limit = 5): Promise<LibraryEntry[]> {
  const trimmed = prefix.trim();
  if (trimmed === '') return [];
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const normalized = normalizeIngredientName(trimmed);
  const rows = await db.getAllAsync<LibraryRow>(
    `SELECT * FROM ingredient_library
     WHERE owner_id = ? AND normalized_name LIKE ?
     ORDER BY updated_at DESC
     LIMIT ?`,
    ownerId,
    normalized + '%',
    limit
  );
  return rows.map(toEntry);
}

export async function upsertFromRecipe(
  db: SQLiteDatabase,
  ownerId: string,
  ingredients: IngredientInput[],
  now: number
): Promise<void> {
  for (const ing of ingredients) {
    const name = ing.name.trim();
    if (name === '') continue;
    const normalized = normalizeIngredientName(name);
    await db.runAsync(
      `INSERT INTO ingredient_library
       (id, owner_id, name, normalized_name, default_unit, default_cost_per_portion, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(owner_id, normalized_name) DO UPDATE SET
         name = excluded.name,
         default_unit = excluded.default_unit,
         default_cost_per_portion = excluded.default_cost_per_portion,
         updated_at = excluded.updated_at`,
      uuid(),
      ownerId,
      name,
      normalized,
      ing.unit ?? null,
      ing.costPerPortion,
      now
    );
  }
}
