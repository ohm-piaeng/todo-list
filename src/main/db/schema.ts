import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const nowMs = sql`(cast(unixepoch('subsec') * 1000 as integer))`

/** A notebook entry shown in the sidebar: a markdown note or a to-do list. */
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['note', 'todo'] }).notNull(),
  title: text('title').notNull(),
  /** To-do lists: item font size in px. */
  textSize: integer('text_size').notNull().default(16),
  /** To-do lists: item font weight. */
  textWeight: text('text_weight', { enum: ['regular', 'semibold', 'bold'] })
    .notNull()
    .default('semibold'),
  createdAt: integer('created_at').notNull().default(nowMs),
  updatedAt: integer('updated_at').notNull().default(nowMs)
})

/** A "paper" inside a document ("Page 1 of 2"). */
export const sheets = sqliteTable(
  'sheets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    documentId: integer('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull().default(''),
    /** Notes: markdown body. Unused for to-do lists. */
    body: text('body').notNull().default(''),
    createdAt: integer('created_at').notNull().default(nowMs)
  },
  (t) => [index('sheets_document_idx').on(t.documentId, t.position)]
)

export const todoItems = sqliteTable(
  'todo_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sheetId: integer('sheet_id')
      .notNull()
      .references(() => sheets.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    text: text('text').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(nowMs)
  },
  (t) => [index('todo_items_sheet_idx').on(t.sheetId, t.position)]
)
