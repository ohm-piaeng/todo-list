import { useQuery } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IAppApi } from '@shared/ipc'
import type { IDocumentDetail, ITodoItem } from '@shared/notebook'
import type { ITodoItemRowProps } from './TodoItemRow'
import { createTestQueryClient, mockApi, renderWithQuery } from '@test/renderer-utils'
import { TodoBody } from './TodoBody'

/** Counts renders per item id by wrapping the real memoised row. */
const renders = vi.hoisted(() => new Map<number, number>())
vi.mock('./TodoItemRow', async (importActual) => {
  const actual = await importActual<typeof import('./TodoItemRow')>()
  const { memo } = await import('react')
  const Inner = (
    actual.TodoItemRow as unknown as { type: (p: ITodoItemRowProps) => React.JSX.Element }
  ).type
  return {
    ...actual,
    TodoItemRow: memo(function CountedRow(props: ITodoItemRowProps) {
      renders.set(props.item.id, (renders.get(props.item.id) ?? 0) + 1)
      return Inner(props)
    })
  }
})

const item = (id: number, text: string, completed = false): ITodoItem => ({
  id,
  sheetId: 10,
  position: id,
  text,
  completed
})

const ITEMS = [item(1, 'Oat milk x2', true), item(2, 'Eggs'), item(3, 'Basmati rice')]

const DOC: IDocumentDetail = {
  id: 1,
  kind: 'todo',
  title: 'Weekly groceries',
  textSize: 16,
  textWeight: 'semibold',
  createdAt: 0,
  updatedAt: 0,
  sheets: [
    { id: 10, documentId: 1, position: 0, title: 'Weekly groceries', body: '', items: ITEMS }
  ]
}

let api: IAppApi
beforeEach(() => {
  api = mockApi()
  vi.mocked(api.item.update).mockImplementation(async ({ id, ...patch }) => ({
    ...ITEMS.find((i) => i.id === id)!,
    ...patch
  }))
  vi.mocked(api.item.create).mockImplementation(async ({ text }) => item(99, text))
})

/** Reads items from the cache like the workspace page, so optimistic updates re-render. */
function Bound(): React.JSX.Element | null {
  const { data } = useQuery({
    queryKey: ['document', 1],
    queryFn: () => window.api.document.get(1)
  })
  if (!data) return null
  return (
    <TodoBody
      documentId={1}
      sheetId={10}
      items={data.sheets[0].items}
      textSize={18}
      textWeight="bold"
    />
  )
}

function setup(): ReturnType<typeof renderWithQuery> {
  const client = createTestQueryClient()
  client.setQueryData(['document', 1], DOC)
  return renderWithQuery(<Bound />, { client })
}

const rows = (): HTMLElement[] =>
  within(screen.getByRole('list', { name: 'Tasks' })).getAllByRole('listitem')
const texts = (): string[] =>
  screen.getAllByRole('textbox', { name: 'Task' }).map((i) => (i as HTMLInputElement).value)

describe('TodoBody', () => {
  it('renders tasks with the chosen text size/weight and done styling', () => {
    setup()
    expect(rows()).toHaveLength(3)
    const [done, open] = screen.getAllByRole('textbox', { name: 'Task' })
    expect(done).toHaveClass('line-through', 'text-fg-tertiary', 'font-bold')
    expect(open).toHaveClass('text-fg', 'font-bold')
    expect(open).not.toHaveClass('line-through')
    expect(open).toHaveStyle({ fontSize: '18px' })
  })

  it('toggles a task optimistically', async () => {
    const user = userEvent.setup()
    const { client } = setup()
    await user.click(screen.getByRole('checkbox', { name: 'Mark "Eggs" done' }))
    await waitFor(() => expect(api.item.update).toHaveBeenCalledWith({ id: 2, completed: true }))
    const cached = client.getQueryData<IDocumentDetail>(['document', 1])
    expect(cached?.sheets[0].items[1].completed).toBe(true)
  })

  it('adds a task with Enter and keeps focus for the next one', async () => {
    const user = userEvent.setup()
    setup()
    const add = screen.getByRole('textbox', { name: 'Add a task' })
    await user.type(add, 'Greek yogurt{Enter}')
    await waitFor(() => expect(add).toHaveValue(''))
    expect(api.item.create).toHaveBeenCalledWith({ sheetId: 10, text: 'Greek yogurt' })
    expect(texts()).toContain('Greek yogurt')
    expect(add).toHaveFocus()
  })

  it('ignores blank tasks', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox', { name: 'Add a task' }), '   {Enter}')
    expect(api.item.create).not.toHaveBeenCalled()
  })

  it('renames a task on Enter', async () => {
    const user = userEvent.setup()
    setup()
    const eggs = screen.getAllByRole('textbox', { name: 'Task' })[1]
    await user.clear(eggs)
    await user.type(eggs, 'Free-range eggs{Enter}')
    await waitFor(() =>
      expect(api.item.update).toHaveBeenCalledWith({ id: 2, text: 'Free-range eggs' })
    )
  })

  it('removes a task when its text is cleared, Backspace again moves focus up', async () => {
    const user = userEvent.setup()
    setup()
    const eggs = screen.getAllByRole('textbox', { name: 'Task' })[1]
    await user.clear(eggs)
    await user.keyboard('{Backspace}')
    await waitFor(() => expect(api.item.remove).toHaveBeenCalledWith(2))
    await waitFor(() => expect(texts()).toEqual(['Oat milk x2', 'Basmati rice']))
  })

  it('reorders with Alt+Arrow keys', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getAllByRole('textbox', { name: 'Task' })[0])
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await waitFor(() =>
      expect(api.item.reorder).toHaveBeenCalledWith({ sheetId: 10, orderedIds: [2, 1, 3] })
    )
    await waitFor(() => expect(texts()).toEqual(['Eggs', 'Oat milk x2', 'Basmati rice']))
  })

  it('keeps focus on the moved task so repeated Alt+Arrow keeps moving it', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getAllByRole('textbox', { name: 'Task' })[0])
    await user.keyboard('{Alt>}{ArrowDown}{ArrowDown}{/Alt}')
    await waitFor(() => expect(texts()).toEqual(['Eggs', 'Basmati rice', 'Oat milk x2']))
    expect(api.item.reorder).toHaveBeenLastCalledWith({ sheetId: 10, orderedIds: [2, 3, 1] })
    expect(document.activeElement).toHaveValue('Oat milk x2')
  })

  it('reorders by dragging the grip onto another row', async () => {
    setup()
    const [first, , third] = rows()
    const grip = first.querySelector('[draggable="true"]')!
    const dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: '' }
    vi.spyOn(third, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 36 } as DOMRect)

    act(() => {
      grip.dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer }))
    })
    act(() => {
      third.dispatchEvent(
        Object.assign(new Event('dragover', { bubbles: true, cancelable: true }), { clientY: 130 })
      )
    })
    act(() => {
      third.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }))
    })
    // dropped below "Basmati rice"
    await waitFor(() =>
      expect(api.item.reorder).toHaveBeenCalledWith({ sheetId: 10, orderedIds: [2, 3, 1] })
    )
  })

  it('toggling one task re-renders only that row (memoised rows)', async () => {
    const user = userEvent.setup()
    setup()
    renders.clear()
    await user.click(screen.getByRole('checkbox', { name: 'Mark "Eggs" done' }))
    await waitFor(() => expect(renders.get(2)).toBeGreaterThan(0))
    expect(renders.get(1) ?? 0).toBe(0)
    expect(renders.get(3) ?? 0).toBe(0)
  })
})
