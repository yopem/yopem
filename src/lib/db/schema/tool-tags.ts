import { pgTable, primaryKey, text } from "drizzle-orm/pg-core"

export const toolTagsTable = pgTable(
  "tool_tags",
  {
    toolId: text("tool_id").notNull(),
    tagId: text("tag_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.toolId, table.tagId] }),
    }
  },
)

export type SelectToolTag = typeof toolTagsTable.$inferSelect
export type InsertToolTag = typeof toolTagsTable.$inferInsert
