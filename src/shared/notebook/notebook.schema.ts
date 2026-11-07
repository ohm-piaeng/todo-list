import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
export const idSchema = z.number().int().positive()

export const documentKindSchema = z.enum(['note', 'todo'])
export type DocumentKind = z.infer<typeof documentKindSchema>

export const textWeightSchema = z.enum(['regular', 'semibold', 'bold'])
export type TextWeight = z.infer<typeof textWeightSchema>

/** Font sizes offered by the to-do toolbar (px). */
export const TEXT_SIZES = [13, 14, 16, 18, 20, 24] as const
export const textSizeSchema = z.number().int().min(10).max(40)

const titleSchema = z.string().trim().max(200)

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
export const documentSchema = z.object({
  id: idSchema,
  kind: documentKindSchema,
  title: z.string(),
  textSize: z.number().int(),
  textWeight: textWeightSchema,
  createdAt: z.number().int(),
  updatedAt: z.number().int()
})

/** Sidebar row: document + a one-line description. */
export const documentSummarySchema = documentSchema.extend({
  /** Notes: first paragraph of the first page. To-do lists: empty. */
  excerpt: z.string(),
  itemCount: z.number().int(),
  doneCount: z.number().int()
})

export const todoItemSchema = z.object({
  id: idSchema,
  sheetId: idSchema,
  position: z.number().int(),
  text: z.string(),
  completed: z.boolean()
})

export const sheetSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  position: z.number().int(),
  title: z.string(),
  body: z.string(),
  items: z.array(todoItemSchema)
})

export const documentDetailSchema = documentSchema.extend({
  sheets: z.array(sheetSchema)
})

export interface IDocument extends z.infer<typeof documentSchema> {}
export interface IDocumentSummary extends z.infer<typeof documentSummarySchema> {}
export interface ITodoItem extends z.infer<typeof todoItemSchema> {}
export interface ISheet extends z.infer<typeof sheetSchema> {}
export interface IDocumentDetail extends z.infer<typeof documentDetailSchema> {}

// ---------------------------------------------------------------------------
// Inputs (validated in main before reaching services)
// ---------------------------------------------------------------------------
export const createDocumentInputSchema = z.object({ kind: documentKindSchema })

export const updateDocumentInputSchema = z.object({
  id: idSchema,
  textSize: textSizeSchema.optional(),
  textWeight: textWeightSchema.optional()
})

export const createSheetInputSchema = z.object({ documentId: idSchema })

export const updateSheetInputSchema = z.object({
  id: idSchema,
  title: titleSchema.optional(),
  body: z.string().max(200_000).optional()
})

export const createItemInputSchema = z.object({
  sheetId: idSchema,
  text: z.string().trim().min(1, 'Task is required').max(500)
})

export const updateItemInputSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional()
})

export const reorderItemsInputSchema = z.object({
  sheetId: idSchema,
  orderedIds: z.array(idSchema).min(1)
})

export interface ICreateDocumentInput extends z.infer<typeof createDocumentInputSchema> {}
export interface IUpdateDocumentInput extends z.infer<typeof updateDocumentInputSchema> {}
export interface ICreateSheetInput extends z.infer<typeof createSheetInputSchema> {}
export interface IUpdateSheetInput extends z.infer<typeof updateSheetInputSchema> {}
export interface ICreateItemInput extends z.infer<typeof createItemInputSchema> {}
export interface IUpdateItemInput extends z.infer<typeof updateItemInputSchema> {}
export interface IReorderItemsInput extends z.infer<typeof reorderItemsInputSchema> {}
