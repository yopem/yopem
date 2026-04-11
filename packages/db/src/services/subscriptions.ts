import { Result } from "better-result"
import { eq } from "drizzle-orm"

import type { InsertSubscription, SelectSubscription } from "../schema/index.ts"

import { DatabaseOperationError, NotFoundError } from "../errors.ts"
import { db } from "../index.ts"
import { subscriptionsTable } from "../schema/index.ts"

export const getSubscription = (
  userId: string,
): Promise<Result<SelectSubscription | null, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const [subscription] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, userId))

      return subscription ?? null
    },
    catch: (error) =>
      new DatabaseOperationError({
        operation: "select",
        table: "subscriptions",
        cause: error,
      }),
  })
}

export const getOrCreateSubscription = (
  userId: string,
): Promise<Result<SelectSubscription, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const existing = await getSubscription(userId)

      if (existing.isOk() && existing.value) {
        return existing.value
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
    },
    catch: (error) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "subscriptions",
        cause: error,
      }),
  })
}

export const createSubscription = (
  data: InsertSubscription,
): Promise<Result<SelectSubscription, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const [subscription] = await db
        .insert(subscriptionsTable)
        .values(data)
        .returning()

      if (!subscription) {
        throw new Error("Failed to create subscription")
      }

      return subscription
    },
    catch: (error) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "subscriptions",
        cause: error,
      }),
  })
}

export const updateSubscription = (
  userId: string,
  data: Partial<Omit<InsertSubscription, "id" | "userId">>,
): Promise<
  Result<SelectSubscription, DatabaseOperationError | NotFoundError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [subscription] = await db
        .update(subscriptionsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptionsTable.userId, userId))
        .returning()

      if (!subscription) {
        throw new NotFoundError({
          resource: "subscription",
          id: userId,
        })
      }

      return subscription
    },
    catch: (error) => {
      if (error instanceof NotFoundError) {
        return error
      }
      return new DatabaseOperationError({
        operation: "update",
        table: "subscriptions",
        cause: error,
      })
    },
  })
}

export const updateSubscriptionByPolarId = (
  polarSubscriptionId: string,
  data: Partial<Omit<InsertSubscription, "id">>,
): Promise<
  Result<SelectSubscription, DatabaseOperationError | NotFoundError>
> => {
  return Result.tryPromise({
    try: async () => {
      const [subscription] = await db
        .update(subscriptionsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(subscriptionsTable.polarSubscriptionId, polarSubscriptionId))
        .returning()

      if (!subscription) {
        throw new NotFoundError({
          resource: "subscription",
          id: polarSubscriptionId,
        })
      }

      return subscription
    },
    catch: (error) => {
      if (error instanceof NotFoundError) {
        return error
      }
      return new DatabaseOperationError({
        operation: "update",
        table: "subscriptions",
        cause: error,
      })
    },
  })
}

export const cancelSubscription = (
  userId: string,
): Promise<
  Result<SelectSubscription, DatabaseOperationError | NotFoundError>
> => {
  return Result.tryPromise({
    try: async () => {
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
        throw new NotFoundError({
          resource: "subscription",
          id: userId,
        })
      }

      return subscription
    },
    catch: (error) => {
      if (error instanceof NotFoundError) {
        return error
      }
      return new DatabaseOperationError({
        operation: "update",
        table: "subscriptions",
        cause: error,
      })
    },
  })
}

export const expireSubscription = (
  userId: string,
): Promise<
  Result<SelectSubscription, DatabaseOperationError | NotFoundError>
> => {
  return Result.tryPromise({
    try: async () => {
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
        throw new NotFoundError({
          resource: "subscription",
          id: userId,
        })
      }

      return subscription
    },
    catch: (error) => {
      if (error instanceof NotFoundError) {
        return error
      }
      return new DatabaseOperationError({
        operation: "update",
        table: "subscriptions",
        cause: error,
      })
    },
  })
}

export const getSubscriptionsByStatus = (
  status: SelectSubscription["status"],
): Promise<Result<SelectSubscription[], DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      return db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.status, status))
    },
    catch: (error) =>
      new DatabaseOperationError({
        operation: "select",
        table: "subscriptions",
        cause: error,
      }),
  })
}

export const getExpiringGrandfatheredSubscriptions = (
  _daysThreshold: number = 7,
): Promise<Result<SelectSubscription[], DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      return db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.source, "grandfathered"))
    },
    catch: (error) =>
      new DatabaseOperationError({
        operation: "select",
        table: "subscriptions",
        cause: error,
      }),
  })
}
