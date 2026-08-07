import { ORPCError } from "@orpc/server"
import * as v from "valibot"

import { categorySchema, listCategorySchema } from "db/schema/categories"
import {
  createCategory,
  deleteCategories,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
  updateCategoryStatus,
} from "db/services/categories"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const PARENT_ERROR_MESSAGES = [
  "Parent category not found",
  "A category cannot be its own parent",
  "Cannot assign a descendant as parent",
]

const isSlugConflict = (message: string) =>
  message.startsWith('Slug "') && message.endsWith('" is already in use')

function mapCategoryError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === "Update returned no rows") {
      throw new ORPCError("NOT_FOUND", {
        status: 404,
        message: "Category not found",
      })
    }
    if (PARENT_ERROR_MESSAGES.includes(error.message)) {
      throw new ORPCError("BAD_REQUEST", {
        status: 400,
        message: error.message,
      })
    }
    if (isSlugConflict(error.message)) {
      throw new ORPCError("CONFLICT", {
        status: 409,
        message: error.message,
      })
    }
  }
  throw error
}

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
          slug: v.optional(v.string()),
          description: v.optional(v.string()),
          parentId: v.optional(v.string()),
        }),
      )
      .output(categorySchema)
      .handler(async ({ input }) => {
        try {
          return await createCategory(input)
        } catch (error) {
          return mapCategoryError(error)
        }
      }),

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
          slug: v.optional(v.string()),
          description: v.optional(v.string()),
          parentId: v.optional(v.string()),
        }),
      )
      .output(categorySchema)
      .handler(async ({ input }) => {
        try {
          return await updateCategory(input)
        } catch (error) {
          return mapCategoryError(error)
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

    bulkDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(v.object({ ids: v.array(v.string()) }))
      .output(v.object({ success: v.boolean(), count: v.number() }))
      .handler(({ input }) => deleteCategories(input.ids)),

    bulkStatusUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(
        v.object({
          ids: v.pipe(v.array(v.string()), v.minLength(1)),
          status: v.picklist(["draft", "active", "archived"]),
        }),
      )
      .handler(({ input }) => updateCategoryStatus(input.ids, input.status)),
  },
}
