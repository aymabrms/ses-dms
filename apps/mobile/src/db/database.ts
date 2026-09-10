import * as SQLite from "expo-sqlite";

import { localMigrations } from "./migrations";

export type LocalDatabase = SQLite.SQLiteDatabase;

const DATABASE_NAME = "ses_dms_mobile.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await db.execAsync("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);");

  for (const migration of localMigrations) {
    const applied = await db.getFirstAsync<{ version: number }>("SELECT version FROM schema_migrations WHERE version = ?", migration.version);
    if (applied) continue;

    await db.withTransactionAsync(async () => {
      if (migration.columns) {
        for (const column of migration.columns) {
          const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${column.table})`);
          if (!columns.some((existing) => existing.name === column.name)) {
            await db.execAsync(`ALTER TABLE ${column.table} ADD COLUMN ${column.name} ${column.definition};`);
          }
        }
      } else {
        await db.execAsync(migration.sql);
      }
      await db.runAsync("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)", migration.version, new Date().toISOString());
    });
  }

  return db;
}

export async function getSchemaVersion() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ version: number }>("SELECT MAX(version) as version FROM schema_migrations");
  return row?.version ?? 0;
}
