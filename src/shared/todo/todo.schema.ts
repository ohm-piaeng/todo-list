import { z } from 'zod'

export const todoIdSchema = z.number().int().positive()

export const todoSchema = z.object({
  id: todoIdSchema,
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.number().int(),
  updatedAt: z.number().int()
})

export const createTodoInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500)
})

export const updateTodoInputSchema = z.object({
  id: todoIdSchema,
  title: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional()
})

export interface ITodo extends z.infer<typeof todoSchema> {}
export interface ICreateTodoInput extends z.infer<typeof createTodoInputSchema> {}
export interface IUpdateTodoInput extends z.infer<typeof updateTodoInputSchema> {}
