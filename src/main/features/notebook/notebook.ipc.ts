import { ipcMain } from 'electron'
import { DOCUMENT_CHANNELS, ITEM_CHANNELS, SHEET_CHANNELS } from '@shared/ipc'
import {
  createDocumentInputSchema,
  createItemInputSchema,
  createSheetInputSchema,
  idSchema,
  reorderItemsInputSchema,
  updateDocumentInputSchema,
  updateItemInputSchema,
  updateSheetInputSchema
} from '@shared/notebook'
import { createAppNotebookService, type INotebookService } from './notebook.service'

/** Every payload from the renderer is untrusted: parse with zod before it reaches the service. */
export function registerNotebookIpc(service: INotebookService = createAppNotebookService()): void {
  ipcMain.handle(DOCUMENT_CHANNELS.list, () => service.listDocuments())
  ipcMain.handle(DOCUMENT_CHANNELS.get, (_e, id: unknown) =>
    service.getDocument(idSchema.parse(id))
  )
  ipcMain.handle(DOCUMENT_CHANNELS.create, (_e, input: unknown) =>
    service.createDocument(createDocumentInputSchema.parse(input))
  )
  ipcMain.handle(DOCUMENT_CHANNELS.update, (_e, input: unknown) =>
    service.updateDocument(updateDocumentInputSchema.parse(input))
  )
  ipcMain.handle(DOCUMENT_CHANNELS.remove, (_e, id: unknown) =>
    service.removeDocument(idSchema.parse(id))
  )

  ipcMain.handle(SHEET_CHANNELS.create, (_e, input: unknown) =>
    service.createSheet(createSheetInputSchema.parse(input))
  )
  ipcMain.handle(SHEET_CHANNELS.update, (_e, input: unknown) =>
    service.updateSheet(updateSheetInputSchema.parse(input))
  )
  ipcMain.handle(SHEET_CHANNELS.remove, (_e, id: unknown) =>
    service.removeSheet(idSchema.parse(id))
  )

  ipcMain.handle(ITEM_CHANNELS.create, (_e, input: unknown) =>
    service.createItem(createItemInputSchema.parse(input))
  )
  ipcMain.handle(ITEM_CHANNELS.update, (_e, input: unknown) =>
    service.updateItem(updateItemInputSchema.parse(input))
  )
  ipcMain.handle(ITEM_CHANNELS.remove, (_e, id: unknown) => service.removeItem(idSchema.parse(id)))
  ipcMain.handle(ITEM_CHANNELS.reorder, (_e, input: unknown) =>
    service.reorderItems(reorderItemsInputSchema.parse(input))
  )
}
