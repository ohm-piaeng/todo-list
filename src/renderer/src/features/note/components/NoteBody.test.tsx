import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail } from '@shared/notebook'
import { createTestQueryClient, mockApi, renderWithQuery } from '@test/renderer-utils'
import { MarkdownToolbar } from './MarkdownToolbar'
import { NoteBody } from './NoteBody'
import { NoteEditorProvider } from './NoteEditorProvider'

const DOC: IDocumentDetail = {
  id: 1,
  kind: 'note',
  title: 'Project ideas',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 0,
  updatedAt: 0,
  sheets: [{ id: 10, documentId: 1, position: 0, title: 'Project ideas', body: '', items: [] }]
}

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.sheet.update).mockImplementation(async ({ id, body }) => ({
    ...DOC.sheets[0],
    id,
    body: body ?? ''
  }))
})

function setup(body: string): ReturnType<typeof renderWithQuery> {
  const client = createTestQueryClient()
  client.setQueryData(['document', 1], { ...DOC, sheets: [{ ...DOC.sheets[0], body }] })
  return renderWithQuery(
    <NoteEditorProvider>
      <MarkdownToolbar />
      <NoteBody documentId={1} sheetId={10} body={body} />
    </NoteEditorProvider>,
    { client }
  )
}

describe('NoteBody', () => {
  it('renders markdown with the design structure', async () => {
    setup('Intro text\n\n## Product\n\n- Offline sync\n\n> Make it fast\n\n```\nconst a = 1\n```')
    expect(await screen.findByRole('heading', { name: 'Product' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Offline sync')
    expect(screen.getByText('Make it fast').closest('blockquote')).toBeInTheDocument()
    expect(screen.getByText('const a = 1').closest('pre')).toBeInTheDocument()
  })

  it('shows a placeholder for an empty page', () => {
    setup('')
    expect(screen.getByText('Start writing…')).toBeInTheDocument()
  })

  it('edits on click and saves the markdown (debounced)', async () => {
    const user = userEvent.setup()
    const { client } = setup('')
    await user.click(screen.getByRole('button', { name: 'Edit page content' }))
    const textarea = screen.getByRole('textbox', { name: /Page content/ })
    expect(textarea).toHaveFocus()

    await user.type(textarea, 'Hello')
    await waitFor(() => expect(api.sheet.update).toHaveBeenCalledWith({ id: 10, body: 'Hello' }))
    expect(api.sheet.update).toHaveBeenCalledTimes(1)
    const cached = client.getQueryData<IDocumentDetail>(['document', 1])
    expect(cached?.sheets[0].body).toBe('Hello')
  })

  it('saves immediately on blur and renders the result', async () => {
    const user = userEvent.setup()
    setup('')
    await user.click(screen.getByRole('button', { name: 'Edit page content' }))
    await user.type(screen.getByRole('textbox', { name: /Page content/ }), '## Title')
    await user.keyboard('{Escape}')
    expect(api.sheet.update).toHaveBeenCalledWith({ id: 10, body: '## Title' })
    expect(await screen.findByRole('heading', { name: 'Title' })).toBeInTheDocument()
  })

  it('toolbar opens the page for editing when nothing is focused', async () => {
    const user = userEvent.setup()
    setup('word')
    await user.click(screen.getByRole('button', { name: 'Heading' }))
    const textarea = await screen.findByRole('textbox', { name: /Page content/ })
    expect(textarea).toHaveFocus()
    expect(textarea).toHaveValue('## word')
  })

  it('toolbar formats the selection without losing focus', async () => {
    const user = userEvent.setup()
    setup('word')
    await user.click(screen.getByRole('button', { name: 'Edit page content' }))
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: /Page content/ })
    textarea.setSelectionRange(0, 4)

    await user.click(screen.getByRole('button', { name: /^Bold/ }))
    expect(textarea).toHaveValue('**word**')
    expect(textarea).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Bulleted list' }))
    expect(textarea).toHaveValue('- **word**')
  })

  it('supports Ctrl+B', async () => {
    const user = userEvent.setup()
    setup('')
    await user.click(screen.getByRole('button', { name: 'Edit page content' }))
    await user.keyboard('{Control>}b{/Control}')
    expect(screen.getByRole('textbox', { name: /Page content/ })).toHaveValue('**bold text**')
  })
})
