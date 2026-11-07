import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail, IDocumentSummary } from '@shared/notebook'
import { mockApi, renderWithQuery } from '@test/renderer-utils'
import { DocumentSidebar } from './DocumentSidebar'

const base = { textSize: 16, textWeight: 'semibold' as const, createdAt: 0, updatedAt: 0 }
const DOCS: IDocumentSummary[] = [
  {
    ...base,
    id: 1,
    kind: 'note',
    title: 'Project ideas',
    excerpt: 'Brainstorm for the Q1 roadmap',
    itemCount: 0,
    doneCount: 0
  },
  {
    ...base,
    id: 2,
    kind: 'todo',
    title: 'Weekly groceries',
    excerpt: '',
    itemCount: 8,
    doneCount: 3
  },
  {
    ...base,
    id: 3,
    kind: 'note',
    title: 'Meeting notes',
    excerpt: 'Design sync, Nov 6',
    itemCount: 0,
    doneCount: 0
  }
]

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.document.list).mockResolvedValue(DOCS)
})

function setup(activeId = 1, onCreated = vi.fn()): ReturnType<typeof renderWithQuery> {
  return renderWithQuery(<DocumentSidebar activeId={activeId} onCreated={onCreated} />, {
    wrapper: (ui) => <MemoryRouter>{ui}</MemoryRouter>
  })
}

describe('DocumentSidebar', () => {
  it('lists pages with excerpt or progress and marks the active one', async () => {
    setup(1)
    const active = await screen.findByRole('link', { current: 'page' })
    expect(active).toHaveTextContent('Project ideas')
    expect(active).toHaveTextContent('Brainstorm for the Q1 roadmap')
    expect(screen.getByRole('link', { name: /Weekly groceries/ })).toHaveTextContent('3 of 8 done')
    expect(screen.getByRole('link', { name: /Weekly groceries/ })).toHaveAttribute('href', '/d/2')
  })

  it('filters by title and excerpt', async () => {
    const user = userEvent.setup()
    setup()
    await screen.findByText('Project ideas')
    await user.type(screen.getByRole('searchbox', { name: 'Search pages' }), 'design')
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(1))
    expect(screen.getByRole('link')).toHaveTextContent('Meeting notes')

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(await screen.findByText(/No pages match/)).toBeInTheDocument()
  })

  it('creates a to-do list from the + menu', async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    vi.mocked(api.document.create).mockResolvedValue({ id: 9, kind: 'todo' } as IDocumentDetail)
    setup(1, onCreated)

    await user.click(screen.getByRole('button', { name: 'Add page' }))
    const menu = screen.getByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: 'New to-do list' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(9))
    expect(api.document.create).toHaveBeenCalledWith({ kind: 'todo' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
