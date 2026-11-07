import type {
  ICreateDocumentInput,
  ICreateItemInput,
  ICreateSheetInput,
  IDocument,
  IDocumentDetail,
  IDocumentSummary,
  IReorderItemsInput,
  ISheet,
  ITodoItem,
  IUpdateDocumentInput,
  IUpdateItemInput,
  IUpdateSheetInput
} from '../notebook'

export interface IDocumentApi {
  list: () => Promise<IDocumentSummary[]>
  get: (id: number) => Promise<IDocumentDetail>
  create: (input: ICreateDocumentInput) => Promise<IDocumentDetail>
  update: (input: IUpdateDocumentInput) => Promise<IDocument>
  remove: (id: number) => Promise<void>
}

export interface ISheetApi {
  create: (input: ICreateSheetInput) => Promise<ISheet>
  update: (input: IUpdateSheetInput) => Promise<ISheet>
  remove: (id: number) => Promise<void>
}

export interface IItemApi {
  create: (input: ICreateItemInput) => Promise<ITodoItem>
  update: (input: IUpdateItemInput) => Promise<ITodoItem>
  remove: (id: number) => Promise<void>
  reorder: (input: IReorderItemsInput) => Promise<void>
}

/** Contract of `window.api`, implemented by preload and consumed by renderer. */
export interface IAppApi {
  document: IDocumentApi
  sheet: ISheetApi
  item: IItemApi
}
