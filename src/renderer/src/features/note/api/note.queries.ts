import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { IDocumentDetail, ISheet } from '@shared/notebook'
import { queryKeys } from '@renderer/shared/lib'

/** Save a page body. Writes the cache directly (no refetch of the whole document). */
export function useSaveNoteBody(
  documentId: number
): UseMutationResult<ISheet, Error, { id: number; body: string }> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => window.api.sheet.update({ id, body }),
    onMutate: ({ id, body }) =>
      qc.setQueryData<IDocumentDetail>(queryKeys.document(documentId), (doc) =>
        doc
          ? {
              ...doc,
              updatedAt: Date.now(),
              sheets: doc.sheets.map((s) => (s.id === id ? { ...s, body } : s))
            }
          : doc
      ),
    // sidebar excerpt comes from the first page body
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents })
  })
}
