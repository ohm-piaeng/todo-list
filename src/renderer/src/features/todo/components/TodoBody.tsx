import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from 'react'
import type { ITodoItem, TextWeight } from '@shared/notebook'
import { Icon } from '@renderer/shared/ui/atoms'
import { useCreateItem, useRemoveItem, useReorderItems, useUpdateItem } from '../api/todo.queries'
import { dropIndex, moveItem } from '../lib/reorder'
import { TodoItemRow, type ITodoRowHandlers } from './TodoItemRow'

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  semibold: 'font-semibold',
  bold: 'font-bold'
}

export interface ITodoBodyProps {
  documentId: number
  sheetId: number
  items: ITodoItem[]
  textSize: number
  textWeight: TextWeight
}

interface IDropTarget {
  id: number
  before: boolean
}

/** Task list of one page: rows, drag/keyboard reordering and the "Add a task" row. */
export const TodoBody = memo(function TodoBody({
  documentId,
  sheetId,
  items,
  textSize,
  textWeight
}: ITodoBodyProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const [newText, setNewText] = useState('')
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<IDropTarget | null>(null)

  const create = useCreateItem(documentId, sheetId)
  const { mutate: update } = useUpdateItem(documentId, sheetId)
  const { mutate: remove } = useRemoveItem(documentId, sheetId)
  const { mutate: reorder } = useReorderItems(documentId, sheetId)

  // Handlers read the latest list/drag state through refs so their identity never
  // changes; otherwise every row would re-render on each keystroke or drag move.
  const latest = useRef({ items, draggingId, dropTarget })
  useEffect(() => {
    latest.current = { items, draggingId, dropTarget }
  })

  // Row to focus once the list has re-rendered. Focus follows the item (by id), not an
  // index: the optimistic update lands asynchronously, and React moving a keyed row in
  // the DOM drops its focus.
  const focusAfterRender = useRef<number | null>(null)
  useLayoutEffect(() => {
    const id = focusAfterRender.current
    if (id === null) return
    const input = listRef.current?.querySelector<HTMLInputElement>(
      `[data-item-id="${id}"] input[aria-label="Task"]`
    )
    if (!input) return
    focusAfterRender.current = null
    if (document.activeElement !== input) input.focus()
  }, [items])

  const handlers = useMemo<ITodoRowHandlers>(() => {
    const ids = (): number[] => latest.current.items.map((i) => i.id)
    const clearDrag = (): void => {
      setDraggingId(null)
      setDropTarget(null)
    }
    /** Apply a new order now, so a key held down keeps moving from the new position. */
    const applyOrder = (next: readonly number[]): void => {
      const byId = new Map(latest.current.items.map((i) => [i.id, i]))
      latest.current.items = next.flatMap((id) => byId.get(id) ?? [])
      reorder([...next])
    }
    return {
      toggle: (id, completed) => update({ id, completed }),
      commitText: (id, text) => update({ id, text }),
      remove: (id, focusPrevious) => {
        const list = ids()
        const index = list.indexOf(id)
        latest.current.items = latest.current.items.filter((i) => i.id !== id)
        remove(id)
        if (!focusPrevious) return
        if (index > 0) focusAfterRender.current = list[index - 1]
        else addRef.current?.focus()
      },
      move: (id, delta) => {
        const list = ids()
        const from = list.indexOf(id)
        const next = moveItem(list, from, from + delta)
        if (next === list) return
        focusAfterRender.current = id
        applyOrder(next)
      },
      dragStart: (id) => setDraggingId(id),
      dragOver: (id, before) => {
        const current = latest.current.dropTarget
        if (current?.id !== id || current.before !== before) setDropTarget({ id, before })
      },
      drop: () => {
        const { draggingId: from, dropTarget: over } = latest.current
        clearDrag()
        if (from === null || !over) return
        const list = ids()
        const fromIndex = list.indexOf(from)
        const to = dropIndex(fromIndex, list.indexOf(over.id), over.before)
        const next = moveItem(list, fromIndex, to)
        if (next !== list) applyOrder(next)
      },
      dragEnd: clearDrag
    }
  }, [update, remove, reorder])

  const textStyle = useMemo<CSSProperties>(() => ({ fontSize: textSize }), [textSize])
  const weightClass = WEIGHT_CLASS[textWeight]

  const addTask = (): void => {
    const text = newText.trim()
    if (!text) return
    create.mutate(text, { onSuccess: () => setNewText('') })
  }

  return (
    <div className="flex flex-col gap-1">
      <ul ref={listRef} aria-label="Tasks" className="flex flex-col gap-1">
        {items.map((item) => (
          <TodoItemRow
            key={item.id}
            item={item}
            textStyle={textStyle}
            weightClass={weightClass}
            dragging={draggingId === item.id}
            dropEdge={
              dropTarget?.id === item.id && draggingId !== item.id
                ? dropTarget.before
                  ? 'before'
                  : 'after'
                : null
            }
            handlers={handlers}
          />
        ))}
      </ul>
      <label className="flex h-9 items-center gap-2.5 py-1.5 pr-2 pl-7.5 text-fg-tertiary">
        <Icon name="plus" />
        <input
          ref={addRef}
          data-sheet-body
          value={newText}
          placeholder="Add a task"
          aria-label="Add a task"
          style={textStyle}
          disabled={create.isPending}
          className="min-w-0 flex-1 bg-transparent leading-normal text-fg outline-none placeholder:text-fg-tertiary"
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTask()
            } else if (e.key === 'Escape') e.currentTarget.blur()
          }}
        />
      </label>
    </div>
  )
})
