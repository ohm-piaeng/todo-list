import { useDeferredValue, useMemo, useState } from 'react'
import type { DocumentKind } from '@shared/notebook'
import { AppMark } from '@renderer/shared/ui/atoms'
import { Menu, SearchField } from '@renderer/shared/ui/molecules'
import { useCreateDocument, useDocumentSummaries } from '../api/documents.queries'
import { SidebarItem } from './SidebarItem'

export interface IDocumentSidebarProps {
  activeId: number
  onCreated: (id: number) => void
}

export function DocumentSidebar({ activeId, onCreated }: IDocumentSidebarProps): React.JSX.Element {
  const { data: docs = [] } = useDocumentSummaries()
  const { mutate: create } = useCreateDocument()
  const [query, setQuery] = useState('')
  // Typing stays responsive; filtering the list renders at lower priority.
  const deferredQuery = useDeferredValue(query)

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.excerpt.toLowerCase().includes(q)
    )
  }, [docs, deferredQuery])

  const newItems = useMemo(() => {
    const start = (kind: DocumentKind): void =>
      create(kind, { onSuccess: (doc) => onCreated(doc.id) })
    return [
      { label: 'New note', onSelect: () => start('note') },
      { label: 'New to-do list', onSelect: () => start('todo') }
    ]
  }, [create, onCreated])

  return (
    <nav
      aria-label="Notebook"
      className="flex w-sidebar shrink-0 flex-col gap-3 border-r border-border bg-sidebar px-3 py-4"
    >
      <div className="flex h-9 items-center gap-2.5 py-1 pr-1 pl-1.5">
        <AppMark />
        <span className="flex-1 text-title-window text-fg">Notebook</span>
        <Menu label="Add page" icon="plus" items={newItems} />
      </div>

      <SearchField
        placeholder="Search"
        aria-label="Search pages"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <h2 className="text-label text-fg-tertiary">All pages</h2>
      <div className="-mx-1 flex flex-col gap-0.5 overflow-y-auto px-1">
        {visible.map((doc) => (
          <SidebarItem key={doc.id} doc={doc} active={doc.id === activeId} />
        ))}
        {visible.length === 0 && (
          <p className="px-2 py-1 text-body-sm text-fg-tertiary">No pages match “{query}”.</p>
        )}
      </div>
    </nav>
  )
}
