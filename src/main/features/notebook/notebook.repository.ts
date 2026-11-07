import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import type {
  DocumentKind,
  IDocument,
  IDocumentDetail,
  ISheet,
  ITodoItem,
  TextWeight
} from '@shared/notebook'
import { getDb, type AppDatabase } from '../../db/client'
import { documents, sheets, todoItems } from '../../db/schema'

export interface IDocumentRow extends IDocument {
  firstBody: string
  itemCount: number
  doneCount: number
}

export interface INotebookRepository {
  listDocuments: () => IDocumentRow[]
  findDocument: (id: number) => IDocument | undefined
  getDocumentDetail: (id: number) => IDocumentDetail | undefined
  insertDocument: (kind: DocumentKind, title: string) => number
  updateDocument: (
    id: number,
    patch: Partial<{ title: string; textSize: number; textWeight: TextWeight }>
  ) => IDocument | undefined
  touchDocument: (id: number) => void
  deleteDocument: (id: number) => boolean

  findSheet: (id: number) => Omit<ISheet, 'items'> | undefined
  countSheets: (documentId: number) => number
  insertSheet: (documentId: number, title?: string) => Omit<ISheet, 'items'>
  updateSheet: (
    id: number,
    patch: Partial<{ title: string; body: string }>
  ) => Omit<ISheet, 'items'> | undefined
  deleteSheet: (id: number) => boolean

  findItem: (id: number) => ITodoItem | undefined
  insertItem: (sheetId: number, text: string) => ITodoItem
  updateItem: (
    id: number,
    patch: Partial<{ text: string; completed: boolean }>
  ) => ITodoItem | undefined
  deleteItem: (id: number) => boolean
  /** Rewrite positions. Returns false when the ids are not exactly the sheet's items. */
  reorderItems: (sheetId: number, orderedIds: number[]) => boolean
}

const sheetColumns = {
  id: sheets.id,
  documentId: sheets.documentId,
  position: sheets.position,
  title: sheets.title,
  body: sheets.body
}

const itemColumns = {
  id: todoItems.id,
  sheetId: todoItems.sheetId,
  position: todoItems.position,
  text: todoItems.text,
  completed: todoItems.completed
}

