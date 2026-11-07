import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { IDocumentSummary } from '@shared/notebook'
import { cn } from '@renderer/shared/lib'
import { Icon } from '@renderer/shared/ui/atoms'

export interface ISidebarItemProps {
  doc: IDocumentSummary
  active: boolean
}

function describe(doc: IDocumentSummary): string {
  if (doc.kind === 'todo') return `${doc.doneCount} of ${doc.itemCount} done`
  return doc.excerpt || 'Empty note'
}

/** Sidebar row. Memoised: re-renders only when its own summary or selection changes. */
export const SidebarItem = memo(function SidebarItem({ doc, active }: ISidebarItemProps) {
  return (
    <Link
      to={`/d/${doc.id}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md py-2 pr-2.5 pl-2 outline-none focus-visible:ring-2 focus-visible:ring-brand',
        active ? 'bg-sidebar-selected' : 'hover:bg-row-alt'
      )}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center',
          doc.kind === 'note' ? 'text-icon-repo' : 'text-success'
        )}
      >
        <Icon name={doc.kind === 'note' ? 'note' : 'todo'} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body leading-4 font-semibold text-fg">{doc.title}</span>
        <span className="truncate text-caption text-fg-secondary">{describe(doc)}</span>
      </span>
    </Link>
  )
})
