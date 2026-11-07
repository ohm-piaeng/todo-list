import { desc, eq } from 'drizzle-orm'
import type { ITodo } from '@shared/todo'
import { getDb } from '../../db/client'
import { todos } from '../../db/schema'

export interface ITodoRepository {
  findAll: () => ITodo[]
  findById: (id: number) => ITodo | undefined
  insert: (title: string) => ITodo
  update: (id: number, patch: Partial<Pick<ITodo, 'title' | 'completed'>>) => ITodo | undefined
  remove: (id: number) => boolean
}

export const todoRepository: ITodoRepository = {
  findAll: () => getDb().select().from(todos).orderBy(desc(todos.createdAt), desc(todos.id)).all(),

  findById: (id) => getDb().select().from(todos).where(eq(todos.id, id)).get(),

  insert: (title) => getDb().insert(todos).values({ title }).returning().get(),

  update: (id, patch) =>
    getDb()
      .update(todos)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(todos.id, id))
      .returning()
      .get(),

  remove: (id) => getDb().delete(todos).where(eq(todos.id, id)).run().changes > 0
}
