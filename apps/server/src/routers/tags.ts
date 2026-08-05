import { ORPCError } from "@orpc/server"
import * as v from "valibot"

import { listTagSchema, tagSchema } from "db/schema/tags"
import {
  createTag,
  deleteTag,
  getTag,
  listTags,
  updateTag,
} from "db/services/tags"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

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
        }),
      )
      .output(tagSchema)
      .handler(({ input }) => createTag(input)),

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
        }),
      )
      .output(tagSchema)
      .handler(async ({ input }) => {
        try {
          return await updateTag(input)
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Update returned no rows"
          ) {
            throw new ORPCError("NOT_FOUND", {
              status: 404,
              message: "Tag not found",
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
        await deleteTag(input.id)
        return { success: true }
      }),
  },
}
