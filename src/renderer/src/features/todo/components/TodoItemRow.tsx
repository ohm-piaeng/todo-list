import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent
} from 'react'
import type { ITodoItem } from '@shared/notebook'
import { cn } from '@renderer/shared/lib'
import { Checkbox, Icon } from '@renderer/shared/ui/atoms'

export interface ITodoRowHandlers {
  toggle: (id: number, completed: boolean) => void
  commitText: (id: number, text: string) => void
  remove: (id: number, focusPrevious: boolean) => void
  move: (id: number, delta: -1 | 1) => void
  dragStart: (id: number) => void
  dragOver: (id: number, before: boolean) => void
  drop: () => void
  dragEnd: () => void
}

export interface ITodoItemRowProps {
  item: ITodoItem
  textStyle: CSSProperties
  weightClass: string
  /** Drop indicator: line above or below this row. */
  dropEdge: 'before' | 'after' | null
  dragging: boolean
  handlers: ITodoRowHandlers
}

/**
 * One task. Memoised: toggling/typing in one row, or dragging over another,
 * leaves every other row untouched (stable `item` identity + stable handlers).
 */
export const TodoItemRow = memo(function TodoItemRow({
  item,
  textStyle,
  weightClass,
  dropEdge,
  dragging,
  handlers
}: ITodoItemRowProps) {
  const [draft, setDraft] = useState(item.text)
  useEffect(() => setDraft(item.text), [item.text])

  // Removing moves focus away (blur → commit) before the row unmounts: remove once only.
  const removed = useRef(false)
  const removeOnce = (focusPrevious: boolean): void => {
    if (removed.current) return
    removed.current = true
    handlers.remove(item.id, focusPrevious)
  }

  const commit = (): void => {
    const text = draft.trim()
    if (!text) return removeOnce(false)
    if (text !== item.text) handlers.commitText(item.id, text)
    else setDraft(item.text)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      handlers.move(item.id, e.key === 'ArrowUp' ? -1 : 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setDraft(item.text)
      requestAnimationFrame(() => (e.target as HTMLInputElement).blur())
    } else if (e.key === 'Backspace' && draft === '') {
      e.preventDefault()
      removeOnce(true)
    }
  }

  const onDragOver = (e: DragEvent<HTMLLIElement>): void => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    handlers.dragOver(item.id, e.clientY < rect.top + rect.height / 2)
  }

  return (
    <li
      data-item-id={item.id}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault()
        handlers.drop()
      }}
      className={cn(
        'group relative flex h-9 items-center gap-2.5 rounded-xs py-1.5 pr-2 pl-1 focus-within:bg-row-alt hover:bg-row-alt',
        dragging && 'opacity-40'
      )}
    >
      {dropEdge && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 h-0.5 rounded-pill bg-brand',
            dropEdge === 'before' ? '-top-px' : '-bottom-px'
          )}
        />
      )}
      <span
        draggable
        aria-hidden
        title="Drag to reorder (Alt+↑/↓)"
        className="absolute -left-4.5 flex size-4 cursor-grab items-center justify-center text-fg-secondary opacity-0 transition-opacity group-hover:opacity-50 active:cursor-grabbing"
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', String(item.id))
          const row = e.currentTarget.parentElement
          if (row) e.dataTransfer.setDragImage(row, 24, 18)
          handlers.dragStart(item.id)
        }}
        onDragEnd={handlers.dragEnd}
      >
        <Icon name="grip" />
      </span>
      <Checkbox
        checked={item.completed}
        aria-label={item.completed ? `Mark "${item.text}" not done` : `Mark "${item.text}" done`}
        onChange={(e) => handlers.toggle(item.id, e.target.checked)}
      />
      <input
        value={draft}
        aria-label="Task"
        style={textStyle}
        className={cn(
          'min-w-0 flex-1 bg-transparent leading-normal outline-none',
          weightClass,
          item.completed ? 'text-fg-tertiary line-through' : 'text-fg'
        )}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
    </li>
  )
})
