import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { DocumentKind, IDocumentDetail, IDocumentSummary } from '@shared/notebook'
import { queryKeys } from '@renderer/shared/lib'

export function useDocumentSummaries(): UseQueryResult<IDocumentSummary[]> {
  return useQuery({ queryKey: queryKeys.documents, queryFn: () => window.api.document.list() })
}

export function useDocument(id: number): UseQueryResult<IDocumentDetail> {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => window.api.document.get(id),
    enabled: Number.isInteger(id) && id > 0
  })
}

export function useCreateDocument(): UseMutationResult<IDocumentDetail, Error, DocumentKind> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kind: DocumentKind) => window.api.document.create({ kind }),
    onSuccess: (doc) => {
      // Seed the detail cache so the workspace renders without a round-trip.
      qc.setQueryData(queryKeys.document(doc.id), doc)
      return qc.invalidateQueries({ queryKey: queryKeys.documents })
    }
  })
}

export function useRemoveDocument(): UseMutationResult<void, Error, number> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.api.document.remove(id),
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: queryKeys.document(id) })
      return qc.invalidateQueries({ queryKey: queryKeys.documents })
    }
  })
}
