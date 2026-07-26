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

import { os, requireAdminMiddleware } from "./orpc"

export const categoriesRouter = {
  categoryList: os
    .route({ method: "GET", path: "/category/list" })
    .output(z.array(listCategorySchema))
    .handler(() => listCategories()),

  categoryById: os
    .route({ method: "GET", path: "/category/{id}" })
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

  categoryCreate: os
    .route({ method: "POST", path: "/category/create" })
    .use(requireAdminMiddleware)
    .input(
      z.object({
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .output(categorySchema)
    .handler(({ input }) => createCategory(input)),

  categoryUpdate: os
    .route({ method: "POST", path: "/category/update" })
    .use(requireAdminMiddleware)
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
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

  categoryDelete: os
    .route({ method: "POST", path: "/category/delete" })
    .use(requireAdminMiddleware)
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ input }) => {
      await deleteCategory(input.id)
      return { success: true }
    }),
}
