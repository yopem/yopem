import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@repo/db/services/categories"
import { adminProcedure, publicProcedure } from "@repo/server/orpc"
import { z } from "zod"

export const categoriesRouter = {
  list: publicProcedure.handler(() => {
    return listCategories()
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(({ input }) => {
      return createCategory({
        name: input.name,
        description: input.description,
      })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(({ input }) => {
      return updateCategory({
        id: input.id,
        name: input.name,
        description: input.description,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteCategory(input.id)

      return { success: true }
    }),
}
