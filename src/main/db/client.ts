import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type AppDatabase = BetterSQLite3Database<typeof schema>

let sqlite: Database.Database | null = null
let db: AppDatabase | null = null

function migrationsFolder(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
}

/** Open `userData/app.db` (WAL) and apply pending migrations. Call once after `app.whenReady()`. */
export function initDb(): AppDatabase {
  if (db) return db
  sqlite = new Database(join(app.getPath('userData'), 'app.db'))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: migrationsFolder() })
  return db
}

export function getDb(): AppDatabase {
  if (!db) throw new Error('Database not initialised. Call initDb() first.')
  return db
}

export function closeDb(): void {
  sqlite?.close()
  sqlite = null
  db = null
}
