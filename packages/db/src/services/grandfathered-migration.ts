import { eq, sql } from "drizzle-orm"

import type { subscriptionTierEnum } from "../schema/index.ts"

import { db } from "../index.ts"
import { subscriptionsTable, userCreditsTable } from "../schema/index.ts"

export interface GrandfatheredMigrationResult {
  migratedCount: number
  failedCount: number
  errors: { userId: string; error: string }[]
}

const PRO_TIER_THRESHOLD = 500
const ENTERPRISE_TIER_THRESHOLD = 2000

type SubscriptionTier = (typeof subscriptionTierEnum.enumValues)[number]

const determineGrandfatheredTier = (balance: number): SubscriptionTier => {
  if (balance >= ENTERPRISE_TIER_THRESHOLD) {
    return "enterprise"
  }
  if (balance >= PRO_TIER_THRESHOLD) {
    return "pro"
  }
  return "free"
}

const calculateRemainingMonths = (balance: number): number => {
  const estimatedMonthlyUsage = balance > 1000 ? 500 : 100
  const months = Math.ceil(balance / estimatedMonthlyUsage)
  return Math.max(1, Math.min(months, 12))
}

export const migrateExistingCreditsToSubscriptions =
  async (): Promise<GrandfatheredMigrationResult> => {
    const errors: { userId: string; error: string }[] = []
    let migratedCount = 0
    let failedCount = 0

    const usersWithCredits = await db
      .select({
        userId: userCreditsTable.userId,
        balance: userCreditsTable.balance,
      })
      .from(userCreditsTable)
      .where(sql`${userCreditsTable.balance} > 0`)

    for (const user of usersWithCredits) {
      try {
        const balance = Number.parseFloat(user.balance)
        const tier = determineGrandfatheredTier(balance)
        const expiresAt = new Date()
        expiresAt.setMonth(
          expiresAt.getMonth() + calculateRemainingMonths(balance),
        )

        const [existingSub] = await db
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.userId, user.userId))
          .limit(1)

        if (existingSub) {
          await db
            .update(subscriptionsTable)
            .set({
              tier,
              status: "active",
              source: "grandfathered",
              currentPeriodEnd: expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.id, existingSub.id))
        } else {
          await db.insert(subscriptionsTable).values({
            userId: user.userId,
            tier,
            status: "active",
            source: "grandfathered",
            currentPeriodStart: new Date(),
            currentPeriodEnd: expiresAt,
          })
        }

        await db
          .update(userCreditsTable)
          .set({
            balance: "0",
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, user.userId))

        migratedCount++
      } catch (e) {
        failedCount++
        errors.push({
          userId: user.userId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return {
      migratedCount,
      failedCount,
      errors,
    }
  }

export const migrateSingleUser = async (
  userId: string,
): Promise<{ tier: SubscriptionTier; expiresAt: Date }> => {
  const [userCredits] = await db
    .select({
      balance: userCreditsTable.balance,
    })
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  if (!userCredits) {
    throw new Error("User credits not found")
  }

  const balance = Number.parseFloat(userCredits.balance)
  if (balance <= 0) {
    throw new Error("No credits to migrate")
  }

  const tier = determineGrandfatheredTier(balance)
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + calculateRemainingMonths(balance))

  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1)

  if (existingSub) {
    await db
      .update(subscriptionsTable)
      .set({
        tier,
        status: "active",
        source: "grandfathered",
        currentPeriodEnd: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.id, existingSub.id))
  } else {
    await db.insert(subscriptionsTable).values({
      userId,
      tier,
      status: "active",
      source: "grandfathered",
      currentPeriodStart: new Date(),
      currentPeriodEnd: expiresAt,
    })
  }

  await db
    .update(userCreditsTable)
    .set({
      balance: "0",
      updatedAt: new Date(),
    })
    .where(eq(userCreditsTable.userId, userId))

  return { tier, expiresAt }
}
