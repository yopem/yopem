import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm"

import { db } from "../index"
import {
  activityLogsTable,
  adminSettingsTable,
  polarPaymentsTable,
  toolRunsTable,
  uptimeEventsTable,
} from "../schema"

export const getSetting = async (key: string) => {
  const [setting] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  return setting
}

export const upsertSetting = async (key: string, value: unknown) => {
  const existing = await getSetting(key)

  if (existing) {
    const [updated] = await db
      .update(adminSettingsTable)
      .set({ settingValue: value, updatedAt: new Date() })
      .where(eq(adminSettingsTable.id, existing.id))
      .returning()

    return updated
  }

  const [created] = await db
    .insert(adminSettingsTable)
    .values({ settingKey: key, settingValue: value })
    .returning()

  return created
}

export const getActivityFeed = (limit: number) => {
  return db
    .select({
      userId: polarPaymentsTable.userId,
      userName: polarPaymentsTable.userName,
      amount: polarPaymentsTable.amount,
      currency: polarPaymentsTable.currency,
      creditsGranted: polarPaymentsTable.creditsGranted,
      createdAt: polarPaymentsTable.createdAt,
    })
    .from(polarPaymentsTable)
    .where(eq(polarPaymentsTable.status, "succeeded"))
    .orderBy(sql`${polarPaymentsTable.createdAt} DESC`)
    .limit(limit)
}

export const getActivityLogs = async (input: {
  limit: number
  cursor?: string
  eventType?: "auth" | "system" | "payment" | "tool" | "api" | "webhook"
  severity?: "critical" | "error" | "warning" | "info" | "debug"
  startDate?: Date
  endDate?: Date
}) => {
  const logs = await db
    .select()
    .from(activityLogsTable)
    .where(
      and(
        input.eventType
          ? eq(activityLogsTable.eventType, input.eventType)
          : sql`true`,
        input.severity
          ? eq(activityLogsTable.severity, input.severity)
          : sql`true`,
        input.startDate
          ? gte(activityLogsTable.timestamp, input.startDate)
          : sql`true`,
        input.endDate
          ? lte(activityLogsTable.timestamp, input.endDate)
          : sql`true`,
        input.cursor ? lt(activityLogsTable.id, input.cursor) : sql`true`,
      ),
    )
    .orderBy(desc(activityLogsTable.timestamp))
    .limit(input.limit + 1)

  let nextCursor: string | undefined
  if (logs.length > input.limit) {
    const nextItem = logs.pop()
    nextCursor = nextItem?.id
  }

  const [totalCountResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(activityLogsTable)

  return {
    logs,
    nextCursor,
    totalCount: Number(totalCountResult?.count ?? 0),
  }
}

export const getSystemMetrics = async () => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [revenueResult] = await db
    .select({
      current: sql<number>`COALESCE(SUM(CASE WHEN ${polarPaymentsTable.createdAt} >= ${thirtyDaysAgo} THEN CAST(${polarPaymentsTable.amount} AS DECIMAL) ELSE 0 END), 0)`,
      previous: sql<number>`COALESCE(SUM(CASE WHEN ${polarPaymentsTable.createdAt} >= ${sixtyDaysAgo} AND ${polarPaymentsTable.createdAt} < ${thirtyDaysAgo} THEN CAST(${polarPaymentsTable.amount} AS DECIMAL) ELSE 0 END), 0)`,
    })
    .from(polarPaymentsTable)
    .where(eq(polarPaymentsTable.status, "succeeded"))

  const [activeUsersResult] = await db
    .select({
      current: sql<number>`COUNT(DISTINCT CASE WHEN ${toolRunsTable.createdAt} >= ${thirtyDaysAgo} THEN ${toolRunsTable.userId} END)`,
      previous: sql<number>`COUNT(DISTINCT CASE WHEN ${toolRunsTable.createdAt} >= ${sixtyDaysAgo} AND ${toolRunsTable.createdAt} < ${thirtyDaysAgo} THEN ${toolRunsTable.userId} END)`,
    })
    .from(toolRunsTable)

  const [aiRequestsResult] = await db
    .select({
      current: sql<number>`COUNT(CASE WHEN ${toolRunsTable.createdAt} >= ${thirtyDaysAgo} AND ${toolRunsTable.status} IN ('completed', 'failed') THEN 1 END)`,
      previous: sql<number>`COUNT(CASE WHEN ${toolRunsTable.createdAt} >= ${sixtyDaysAgo} AND ${toolRunsTable.createdAt} < ${thirtyDaysAgo} AND ${toolRunsTable.status} IN ('completed', 'failed') THEN 1 END)`,
    })
    .from(toolRunsTable)

  const [uptimeStats] = await db
    .select({
      totalDowntime: sql<number>`COALESCE(SUM(${uptimeEventsTable.durationSeconds}), 0)`,
    })
    .from(uptimeEventsTable)
    .where(
      and(
        gte(uptimeEventsTable.startedAt, thirtyDaysAgo),
        sql`${uptimeEventsTable.endedAt} IS NOT NULL`,
      ),
    )

  return {
    revenue: {
      current: Number(revenueResult?.current ?? 0),
      previous: Number(revenueResult?.previous ?? 0),
    },
    activeUsers: {
      current: Number(activeUsersResult?.current ?? 0),
      previous: Number(activeUsersResult?.previous ?? 0),
    },
    aiRequests: {
      current: Number(aiRequestsResult?.current ?? 0),
      previous: Number(aiRequestsResult?.previous ?? 0),
    },
    downtimeSeconds: Number(uptimeStats?.totalDowntime ?? 0),
  }
}

