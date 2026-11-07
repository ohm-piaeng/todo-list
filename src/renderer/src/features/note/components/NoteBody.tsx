import { lazy, memo, Suspense, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useAutosize, useDebouncedCallback } from '@renderer/shared/hooks'
import { useSaveNoteBody } from '../api/note.queries'
import type { MarkdownAction } from '../lib/markdownFormat'
import { useNoteEditor } from './noteEditor'

// react-markdown + remark are only needed once a note is open: separate chunk.
const MarkdownView = lazy(() => import('./MarkdownView'))

const SAVE_DELAY_MS = 500

const SHORTCUTS: Record<string, MarkdownAction> = { b: 'bold', i: 'italic', k: 'link' }

export interface INoteBodyProps {
  documentId: number
  sheetId: number
  body: string
}

/** Rendered markdown; click (or Enter from the title) to edit the source. */
export const NoteBody = memo(function NoteBody({ documentId, sheetId, body }: INoteBodyProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(body)
  const ref = useRef<HTMLTextAreaElement>(null)
  const editor = useNoteEditor()
  const { mutate: saveBody } = useSaveNoteBody(documentId)
  const save = useDebouncedCallback(
    (value: string) => saveBody({ id: sheetId, body: value }),
    SAVE_DELAY_MS
  )

  // Adopt a new saved body (e.g. refetch) only when it actually changes and the
  // user is not typing; toggling edit mode must never roll the draft back.
  const editingRef = useRef(editing)
  editingRef.current = editing
  useEffect(() => {
    if (!editingRef.current) setDraft(body)
  }, [body])

  useEffect(() => editor.registerBody(sheetId, () => setEditing(true)), [editor, sheetId])

  useEffect(() => {
    if (!editing) return
    const el = ref.current
    // caret to the end before focusing: a pending toolbar action applies on focus
    el?.setSelectionRange(el.value.length, el.value.length)
    el?.focus()
    editor.setActive(el)
  }, [editing, editor])

  useAutosize(ref, editing ? draft : '')

  const stopEditing = (): void => {
    save.flush()
    editor.setActive(null)
    setEditing(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Escape') return e.currentTarget.blur()
    const action = (e.ctrlKey || e.metaKey) && SHORTCUTS[e.key.toLowerCase()]
    if (action) {
      e.preventDefault()
      editor.apply(action)
    }
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        aria-label="Page content (Markdown)"
        placeholder="Start writing…"
        className="min-h-26 w-full resize-none overflow-hidden bg-transparent text-lead text-fg outline-none placeholder:text-fg-tertiary"
        onChange={(e) => {
          setDraft(e.target.value)
          save(e.target.value)
        }}
        onFocus={(e) => editor.setActive(e.currentTarget)}
        onBlur={stopEditing}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-sheet-body
      aria-label="Edit page content"
      className="-mx-2 min-h-13 cursor-text rounded-md px-2 outline-none focus-visible:ring-2 focus-visible:ring-brand"
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault()
          setEditing(true)
        }
      }}
    >
      {draft.trim() ? (
        <Suspense
          fallback={<p className="text-lead whitespace-pre-wrap text-fg-secondary">{draft}</p>}
        >
          <MarkdownView source={draft} />
        </Suspense>
      ) : (
        <p className="text-lead text-fg-tertiary">Start writing…</p>
      )}
    </div>
  )
})
