import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type IDatabaseHandle } from '../../db/client'
import { createNotebookRepository } from './notebook.repository'
import { createNotebookService, toExcerpt, type INotebookService } from './notebook.service'

const MIGRATIONS = resolve(__dirname, '../../db/migrations')

let handle: IDatabaseHandle
let service: INotebookService

beforeEach(() => {
  handle = createDatabase(':memory:', MIGRATIONS)
  service = createNotebookService(createNotebookRepository(handle.db))
})
afterEach(() => handle.close())

describe('documents', () => {
  it('starts empty (first launch shows Welcome)', () => {
    expect(service.listDocuments()).toEqual([])
  })

  it('creates a note with one untitled page', () => {
    const doc = service.createDocument({ kind: 'note' })
    expect(doc).toMatchObject({ kind: 'note', title: 'Untitled note', textSize: 16 })
    expect(doc.sheets).toHaveLength(1)
    expect(doc.sheets[0]).toMatchObject({ position: 0, title: 'Untitled note', items: [] })
  })

  it('creates a to-do list with default text settings', () => {
    const doc = service.createDocument({ kind: 'todo' })
    expect(doc).toMatchObject({ kind: 'todo', title: 'Untitled list', textWeight: 'semibold' })
  })

  it('lists summaries in creation order with excerpt and progress', () => {
    const note = service.createDocument({ kind: 'note' })
    const list = service.createDocument({ kind: 'todo' })
    service.updateSheet({
      id: note.sheets[0].id,
      body: '# Heading\n\nBrainstorm for the **Q1** roadmap'
    })
    const sheetId = list.sheets[0].id
    const a = service.createItem({ sheetId, text: 'Eggs' })
    service.createItem({ sheetId, text: 'Milk' })
    service.updateItem({ id: a.id, completed: true })

    const [s1, s2] = service.listDocuments()
    expect(s1).toMatchObject({ id: note.id, excerpt: 'Brainstorm for the Q1 roadmap' })
    expect(s2).toMatchObject({ id: list.id, itemCount: 2, doneCount: 1, excerpt: '' })
  })

  it('updates to-do text settings', () => {
    const doc = service.createDocument({ kind: 'todo' })
    expect(service.updateDocument({ id: doc.id, textSize: 20, textWeight: 'bold' })).toMatchObject({
      textSize: 20,
      textWeight: 'bold'
    })
  })

  it('removes a document with its pages and items (cascade)', () => {
    const doc = service.createDocument({ kind: 'todo' })
    service.createItem({ sheetId: doc.sheets[0].id, text: 'x' })
    service.removeDocument(doc.id)
    expect(service.listDocuments()).toEqual([])
    expect(() => service.getDocument(doc.id)).toThrow(/not found/)
  })
})

describe('sheets', () => {
  it('first page title is the document title', () => {
    const doc = service.createDocument({ kind: 'note' })
    service.updateSheet({ id: doc.sheets[0].id, title: 'Project ideas' })
    expect(service.getDocument(doc.id).title).toBe('Project ideas')
  })

  it('empty first page title falls back to the default title', () => {
    const doc = service.createDocument({ kind: 'todo' })
    service.updateSheet({ id: doc.sheets[0].id, title: '' })
    expect(service.getDocument(doc.id).title).toBe('Untitled list')
  })

  it('later page titles do not change the document title', () => {
    const doc = service.createDocument({ kind: 'note' })
    const second = service.createSheet({ documentId: doc.id })
    expect(second.position).toBe(1)
    service.updateSheet({ id: second.id, title: 'Open questions' })
    expect(service.getDocument(doc.id).title).toBe('Untitled note')
  })

  it('keeps at least one page and renumbers after removal', () => {
    const doc = service.createDocument({ kind: 'note' })
    expect(() => service.removeSheet(doc.sheets[0].id)).toThrow(/at least one page/)

    const second = service.createSheet({ documentId: doc.id })
    service.updateSheet({ id: second.id, title: 'Second' })
    service.removeSheet(doc.sheets[0].id)
    const after = service.getDocument(doc.id)
    expect(after.sheets).toHaveLength(1)
    expect(after.sheets[0]).toMatchObject({ id: second.id, position: 0 })
    expect(after.title).toBe('Second')
  })
})

describe('todo items', () => {
  it('appends items in order and reorders them', () => {
    const doc = service.createDocument({ kind: 'todo' })
    const sheetId = doc.sheets[0].id
    const ids = ['a', 'b', 'c'].map((text) => service.createItem({ sheetId, text }).id)

    service.reorderItems({ sheetId, orderedIds: [ids[2], ids[0], ids[1]] })
    expect(service.getDocument(doc.id).sheets[0].items.map((i) => i.text)).toEqual(['c', 'a', 'b'])
  })

  it('rejects a reorder that does not match the sheet items', () => {
    const doc = service.createDocument({ kind: 'todo' })
    const sheetId = doc.sheets[0].id
    const a = service.createItem({ sheetId, text: 'a' })
    service.createItem({ sheetId, text: 'b' })
    expect(() => service.reorderItems({ sheetId, orderedIds: [a.id] })).toThrow()
  })

  it('touches the document updatedAt on item changes', async () => {
    const doc = service.createDocument({ kind: 'todo' })
    await new Promise((r) => setTimeout(r, 5))
    service.createItem({ sheetId: doc.sheets[0].id, text: 'x' })
    expect(service.getDocument(doc.id).updatedAt).toBeGreaterThan(doc.updatedAt)
  })

  it('removes an item', () => {
    const doc = service.createDocument({ kind: 'todo' })
    const item = service.createItem({ sheetId: doc.sheets[0].id, text: 'x' })
    service.removeItem(item.id)
    expect(service.getDocument(doc.id).sheets[0].items).toEqual([])
  })
})

describe('toExcerpt', () => {
  it.each([
    ['', ''],
    ['# Only heading', ''],
    ['- [ ] task one', 'task one'],
    ['> quoted [link](http://x)', 'quoted link'],
    ['x'.repeat(100), `${'x'.repeat(79)}…`]
  ])('%j → %j', (input, expected) => {
    expect(toExcerpt(input)).toBe(expected)
  })
})
