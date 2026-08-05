import { ORPCError } from "@orpc/server"
import * as v from "valibot"

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
      .output(v.array(listCategorySchema))
      .handler(() => listCategories()),

    byId: os
      .route({ method: "GET" })
      .input(v.object({ id: v.string() }))
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
        v.object({
          name: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "Category name is required"),
          ),
          description: v.optional(v.string()),
          parentId: v.optional(v.string()),
        }),
      )
      .output(categorySchema)
      .handler(({ input }) => createCategory(input)),

    update: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(
        v.object({
          id: v.string(),
          name: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "Category name is required"),
          ),
          description: v.optional(v.string()),
          parentId: v.optional(v.string()),
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
      .input(v.object({ id: v.string() }))
      .output(v.object({ success: v.boolean() }))
      .handler(async ({ input }) => {
        await deleteCategory(input.id)
        return { success: true }
      }),
  },
}
