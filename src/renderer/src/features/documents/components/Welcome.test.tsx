import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail } from '@shared/notebook'
import { mockApi, renderWithQuery } from '@test/renderer-utils'
import { Welcome } from './Welcome'

const created: IDocumentDetail = {
  id: 7,
  kind: 'note',
  title: 'Untitled note',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 1,
  updatedAt: 1,
  sheets: []
}

let api: IAppApi
beforeEach(() => {
  api = mockApi()
})

describe('Welcome', () => {
  it('renders the hero and both choices from the design', () => {
    renderWithQuery(<Welcome onCreated={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Welcome to your notebook' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Note.*Create note/s })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /To-do list.*Create list/s })).toBeInTheDocument()
    expect(screen.getByText(/add more notes and lists from the sidebar/)).toBeInTheDocument()
  })

  it.each([
    ['note', /Create note/],
    ['todo', /Create list/]
  ] as const)('creates a %s and reports its id', async (kind, button) => {
    vi.mocked(api.document.create).mockResolvedValue({ ...created, kind })
    const onCreated = vi.fn()
    const { client } = renderWithQuery(<Welcome onCreated={onCreated} />)

    await userEvent.click(screen.getByRole('button', { name: button }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(7))
    expect(api.document.create).toHaveBeenCalledWith({ kind })
    // detail cache is seeded so the workspace opens without another round-trip
    expect(client.getQueryData(['document', 7])).toMatchObject({ id: 7, kind })
  })

  it('shows the error instead of the hint when creation fails', async () => {
    vi.mocked(api.document.create).mockRejectedValue(new Error('disk full'))
    renderWithQuery(<Welcome onCreated={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Create note/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('disk full')
  })
})
