import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ITodoItem } from '@shared/notebook'
import { TodoItemRow, type ITodoRowHandlers } from './TodoItemRow'

const ITEM: ITodoItem = { id: 2, sheetId: 10, position: 1, text: 'Eggs', completed: false }

function setup(): ITodoRowHandlers {
  const handlers: ITodoRowHandlers = {
    toggle: vi.fn(),
    commitText: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
    dragStart: vi.fn(),
    dragOver: vi.fn(),
    drop: vi.fn(),
    dragEnd: vi.fn()
  }
  render(
    <ul>
      <TodoItemRow
        item={ITEM}
        textStyle={{ fontSize: 16 }}
        weightClass="font-semibold"
        dropEdge={null}
        dragging={false}
        handlers={handlers}
      />
    </ul>
  )
  return handlers
}

describe('TodoItemRow', () => {
  it('Backspace on an empty task removes it once, even when blur follows', async () => {
    const user = userEvent.setup()
    const handlers = setup()
    const input = screen.getByRole('textbox', { name: 'Task' })
    await user.clear(input)
    await user.keyboard('{Backspace}')
    // Chromium: focus moves to the previous row before this one unmounts → blur → commit
    fireEvent.blur(input)
    expect(handlers.remove).toHaveBeenCalledTimes(1)
    expect(handlers.remove).toHaveBeenCalledWith(2, true)
  })

  it('Escape restores the saved text without committing', async () => {
    const user = userEvent.setup()
    const handlers = setup()
    const input = screen.getByRole('textbox', { name: 'Task' })
    await user.type(input, ' and ham{Escape}')
    expect(input).toHaveValue('Eggs')
    fireEvent.blur(input)
    expect(handlers.commitText).not.toHaveBeenCalled()
  })
})
