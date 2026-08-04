import { ORPCError } from "@orpc/server"
import { z } from "zod"

import { categorySchema, listCategorySchema } from "db/schema/categories"
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "db/services/categories"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

export const categoriesRouter = {
  categories: {
    list: os
      .route({ method: "GET" })
      .output(z.array(listCategorySchema))
      .handler(() => listCategories()),

    byId: os
      .route({ method: "GET" })
      .input(z.object({ id: z.string() }))
      .output(categorySchema)
      .handler(async ({ input }) => {
        const category = await getCategory(input.id)
        if (!category) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "Category not found",
          })
        }
        return category
      }),

    create: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(
        z.object({
          name: z.string().min(1, "Category name is required").trim(),
          description: z.string().optional(),
          parentId: z.string().optional(),
        }),
      )
      .output(categorySchema)
      .handler(({ input }) => createCategory(input)),

    update: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1, "Category name is required").trim(),
          description: z.string().optional(),
          parentId: z.string().optional(),
        }),
      )
      .output(categorySchema)
      .handler(async ({ input }) => {
        try {
          return await updateCategory(input)
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Update returned no rows"
          ) {
            throw new ORPCError("NOT_FOUND", {
              status: 404,
              message: "Category not found",
            })
          }
          throw error
        }
      }),

    delete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .output(z.object({ success: z.boolean() }))
      .handler(async ({ input }) => {
        await deleteCategory(input.id)
        return { success: true }
      }),
  },
}
