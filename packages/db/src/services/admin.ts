import { and, asc, desc, eq, gte, lt, lte, sql } from "drizzle-orm"

import { db } from "db"
import {
  activityLogsTable,
  adminSettingsTable,
  aiModelsTable,
  polarPaymentsTable,
  productRunsTable,
  uptimeEventsTable,
} from "db/schema"
import type { SelectAdminSettings } from "db/schema/admin-settings"

export const getSetting = async (
  key: string,
): Promise<SelectAdminSettings | null> => {
  const [setting] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  return setting ?? null
}

export const upsertSetting = async (
  key: string,
  value: unknown,
): Promise<SelectAdminSettings> => {
  const settingResult = await getSetting(key)

  if (settingResult) {
    const existing = settingResult
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

export const getActivityFeed = (
  limit: number,
): Promise<
  {
    userId: string
    userName: string | null
    amount: string
    currency: string
    creditsGranted: number
    createdAt: Date | null
  }[]
> => {
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
}): Promise<{
  logs: (typeof activityLogsTable.$inferSelect)[]
  nextCursor?: string
  totalCount: number
}> => {
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

export const getSystemMetrics = async (): Promise<{
  revenue: { current: number; previous: number }
  activeUsers: { current: number; previous: number }
  aiRequests: { current: number; previous: number }
  downtimeSeconds: number
}> => {
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
      current: sql<number>`COUNT(DISTINCT CASE WHEN ${productRunsTable.createdAt} >= ${thirtyDaysAgo} THEN ${productRunsTable.userId} END)`,
      previous: sql<number>`COUNT(DISTINCT CASE WHEN ${productRunsTable.createdAt} >= ${sixtyDaysAgo} AND ${productRunsTable.createdAt} < ${thirtyDaysAgo} THEN ${productRunsTable.userId} END)`,
    })
    .from(productRunsTable)

  const [aiRequestsResult] = await db
    .select({
      current: sql<number>`COUNT(CASE WHEN ${productRunsTable.createdAt} >= ${thirtyDaysAgo} AND ${productRunsTable.status} IN ('completed', 'failed') THEN 1 END)`,
      previous: sql<number>`COUNT(CASE WHEN ${productRunsTable.createdAt} >= ${sixtyDaysAgo} AND ${productRunsTable.createdAt} < ${thirtyDaysAgo} AND ${productRunsTable.status} IN ('completed', 'failed') THEN 1 END)`,
    })
    .from(productRunsTable)

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

export const getUptimeMetrics = async (): Promise<{
  totalDowntime: number
  downtimeCount: number
  lastDowntime: Date | null
}> => {
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
}): Promise<
  {
    startedAt: Date
    endedAt: Date | null
    durationSeconds: number | null
  }[]
> => {
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

export const getAiRequestsHistory = (input: {
  startDate: Date
}): Promise<{ createdAt: Date | null }[]> => {
  return db
    .select({
      createdAt: productRunsTable.createdAt,
    })
    .from(productRunsTable)
    .where(
      and(
        gte(productRunsTable.createdAt, input.startDate),
        sql`${productRunsTable.status} IN ('completed', 'failed')`,
      ),
    )
}

export const listAIModels = () => {
  return db.select().from(aiModelsTable).orderBy(asc(aiModelsTable.displayName))
}

export const findAIModelByProviderAndModelId = async (
  provider: string,
  modelId: string,
) => {
  const [existing] = await db
    .select({ id: aiModelsTable.id })
    .from(aiModelsTable)
    .where(
      and(
        eq(aiModelsTable.provider, provider),
        eq(aiModelsTable.modelId, modelId),
      ),
    )

  return existing ?? null
}

export const findAIModelById = async (id: string) => {
  const [existing] = await db
    .select({ id: aiModelsTable.id })
    .from(aiModelsTable)
    .where(eq(aiModelsTable.id, id))

  return existing ?? null
}

export const createAIModel = async (input: {
  provider: string
  modelId: string
  displayName: string
  isEnabled: boolean
}) => {
  const [created] = await db
    .insert(aiModelsTable)
    .values({
      provider: input.provider,
      modelId: input.modelId,
      displayName: input.displayName,
      isEnabled: input.isEnabled,
    })
    .returning()

  return created
}

export const updateAIModelById = async (
  id: string,
  input: {
    provider?: string
    modelId?: string
    displayName?: string
    isEnabled?: boolean
  },
) => {
  const [updated] = await db
    .update(aiModelsTable)
    .set({
      ...(input.provider !== undefined && { provider: input.provider }),
      ...(input.modelId !== undefined && { modelId: input.modelId }),
      ...(input.displayName !== undefined && {
        displayName: input.displayName,
      }),
      ...(input.isEnabled !== undefined && {
        isEnabled: input.isEnabled,
      }),
      updatedAt: new Date(),
    })
    .where(eq(aiModelsTable.id, id))
    .returning()

  return updated
}

export const deleteAIModelById = async (id: string) => {
  await db.delete(aiModelsTable).where(eq(aiModelsTable.id, id))
}

export const getApiKeyStats = async (): Promise<{
  totalRequests: number
  requestsThisMonth: number
  monthlyCost: number
  previousMonthCost: number
}> => {
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
    .from(productRunsTable)

  const [currentMonthResult] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      cost: sql<number>`COALESCE(SUM(CAST(${productRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(productRunsTable)
    .where(sql`${productRunsTable.createdAt} >= ${startOfCurrentMonth}`)

  const [previousMonthResult] = await db
    .select({
      cost: sql<number>`COALESCE(SUM(CAST(${productRunsTable.cost} AS DECIMAL)), 0)`,
    })
    .from(productRunsTable)
    .where(
      sql`${productRunsTable.createdAt} >= ${startOfPreviousMonth} AND ${productRunsTable.createdAt} < ${endOfPreviousMonth}`,
    )

  return {
    totalRequests: Number(totalRequestsResult?.count ?? 0),
    requestsThisMonth: Number(currentMonthResult?.count ?? 0),
    monthlyCost: Number(currentMonthResult?.cost ?? 0),
    previousMonthCost: Number(previousMonthResult?.cost ?? 0),
  }
}
