import { asc, eq } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure, publicProcedure } from "@/lib/api/orpc"
import { insertTagSchema, tagsTable } from "@/lib/db/schema"

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export const tagsRouter = {
  list: publicProcedure.handler(async ({ context }) => {
    const tags = await context.db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        slug: tagsTable.slug,
      })
      .from(tagsTable)
      .orderBy(asc(tagsTable.name))

    return tags
  }),

  create: adminProcedure
    .input(
      insertTagSchema.pick({ name: true }).extend({
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ context, input }) => {
      const slug = createSlug(input.name)

      const [tag] = await context.db
        .insert(tagsTable)
        .values({
          name: input.name,
          slug,
        })
        .returning()

      return tag
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Tag name is required").trim(),
      }),
    )
    .handler(async ({ context, input }) => {
      const slug = createSlug(input.name)

      const [tag] = await context.db
        .update(tagsTable)
        .set({
          name: input.name,
          slug,
        })
        .where(eq(tagsTable.id, input.id))
        .returning()

      return tag
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      await context.db.delete(tagsTable).where(eq(tagsTable.id, input.id))

      return { success: true }
    }),
}
