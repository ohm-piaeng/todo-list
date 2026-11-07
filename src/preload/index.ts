import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { TODO_CHANNELS, type IAppApi } from '@shared/ipc'

// Typed API exposed to the renderer as `window.api` (contract: @shared/ipc/api.ts)
const api: IAppApi = {
  todo: {
    list: () => ipcRenderer.invoke(TODO_CHANNELS.list),
    create: (input) => ipcRenderer.invoke(TODO_CHANNELS.create, input),
    update: (input) => ipcRenderer.invoke(TODO_CHANNELS.update, input),
    remove: (id) => ipcRenderer.invoke(TODO_CHANNELS.remove, id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
