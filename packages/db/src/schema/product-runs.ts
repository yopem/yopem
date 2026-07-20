import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "utils/custom-id"

export const productRunStatusEnum = ["running", "completed", "failed"] as const
export type ProductRunStatus = (typeof productRunStatusEnum)[number]

export const productRunsTable = pgTable(
  "product_runs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    productId: text("product_id").notNull(),
    userId: text("user_id").notNull(),
    versionId: text("version_id"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
    status: text("status", { enum: productRunStatusEnum })
      .default("running")
      .notNull(),
    errorMessage: text("error_message"),
    tokensUsed: integer("tokens_used"),
    cost: decimal("cost", { precision: 10, scale: 4 }),
    duration: integer("duration"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => {
    return {
      userIdIdx: index("idx_product_runs_user_id").on(table.userId),
      createdAtIdx: index("idx_product_runs_created_at").on(table.createdAt),
      userIdCreatedAtIdx: index("idx_product_runs_user_id_created_at").on(
        table.userId,
        table.createdAt,
      ),
    }
  },
)

export const insertProductRunSchema = createInsertSchema(productRunsTable)
export const updateProductRunSchema = createUpdateSchema(productRunsTable)

export type SelectProductRun = typeof productRunsTable.$inferSelect
export type InsertProductRun = typeof productRunsTable.$inferInsert
