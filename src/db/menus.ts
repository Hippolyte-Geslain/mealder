import { getDb } from './client';
import { ensureDeviceOwnerId } from './owner';
import { uuid } from '../utils/uuid';
import { getRecipe } from './recipes';
import type { Course, Menu, MenuWithCourses } from './types';

type MenuRow = {
  id: string;
  owner_id: string;
  composed_by: string | null;
  title: string;
  couverts: number;
  created_at: number;
  updated_at: number;
};

type MenuCourseRow = {
  menu_id: string;
  position: number;
  course: Course;
  recipe_id: string;
};

function toMenu(m: MenuRow): Menu {
  return {
    id: m.id,
    ownerId: m.owner_id,
    composedBy: m.composed_by,
    title: m.title,
    couverts: m.couverts,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

export type MenuPick = { course: Course; recipeId: string };

export type MenuInput = {
  title: string;
  couverts: number;
  picks: MenuPick[];
};

export async function createMenu(input: MenuInput): Promise<string> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const id = uuid();
  const now = Date.now();
  const couverts = Math.max(1, Math.floor(input.couverts));
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO menu (id, owner_id, composed_by, title, couverts, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?)',
      id,
      ownerId,
      input.title,
      couverts,
      now,
      now
    );
    for (let i = 0; i < input.picks.length; i++) {
      const pick = input.picks[i];
      await db.runAsync(
        'INSERT INTO menu_course (menu_id, position, course, recipe_id) VALUES (?, ?, ?, ?)',
        id,
        i,
        pick.course,
        pick.recipeId
      );
    }
  });
  return id;
}

export async function updateMenuCouverts(id: string, couverts: number): Promise<void> {
  const db = await getDb();
  const value = Math.max(1, Math.floor(couverts));
  await db.runAsync(
    'UPDATE menu SET couverts = ?, updated_at = ? WHERE id = ?',
    value,
    Date.now(),
    id
  );
}

export async function getMenu(id: string): Promise<MenuWithCourses | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MenuRow>('SELECT * FROM menu WHERE id = ?', id);
  if (!row) return null;
  const courseRows = await db.getAllAsync<MenuCourseRow>(
    'SELECT * FROM menu_course WHERE menu_id = ? ORDER BY position ASC',
    id
  );
  const courses: MenuWithCourses['courses'] = [];
  for (const cr of courseRows) {
    const recipe = await getRecipe(cr.recipe_id);
    if (recipe) courses.push({ course: cr.course, recipe });
  }
  return {
    ...toMenu(row),
    courses,
    totalCostPerPortion: courses.reduce((s, c) => s + c.recipe.totalCostPerPortion, 0),
  };
}

export async function listMenus(): Promise<MenuWithCourses[]> {
  const db = await getDb();
  const ownerId = await ensureDeviceOwnerId();
  const rows = await db.getAllAsync<MenuRow>(
    'SELECT * FROM menu WHERE owner_id = ? ORDER BY created_at DESC',
    ownerId
  );
  const menus: MenuWithCourses[] = [];
  for (const r of rows) {
    const m = await getMenu(r.id);
    if (m) menus.push(m);
  }
  return menus;
}

export async function deleteMenu(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM menu WHERE id = ?', id);
}
