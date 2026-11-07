import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DocumentKind } from '@shared/notebook'
import { useAutosize, useDebouncedCallback } from '@renderer/shared/hooks'
import { Paper } from '@renderer/shared/ui/organisms'
import { useRemoveSheet, useRenameSheet } from '../api/sheets.queries'

export interface ISheetFrameProps {
  documentId: number
  kind: DocumentKind
  sheetId: number
  title: string
  index: number
  total: number
  /** The page body (note editor or to-do list). */
  children: ReactNode
}

const SAVE_DELAY_MS = 400

/** One paper: "Page n of m", page menu and an editable title around the body. */
export const SheetFrame = memo(function SheetFrame({
  documentId,
  kind,
  sheetId,
  title,
  index,
  total,
  children
}: ISheetFrameProps) {
  const [draft, setDraft] = useState(title)
  const ref = useRef<HTMLTextAreaElement>(null)
  const { mutate: rename } = useRenameSheet(documentId)
  const { mutate: remove } = useRemoveSheet(documentId)
  const save = useDebouncedCallback(
    (value: string) => rename({ id: sheetId, title: value, isFirst: index === 0 }),
    SAVE_DELAY_MS
  )

  // Follow external changes (e.g. after a refetch) unless the user is typing here.
  useEffect(() => {
    if (document.activeElement !== ref.current) setDraft(title)
  }, [title])

  useAutosize(ref, draft)

  const menuItems = useMemo(
    () => [
      {
        label: 'Delete page',
        tone: 'danger' as const,
        disabled: total <= 1,
        onSelect: () => remove(sheetId)
      }
    ],
    [total, remove, sheetId]
  )

  return (
    <Paper label={`Page ${index + 1} of ${total}`} menuItems={menuItems}>
      <textarea
        ref={ref}
        rows={1}
        value={draft}
        placeholder={kind === 'note' ? 'Untitled note' : 'Untitled list'}
        aria-label={`Page ${index + 1} title`}
        className="w-full resize-none overflow-hidden bg-transparent text-heading-page text-fg outline-none placeholder:text-fg-tertiary"
        onChange={(e) => {
          const value = e.target.value.replace(/\n/g, ' ')
          setDraft(value)
          save(value)
        }}
        onBlur={save.flush}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save.flush()
            ;(
              e.currentTarget
                .closest('article')
                ?.querySelector('[data-sheet-body]') as HTMLElement | null
            )?.focus()
          }
        }}
      />
      {children}
    </Paper>
  )
})
