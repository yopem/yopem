import { Result } from "better-result"
import { adminProcedure, publicProcedure } from "server/orpc"
import { z } from "zod"

import { insertTagSchema } from "db/schema"
import { createTag, deleteTag, listTags, updateTag } from "db/services/tags"

import { handleProcedureError } from "./error-handler"
import { TagNotFoundError, TagValidationError } from "./procedure-errors"

export const tagsRouter = {
  list: publicProcedure.handler(async () => {
    const result = await listTags()

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  create: adminProcedure
    .input(
      insertTagSchema.pick({ name: true }).extend({
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await Result.tryPromise({
        try: async () => {
          return await createTag({ name: input.name })
        },
        catch: (error) => {
          return new TagValidationError({
            message: `Failed to create tag: ${error instanceof Error ? error.message : String(error)}`,
          })
        },
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await Result.gen(async function* () {
        const tag = yield* Result.await(
          Result.tryPromise({
            try: async () => {
              const updated = await updateTag({
                id: input.id,
                name: input.name,
              })
              if (!updated) {
                return Result.err(new TagNotFoundError({ tagId: input.id }))
              }
              return Result.ok(updated)
            },
            catch: (error) => {
              return Result.err(
                new TagValidationError({
                  message: `Failed to update tag: ${error instanceof Error ? error.message : String(error)}`,
                }),
              )
            },
          }),
        )

        return Result.ok(tag)
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await Result.tryPromise({
        try: async () => {
          await deleteTag(input.id)
          return { success: true }
        },
        catch: (error) => {
          return new TagValidationError({
            message: `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`,
          })
        },
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),
}
