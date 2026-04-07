import { Result } from "better-result"
import { and, desc, eq, gt, sql } from "drizzle-orm"

import { createCustomId } from "shared/custom-id"

import type {
  SelectPolarCheckoutSession,
  SelectUserCredits,
  SelectUserSettings,
} from "../schema/index.ts"
import type { InsertUserSettings } from "../schema/user-settings.ts"

import { DatabaseOperationError, NotFoundError } from "../errors.ts"
import { db } from "../index.ts"
import {
  creditTransactionsTable,
  polarCheckoutSessionsTable,
  polarPaymentsTable,
  toolRunsTable,
  toolsTable,
  userCreditsTable,
  userSettingsTable,
} from "../schema/index.ts"

export const getUserStats = (
  userId: string,
): Promise<
  Result<
    {
      balance: string
      totalUsed: string | null
      totalPurchased: string | null
      totalRuns: number
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const [credits] = await db
        .select({
          balance: userCreditsTable.balance,
          totalUsed: userCreditsTable.totalUsed,
          totalPurchased: userCreditsTable.totalPurchased,
        })
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, userId))

      const [runsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(toolRunsTable)
        .where(eq(toolRunsTable.userId, userId))

      return {
        balance: credits ? credits.balance : "0",
        totalUsed: credits ? credits.totalUsed : "0",
        totalPurchased: credits ? credits.totalPurchased : "0",
        totalRuns: Number(runsResult ? runsResult.count : 0),
      }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "user_credits",
        cause: e,
      }),
  })
}

export const getUserRuns = (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<
  Result<
    {
      runs: {
        id: string
        toolId: string
        status: string | null
        cost: string | null
        createdAt: Date | null
        toolName: string | null
      }[]
      nextCursor?: string
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const runs = await db
        .select({
          id: toolRunsTable.id,
          toolId: toolRunsTable.toolId,
          status: toolRunsTable.status,
          cost: toolRunsTable.cost,
          createdAt: toolRunsTable.createdAt,
          toolName: toolsTable.name,
        })
        .from(toolRunsTable)
        .leftJoin(toolsTable, eq(toolRunsTable.toolId, toolsTable.id))
        .where(eq(toolRunsTable.userId, userId))
        .orderBy(desc(toolRunsTable.createdAt))
        .limit(input.limit + 1)

      let nextCursor: string | undefined = undefined
      if (runs.length > input.limit) {
        const nextItem = runs.pop()
        nextCursor = nextItem?.id
      }

      return { runs, nextCursor }
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_runs",
        cause: e,
      }),
  })
}

export const getUserCredits = async (
  userId: string,
): Promise<Result<SelectUserCredits, NotFoundError>> => {
  const [credits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  if (!credits) {
    return Result.err(
      new NotFoundError({ resource: "UserCredits", id: userId }),
    )
  }

  return Result.ok(credits)
}

export const getUserTransactions = (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<
  Result<
    {
      id: string
      amount: string
      type: string
      description: string | null
      createdAt: Date | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: () => {
      return db
        .select({
          id: creditTransactionsTable.id,
          amount: creditTransactionsTable.amount,
          type: creditTransactionsTable.type,
          description: creditTransactionsTable.description,
          createdAt: creditTransactionsTable.createdAt,
        })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.userId, userId))
        .orderBy(desc(creditTransactionsTable.createdAt))
        .limit(input.limit)
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "credit_transactions",
        cause: e,
      }),
  })
}

export const getUserSettings = async (
  userId: string,
): Promise<Result<SelectUserSettings, NotFoundError>> => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId))

  if (!settings) {
    return Result.err(
      new NotFoundError({ resource: "UserSettings", id: userId }),
    )
  }

  return Result.ok(settings)
}

export const upsertUserSettings = async (
  userId: string,
  data: Partial<InsertUserSettings>,
): Promise<Result<SelectUserSettings, DatabaseOperationError>> => {
  const creditsResult = await getUserCredits(userId)

  if (creditsResult.isOk()) {
    const [updated] = await db
      .update(userSettingsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId))
      .returning()

    if (!updated) {
      return Result.err(
        new DatabaseOperationError({
          operation: "update",
          table: "user_settings",
          cause: new Error("Update returned no rows"),
        }),
      )
    }

    return Result.ok(updated)
  }

  const [created] = await db
    .insert(userSettingsTable)
    .values({ id: createCustomId(), userId, ...data })
    .returning()

  if (!created) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "user_settings",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(created)
}

export const upsertPolarCustomer = (
  userId: string,
  polarCustomerId: string,
): Promise<Result<SelectUserSettings, DatabaseOperationError>> => {
  return upsertUserSettings(userId, { polarCustomerId })
}

export const insertCheckoutSession = async (data: {
  userId: string
  checkoutId: string
  productId: string
  checkoutUrl: string
  amount: string
}): Promise<Result<SelectPolarCheckoutSession, DatabaseOperationError>> => {
  const [session] = await db
    .insert(polarCheckoutSessionsTable)
    .values(data)
    .returning()

  if (!session) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "polar_checkout_sessions",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(session)
}

