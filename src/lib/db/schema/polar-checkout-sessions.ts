import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const polarCheckoutSessionStatusEnum = [
  "pending",
  "completed",
  "expired",
] as const
export type PolarCheckoutSessionStatus =
  (typeof polarCheckoutSessionStatusEnum)[number]

export const polarCheckoutSessionsTable = pgTable(
  "polar_checkout_sessions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    userId: text("user_id").notNull(),
    checkoutId: text("checkout_id").notNull().unique(),
    productId: text("product_id").notNull(),
    status: text("status", { enum: polarCheckoutSessionStatusEnum })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_polar_checkout_sessions_user_id").on(table.userId),
    checkoutIdIdx: index("idx_polar_checkout_sessions_checkout_id").on(
      table.checkoutId,
    ),
  }),
)

export const insertPolarCheckoutSessionSchema = createInsertSchema(
  polarCheckoutSessionsTable,
)
export const updatePolarCheckoutSessionSchema = createUpdateSchema(
  polarCheckoutSessionsTable,
)

export type SelectPolarCheckoutSession =
  typeof polarCheckoutSessionsTable.$inferSelect
export type InsertPolarCheckoutSession =
  typeof polarCheckoutSessionsTable.$inferInsert
