import { Result } from "better-result"
import { adminProcedure, publicProcedure } from "server/orpc"
import { z } from "zod"

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "db/services/categories"

import { handleProcedureError } from "./error-handler"
import {
  CategoryNotFoundError,
  CategoryValidationError,
} from "./procedure-errors"

export const categoriesRouter = {
  list: publicProcedure.handler(() => {
    return listCategories()
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await Result.tryPromise({
        try: async () => {
          return await createCategory({
            name: input.name,
            description: input.description,
          })
        },
        catch: (error) => {
          return new CategoryValidationError({
            message: `Failed to create category: ${error instanceof Error ? error.message : String(error)}`,
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
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await Result.gen(async function* () {
        const category = yield* Result.await(
          Result.tryPromise({
            try: async () => {
              const updated = await updateCategory({
                id: input.id,
                name: input.name,
                description: input.description,
              })
              if (!updated) {
                return Result.err(
                  new CategoryNotFoundError({ categoryId: input.id }),
                )
              }
              return Result.ok(updated)
            },
            catch: (error) => {
              return Result.err(
                new CategoryValidationError({
                  message: `Failed to update category: ${error instanceof Error ? error.message : String(error)}`,
                }),
              )
            },
          }),
        )

        return Result.ok(category)
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
          await deleteCategory(input.id)
          return { success: true }
        },
        catch: (error) => {
          return new CategoryValidationError({
            message: `Failed to delete category: ${error instanceof Error ? error.message : String(error)}`,
          })
        },
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),
}
