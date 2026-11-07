import { ipcMain } from 'electron'
import { TODO_CHANNELS } from '@shared/ipc'
import { createTodoInputSchema, todoIdSchema, updateTodoInputSchema } from '@shared/todo'
import { createTodoService } from './todo.service'

export function registerTodoIpc(): void {
  const service = createTodoService()

  ipcMain.handle(TODO_CHANNELS.list, () => service.list())
  ipcMain.handle(TODO_CHANNELS.create, (_e, input: unknown) =>
    service.create(createTodoInputSchema.parse(input))
  )
  ipcMain.handle(TODO_CHANNELS.update, (_e, input: unknown) =>
    service.update(updateTodoInputSchema.parse(input))
  )
  ipcMain.handle(TODO_CHANNELS.remove, (_e, id: unknown) => service.remove(todoIdSchema.parse(id)))
}
