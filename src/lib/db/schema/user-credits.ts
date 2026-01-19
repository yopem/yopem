import { decimal, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserCreditsSchema = createInsertSchema(userCreditsTable)
export const updateUserCreditsSchema = createUpdateSchema(userCreditsTable)

export type SelectUserCredits = typeof userCreditsTable.$inferSelect
export type InsertUserCredits = typeof userCreditsTable.$inferInsert
