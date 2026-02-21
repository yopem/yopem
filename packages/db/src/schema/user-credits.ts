import { createCustomId } from "@repo/utils/custom-id"
import { boolean, decimal, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const userCreditsTable = pgTable("user_credits", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  userId: text("user_id").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  totalPurchased: decimal("total_purchased", {
    precision: 10,
    scale: 2,
  }).default("0"),
  totalUsed: decimal("total_used", { precision: 10, scale: 2 }).default("0"),
  lastResetAt: timestamp("last_reset_at"),
  autoTopupEnabled: boolean("auto_topup_enabled").default(false).notNull(),
  autoTopupThreshold: decimal("auto_topup_threshold", {
    precision: 10,
    scale: 2,
  }),
  autoTopupAmount: decimal("auto_topup_amount", {
    precision: 10,
    scale: 2,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserCreditsSchema = createInsertSchema(userCreditsTable)
export const updateUserCreditsSchema = createUpdateSchema(userCreditsTable)

export type SelectUserCredits = typeof userCreditsTable.$inferSelect
export type InsertUserCredits = typeof userCreditsTable.$inferInsert
