import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@renderer/shared/lib'
import { IconButton, type IconName } from '@renderer/shared/ui/atoms'

export interface IMenuItem {
  label: string
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export interface IMenuProps {
  /** Accessible name of the trigger. */
  label: string
  icon?: IconName
  items: IMenuItem[]
  align?: 'start' | 'end'
  size?: 'sm' | 'md'
  className?: string
}

/** Icon-triggered dropdown menu. Closes on outside click, Escape, or selection. */
export function Menu({
  label,
  icon = 'more',
  items,
  align = 'end',
  size,
  className
}: IMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close(true)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <IconButton
        ref={triggerRef}
        icon={icon}
        label={label}
        size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(
            'absolute top-full z-20 mt-1 flex min-w-40 flex-col rounded-lg border border-border bg-window p-1 shadow-card',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'rounded-sm px-2.5 py-1.5 text-left text-body outline-none hover:bg-subtle focus-visible:bg-subtle disabled:opacity-40',
                item.tone === 'danger' ? 'text-danger-fg' : 'text-fg'
              )}
              onClick={() => {
                close(true)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
