import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export interface IProvidersProps {
  children: ReactNode
}

export function Providers({ children }: IProvidersProps): React.JSX.Element {
  // Local IPC is fast and the app is the only writer: no background refetching.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity, refetchOnWindowFocus: false } }
      })
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
