import { desc, eq, sql } from "drizzle-orm"

import { db } from "db"
import type { SelectUserSettings } from "db/schema"
import { productRunsTable, productsTable, userSettingsTable } from "db/schema"
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
  const [runsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productRunsTable)
    .where(eq(productRunsTable.userId, userId))

  return {
    balance: "0",
    overflowBalance: "0",
    totalUsed: "0",
    totalPurchased: "0",
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
