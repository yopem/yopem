import { asc } from "drizzle-orm"

import { publicProcedure } from "@/lib/api/orpc"
import { categoriesTable } from "@/lib/db/schema"

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
}
