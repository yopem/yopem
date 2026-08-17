import * as v from "valibot"

import { isSlugAvailable } from "db/services/slug"
import { slugify } from "utils/slug"

import { os } from "./orpc"

export const slugsRouter = {
  slugs: {
    check: os
      .route({ method: "GET" })
      .input(
        v.object({
          entity: v.picklist(["product", "category", "tag"] as const),
          slug: v.string(),
          excludeId: v.optional(v.string()),
        }),
      )
      .output(v.object({ available: v.boolean() }))
      .handler(async ({ input }) => {
        const slug = slugify(input.slug)
        const available = await isSlugAvailable(
          input.entity,
          slug,
          input.excludeId,
        )
        return { available }
      }),
  },
}
