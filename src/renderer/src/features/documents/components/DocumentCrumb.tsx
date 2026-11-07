import { memo } from 'react'
import type { DocumentKind } from '@shared/notebook'
import { formatEdited } from '@renderer/shared/lib'
import { useNow } from '@renderer/shared/hooks'
import { Icon } from '@renderer/shared/ui/atoms'

export interface IDocumentCrumbProps {
  kind: DocumentKind
  title: string
  updatedAt: number
}

/** Top-bar breadcrumb. The only subscriber to the clock, so ticks re-render just this. */
export const DocumentCrumb = memo(function DocumentCrumb({
  kind,
  title,
  updatedAt
}: IDocumentCrumbProps) {
  const now = useNow()
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon
        name={kind === 'note' ? 'note' : 'todo'}
        className="size-4 shrink-0 text-fg-secondary"
      />
      <span className="truncate text-body font-semibold text-fg">{title}</span>
      <span className="shrink-0 text-body-sm text-fg-tertiary">
        {formatEdited(updatedAt, Math.max(now, updatedAt))}
      </span>
    </div>
  )
})
