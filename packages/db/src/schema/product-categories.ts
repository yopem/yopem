import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core"

export const productCategoriesTable = pgTable(
  "product_categories",
  {
    productId: text("product_id").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.productId, table.categoryId] }),
      productIdIdx: index("idx_product_categories_product_id").on(
        table.productId,
      ),
      categoryIdIdx: index("idx_product_categories_category_id").on(
        table.categoryId,
      ),
    }
  },
)

export type SelectProductCategory = typeof productCategoriesTable.$inferSelect
export type InsertProductCategory = typeof productCategoriesTable.$inferInsert
