import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { IDocumentDetail, ISheet } from '@shared/notebook'
import { queryKeys } from '@renderer/shared/lib'

type DetailUpdater = (doc: IDocumentDetail) => IDocumentDetail

function useUpdateDetail(documentId: number): (fn: DetailUpdater) => void {
  const qc = useQueryClient()
  return (fn) =>
    qc.setQueryData<IDocumentDetail>(queryKeys.document(documentId), (doc) => (doc ? fn(doc) : doc))
}

export function useCreateSheet(documentId: number): UseMutationResult<ISheet, Error, void> {
  const qc = useQueryClient()
  const update = useUpdateDetail(documentId)
  return useMutation({
    mutationFn: () => window.api.sheet.create({ documentId }),
    onSuccess: (sheet) => {
      update((doc) => ({ ...doc, updatedAt: Date.now(), sheets: [...doc.sheets, sheet] }))
      return qc.invalidateQueries({ queryKey: queryKeys.documents })
    }
  })
}

export function useRenameSheet(
  documentId: number
): UseMutationResult<ISheet, Error, { id: number; title: string; isFirst: boolean }> {
  const qc = useQueryClient()
  const update = useUpdateDetail(documentId)
  return useMutation({
    mutationFn: ({ id, title }) => window.api.sheet.update({ id, title }),
    onMutate: ({ id, title, isFirst }) =>
      update((doc) => ({
        ...doc,
        // first page title is the document title (breadcrumb + sidebar)
        title: isFirst && title.trim() ? title.trim() : doc.title,
        updatedAt: Date.now(),
        sheets: doc.sheets.map((s) => (s.id === id ? { ...s, title } : s))
      })),
    onSettled: (_s, _e, { isFirst }) =>
      isFirst
        ? Promise.all([
            qc.invalidateQueries({ queryKey: queryKeys.documents }),
            qc.invalidateQueries({ queryKey: queryKeys.document(documentId) })
          ])
        : undefined
  })
}

export function useRemoveSheet(documentId: number): UseMutationResult<void, Error, number> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.api.sheet.remove(id),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.document(documentId) }),
        qc.invalidateQueries({ queryKey: queryKeys.documents })
      ])
  })
}
