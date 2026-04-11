import { ORPCError } from "@orpc/server"
import { adminProcedure, publicProcedure } from "server/orpc"
import { z } from "zod"

import { insertTagSchema } from "db/schema"
import { createTag, deleteTag, listTags, updateTag } from "db/services/tags"

export const tagsRouter = {
  list: publicProcedure.handler(async () => {
    return await listTags()
  }),

  create: adminProcedure
    .input(
      insertTagSchema.pick({ name: true }).extend({
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ input }) => {
      try {
        return await createTag({ name: input.name })
      } catch (error) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to create tag: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ input }) => {
      try {
        const updated = await updateTag({
          id: input.id,
          name: input.name,
        })
        if (!updated) {
          throw new ORPCError("NOT_FOUND", {
            message: `Tag not found: ${input.id}`,
          })
        }
        return updated
      } catch (error) {
        if (error instanceof ORPCError) throw error
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to update tag: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      try {
        await deleteTag(input.id)
        return { success: true }
      } catch (error) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`,
        })
      }
    }),
}
