import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocument, IDocumentDetail } from '@shared/notebook'
import { createTestQueryClient, mockApi, renderWithQuery } from '@test/renderer-utils'
import { TodoToolbar } from './TodoToolbar'

const DOC = {
  id: 1,
  kind: 'todo',
  title: 'Weekly groceries',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 0,
  updatedAt: 0,
  sheets: []
} satisfies IDocumentDetail

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.document.update).mockImplementation(
    async (patch) => ({ ...DOC, ...patch }) as IDocument
  )
})

function setup(): ReturnType<typeof renderWithQuery> {
  const client = createTestQueryClient()
  client.setQueryData(['document', 1], DOC)
  return renderWithQuery(<TodoToolbar documentId={1} textSize={16} textWeight="semibold" />, {
    client
  })
}

describe('TodoToolbar', () => {
  it('shows the current size and weight like the design', () => {
    setup()
    expect(screen.getByRole('combobox', { name: 'Text size' })).toHaveDisplayValue('16 px')
    expect(screen.getByRole('radio', { name: 'Semibold' })).toBeChecked()
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'Regular',
      'Semibold',
      'Bold'
    ])
  })

  it('changes the text size optimistically', async () => {
    const user = userEvent.setup()
    const { client } = setup()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Text size' }), '20 px')
    expect(api.document.update).toHaveBeenCalledWith({ id: 1, textSize: 20 })
    expect(client.getQueryData<IDocumentDetail>(['document', 1])?.textSize).toBe(20)
  })

  it('changes the weight by click and by arrow keys', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('radio', { name: 'Bold' }))
    expect(api.document.update).toHaveBeenLastCalledWith({ id: 1, textWeight: 'bold' })

    screen.getByRole('radio', { name: 'Semibold' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(api.document.update).toHaveBeenLastCalledWith({ id: 1, textWeight: 'regular' })
  })
})
