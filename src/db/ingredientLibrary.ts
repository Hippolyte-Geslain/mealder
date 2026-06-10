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
    // Historise le coût quand il change (ou à la première apparition), avant
    // que l'upsert n'écrase la valeur courante.
    const current = await db.getFirstAsync<{ default_cost_per_portion: number }>(
      'SELECT default_cost_per_portion FROM ingredient_library WHERE owner_id = ? AND normalized_name = ?',
      ownerId,
      normalized
    );
    if (!current || current.default_cost_per_portion !== ing.costPerPortion) {
      await db.runAsync(
        `INSERT INTO ingredient_cost_history
         (id, owner_id, normalized_name, name, cost_per_portion, unit, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        uuid(),
        ownerId,
        normalized,
        name,
        ing.costPerPortion,
        ing.unit ?? null,
        now
      );
    }
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

export type IngredientCostSummary = {
  name: string;
  normalizedName: string;
  defaultUnit: string | null;
  currentCost: number;
  changeCount: number;
};

export type CostHistoryEntry = {
  cost: number;
  unit: string | null;
  recordedAt: number;
};

export async function listCostSummaries(): Promise<IngredientCostSummary[]> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const rows = await db.getAllAsync<{
    name: string;
    normalized_name: string;
    default_unit: string | null;
    default_cost_per_portion: number;
    change_count: number;
  }>(
    `SELECT l.name, l.normalized_name, l.default_unit, l.default_cost_per_portion,
            (SELECT COUNT(*) FROM ingredient_cost_history h
             WHERE h.owner_id = l.owner_id AND h.normalized_name = l.normalized_name) AS change_count
     FROM ingredient_library l
     WHERE l.owner_id = ?
     ORDER BY l.name COLLATE NOCASE ASC`,
    ownerId
  );
  return rows.map((r) => ({
    name: r.name,
    normalizedName: r.normalized_name,
    defaultUnit: r.default_unit,
    currentCost: r.default_cost_per_portion,
    changeCount: r.change_count,
  }));
}

export async function getCostHistory(normalizedName: string): Promise<CostHistoryEntry[]> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const rows = await db.getAllAsync<{
    cost_per_portion: number;
    unit: string | null;
    recorded_at: number;
  }>(
    `SELECT cost_per_portion, unit, recorded_at FROM ingredient_cost_history
     WHERE owner_id = ? AND normalized_name = ?
     ORDER BY recorded_at DESC, rowid DESC`,
    ownerId,
    normalizedName
  );
  return rows.map((r) => ({ cost: r.cost_per_portion, unit: r.unit, recordedAt: r.recorded_at }));
}
