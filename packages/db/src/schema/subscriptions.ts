import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "shared/custom-id"

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "enterprise",
])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "expired",
])

export const subscriptionSourceEnum = pgEnum("subscription_source", [
  "polar",
  "grandfathered",
])

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    userId: text("user_id").notNull().unique(),
    polarSubscriptionId: text("polar_subscription_id").unique(),
    polarCustomerId: text("polar_customer_id"),
    tier: subscriptionTierEnum("tier").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    source: subscriptionSourceEnum("source").notNull().default("polar"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_subscriptions_user_id").on(table.userId),
    polarSubscriptionIdIdx: index("idx_subscriptions_polar_subscription_id").on(
      table.polarSubscriptionId,
    ),
    polarCustomerIdIdx: index("idx_subscriptions_polar_customer_id").on(
      table.polarCustomerId,
    ),
    tierIdx: index("idx_subscriptions_tier").on(table.tier),
    statusIdx: index("idx_subscriptions_status").on(table.status),
    currentPeriodEndIdx: index("idx_subscriptions_current_period_end").on(
      table.currentPeriodEnd,
    ),
    createdAtIdx: index("idx_subscriptions_created_at").on(table.createdAt),
  }),
)

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable)
export const updateSubscriptionSchema = createUpdateSchema(subscriptionsTable)

export type SelectSubscription = typeof subscriptionsTable.$inferSelect
export type InsertSubscription = typeof subscriptionsTable.$inferInsert
