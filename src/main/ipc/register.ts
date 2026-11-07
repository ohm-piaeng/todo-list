import { registerNotebookIpc } from '../features/notebook/notebook.ipc'

/** Register IPC handlers of every feature. Add new features here. */
export function registerIpc(): void {
  registerNotebookIpc()
}
