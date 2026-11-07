/** IPC channel names: `<feature>:<action>`. Single source of truth for main + preload. */
export const DOCUMENT_CHANNELS = {
  list: 'document:list',
  get: 'document:get',
  create: 'document:create',
  update: 'document:update',
  remove: 'document:remove'
} as const

export const SHEET_CHANNELS = {
  create: 'sheet:create',
  update: 'sheet:update',
  remove: 'sheet:remove'
} as const

export const ITEM_CHANNELS = {
  create: 'item:create',
  update: 'item:update',
  remove: 'item:remove',
  reorder: 'item:reorder'
} as const
