import { categoriesTable, insertCategorySchema } from "@repo/db/schema"
import { adminProcedure, publicProcedure } from "@repo/server/orpc"
import { generateUniqueCategorySlug } from "@repo/utils/slug"
import { asc, eq } from "drizzle-orm"
import { z } from "zod"

export const categoriesRouter = {
  list: publicProcedure.handler(async ({ context }) => {
    const categories = await context.db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
      })
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name))

    return categories
  }),

  create: adminProcedure
    .input(
      insertCategorySchema.pick({ name: true, description: true }).extend({
        name: z.string().min(1, "Category name is required").trim(),
      }),
    )
    .handler(async ({ context, input }) => {
      const slug = await generateUniqueCategorySlug(input.name)

      const [category] = await context.db
        .insert(categoriesTable)
        .values({
          name: input.name,
          slug,
          description: input.description,
        })
        .returning()

      return category
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Category name is required").trim(),
        description: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const slug = await generateUniqueCategorySlug(input.name, input.id)

      const [category] = await context.db
        .update(categoriesTable)
        .set({
          name: input.name,
          slug,
          description: input.description,
        })
        .where(eq(categoriesTable.id, input.id))
        .returning()

      return category
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      await context.db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, input.id))

      return { success: true }
    }),
}
