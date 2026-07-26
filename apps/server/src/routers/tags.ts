import { ORPCError } from "@orpc/server"
import { z } from "zod"

import { listTagSchema, tagSchema } from "db/schema/tags"
import {
  createTag,
  deleteTag,
  getTag,
  listTags,
  updateTag,
} from "db/services/tags"

import { os, requireAdminMiddleware } from "./orpc"

export const tagsRouter = {
  tagList: os
    .route({ method: "GET", path: "/tag/list" })
    .output(z.array(listTagSchema))
    .handler(() => listTags()),

  tagById: os
    .route({ method: "GET", path: "/tag/{id}" })
    .input(z.object({ id: z.string() }))
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

  tagCreate: os
    .route({ method: "POST", path: "/tag/create" })
    .use(requireAdminMiddleware)
    .input(z.object({ name: z.string().min(1, "Tag name is required").trim() }))
    .output(tagSchema)
    .handler(({ input }) => createTag(input)),

  tagUpdate: os
    .route({ method: "POST", path: "/tag/update" })
    .use(requireAdminMiddleware)
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").trim(),
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

  tagDelete: os
    .route({ method: "POST", path: "/tag/delete" })
    .use(requireAdminMiddleware)
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ input }) => {
      await deleteTag(input.id)
      return { success: true }
    }),
}
