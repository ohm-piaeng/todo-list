import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export type AppDatabase = BetterSQLite3Database<typeof schema>

export interface IDatabaseHandle {
  db: AppDatabase
  close: () => void
}

/** Open a SQLite database (file path or ':memory:') and apply pending migrations. */
export function createDatabase(filename: string, migrationsFolder: string): IDatabaseHandle {
  const sqlite = new Database(filename)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })
  return { db, close: () => sqlite.close() }
}

let handle: IDatabaseHandle | null = null

function migrationsFolder(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
}

/** Open `userData/app.db`. Call once after `app.whenReady()`. */
export function initDb(): AppDatabase {
  handle ??= createDatabase(join(app.getPath('userData'), 'app.db'), migrationsFolder())
  return handle.db
}

export function getDb(): AppDatabase {
  if (!handle) throw new Error('Database not initialised. Call initDb() first.')
  return handle.db
}

export function closeDb(): void {
  handle?.close()
  handle = null
}
