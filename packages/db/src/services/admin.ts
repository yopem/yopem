import { Result } from "better-result"
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm"

import type { SelectAdminSettings } from "../schema/admin-settings.ts"

import { DatabaseOperationError, NotFoundError } from "../errors.ts"
import { db } from "../index.ts"
import {
  activityLogsTable,
  adminSettingsTable,
  polarPaymentsTable,
  toolRunsTable,
  uptimeEventsTable,
} from "../schema/index.ts"

export const getSetting = async (
  key: string,
): Promise<Result<SelectAdminSettings, NotFoundError>> => {
  const [setting] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  if (!setting) {
    return Result.err(new NotFoundError({ resource: "AdminSettings", id: key }))
  }

  return Result.ok(setting)
}

export const upsertSetting = async (
  key: string,
  value: unknown,
): Promise<Result<SelectAdminSettings, DatabaseOperationError>> => {
  const settingResult = await getSetting(key)

  if (settingResult.isOk()) {
    const existing = settingResult.value
    const [updated] = await db
      .update(adminSettingsTable)
      .set({ settingValue: value, updatedAt: new Date() })
      .where(eq(adminSettingsTable.id, existing.id))
      .returning()

    if (!updated) {
      return Result.err(
        new DatabaseOperationError({
          operation: "update",
          table: "admin_settings",
          cause: new Error("Update returned no rows"),
        }),
      )
    }

    return Result.ok(updated)
  }

  const [created] = await db
    .insert(adminSettingsTable)
    .values({ settingKey: key, settingValue: value })
    .returning()

  if (!created) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "admin_settings",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(created)
}

export const getActivityFeed = (
  limit: number,
): Promise<
  Result<
    {
      userId: string
      userName: string | null
      amount: string
      currency: string
      creditsGranted: number
      createdAt: Date | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "polar_payments",
        cause: e,
      }),
  })
}

export const getActivityLogs = (input: {
  limit: number
  cursor?: string
  eventType?: "auth" | "system" | "payment" | "tool" | "api" | "webhook"
  severity?: "critical" | "error" | "warning" | "info" | "debug"
  startDate?: Date
  endDate?: Date
}): Promise<
  Result<
    {
      logs: (typeof activityLogsTable.$inferSelect)[]
      nextCursor?: string
      totalCount: number
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "activity_logs",
        cause: e,
      }),
  })
}

export const getSystemMetrics = (): Promise<
  Result<
    {
      revenue: { current: number; previous: number }
      activeUsers: { current: number; previous: number }
      aiRequests: { current: number; previous: number }
      downtimeSeconds: number
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "polar_payments",
        cause: e,
      }),
  })
}

export const getUptimeMetrics = (): Promise<
  Result<
    {
      totalDowntime: number
      downtimeCount: number
      lastDowntime: Date | null
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "uptime_events",
        cause: e,
      }),
  })
}

export const getUptimeHistory = (input: {
  days: number
  startDate: Date
  now: Date
}): Promise<
  Result<
    {
      startedAt: Date
      endedAt: Date | null
      durationSeconds: number | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "uptime_events",
        cause: e,
      }),
  })
}

export const getAiRequestsHistory = (input: {
  startDate: Date
}): Promise<Result<{ createdAt: Date | null }[], DatabaseOperationError>> => {
  return Result.tryPromise({
    try: () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_runs",
        cause: e,
      }),
  })
}

export const getApiKeyStats = (): Promise<
  Result<
    {
      totalRequests: number
      requestsThisMonth: number
      monthlyCost: number
      previousMonthCost: number
    },
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "tool_runs",
        cause: e,
      }),
  })
}
