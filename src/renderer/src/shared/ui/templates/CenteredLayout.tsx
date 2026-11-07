import type { ReactNode } from 'react'

export interface ICenteredLayoutProps {
  children: ReactNode
}

/** Full-window gradient backdrop with vertically centered content (first-launch screens). */
export function CenteredLayout({ children }: ICenteredLayoutProps): React.JSX.Element {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-10 overflow-y-auto bg-linear-135 from-welcome-from to-welcome-to px-6 py-12">
      {children}
    </main>
  )
}
