import { useId, type KeyboardEvent } from 'react'
import { cn } from '@renderer/shared/lib'

export interface ISegment<T extends string> {
  value: T
  label: string
}

export interface ISegmentedControlProps<T extends string> {
  label: string
  value: T
  segments: ISegment<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Single-choice pill group (design: SegmentedControl). Arrow keys move the selection. */
export function SegmentedControl<T extends string>({
  label,
  value,
  segments,
  onChange,
  className
}: ISegmentedControlProps<T>): React.JSX.Element {
  const name = useId()
  const index = segments.findIndex((s) => s.value === value)

  const onKeyDown = (e: KeyboardEvent): void => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = segments[(index + step + segments.length) % segments.length]
    onChange(next.value)
    ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex h-7 gap-0.5 rounded-lg bg-subtle p-0.5', className)}
      onKeyDown={onKeyDown}
    >
      {segments.map((s) => {
        const checked = s.value === value
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            name={name}
            data-value={s.value}
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={cn(
              'rounded-sm px-2.5 text-body-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand',
              checked ? 'bg-window shadow-toolbar' : 'hover:bg-selected/60'
            )}
            onClick={() => onChange(s.value)}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
