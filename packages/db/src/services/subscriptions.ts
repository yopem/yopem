import { eq } from "drizzle-orm"

import type { InsertSubscription, SelectSubscription } from "../schema/index.ts"

import { db } from "../index.ts"
import { subscriptionsTable } from "../schema/index.ts"

export const getSubscription = async (
  userId: string,
): Promise<SelectSubscription | null> => {
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))

  return subscription ?? null
}

export const getOrCreateSubscription = async (
  userId: string,
): Promise<SelectSubscription> => {
  const existing = await getSubscription(userId)

  if (existing) {
    return existing
  }

  const [subscription] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      tier: "free",
      status: "active",
      source: "polar",
    })
    .returning()

  if (!subscription) {
    throw new Error("Failed to create subscription")
  }

  return subscription
}

export const createSubscription = async (
  data: InsertSubscription,
): Promise<SelectSubscription> => {
  const [subscription] = await db
    .insert(subscriptionsTable)
    .values(data)
    .returning()

  if (!subscription) {
    throw new Error("Failed to create subscription")
  }

  return subscription
}

export const updateSubscription = async (
  userId: string,
  data: Partial<Omit<InsertSubscription, "id" | "userId">>,
): Promise<SelectSubscription> => {
  const [subscription] = await db
    .update(subscriptionsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptionsTable.userId, userId))
    .returning()

  if (!subscription) {
    throw new Error(`Subscription not found for user ${userId}`)
  }

  return subscription
}

export const updateSubscriptionByPolarId = async (
  polarSubscriptionId: string,
  data: Partial<Omit<InsertSubscription, "id">>,
): Promise<SelectSubscription> => {
  const [subscription] = await db
    .update(subscriptionsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptionsTable.polarSubscriptionId, polarSubscriptionId))
    .returning()

  if (!subscription) {
    throw new Error(
      `Subscription not found for polar id ${polarSubscriptionId}`,
    )
  }

  return subscription
}

export const cancelSubscription = async (
  userId: string,
): Promise<SelectSubscription> => {
  const [subscription] = await db
    .update(subscriptionsTable)
    .set({
      status: "cancelled",
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId))
    .returning()

  if (!subscription) {
    throw new Error(`Subscription not found for user ${userId}`)
  }

  return subscription
}

export const expireSubscription = async (
  userId: string,
): Promise<SelectSubscription> => {
  const [subscription] = await db
    .update(subscriptionsTable)
    .set({
      status: "expired",
      tier: "free",
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId))
    .returning()

  if (!subscription) {
    throw new Error(`Subscription not found for user ${userId}`)
  }

  return subscription
}

export const getSubscriptionsByStatus = (
  status: SelectSubscription["status"],
): Promise<SelectSubscription[]> => {
  return db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.status, status))
}

export const getExpiringGrandfatheredSubscriptions = (
  _daysThreshold = 7,
): Promise<SelectSubscription[]> => {
  return db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.source, "grandfathered"))
}
