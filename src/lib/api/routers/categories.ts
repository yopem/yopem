import { asc, eq } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure, publicProcedure } from "@/lib/api/orpc"
import { categoriesTable, insertCategorySchema } from "@/lib/db/schema"
import { generateUniqueCategorySlug } from "@/lib/utils/slug"

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
