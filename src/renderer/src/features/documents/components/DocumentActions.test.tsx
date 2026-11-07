import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail, IDocumentSummary } from '@shared/notebook'
import { createTestQueryClient, mockApi, renderWithQuery } from '@test/renderer-utils'
import { useDocument } from '../api/documents.queries'
import { DocumentActions } from './DocumentActions'

const DOC = {
  id: 5,
  kind: 'todo',
  title: 'Launch checklist',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 0,
  updatedAt: 0,
  sheets: []
} satisfies IDocumentDetail

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.document.get).mockResolvedValue(DOC)
})

/** The workspace keeps observing the document while the delete is in flight. */
function Workspace({ onRemoved }: { onRemoved: () => void }): React.JSX.Element {
  useDocument(5)
  return <DocumentActions id={5} kind="todo" onRemoved={onRemoved} />
}

describe('DocumentActions', () => {
  it('deletes the document, updates the sidebar list and reports back', async () => {
    const user = userEvent.setup()
    const onRemoved = vi.fn()
    const client = createTestQueryClient()
    client.setQueryData(['document', 5], DOC)
    client.setQueryData<IDocumentSummary[]>(
      ['documents'],
      [
        { ...DOC, excerpt: '', itemCount: 0, doneCount: 0 },
        { ...DOC, id: 6, excerpt: '', itemCount: 0, doneCount: 0 }
      ]
    )
    renderWithQuery(<Workspace onRemoved={onRemoved} />, { client })

    await user.click(screen.getByRole('button', { name: 'Document options' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete list' }))

    await waitFor(() => expect(onRemoved).toHaveBeenCalled())
    expect(api.document.remove).toHaveBeenCalledWith(5)
    expect(client.getQueryData<IDocumentSummary[]>(['documents'])?.map((d) => d.id)).toEqual([6])
    // regression: dropping the observed detail query made it refetch a deleted document
    expect(api.document.get).not.toHaveBeenCalled()
  })
})
