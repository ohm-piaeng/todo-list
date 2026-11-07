import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail } from '@shared/notebook'
import { createTestQueryClient, mockApi, renderWithQuery } from '@test/renderer-utils'
import { SheetFrame } from './SheetFrame'

const DOC: IDocumentDetail = {
  id: 1,
  kind: 'note',
  title: 'Untitled note',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 0,
  updatedAt: 0,
  sheets: [
    { id: 10, documentId: 1, position: 0, title: 'Untitled note', body: '', items: [] },
    { id: 11, documentId: 1, position: 1, title: 'Open questions', body: '', items: [] }
  ]
}

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.sheet.update).mockImplementation(async ({ id, title }) => ({
    ...DOC.sheets[0],
    id,
    title: title ?? ''
  }))
  vi.mocked(api.document.get).mockResolvedValue(DOC)
})

function setup(index: number, total: number): ReturnType<typeof renderWithQuery> {
  const client = createTestQueryClient()
  client.setQueryData(['document', 1], DOC)
  const sheet = DOC.sheets[index]
  return renderWithQuery(
    <SheetFrame
      documentId={1}
      kind="note"
      sheetId={sheet.id}
      title={sheet.title}
      index={index}
      total={total}
    >
      <p>body</p>
    </SheetFrame>,
    { client }
  )
}

describe('SheetFrame', () => {
  it('labels the page "Page n of m" and renders the body', () => {
    setup(1, 2)
    expect(screen.getByRole('article', { name: 'Page 2 of 2' })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renaming the first page renames the document optimistically', async () => {
    const user = userEvent.setup()
    const { client } = setup(0, 2)
    const title = screen.getByRole('textbox', { name: 'Page 1 title' })
    await user.clear(title)
    await user.type(title, 'Project ideas')
    await user.tab()

    expect(api.sheet.update).toHaveBeenLastCalledWith({ id: 10, title: 'Project ideas' })
    expect(client.getQueryData<IDocumentDetail>(['document', 1])?.title).toBe('Project ideas')
  })

  it('Enter in the title does not insert a newline', async () => {
    const user = userEvent.setup()
    setup(1, 2)
    const title = screen.getByRole('textbox', { name: 'Page 2 title' })
    await user.type(title, '{Enter}')
    expect(title).toHaveValue('Open questions')
  })

  it('cannot delete the only page', async () => {
    const user = userEvent.setup()
    setup(0, 1)
    await user.click(screen.getByRole('button', { name: 'Page 1 of 1 options' }))
    expect(screen.getByRole('menuitem', { name: 'Delete page' })).toBeDisabled()
  })

  it('deletes a page from its menu', async () => {
    const user = userEvent.setup()
    setup(1, 2)
    await user.click(screen.getByRole('button', { name: 'Page 2 of 2 options' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete page' }))
    await waitFor(() => expect(api.sheet.remove).toHaveBeenCalledWith(11))
  })
})
