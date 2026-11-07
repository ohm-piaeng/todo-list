/** IPC channel names: `<feature>:<action>`. Single source of truth for main + preload. */
export const TODO_CHANNELS = {
  list: 'todo:list',
  create: 'todo:create',
  update: 'todo:update',
  remove: 'todo:remove'
} as const
