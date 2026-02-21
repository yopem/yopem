import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core"

export const toolCategoriesTable = pgTable(
  "tool_categories",
  {
    toolId: text("tool_id").notNull(),
    categoryId: text("category_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.toolId, table.categoryId] }),
      toolIdIdx: index("idx_tool_categories_tool_id").on(table.toolId),
      categoryIdIdx: index("idx_tool_categories_category_id").on(
        table.categoryId,
      ),
    }
  },
)

export type SelectToolCategory = typeof toolCategoriesTable.$inferSelect
export type InsertToolCategory = typeof toolCategoriesTable.$inferInsert
