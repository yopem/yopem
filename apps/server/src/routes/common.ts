import { z } from "zod"

export const idParamSchema = z.object({
  id: z.string(),
})

export const successSchema = z.object({
  success: z.boolean(),
})

export const cursorQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
})

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
})

export const jsonOkResponse = (schema?: z.ZodTypeAny) => ({
  description: "Success",
  content: {
    "application/json": {
      schema: schema ?? z.any(),
    },
  },
})
