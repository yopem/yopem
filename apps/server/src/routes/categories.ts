import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import { requireAdmin, requireAuth } from "server/middleware"
import { z } from "zod"

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "db/services/categories"

import { idParamSchema, jsonOkResponse } from "./common"

export const categoriesPublicApp = new OpenAPIHono<AppContext>()

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["categories"],
  responses: {
    200: jsonOkResponse(),
  },
})

categoriesPublicApp.openapi(listRoute, async (c) => {
  return c.json(await listCategories(), 200)
})

export const categoriesAdminApp = new OpenAPIHono<AppContext>()

categoriesAdminApp.use("*", requireAuth, requireAdmin)

const createInputSchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  description: z.string().optional(),
})

const createItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["categories"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

categoriesAdminApp.openapi(createItemRoute, async (c) => {
  const input = c.req.valid("json")

  try {
    return c.json(
      await createCategory({
        name: input.name,
        description: input.description,
      }),
      200,
    )
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to create category: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

const updateInputSchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  description: z.string().optional(),
})

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["categories"],
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

categoriesAdminApp.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")

  try {
    const updated = await updateCategory({
      id,
      name: input.name,
      description: input.description,
    })

    if (!updated) {
      throw new ApiError("NOT_FOUND", {
        message: `Category not found: ${id}`,
      })
    }

    return c.json(updated, 200)
  } catch (error) {
    if (error instanceof ApiError) throw error

    throw new ApiError("BAD_REQUEST", {
      message: `Failed to update category: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["categories"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

categoriesAdminApp.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param")

  try {
    await deleteCategory(id)
    return c.json({ success: true }, 200)
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to delete category: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})
