import { createCustomId } from "@repo/utils/custom-id"
import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const polarPaymentStatusEnum = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
] as const
export type PolarPaymentStatus = (typeof polarPaymentStatusEnum)[number]

export const polarPaymentsTable = pgTable(
  "polar_payments",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    userId: text("user_id").notNull(),
    userName: text("user_name"),
    polarPaymentId: text("polar_payment_id").notNull().unique(),
    polarCustomerId: text("polar_customer_id"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status", { enum: polarPaymentStatusEnum }).notNull(),
    productId: text("product_id").notNull(),
    creditsGranted: integer("credits_granted").notNull().default(0),
    refundedAmount: decimal("refunded_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_polar_payments_user_id").on(table.userId),
    polarPaymentIdIdx: index("idx_polar_payments_polar_payment_id").on(
      table.polarPaymentId,
    ),
  }),
)

export const insertPolarPaymentSchema = createInsertSchema(polarPaymentsTable)
export const updatePolarPaymentSchema = createUpdateSchema(polarPaymentsTable)

export type SelectPolarPayment = typeof polarPaymentsTable.$inferSelect
export type InsertPolarPayment = typeof polarPaymentsTable.$inferInsert
