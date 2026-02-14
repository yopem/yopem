import { decimal, index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const creditTransactionTypeEnum = [
  "purchase",
  "usage",
  "refund",
  "bonus",
] as const
export type CreditTransactionType = (typeof creditTransactionTypeEnum)[number]

export const creditTransactionsTable = pgTable(
  "credit_transactions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    userId: text("user_id").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    type: text("type", { enum: creditTransactionTypeEnum }).notNull(),
    description: text("description"),
    toolRunId: text("tool_run_id"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_credit_transactions_user_id").on(table.userId),
  }),
)

export const insertCreditTransactionSchema = createInsertSchema(
  creditTransactionsTable,
)
export const updateCreditTransactionSchema = createUpdateSchema(
  creditTransactionsTable,
)

export type SelectCreditTransaction =
  typeof creditTransactionsTable.$inferSelect
export type InsertCreditTransaction =
  typeof creditTransactionsTable.$inferInsert
