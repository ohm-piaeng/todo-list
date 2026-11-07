import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type {
  IDocument,
  IDocumentDetail,
  ITodoItem,
  IUpdateItemInput,
  TextWeight
} from '@shared/notebook'
import { queryKeys } from '@renderer/shared/lib'

type SheetItemsUpdater = (items: ITodoItem[]) => ITodoItem[]

interface IContext {
  previous?: IDocumentDetail
}

/**
 * Optimistic cache writes scoped to one sheet. Only that sheet object (and the
 * items that change) get new identities, so memoised rows elsewhere stay put.
 */
interface ISheetCache {
  snapshot: () => IContext
  updateItems: (sheetId: number, fn: SheetItemsUpdater) => void
  rollback: (ctx: IContext | undefined) => void
  refreshSummaries: () => Promise<void>
}

function useSheetCache(documentId: number): ISheetCache {
  const qc = useQueryClient()
  const key = queryKeys.document(documentId)
  return {
    // Synchronous on purpose: rapid mutations (e.g. Alt+↓ held) must write the cache
    // in call order. Awaiting cancelQueries here let later writes land first.
    snapshot: () => {
      void qc.cancelQueries({ queryKey: key })
      return { previous: qc.getQueryData<IDocumentDetail>(key) }
    },
    updateItems: (sheetId, fn) => {
      qc.setQueryData<IDocumentDetail>(key, (doc) =>
        doc
          ? {
              ...doc,
              updatedAt: Date.now(),
              sheets: doc.sheets.map((s) => (s.id === sheetId ? { ...s, items: fn(s.items) } : s))
            }
          : doc
      )
    },
    rollback: (ctx: IContext | undefined) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    /** Sidebar shows "n of m done". */
    refreshSummaries: () => qc.invalidateQueries({ queryKey: queryKeys.documents })
  }
}

export function useCreateItem(
  documentId: number,
  sheetId: number
): UseMutationResult<ITodoItem, Error, string> {
  const cache = useSheetCache(documentId)
  return useMutation({
    mutationFn: (text: string) => window.api.item.create({ sheetId, text }),
    onSuccess: (item) => {
      cache.updateItems(sheetId, (items) => [...items, item])
      return cache.refreshSummaries()
    }
  })
}

export function useUpdateItem(
  documentId: number,
  sheetId: number
): UseMutationResult<ITodoItem, Error, IUpdateItemInput, IContext> {
  const cache = useSheetCache(documentId)
  return useMutation({
    mutationFn: (input: IUpdateItemInput) => window.api.item.update(input),
    onMutate: ({ id, ...patch }) => {
      const ctx = cache.snapshot()
      cache.updateItems(sheetId, (items) =>
        items.map((i) => (i.id === id ? { ...i, ...patch } : i))
      )
      return ctx
    },
    onError: (_e, _v, ctx) => cache.rollback(ctx),
    onSuccess: (_item, { completed }) =>
      completed === undefined ? undefined : cache.refreshSummaries()
  })
}

export function useRemoveItem(
  documentId: number,
  sheetId: number
): UseMutationResult<void, Error, number, IContext> {
  const cache = useSheetCache(documentId)
  return useMutation({
    mutationFn: (id: number) => window.api.item.remove(id),
    onMutate: (id) => {
      const ctx = cache.snapshot()
      cache.updateItems(sheetId, (items) => items.filter((i) => i.id !== id))
      return ctx
    },
    onError: (_e, _v, ctx) => cache.rollback(ctx),
    onSuccess: () => cache.refreshSummaries()
  })
}

export function useReorderItems(
  documentId: number,
  sheetId: number
): UseMutationResult<void, Error, number[], IContext> {
  const cache = useSheetCache(documentId)
  return useMutation({
    mutationFn: (orderedIds: number[]) => window.api.item.reorder({ sheetId, orderedIds }),
    onMutate: (orderedIds) => {
      const ctx = cache.snapshot()
      cache.updateItems(sheetId, (items) => {
        const byId = new Map(items.map((i) => [i.id, i]))
        return orderedIds.flatMap((id, position) => {
          const item = byId.get(id)
          return item ? [{ ...item, position }] : []
        })
      })
      return ctx
    },
    onError: (_e, _v, ctx) => cache.rollback(ctx)
  })
}

export function useUpdateTextStyle(
  documentId: number
): UseMutationResult<IDocument, Error, { textSize?: number; textWeight?: TextWeight }, IContext> {
  const qc = useQueryClient()
  const key = queryKeys.document(documentId)
  return useMutation({
    mutationFn: (patch) => window.api.document.update({ id: documentId, ...patch }),
    onMutate: (patch) => {
      void qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<IDocumentDetail>(key)
      qc.setQueryData<IDocumentDetail>(key, (doc) => (doc ? { ...doc, ...patch } : doc))
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    }
  })
}
