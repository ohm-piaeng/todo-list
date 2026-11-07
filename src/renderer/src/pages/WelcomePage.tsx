import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Welcome } from '@renderer/features/documents'
import { CenteredLayout } from '@renderer/shared/ui/templates'

export function WelcomePage(): React.JSX.Element {
  const navigate = useNavigate()
  const open = useCallback((id: number) => navigate(`/d/${id}`, { replace: true }), [navigate])
  return (
    <CenteredLayout>
      <Welcome onCreated={open} />
    </CenteredLayout>
  )
}
