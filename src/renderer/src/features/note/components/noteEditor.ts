import { createContext, useContext } from 'react'
import { applyEdit, applyMarkdown, type MarkdownAction } from '../lib/markdownFormat'

/**
 * Connects the top-bar markdown toolbar to the page body being edited.
 * Plain mutable store (no React state): focus changes re-render nothing.
 */
export interface INoteEditorStore {
  setActive: (el: HTMLTextAreaElement | null) => void
  /** Page bodies register how to enter edit mode, in page order. */
  registerBody: (sheetId: number, startEditing: () => void) => () => void
  /** Format the active body; with none active, open the first page and format there. */
  apply: (action: MarkdownAction) => void
}

export const NoteEditorContext = createContext<INoteEditorStore | null>(null)

/** Replace a range keeping native undo/redo; falls back to a value write (jsdom). */
function replaceRange(el: HTMLTextAreaElement, from: number, to: number, text: string): void {
  el.focus()
  el.setSelectionRange(from, to)
  // execCommand is deprecated but is still the only way to keep the textarea undo stack.
  const ok =
    typeof document.execCommand === 'function' && document.execCommand('insertText', false, text)
  if (!ok) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    setter?.call(
      el,
      applyEdit(el.value, { from, to, insert: text, selectionStart: 0, selectionEnd: 0 })
    )
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

function format(el: HTMLTextAreaElement, action: MarkdownAction): void {
  const edit = applyMarkdown(
    { value: el.value, start: el.selectionStart, end: el.selectionEnd },
    action
  )
  replaceRange(el, edit.from, edit.to, edit.insert)
  el.setSelectionRange(edit.selectionStart, edit.selectionEnd)
}

export function createNoteEditorStore(): INoteEditorStore {
  let active: HTMLTextAreaElement | null = null
  let pending: MarkdownAction | null = null
  const bodies = new Map<number, () => void>()

  return {
    setActive: (el) => {
      active = el
      if (el && pending) {
        const action = pending
        pending = null
        format(el, action)
      }
    },
    registerBody: (sheetId, startEditing) => {
      bodies.set(sheetId, startEditing)
      return () => {
        if (bodies.get(sheetId) === startEditing) bodies.delete(sheetId)
      }
    },
    apply: (action) => {
      if (active) return format(active, action)
      const first = bodies.values().next().value
      if (!first) return
      pending = action
      first()
    }
  }
}

export function useNoteEditor(): INoteEditorStore {
  const store = useContext(NoteEditorContext)
  if (!store) throw new Error('useNoteEditor must be used inside <NoteEditorProvider>')
  return store
}
