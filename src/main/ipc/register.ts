import { registerTodoIpc } from '../features/todo/todo.ipc'

/** Register IPC handlers of every feature. Add new features here. */
export function registerIpc(): void {
  registerTodoIpc()
}
