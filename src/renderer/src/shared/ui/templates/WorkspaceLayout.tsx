import type { ReactNode } from 'react'

export interface IWorkspaceLayoutProps {
  sidebar: ReactNode
  /** Left / center / right regions of the 56px top bar. */
  topStart: ReactNode
  topCenter?: ReactNode
  topEnd?: ReactNode
  children: ReactNode
}

/** Sidebar + top bar + scrollable canvas of papers (design: 02/03 Workspace). */
export function WorkspaceLayout({
  sidebar,
  topStart,
  topCenter,
  topEnd,
  children
}: IWorkspaceLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-full bg-canvas">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-topbar shrink-0 items-center gap-3 px-6">
          <div className="flex min-w-0 flex-1 basis-0 items-center">{topStart}</div>
          {topCenter}
          <div className="flex flex-1 basis-0 items-center justify-end gap-2">{topEnd}</div>
        </header>
        <main className="flex flex-1 scrollbar-stable flex-col items-center gap-6 overflow-y-auto px-6 pt-4 pb-12">
          {children}
        </main>
      </div>
    </div>
  )
}
