import { ORPCError } from "@orpc/server"
import * as v from "valibot"

import { listTagSchema, tagSchema } from "db/schema/tags"
import {
  createTag,
  deleteTag,
  deleteTags,
  getTag,
  listTags,
  updateTag,
  updateTagStatus,
} from "db/services/tags"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const isSlugConflict = (message: string) =>
  message.startsWith('Slug "') && message.endsWith('" is already in use')

function mapTagError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === "Update returned no rows") {
      throw new ORPCError("NOT_FOUND", {
        status: 404,
        message: "Tag not found",
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

export const tagsRouter = {
  tags: {
    list: os
      .route({ method: "GET" })
      .output(v.array(listTagSchema))
      .handler(() => listTags()),

    byId: os
      .route({ method: "GET" })
      .input(v.object({ id: v.string() }))
      .output(tagSchema)
      .handler(async ({ input }) => {
        const tag = await getTag(input.id)
        if (!tag) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "Tag not found",
          })
        }
        return tag
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
            v.minLength(1, "Tag name is required"),
          ),
          slug: v.optional(v.string()),
        }),
      )
      .output(tagSchema)
      .handler(async ({ input }) => {
        try {
          return await createTag(input)
        } catch (error) {
          return mapTagError(error)
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
            v.minLength(1, "Tag name is required"),
          ),
          slug: v.optional(v.string()),
        }),
      )
      .output(tagSchema)
      .handler(async ({ input }) => {
        try {
          return await updateTag(input)
        } catch (error) {
          return mapTagError(error)
        }
      }),

    delete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(v.object({ id: v.string() }))
      .output(v.object({ success: v.boolean() }))
      .handler(async ({ input }) => {
        await deleteTag(input.id)
        return { success: true }
      }),

    bulkDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(v.object({ ids: v.array(v.string()) }))
      .output(v.object({ success: v.boolean(), count: v.number() }))
      .handler(({ input }) => deleteTags(input.ids)),

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
      .handler(({ input }) => updateTagStatus(input.ids, input.status)),
  },
}
