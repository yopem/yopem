import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import { requireAdmin, requireAuth } from "server/middleware"
import { z } from "zod"

import { insertTagSchema } from "db/schema"
import { createTag, deleteTag, listTags, updateTag } from "db/services/tags"

import { idParamSchema, jsonOkResponse } from "./common"

export const tagsPublicApp = new OpenAPIHono<AppContext>()

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["tags"],
  responses: {
    200: jsonOkResponse(),
  },
})

tagsPublicApp.openapi(listRoute, async (c) => {
  return c.json(await listTags(), 200)
})

export const tagsAdminApp = new OpenAPIHono<AppContext>()

tagsAdminApp.use("*", requireAuth, requireAdmin)

const createInputSchema = insertTagSchema.pick({ name: true }).extend({
  name: z.string().min(1, "Tag name is required").trim(),
})

const createItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["tags"],
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

tagsAdminApp.openapi(createItemRoute, async (c) => {
  const input = c.req.valid("json")

  try {
    return c.json(await createTag({ name: input.name }), 200)
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to create tag: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

const updateInputSchema = z.object({
  name: z.string().min(1, "Tag name is required").trim(),
})

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["tags"],
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

tagsAdminApp.openapi(updateRoute, async (c) => {
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")

  try {
    const updated = await updateTag({ id, name: input.name })

    if (!updated) {
      throw new ApiError("NOT_FOUND", {
        message: `Tag not found: ${id}`,
      })
    }

    return c.json(updated, 200)
  } catch (error) {
    if (error instanceof ApiError) throw error

    throw new ApiError("BAD_REQUEST", {
      message: `Failed to update tag: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["tags"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

tagsAdminApp.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param")

  try {
    await deleteTag(id)
    return c.json({ success: true }, 200)
  } catch (error) {
    throw new ApiError("BAD_REQUEST", {
      message: `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
})
