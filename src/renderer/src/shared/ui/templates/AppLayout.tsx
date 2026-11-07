import type { ReactNode } from 'react'

export interface IAppLayoutProps {
  children: ReactNode
}

/** Full-window shell: draggable title strip + scrollable content. */
export function AppLayout({ children }: IAppLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="h-control-md shrink-0 drag-region" />
      <main className="flex-1 overflow-y-auto px-6 pb-9">{children}</main>
    </div>
  )
}
