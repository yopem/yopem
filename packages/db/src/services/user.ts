import { createCustomId } from "@repo/utils/custom-id"
import { desc, eq, sql } from "drizzle-orm"

import { db } from "../index"
import {
  creditTransactionsTable,
  polarCheckoutSessionsTable,
  polarPaymentsTable,
  toolRunsTable,
  toolsTable,
  userCreditsTable,
  userSettingsTable,
} from "../schema"
import type { InsertUserSettings } from "../schema/user-settings"

export const getUserStats = async (userId: string) => {
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
}

export const getUserRuns = async (
  userId: string,
  input: { limit: number; cursor?: string },
) => {
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
}

export const getUserCredits = async (userId: string) => {
  const [credits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  return credits ?? null
}

export const getUserTransactions = (
  userId: string,
  input: { limit: number; cursor?: string },
) => {
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
}

export const getUserSettings = async (userId: string) => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId))

  return settings
}

export const upsertUserSettings = async (
  userId: string,
  data: Partial<InsertUserSettings>,
) => {
  const existing = await getUserSettings(userId)

  if (existing) {
    const [updated] = await db
      .update(userSettingsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(userSettingsTable)
    .values({ id: createCustomId(), userId, ...data })
    .returning()

  return created
}

export const upsertPolarCustomer = (
  userId: string,
  polarCustomerId: string,
) => {
  return upsertUserSettings(userId, { polarCustomerId })
}

export const insertCheckoutSession = async (data: {
  userId: string
  checkoutId: string
  productId: string
  checkoutUrl: string
  amount: string
}) => {
  const [session] = await db
    .insert(polarCheckoutSessionsTable)
    .values(data)
    .returning()

  return session
}

export const updateAutoTopup = async (
  userId: string,
  settings: {
    enabled: boolean
    threshold?: number | null
    amount?: number | null
  },
) => {
  const existing = await getUserCredits(userId)

  if (existing) {
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
  } else {
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
  }
}

export const getPaymentHistory = (
  userId: string,
  input: { limit: number; cursor?: string },
) => {
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
}

export const getPendingCheckouts = (userId: string) => {
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
    .where(eq(polarCheckoutSessionsTable.userId, userId))
    .orderBy(desc(polarCheckoutSessionsTable.createdAt))
    .limit(10)
}

export const initUserCredits = async (userId: string) => {
  const existing = await getUserCredits(userId)
  if (existing) return existing

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

  return created
}

export const deductCreditsForRun = async (
  userId: string,
  cost: number,
  toolRunId: string,
  toolName: string,
) => {
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
}

export const addCredits = async (userId: string, amount: number) => {
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
}
