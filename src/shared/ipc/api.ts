import type { ICreateTodoInput, ITodo, IUpdateTodoInput } from '../todo'

/** Contract of `window.api`, implemented by preload and consumed by renderer. */
export interface ITodoApi {
  list: () => Promise<ITodo[]>
  create: (input: ICreateTodoInput) => Promise<ITodo>
  update: (input: IUpdateTodoInput) => Promise<ITodo>
  remove: (id: number) => Promise<void>
}

export interface IAppApi {
  todo: ITodoApi
}
