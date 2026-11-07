import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { DOCUMENT_CHANNELS, ITEM_CHANNELS, SHEET_CHANNELS, type IAppApi } from '@shared/ipc'

// Typed API exposed to the renderer as `window.api` (contract: @shared/ipc/api.ts)
const api: IAppApi = {
  document: {
    list: () => ipcRenderer.invoke(DOCUMENT_CHANNELS.list),
    get: (id) => ipcRenderer.invoke(DOCUMENT_CHANNELS.get, id),
    create: (input) => ipcRenderer.invoke(DOCUMENT_CHANNELS.create, input),
    update: (input) => ipcRenderer.invoke(DOCUMENT_CHANNELS.update, input),
    remove: (id) => ipcRenderer.invoke(DOCUMENT_CHANNELS.remove, id)
  },
  sheet: {
    create: (input) => ipcRenderer.invoke(SHEET_CHANNELS.create, input),
    update: (input) => ipcRenderer.invoke(SHEET_CHANNELS.update, input),
    remove: (id) => ipcRenderer.invoke(SHEET_CHANNELS.remove, id)
  },
  item: {
    create: (input) => ipcRenderer.invoke(ITEM_CHANNELS.create, input),
    update: (input) => ipcRenderer.invoke(ITEM_CHANNELS.update, input),
    remove: (id) => ipcRenderer.invoke(ITEM_CHANNELS.remove, id),
    reorder: (input) => ipcRenderer.invoke(ITEM_CHANNELS.reorder, input)
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
