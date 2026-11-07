import { ElectronAPI } from '@electron-toolkit/preload'
import type { IAppApi } from '../shared/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IAppApi
  }
}
