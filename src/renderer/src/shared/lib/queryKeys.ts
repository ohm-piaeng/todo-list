/**
 * React Query keys shared by features that read/write the same server state.
 * Features must not import each other, so the cache contract lives here.
 */
export const queryKeys = {
  documents: ['documents'] as const,
  document: (id: number) => ['document', id] as const
}