export function createNotebookRepository(db: AppDatabase): INotebookRepository {
  const nextPosition = (max: number | null): number => (max ?? -1) + 1

  const renumberSheets = (documentId: number): void => {
    const rows = db
      .select({ id: sheets.id })
      .from(sheets)
      .where(eq(sheets.documentId, documentId))
      .orderBy(asc(sheets.position), asc(sheets.id))
      .all()
    rows.forEach((r, i) => db.update(sheets).set({ position: i }).where(eq(sheets.id, r.id)).run())
  }

  return {
    listDocuments: () => {
      // Correlated subqueries use explicit aliases: drizzle emits bare column names,
      // which SQLite rejects as ambiguous inside a join.
      const docId = sql.raw('"documents"."id"')
      return db
        .select({
          id: documents.id,
          kind: documents.kind,
          title: documents.title,
          textSize: documents.textSize,
          textWeight: documents.textWeight,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          firstBody: sql<string>`coalesce((select fs.body from sheets fs where fs.document_id = ${docId} order by fs.position limit 1), '')`,
          itemCount: sql<number>`(select count(*) from todo_items ti join sheets s on s.id = ti.sheet_id where s.document_id = ${docId})`,
          doneCount: sql<number>`(select count(*) from todo_items ti join sheets s on s.id = ti.sheet_id where s.document_id = ${docId} and ti.completed = 1)`
        })
        .from(documents)
        .orderBy(asc(documents.createdAt), asc(documents.id))
        .all()
    },

    findDocument: (id) => db.select().from(documents).where(eq(documents.id, id)).get(),

    getDocumentDetail: (id) => {
      const doc = db.select().from(documents).where(eq(documents.id, id)).get()
      if (!doc) return undefined
      const sheetRows = db
        .select(sheetColumns)
        .from(sheets)
        .where(eq(sheets.documentId, id))
        .orderBy(asc(sheets.position))
        .all()
      const items = sheetRows.length
        ? db
            .select(itemColumns)
            .from(todoItems)
            .where(
              inArray(
                todoItems.sheetId,
                sheetRows.map((s) => s.id)
              )
            )
            .orderBy(asc(todoItems.position), asc(todoItems.id))
            .all()
        : []
      return {
        ...doc,
        sheets: sheetRows.map((s) => ({ ...s, items: items.filter((i) => i.sheetId === s.id) }))
      }
    },

    insertDocument: (kind, title) =>
      db.transaction((tx) => {
        const doc = tx.insert(documents).values({ kind, title }).returning().get()
        tx.insert(sheets).values({ documentId: doc.id, position: 0, title }).run()
        return doc.id
      }),

    updateDocument: (id, patch) =>
      db
        .update(documents)
        .set({ ...patch, updatedAt: Date.now() })
        .where(eq(documents.id, id))
        .returning()
        .get(),

    touchDocument: (id) => {
      db.update(documents).set({ updatedAt: Date.now() }).where(eq(documents.id, id)).run()
    },

    deleteDocument: (id) => db.delete(documents).where(eq(documents.id, id)).run().changes > 0,

    findSheet: (id) => db.select(sheetColumns).from(sheets).where(eq(sheets.id, id)).get(),

    countSheets: (documentId) =>
      db
        .select({ n: sql<number>`count(*)` })
        .from(sheets)
        .where(eq(sheets.documentId, documentId))
        .get()?.n ?? 0,

    insertSheet: (documentId, title = '') => {
      const max = db
        .select({ max: sql<number | null>`max(${sheets.position})` })
        .from(sheets)
        .where(eq(sheets.documentId, documentId))
        .get()?.max
      return db
        .insert(sheets)
        .values({ documentId, title, position: nextPosition(max ?? null) })
        .returning(sheetColumns)
        .get()
    },

    updateSheet: (id, patch) =>
      db.update(sheets).set(patch).where(eq(sheets.id, id)).returning(sheetColumns).get(),

    deleteSheet: (id) =>
      db.transaction(() => {
        const sheet = db.select(sheetColumns).from(sheets).where(eq(sheets.id, id)).get()
        if (!sheet) return false
        db.delete(sheets).where(eq(sheets.id, id)).run()
        renumberSheets(sheet.documentId)
        return true
      }),

    findItem: (id) => db.select(itemColumns).from(todoItems).where(eq(todoItems.id, id)).get(),

    insertItem: (sheetId, text) => {
      const max = db
        .select({ max: sql<number | null>`max(${todoItems.position})` })
        .from(todoItems)
        .where(eq(todoItems.sheetId, sheetId))
        .get()?.max
      return db
        .insert(todoItems)
        .values({ sheetId, text, position: nextPosition(max ?? null) })
        .returning(itemColumns)
        .get()
    },

    updateItem: (id, patch) =>
      db.update(todoItems).set(patch).where(eq(todoItems.id, id)).returning(itemColumns).get(),

    deleteItem: (id) => db.delete(todoItems).where(eq(todoItems.id, id)).run().changes > 0,

    reorderItems: (sheetId, orderedIds) =>
      db.transaction(() => {
        const current = db
          .select({ id: todoItems.id })
          .from(todoItems)
          .where(eq(todoItems.sheetId, sheetId))
          .all()
          .map((r) => r.id)
        const same =
          current.length === orderedIds.length &&
          new Set(orderedIds).size === orderedIds.length &&
          orderedIds.every((id) => current.includes(id))
        if (!same) return false
        orderedIds.forEach((id, position) =>
          db
            .update(todoItems)
            .set({ position })
            .where(and(eq(todoItems.id, id), eq(todoItems.sheetId, sheetId)))
            .run()
        )
        return true
      })
  }
}

/** Repository bound to the app database (after `initDb()`). */
export function createAppNotebookRepository(): INotebookRepository {
  return createNotebookRepository(getDb())
}
