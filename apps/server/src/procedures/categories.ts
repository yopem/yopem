import { ORPCError } from "@orpc/server"
import { adminProcedure, publicProcedure } from "server/orpc"
import { z } from "zod"

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "db/services/categories"

export const categoriesRouter = {
  list: publicProcedure.handler(async () => {
    return await listCategories()
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      try {
        return await createCategory({
          name: input.name,
          description: input.description,
        })
      } catch (error) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to create category: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      try {
        const updated = await updateCategory({
          id: input.id,
          name: input.name,
          description: input.description,
        })
        if (!updated) {
          throw new ORPCError("NOT_FOUND", {
            message: `Category not found: ${input.id}`,
          })
        }
        return updated
      } catch (error) {
        if (error instanceof ORPCError) throw error
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to update category: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      try {
        await deleteCategory(input.id)
        return { success: true }
      } catch (error) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to delete category: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),
}
