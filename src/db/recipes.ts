import { getDb } from './client';
import { ensureDeviceOwnerId } from './owner';
import { upsertFromRecipe } from './ingredientLibrary';
import { uuid } from '../utils/uuid';
import type { Course, Ingredient, Recipe, RecipeWithIngredients } from './types';

type RecipeRow = {
  id: string;
  owner_id: string;
  name: string;
  course: Course;
  photo_uri: string | null;
  description: string | null;
  tags: string | null;
  created_at: number;
  updated_at: number;
};

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '');
}

function serializeTags(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  const cleaned = tags.map((t) => t.trim()).filter((t) => t !== '');
  return cleaned.length === 0 ? null : cleaned.join(',');
}

type IngredientRow = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  cost_per_portion: number;
  position: number;
};

function toRecipe(r: RecipeRow): Recipe {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    course: r.course,
    photoUri: r.photo_uri,
    description: r.description,
    tags: parseTags(r.tags),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toIngredient(r: IngredientRow): Ingredient {
  return {
    id: r.id,
    recipeId: r.recipe_id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
    costPerPortion: r.cost_per_portion,
    position: r.position,
  };
}

function withTotal(recipe: Recipe, ingredients: Ingredient[]): RecipeWithIngredients {
  return {
    ...recipe,
    ingredients,
    totalCostPerPortion: ingredients.reduce((s, i) => s + i.costPerPortion, 0),
  };
}

export async function listRecipes(course?: Course): Promise<RecipeWithIngredients[]> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const recipeRows = course
    ? await db.getAllAsync<RecipeRow>(
        'SELECT * FROM recipe WHERE owner_id = ? AND course = ? ORDER BY updated_at DESC',
        ownerId,
        course
      )
    : await db.getAllAsync<RecipeRow>(
        'SELECT * FROM recipe WHERE owner_id = ? ORDER BY updated_at DESC',
        ownerId
      );
  if (recipeRows.length === 0) return [];
  const ids = recipeRows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const ingRows = await db.getAllAsync<IngredientRow>(
    `SELECT * FROM ingredient WHERE recipe_id IN (${placeholders}) ORDER BY position ASC`,
    ...ids
  );
  const byRecipe = new Map<string, Ingredient[]>();
  for (const r of ingRows) {
    const list = byRecipe.get(r.recipe_id) ?? [];
    list.push(toIngredient(r));
    byRecipe.set(r.recipe_id, list);
  }
  return recipeRows.map((row) => withTotal(toRecipe(row), byRecipe.get(row.id) ?? []));
}

export async function getRecipe(id: string): Promise<RecipeWithIngredients | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RecipeRow>('SELECT * FROM recipe WHERE id = ?', id);
  if (!row) return null;
  const ingRows = await db.getAllAsync<IngredientRow>(
    'SELECT * FROM ingredient WHERE recipe_id = ? ORDER BY position ASC',
    id
  );
  return withTotal(toRecipe(row), ingRows.map(toIngredient));
}

export type IngredientInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
  costPerPortion: number;
};

export type RecipeInput = {
  name: string;
  course: Course;
  photoUri: string | null;
  description?: string | null;
  tags?: string[];
  ingredients: IngredientInput[];
};

export async function createRecipe(input: RecipeInput): Promise<string> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const id = uuid();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO recipe (id, owner_id, name, course, photo_uri, description, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      ownerId,
      input.name,
      input.course,
      input.photoUri,
      input.description ?? null,
      serializeTags(input.tags),
      now,
      now
    );
    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      await db.runAsync(
        'INSERT INTO ingredient (id, recipe_id, name, quantity, unit, cost_per_portion, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        uuid(),
        id,
        ing.name,
        ing.quantity,
        ing.unit,
        ing.costPerPortion,
        i
      );
    }
    await upsertFromRecipe(db, ownerId, input.ingredients, now);
  });
  return id;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE recipe SET name = ?, course = ?, photo_uri = ?, description = ?, tags = ?, updated_at = ? WHERE id = ?',
      input.name,
      input.course,
      input.photoUri,
      input.description ?? null,
      serializeTags(input.tags),
      now,
      id
    );
    await db.runAsync('DELETE FROM ingredient WHERE recipe_id = ?', id);
    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      await db.runAsync(
        'INSERT INTO ingredient (id, recipe_id, name, quantity, unit, cost_per_portion, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        uuid(),
        id,
        ing.name,
        ing.quantity,
        ing.unit,
        ing.costPerPortion,
        i
      );
    }
    await upsertFromRecipe(db, ownerId, input.ingredients, now);
  });
}

export async function createRecipesBulk(inputs: RecipeInput[]): Promise<string[]> {
  if (inputs.length === 0) return [];
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const now = Date.now();
  const ids: string[] = [];
  await db.withTransactionAsync(async () => {
    for (const input of inputs) {
      const id = uuid();
      ids.push(id);
      await db.runAsync(
        'INSERT INTO recipe (id, owner_id, name, course, photo_uri, description, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id,
        ownerId,
        input.name,
        input.course,
        input.photoUri,
        input.description ?? null,
        serializeTags(input.tags),
        now,
        now
      );
      for (let i = 0; i < input.ingredients.length; i++) {
        const ing = input.ingredients[i];
        await db.runAsync(
          'INSERT INTO ingredient (id, recipe_id, name, quantity, unit, cost_per_portion, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
          uuid(),
          id,
          ing.name,
          ing.quantity,
          ing.unit,
          ing.costPerPortion,
          i
        );
      }
      await upsertFromRecipe(db, ownerId, input.ingredients, now);
    }
  });
  return ids;
}

export class RecipeInUseError extends Error {
  constructor() {
    super('recipe_in_use');
    this.name = 'RecipeInUseError';
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  const db = await getDb();
  try {
    await db.runAsync('DELETE FROM recipe WHERE id = ?', id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('foreign key')) {
      throw new RecipeInUseError();
    }
    throw e;
  }
}
