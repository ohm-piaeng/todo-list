import type { ReactNode } from 'react'
import { Menu, type IMenuItem } from '@renderer/shared/ui/molecules'

export interface IPaperProps {
  /** e.g. "Page 1 of 2" */
  label: string
  menuItems: IMenuItem[]
  children: ReactNode
}

/** A page card on the workspace canvas (design: Paper, 760px, padding 48/64/56). */
export function Paper({ label, menuItems, children }: IPaperProps): React.JSX.Element {
  return (
    <article
      aria-label={label}
      className="flex w-full max-w-paper flex-col gap-5 rounded-md border border-border bg-window px-16 pt-12 pb-14 shadow-paper"
    >
      <header className="flex h-4 items-center gap-3">
        <span className="flex-1 text-label text-fg-tertiary">{label}</span>
        <Menu label={`${label} options`} items={menuItems} size="sm" className="-mr-1" />
      </header>
      {children}
    </article>
  )
}
