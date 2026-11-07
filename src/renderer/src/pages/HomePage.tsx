import { Navigate } from 'react-router-dom'
import { useDocumentSummaries } from '@renderer/features/documents'

/** `/`: first launch → Welcome, otherwise open the first document. */
export function HomePage(): React.JSX.Element | null {
  const { data, isPending } = useDocumentSummaries()
  if (isPending) return null
  const first = data?.[0]
  return <Navigate to={first ? `/d/${first.id}` : '/welcome'} replace />
}