export const getUptimeMetrics = async () => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [downtimeStats] = await db
    .select({
      totalDowntime: sql<number>`COALESCE(SUM(${uptimeEventsTable.durationSeconds}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(uptimeEventsTable)
    .where(
      and(
        gte(uptimeEventsTable.startedAt, thirtyDaysAgo),
        sql`${uptimeEventsTable.endedAt} IS NOT NULL`,
      ),
    )

  const [lastDowntime] = await db
    .select({ startedAt: uptimeEventsTable.startedAt })
    .from(uptimeEventsTable)
    .where(sql`${uptimeEventsTable.endedAt} IS NOT NULL`)
    .orderBy(desc(uptimeEventsTable.startedAt))
    .limit(1)

  return {
    totalDowntime: Number(downtimeStats?.totalDowntime ?? 0),
    downtimeCount: Number(downtimeStats?.count ?? 0),
    lastDowntime: lastDowntime?.startedAt ?? null,
  }
}

export const getUptimeHistory = (input: {
  days: number
  startDate: Date
  now: Date
}) => {
  return db
    .select({
      startedAt: uptimeEventsTable.startedAt,
      endedAt: uptimeEventsTable.endedAt,
      durationSeconds: uptimeEventsTable.durationSeconds,
    })
    .from(uptimeEventsTable)
    .where(
      and(
        gte(uptimeEventsTable.startedAt, input.startDate),
        lte(uptimeEventsTable.startedAt, input.now),
        sql`${uptimeEventsTable.endedAt} IS NOT NULL`,
      ),
    )
}

export const getAiRequestsHistory = (input: { startDate: Date }) => {
  return db
    .select({
      createdAt: toolRunsTable.createdAt,
    })
    .from(toolRunsTable)
    .where(
      and(
        gte(toolRunsTable.createdAt, input.startDate),
        sql`${toolRunsTable.status} IN ('completed', 'failed')`,
      ),
    )
}

export const getApiKeyStats = async () => {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  )
  const endOfPreviousMonth = startOfCurrentMonth

  const [totalRequestsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(toolRunsTable)

  const [currentMonthResult] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      cost: sql<number>`COALESCE(SUM(CAST(${toolRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(toolRunsTable)
    .where(sql`${toolRunsTable.createdAt} >= ${startOfCurrentMonth}`)

  const [previousMonthResult] = await db
    .select({
      cost: sql<number>`COALESCE(SUM(CAST(${toolRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(toolRunsTable)
    .where(
      sql`${toolRunsTable.createdAt} >= ${startOfPreviousMonth} AND ${toolRunsTable.createdAt} < ${endOfPreviousMonth}`,
    )

  return {
    totalRequests: Number(totalRequestsResult?.count ?? 0),
    requestsThisMonth: Number(currentMonthResult?.count ?? 0),
    monthlyCost: Number(currentMonthResult?.cost ?? 0),
    previousMonthCost: Number(previousMonthResult?.cost ?? 0),
  }
}
