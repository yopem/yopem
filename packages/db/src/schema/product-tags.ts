import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core"

export const productTagsTable = pgTable(
  "product_tags",
  {
    productId: text("product_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.productId, table.tagId] }),
      productIdIdx: index("idx_product_tags_product_id").on(table.productId),
      tagIdIdx: index("idx_product_tags_tag_id").on(table.tagId),
    }
  },
)

export type SelectProductTag = typeof productTagsTable.$inferSelect
export type InsertProductTag = typeof productTagsTable.$inferInsert
