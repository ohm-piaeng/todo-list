import type { ReactNode } from 'react'
import { cn } from '@renderer/shared/lib'

export interface IToolbarProps {
  label: string
  children: ReactNode
  className?: string
}

/** Floating pill that groups toolbar controls (design: Toolbar/Markdown, Toolbar/Todo). */
export function Toolbar({ label, children, className }: IToolbarProps): React.JSX.Element {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn(
        'flex h-9.5 items-center gap-0.5 rounded-lg border border-border bg-window p-1 shadow-toolbar',
        className
      )}
    >
      {children}
    </div>
  )
}
