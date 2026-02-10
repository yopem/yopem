import { asc } from "drizzle-orm"

import { publicProcedure } from "@/lib/api/orpc"
import { tagsTable } from "@/lib/db/schema"

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
}
