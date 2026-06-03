import type { SQLiteDatabase } from 'expo-sqlite';

const MIGRATIONS: ((db: SQLiteDatabase) => Promise<void>)[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE recipe (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        course TEXT NOT NULL CHECK (course IN ('entree','plat','dessert')),
        photo_uri TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE ingredient (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        quantity REAL,
        unit TEXT,
        cost_per_portion REAL NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE menu (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        composed_by TEXT,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE menu_course (
        menu_id TEXT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
        course TEXT NOT NULL CHECK (course IN ('entree','plat','dessert')),
        recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE RESTRICT,
        PRIMARY KEY (menu_id, course)
      );
      CREATE INDEX recipe_owner_course ON recipe(owner_id, course);
      CREATE INDEX menu_owner_created ON menu(owner_id, created_at DESC);
    `);
  },
  async (db) => {
    await db.execAsync(`
      ALTER TABLE menu ADD COLUMN couverts INTEGER NOT NULL DEFAULT 1;
    `);
  },
  async (db) => {
    await db.execAsync(`
      CREATE TABLE ingredient_library (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        default_unit TEXT,
        default_cost_per_portion REAL NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        UNIQUE(owner_id, normalized_name)
      );
      CREATE INDEX ingredient_library_search ON ingredient_library(owner_id, normalized_name);
    `);
  },
  async (db) => {
    // Add description + tags to recipe; allow multiple recipes per course in a menu.
    // SQLite cannot drop a PK in place, so recreate menu_course with (menu_id, position).
    await db.execAsync(`
      ALTER TABLE recipe ADD COLUMN description TEXT;
      ALTER TABLE recipe ADD COLUMN tags TEXT;

      CREATE TABLE menu_course_new (
        menu_id TEXT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        course TEXT NOT NULL CHECK (course IN ('entree','plat','dessert')),
        recipe_id TEXT NOT NULL REFERENCES recipe(id) ON DELETE RESTRICT,
        PRIMARY KEY (menu_id, position)
      );
      INSERT INTO menu_course_new (menu_id, position, course, recipe_id)
      SELECT menu_id,
             CASE course WHEN 'entree' THEN 0 WHEN 'plat' THEN 1 ELSE 2 END,
             course, recipe_id
      FROM menu_course;
      DROP TABLE menu_course;
      ALTER TABLE menu_course_new RENAME TO menu_course;
      CREATE INDEX menu_course_menu ON menu_course(menu_id, position);
    `);
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (let i = current; i < MIGRATIONS.length; i++) {
    await MIGRATIONS[i](db);
    await db.execAsync(`PRAGMA user_version = ${i + 1};`);
  }
}
