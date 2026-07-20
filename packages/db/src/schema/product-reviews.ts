import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "utils/custom-id"

export const productReviewsTable = pgTable(
  "product_reviews",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    productId: text("product_id").notNull(),
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    rating: integer("rating").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      productUserUnique: uniqueIndex("product_reviews_product_user_unique").on(
        table.productId,
        table.userId,
      ),
    }
  },
)

export const insertProductReviewSchema = createInsertSchema(productReviewsTable)
export const updateProductReviewSchema = createUpdateSchema(productReviewsTable)

export type SelectProductReview = typeof productReviewsTable.$inferSelect
export type InsertProductReview = typeof productReviewsTable.$inferInsert
