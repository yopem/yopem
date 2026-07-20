import { and, desc, eq, gt, sql } from "drizzle-orm"

import { db } from "db"
import type {
  SelectPolarCheckoutSession,
  SelectUserCredits,
  SelectUserSettings,
} from "db/schema"
import {
  creditTransactionsTable,
  polarCheckoutSessionsTable,
  polarPaymentsTable,
  productRunsTable,
  productsTable,
  userCreditsTable,
  userSettingsTable,
} from "db/schema"
import type { InsertUserSettings } from "db/schema/user-settings"
import { createCustomId } from "utils/custom-id"

export const getUserStats = async (
  userId: string,
): Promise<{
  balance: string
  overflowBalance: string
  totalUsed: string | null
  totalPurchased: string | null
  totalRuns: number
}> => {
  const [credits] = await db
    .select({
      balance: userCreditsTable.balance,
      overflowBalance: userCreditsTable.overflowBalance,
      totalUsed: userCreditsTable.totalUsed,
      totalPurchased: userCreditsTable.totalPurchased,
    })
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  const [runsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productRunsTable)
    .where(eq(productRunsTable.userId, userId))

  return {
    balance: credits ? credits.balance : "0",
    overflowBalance: credits ? credits.overflowBalance : "0",
    totalUsed: credits ? credits.totalUsed : "0",
    totalPurchased: credits ? credits.totalPurchased : "0",
    totalRuns: Number(runsResult ? runsResult.count : 0),
  }
}

export const getUserRuns = async (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<{
  runs: {
    id: string
    productId: string
    status: string | null
    cost: string | null
    createdAt: Date | null
    productName: string | null
  }[]
  nextCursor?: string
}> => {
  const runs = await db
    .select({
      id: productRunsTable.id,
      productId: productRunsTable.productId,
      status: productRunsTable.status,
      cost: productRunsTable.cost,
      createdAt: productRunsTable.createdAt,
      productName: productsTable.name,
    })
    .from(productRunsTable)
    .leftJoin(productsTable, eq(productRunsTable.productId, productsTable.id))
    .where(eq(productRunsTable.userId, userId))
    .orderBy(desc(productRunsTable.createdAt))
    .limit(input.limit + 1)

  let nextCursor: string | undefined = undefined
  if (runs.length > input.limit) {
    const nextItem = runs.pop()
    nextCursor = nextItem?.id
  }

  return { runs, nextCursor }
}

export const getUserCredits = async (
  userId: string,
): Promise<SelectUserCredits | null> => {
  const [credits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  return credits ?? null
}

export const getUserTransactions = (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<
  {
    id: string
    amount: string
    type: string
    description: string | null
    createdAt: Date | null
  }[]
> => {
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

export const getUserSettings = async (
  userId: string,
): Promise<SelectUserSettings | null> => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId))

  return settings ?? null
}

export const upsertUserSettings = async (
  userId: string,
  data: Partial<InsertUserSettings>,
): Promise<SelectUserSettings> => {
  const existing = await getUserSettings(userId)

  if (existing) {
    const [updated] = await db
      .update(userSettingsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettingsTable.userId, userId))
      .returning()

    if (!updated) {
      throw new Error("Update returned no rows")
    }

    return updated
  }

  const [created] = await db
    .insert(userSettingsTable)
    .values({ id: createCustomId(), userId, ...data })
    .returning()

  if (!created) {
    throw new Error("Insert returned no rows")
  }

  return created
}

export const upsertPolarCustomer = (
  userId: string,
  polarCustomerId: string,
): Promise<SelectUserSettings> => {
  return upsertUserSettings(userId, { polarCustomerId })
}

export const insertCheckoutSession = async (data: {
  userId: string
  checkoutId: string
  productId: string
  checkoutUrl: string
  amount: string
}): Promise<SelectPolarCheckoutSession> => {
  const [session] = await db
    .insert(polarCheckoutSessionsTable)
    .values(data)
    .returning()

  if (!session) {
    throw new Error("Insert returned no rows")
  }

  return session
}

export const getPaymentHistory = (
  userId: string,
  input: { limit: number; cursor?: string },
): Promise<
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
  }[]
> => {
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

export const getPendingCheckouts = (
  userId: string,
): Promise<
  {
    id: string
    checkoutId: string
    productId: string
    checkoutUrl: string
    amount: string
    status: string
    createdAt: Date | null
  }[]
> => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
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
}

export const initUserCredits = async (
  userId: string,
): Promise<SelectUserCredits> => {
  const creditsResult = await getUserCredits(userId)
  if (creditsResult) {
    return creditsResult
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
    throw new Error("Insert returned no rows")
  }

  return created
}

export const deductCreditsForRun = async (
  userId: string,
  cost: number,
  productRunId: string,
  productName: string,
): Promise<void> => {
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
    description: `Product execution: ${productName}`,
    productRunId,
  })
}

export const deductOverflowCredit = async (
  userId: string,
  productName: string,
  productRunId?: string,
): Promise<boolean> => {
  const result = await db
    .update(userCreditsTable)
    .set({
      overflowBalance: sql`${userCreditsTable.overflowBalance} - 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userCreditsTable.userId, userId),
        sql`${userCreditsTable.overflowBalance} > 0`,
      ),
    )

  if (result.rowCount === 0) {
    return false
  }

  await db.insert(creditTransactionsTable).values({
    id: createCustomId(),
    userId,
    amount: "-1",
    type: "overflow_usage",
    description: `Overflow usage: ${productName}`,
    productRunId: productRunId ?? null,
  })

  return true
}

export const addCredits = async (
  userId: string,
  amount: number,
): Promise<void> => {
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
