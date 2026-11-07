import type { ICreateTodoInput, ITodo, IUpdateTodoInput } from '@shared/todo'
import { todoRepository, type ITodoRepository } from './todo.repository'

export interface ITodoService {
  list: () => ITodo[]
  create: (input: ICreateTodoInput) => ITodo
  update: (input: IUpdateTodoInput) => ITodo
  remove: (id: number) => void
}

export function createTodoService(repo: ITodoRepository = todoRepository): ITodoService {
  return {
    list: () => repo.findAll(),

    create: ({ title }) => repo.insert(title),

    update: ({ id, ...patch }) => {
      const updated = repo.update(id, patch)
      if (!updated) throw new Error(`Todo ${id} not found`)
      return updated
    },

    remove: (id) => {
      if (!repo.remove(id)) throw new Error(`Todo ${id} not found`)
    }
  }
}
