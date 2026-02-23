import { insertTagSchema } from "@repo/db/schema"
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from "@repo/db/services/tags"
import { adminProcedure, publicProcedure } from "@repo/server/orpc"
import { z } from "zod"

export const tagsRouter = {
  list: publicProcedure.handler(() => {
    return listTags()
  }),

  create: adminProcedure
    .input(
      insertTagSchema.pick({ name: true }).extend({
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(({ input }) => {
      return createTag({ name: input.name })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(({ input }) => {
      return updateTag({
        id: input.id,
        name: input.name,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteTag(input.id)

      return { success: true }
    }),
}
