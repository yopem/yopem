import { createCustomId } from "@repo/utils/custom-id"
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const toolReviewsTable = pgTable(
  "tool_reviews",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    toolId: text("tool_id").notNull(),
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    rating: integer("rating").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      toolUserUnique: uniqueIndex("tool_reviews_tool_user_unique").on(
        table.toolId,
        table.userId,
      ),
    }
  },
)

export const insertToolReviewSchema = createInsertSchema(toolReviewsTable)
export const updateToolReviewSchema = createUpdateSchema(toolReviewsTable)

export type SelectToolReview = typeof toolReviewsTable.$inferSelect
export type InsertToolReview = typeof toolReviewsTable.$inferInsert
