import * as SQLite from 'expo-sqlite';
import { runMigrations } from './schema';

let _ready: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_ready) {
    _ready = (async () => {
      const db = await SQLite.openDatabaseAsync('mealmatch.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await runMigrations(db);
      return db;
    })();
  }
  return _ready;
}
