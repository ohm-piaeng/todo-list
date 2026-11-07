import type {
  ICreateDocumentInput,
  ICreateItemInput,
  ICreateSheetInput,
  IDocument,
  IDocumentDetail,
  IDocumentSummary,
  IReorderItemsInput,
  ISheet,
  ITodoItem,
  IUpdateDocumentInput,
  IUpdateItemInput,
  IUpdateSheetInput
} from '@shared/notebook'
import { createAppNotebookRepository, type INotebookRepository } from './notebook.repository'

export interface INotebookService {
  listDocuments: () => IDocumentSummary[]
  getDocument: (id: number) => IDocumentDetail
  createDocument: (input: ICreateDocumentInput) => IDocumentDetail
  updateDocument: (input: IUpdateDocumentInput) => IDocument
  removeDocument: (id: number) => void

  createSheet: (input: ICreateSheetInput) => ISheet
  updateSheet: (input: IUpdateSheetInput) => ISheet
  removeSheet: (id: number) => void

  createItem: (input: ICreateItemInput) => ITodoItem
  updateItem: (input: IUpdateItemInput) => ITodoItem
  removeItem: (id: number) => void
  reorderItems: (input: IReorderItemsInput) => void
}

export const DEFAULT_TITLES = { note: 'Untitled note', todo: 'Untitled list' } as const

const EXCERPT_MAX = 80

/** First plain-text paragraph of a markdown body, for the sidebar. */
export function toExcerpt(markdown: string): string {
  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('```')) continue
    const plain = line
      .replace(/^([-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/, '')
      .replace(/^>\s?/, '')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_~`]/g, '')
      .trim()
    if (plain) return plain.length > EXCERPT_MAX ? `${plain.slice(0, EXCERPT_MAX - 1)}…` : plain
  }
  return ''
}

function notFound(what: string, id: number): Error {
  return new Error(`${what} ${id} not found`)
}

export function createNotebookService(repo: INotebookRepository): INotebookService {
  const getDocument = (id: number): IDocumentDetail => {
    const detail = repo.getDocumentDetail(id)
    if (!detail) throw notFound('Document', id)
    return detail
  }

  const requireSheet = (id: number): Omit<ISheet, 'items'> => {
    const sheet = repo.findSheet(id)
    if (!sheet) throw notFound('Sheet', id)
    return sheet
  }

  const requireItem = (id: number): ITodoItem => {
    const item = repo.findItem(id)
    if (!item) throw notFound('Item', id)
    return item
  }

  const touchBySheet = (sheetId: number): void =>
    repo.touchDocument(requireSheet(sheetId).documentId)

  return {
    listDocuments: () =>
      repo.listDocuments().map(({ firstBody, ...doc }) => ({
        ...doc,
        excerpt: doc.kind === 'note' ? toExcerpt(firstBody) : ''
      })),

    getDocument,

    createDocument: ({ kind }) => getDocument(repo.insertDocument(kind, DEFAULT_TITLES[kind])),

    updateDocument: ({ id, ...patch }) => {
      const doc = repo.updateDocument(id, patch)
      if (!doc) throw notFound('Document', id)
      return doc
    },

    removeDocument: (id) => {
      if (!repo.deleteDocument(id)) throw notFound('Document', id)
    },

    createSheet: ({ documentId }) => {
      if (!repo.findDocument(documentId)) throw notFound('Document', documentId)
      const sheet = repo.insertSheet(documentId)
      repo.touchDocument(documentId)
      return { ...sheet, items: [] }
    },

    updateSheet: ({ id, ...patch }) => {
      const sheet = repo.updateSheet(id, patch)
      if (!sheet) throw notFound('Sheet', id)
      // The first page's title is the document's title (sidebar + breadcrumb).
      if (patch.title !== undefined && sheet.position === 0) {
        const doc = repo.findDocument(sheet.documentId)
        repo.updateDocument(sheet.documentId, {
          title: patch.title || DEFAULT_TITLES[doc?.kind ?? 'note']
        })
      } else {
        repo.touchDocument(sheet.documentId)
      }
      return {
        ...sheet,
        items: getDocument(sheet.documentId).sheets.find((s) => s.id === id)?.items ?? []
      }
    },

    removeSheet: (id) => {
      const sheet = requireSheet(id)
      if (repo.countSheets(sheet.documentId) <= 1) {
        throw new Error('A document must keep at least one page')
      }
      repo.deleteSheet(id)
      // A new first page becomes the document title source.
      const first = getDocument(sheet.documentId).sheets[0]
      const doc = repo.findDocument(sheet.documentId)
      repo.updateDocument(sheet.documentId, {
        title: first?.title || DEFAULT_TITLES[doc?.kind ?? 'note']
      })
    },

    createItem: ({ sheetId, text }) => {
      requireSheet(sheetId)
      const item = repo.insertItem(sheetId, text)
      touchBySheet(sheetId)
      return item
    },

    updateItem: ({ id, ...patch }) => {
      const item = repo.updateItem(id, patch)
      if (!item) throw notFound('Item', id)
      touchBySheet(item.sheetId)
      return item
    },

    removeItem: (id) => {
      const item = requireItem(id)
      repo.deleteItem(id)
      touchBySheet(item.sheetId)
    },

    reorderItems: ({ sheetId, orderedIds }) => {
      requireSheet(sheetId)
      if (!repo.reorderItems(sheetId, orderedIds)) {
        throw new Error('orderedIds must contain exactly the items of the sheet')
      }
      touchBySheet(sheetId)
    }
  }
}

/** Service wired to the app database. */
export function createAppNotebookService(): INotebookService {
  return createNotebookService(createAppNotebookRepository())
}
