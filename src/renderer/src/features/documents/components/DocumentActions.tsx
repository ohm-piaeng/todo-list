import { useMemo } from 'react'
import type { DocumentKind } from '@shared/notebook'
import { Menu } from '@renderer/shared/ui/molecules'
import { useRemoveDocument } from '../api/documents.queries'

export interface IDocumentActionsProps {
  id: number
  kind: DocumentKind
  onRemoved: () => void
}

export function DocumentActions({ id, kind, onRemoved }: IDocumentActionsProps): React.JSX.Element {
  const { mutate: remove } = useRemoveDocument()
  const items = useMemo(
    () => [
      {
        label: kind === 'note' ? 'Delete note' : 'Delete list',
        tone: 'danger' as const,
        onSelect: () => remove(id, { onSuccess: onRemoved })
      }
    ],
    [id, kind, remove, onRemoved]
  )
  return <Menu label="Document options" items={items} />
}