export const updateAutoTopup = async (
  userId: string,
  settings: {
    enabled: boolean
    threshold?: number | null
    amount?: number | null
  },
): Promise<Result<void, DatabaseOperationError>> => {
  const creditsResult = await getUserCredits(userId)

  if (creditsResult.isOk()) {
    return Result.tryPromise({
      try: async () => {
        await db
          .update(userCreditsTable)
          .set({
            autoTopupEnabled: settings.enabled,
            autoTopupThreshold: settings.threshold
              ? String(settings.threshold)
              : null,
            autoTopupAmount: settings.amount ? String(settings.amount) : null,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, userId))
      },
      catch: (e) =>
        new DatabaseOperationError({
          operation: "update",
          table: "user_credits",
          cause: e,
        }),
    })
  }

  return Result.tryPromise({
    try: async () => {
      await db.insert(userCreditsTable).values({
        id: createCustomId(),
        userId,
        balance: "0",
        totalPurchased: "0",
        totalUsed: "0",
        autoTopupEnabled: settings.enabled,
        autoTopupThreshold: settings.threshold
          ? String(settings.threshold)
          : null,
        autoTopupAmount: settings.amount ? String(settings.amount) : null,
      })
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "user_credits",
        cause: e,
      }),
  })
}

export const getPaymentHistory = (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<
  Result<
    {
      id: string
      polarPaymentId: string | null
      amount: string
      currency: string
      status: string
      productId: string
      creditsGranted: number
      refundedAmount: string | null
      createdAt: Date | null
      updatedAt: Date | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: () => {
      return db
        .select({
          id: polarPaymentsTable.id,
          polarPaymentId: polarPaymentsTable.polarPaymentId,
          amount: polarPaymentsTable.amount,
          currency: polarPaymentsTable.currency,
          status: polarPaymentsTable.status,
          productId: polarPaymentsTable.productId,
          creditsGranted: polarPaymentsTable.creditsGranted,
          refundedAmount: polarPaymentsTable.refundedAmount,
          createdAt: polarPaymentsTable.createdAt,
          updatedAt: polarPaymentsTable.updatedAt,
        })
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.userId, userId))
        .orderBy(desc(polarPaymentsTable.createdAt))
        .limit(input.limit)
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "polar_payments",
        cause: e,
      }),
  })
}

export const getPendingCheckouts = (
  userId: string,
): Promise<
  Result<
    {
      id: string
      checkoutId: string
      productId: string
      checkoutUrl: string
      amount: string
      status: string
      createdAt: Date | null
    }[],
    DatabaseOperationError
  >
> => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return Result.tryPromise({
    try: () => {
      return db
        .select({
          id: polarCheckoutSessionsTable.id,
          checkoutId: polarCheckoutSessionsTable.checkoutId,
          productId: polarCheckoutSessionsTable.productId,
          checkoutUrl: polarCheckoutSessionsTable.checkoutUrl,
          amount: polarCheckoutSessionsTable.amount,
          status: polarCheckoutSessionsTable.status,
          createdAt: polarCheckoutSessionsTable.createdAt,
        })
        .from(polarCheckoutSessionsTable)
        .where(
          and(
            eq(polarCheckoutSessionsTable.userId, userId),
            eq(polarCheckoutSessionsTable.status, "pending"),
            gt(polarCheckoutSessionsTable.createdAt, oneDayAgo),
          ),
        )
        .orderBy(desc(polarCheckoutSessionsTable.createdAt))
        .limit(10)
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "polar_checkout_sessions",
        cause: e,
      }),
  })
}

export const initUserCredits = async (
  userId: string,
): Promise<Result<SelectUserCredits, DatabaseOperationError>> => {
  const creditsResult = await getUserCredits(userId)
  if (creditsResult.isOk()) {
    return Result.ok(creditsResult.value)
  }

  const [created] = await db
    .insert(userCreditsTable)
    .values({
      id: createCustomId(),
      userId,
      balance: "100",
      totalPurchased: "0",
      totalUsed: "0",
    })
    .returning()

  if (!created) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "user_credits",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(created)
}

export const deductCreditsForRun = (
  userId: string,
  cost: number,
  toolRunId: string,
  toolName: string,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db
        .update(userCreditsTable)
        .set({
          balance: sql`${userCreditsTable.balance} - ${cost}`,
          totalUsed: sql`${userCreditsTable.totalUsed} + ${cost}`,
          updatedAt: new Date(),
        })
        .where(eq(userCreditsTable.userId, userId))

      await db.insert(creditTransactionsTable).values({
        id: createCustomId(),
        userId,
        amount: String(-cost),
        type: "usage" as const,
        description: `Tool execution: ${toolName}`,
        toolRunId,
      })
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "user_credits",
        cause: e,
      }),
  })
}

export const addCredits = (
  userId: string,
  amount: number,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(userCreditsTable)
          .where(eq(userCreditsTable.userId, userId))

        if (existing) {
          await tx
            .update(userCreditsTable)
            .set({
              balance: sql`${userCreditsTable.balance} + ${amount}`,
              totalPurchased: sql`${userCreditsTable.totalPurchased} + ${amount}`,
              updatedAt: new Date(),
            })
            .where(eq(userCreditsTable.userId, userId))
        } else {
          await tx.insert(userCreditsTable).values({
            id: createCustomId(),
            userId,
            balance: String(amount),
            totalPurchased: String(amount),
            totalUsed: "0",
          })
        }

        await tx.insert(creditTransactionsTable).values({
          id: createCustomId(),
          userId,
          amount: String(amount),
          type: "purchase",
          description: `Purchased ${amount} credits`,
        })
      })
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "update",
        table: "user_credits",
        cause: e,
      }),
  })
}
