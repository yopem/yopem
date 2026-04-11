import { Result } from "better-result"
import { and, count, eq, gte, lt, sql } from "drizzle-orm"

import { db } from "../index.ts"
import { subscriptionsTable } from "../schema/index.ts"

export interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  cancelledSubscriptions: number
  pastDueSubscriptions: number
  expiredSubscriptions: number
  freeTierCount: number
  proTierCount: number
  enterpriseTierCount: number
  polarSourceCount: number
  grandfatheredSourceCount: number
  newThisMonth: number
  cancelingThisMonth: number
}

export const getSubscriptionStats = async (): Promise<
  Result<SubscriptionStats, Error>
> => {
  return Result.tryPromise({
    try: async () => {
      const [
        totalResult,
        activeResult,
        cancelledResult,
        pastDueResult,
        expiredResult,
        freeResult,
        proResult,
        enterpriseResult,
        polarResult,
        grandfatheredResult,
        newThisMonthResult,
        cancelingResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(subscriptionsTable),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.status, "active")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.status, "cancelled")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.status, "past_due")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.status, "expired")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.tier, "free")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.tier, "pro")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.tier, "enterprise")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.source, "polar")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.source, "grandfathered")),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(
            gte(subscriptionsTable.createdAt, sql`DATE_TRUNC('month', NOW())`),
          ),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.cancelAtPeriodEnd, true),
              gte(subscriptionsTable.currentPeriodEnd, sql`NOW()`),
              lt(
                subscriptionsTable.currentPeriodEnd,
                sql`DATE_TRUNC('month', NOW()) + INTERVAL '1 month'`,
              ),
            ),
          ),
      ])

      return {
        totalSubscriptions: totalResult[0]?.count ?? 0,
        activeSubscriptions: activeResult[0]?.count ?? 0,
        cancelledSubscriptions: cancelledResult[0]?.count ?? 0,
        pastDueSubscriptions: pastDueResult[0]?.count ?? 0,
        expiredSubscriptions: expiredResult[0]?.count ?? 0,
        freeTierCount: freeResult[0]?.count ?? 0,
        proTierCount: proResult[0]?.count ?? 0,
        enterpriseTierCount: enterpriseResult[0]?.count ?? 0,
        polarSourceCount: polarResult[0]?.count ?? 0,
        grandfatheredSourceCount: grandfatheredResult[0]?.count ?? 0,
        newThisMonth: newThisMonthResult[0]?.count ?? 0,
        cancelingThisMonth: cancelingResult[0]?.count ?? 0,
      }
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to get subscription stats"),
  })
}

export interface SubscriptionListItem {
  id: string
  userId: string
  tier: string
  status: string
  source: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  createdAt: Date | null
}

export const getSubscriptionsList = async (input: {
  limit: number
  cursor?: string
  status?: "active" | "cancelled" | "past_due" | "expired"
  tier?: "free" | "pro" | "enterprise"
}): Promise<
  Result<{ subscriptions: SubscriptionListItem[]; nextCursor?: string }, Error>
> => {
  return Result.tryPromise({
    try: async () => {
      const conditions = []

      if (input.status) {
        conditions.push(eq(subscriptionsTable.status, input.status))
      }

      if (input.tier) {
        conditions.push(eq(subscriptionsTable.tier, input.tier))
      }

      if (input.cursor) {
        conditions.push(sql`${subscriptionsTable.id} > ${input.cursor}`)
      }

      const query = db
        .select({
          id: subscriptionsTable.id,
          userId: subscriptionsTable.userId,
          tier: subscriptionsTable.tier,
          status: subscriptionsTable.status,
          source: subscriptionsTable.source,
          currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionsTable.cancelAtPeriodEnd,
          createdAt: subscriptionsTable.createdAt,
        })
        .from(subscriptionsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit + 1)

      const subscriptions = await query.orderBy(subscriptionsTable.createdAt)

      let nextCursor: string | undefined = undefined
      if (subscriptions.length > input.limit) {
        const nextItem = subscriptions.pop()
        nextCursor = nextItem?.id
      }

      return { subscriptions, nextCursor }
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to get subscriptions list"),
  })
}

export const getRevenueStats = async (): Promise<
  Result<
    {
      estimatedMonthlyRevenue: number
      estimatedAnnualRevenue: number
      proSubscribers: number
      enterpriseSubscribers: number
    },
    Error
  >
> => {
  return Result.tryPromise({
    try: async () => {
      const [proResult, enterpriseResult] = await Promise.all([
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.tier, "pro"),
              eq(subscriptionsTable.status, "active"),
            ),
          ),
        db
          .select({ count: count() })
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.tier, "enterprise"),
              eq(subscriptionsTable.status, "active"),
            ),
          ),
      ])

      const proCount = proResult[0]?.count ?? 0
      const enterpriseCount = enterpriseResult[0]?.count ?? 0

      const proMonthlyPrice = 19
      const enterpriseMonthlyPrice = 99

      const estimatedMonthlyRevenue =
        proCount * proMonthlyPrice + enterpriseCount * enterpriseMonthlyPrice
      const estimatedAnnualRevenue = estimatedMonthlyRevenue * 12

      return {
        estimatedMonthlyRevenue,
        estimatedAnnualRevenue,
        proSubscribers: proCount,
        enterpriseSubscribers: enterpriseCount,
      }
    },
    catch: (e) =>
      e instanceof Error ? e : new Error("Failed to get revenue stats"),
  })
}
