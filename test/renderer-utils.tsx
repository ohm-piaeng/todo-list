import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'

export interface IRenderOptions {
  client?: QueryClient
  wrapper?: (children: ReactNode) => ReactElement
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } }
  })
}

export function renderWithQuery(
  ui: ReactElement,
  { client = createTestQueryClient(), wrapper }: IRenderOptions = {}
): RenderResult & { client: QueryClient } {
  const tree = (
    <QueryClientProvider client={client}>{wrapper ? wrapper(ui) : ui}</QueryClientProvider>
  )
  return { ...render(tree), client }
}

/** Install a fully mocked `window.api`; override what a test needs. */
export function mockApi(): IAppApi {
  const api: IAppApi = {
    document: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined)
    },
    sheet: { create: vi.fn(), update: vi.fn(), remove: vi.fn().mockResolvedValue(undefined) },
    item: {
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
      reorder: vi.fn().mockResolvedValue(undefined)
    }
  }
  window.api = api
  return api
}
