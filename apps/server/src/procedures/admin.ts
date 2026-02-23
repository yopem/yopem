import { ORPCError } from "@orpc/server"
import * as adminService from "@repo/db/services/admin"
import { formatError, logger } from "@repo/logger"
import { WebhookMetrics } from "@repo/payments/webhook-metrics"
import { adminProcedure } from "@repo/server/orpc"
import { failure, success, type Result } from "@repo/types"
import {
  addApiKeyInputSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@repo/utils/api-keys-schema"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@repo/utils/crypto"
import { createCustomId } from "@repo/utils/custom-id"
import { z } from "zod"

const API_KEYS_SETTING_KEY = "api_keys"
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const MODEL_CACHE_PREFIX = "models:"
const MODEL_CACHE_TTL = 300
const SETTINGS_CACHE_TTL = 300

const activityFeedItemSchema = z.object({
  type: z.string(),
  message: z.string(),
  timestamp: z.date(),
})

const activityFeedOutputSchema = z.array(activityFeedItemSchema)

const systemMetricsOutputSchema = z.object({
  revenue: z.number(),
  revenueChange: z.string(),
  activeUsers: z.number(),
  activeUsersChange: z.string(),
  aiRequests: z.number(),
  aiRequestsChange: z.string(),
  systemUptime: z.string(),
  systemUptimeChange: z.string(),
})

const apiKeyStatsOutputSchema = z.object({
  totalRequests: z.number(),
  activeKeys: z.number(),
  monthlyCost: z.number(),
  requestsThisMonth: z.number(),
  costChange: z.string(),
})

const uptimeMetricsOutputSchema = z.object({
  uptimePercentage: z.number(),
  totalDuration: z.number(),
  lastDowntime: z.date().nullable(),
  downtimeCount: z.number(),
})

const activityLogsOutputSchema = z.object({
  logs: z.array(
    z.object({
      id: z.string(),
      timestamp: z.date(),
      eventType: z.string(),
      severity: z.string(),
      description: z.string(),
      metadata: z.record(z.string(), z.unknown()).nullable(),
    }),
  ),
  nextCursor: z.string().optional(),
  totalCount: z.number(),
})

const uptimeHistoryOutputSchema = z.object({
  dataPoints: z.array(
    z.object({
      date: z.string(),
      uptimePercentage: z.number(),
      downtimeSeconds: z.number(),
    }),
  ),
})

export const adminRouter = {
  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const cacheKey = `settings:${API_KEYS_SETTING_KEY}`
    const cached = await context.redis.getCache<ApiKeyConfig[]>(cacheKey)

    if (cached) {
      return cached.map((key) => ({
        ...key,
        apiKey: maskApiKey(decryptApiKey(key.apiKey)),
      }))
    }

    const settings = await adminService.getSetting(API_KEYS_SETTING_KEY)

    if (!settings?.settingValue) {
      return []
    }

    const apiKeys = settings.settingValue as ApiKeyConfig[]
    await context.redis.setCache(cacheKey, apiKeys, SETTINGS_CACHE_TTL)

    return apiKeys.map((key) => {
      try {
        const decrypted = decryptApiKey(key.apiKey)
        return {
          ...key,
          apiKey: maskApiKey(decrypted),
        }
      } catch (error) {
        logger.error(
          `Failed to decrypt API key ${key.id}: ${formatError(error)}`,
        )
        return {
          ...key,
          apiKey: "Error: Failed to decrypt",
        }
      }
    })
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await adminService.getSetting(API_KEYS_SETTING_KEY)

      const existingKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []

      const newKey: ApiKeyConfig = {
        id: createCustomId(),
        provider: input.provider,
        name: input.name,
        description: input.description,
        apiKey: encryptApiKey(input.apiKey),
        status: input.status ?? "active",
        restrictions: input.restrictions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedKeys = [...existingKeys, newKey]

      await adminService.upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

      return { success: true, id: newKey.id }
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await adminService.getSetting(API_KEYS_SETTING_KEY)

      if (!settings?.settingValue) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

      if (keyIndex === -1) {
        throw new ORPCError("NOT_FOUND", { message: "API key not found" })
      }

      const updatedKey: ApiKeyConfig = {
        ...existingKeys[keyIndex],
        ...(input.provider && { provider: input.provider }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.apiKey && {
          apiKey: encryptApiKey(
            input.apiKey ?? decryptApiKey(existingKeys[keyIndex].apiKey),
          ),
        }),
        ...(input.status && { status: input.status }),
        ...(input.restrictions !== undefined && {
          restrictions: input.restrictions,
        }),
        updatedAt: new Date().toISOString(),
      }

      const updatedKeys = [...existingKeys]
      updatedKeys[keyIndex] = updatedKey

      await adminService.upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

      return { success: true }
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await adminService.getSetting(API_KEYS_SETTING_KEY)

      if (!settings?.settingValue) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

      await adminService.upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)
      await context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

      return { success: true }
    }),

  getApiKeyStats: adminProcedure
    .output(apiKeyStatsOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:api_key_stats"
      const cached = await context.redis.getCache<{
        totalRequests: number
        activeKeys: number
        monthlyCost: number
        requestsThisMonth: number
        costChange: string
      }>(cacheKey)

      if (cached) {
        return cached
      }

      const [settings, rawStats] = await Promise.all([
        adminService.getSetting(API_KEYS_SETTING_KEY),
        adminService.getApiKeyStats(),
      ])

      const apiKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []
      const activeKeys = apiKeys.filter((key) => key.status === "active").length

      const {
        totalRequests,
        requestsThisMonth,
        monthlyCost,
        previousMonthCost,
      } = rawStats

      let costChange = "N/A"
      if (previousMonthCost > 0) {
        const changePercent =
          ((monthlyCost - previousMonthCost) / previousMonthCost) * 100
        costChange =
          changePercent >= 0
            ? `+${changePercent.toFixed(1)}%`
            : `${changePercent.toFixed(1)}%`
      } else if (monthlyCost > 0) {
        costChange = "+100%"
      }

      const stats = {
        totalRequests,
        activeKeys,
        monthlyCost,
        requestsThisMonth,
        costChange,
      }

      await context.redis.setCache(cacheKey, stats, MODEL_CACHE_TTL)

      return stats
    }),

  getAvailableModels: adminProcedure.handler(async ({ context }) => {
    const settings = await adminService.getSetting(API_KEYS_SETTING_KEY)

    if (!settings?.settingValue) {
      return []
    }

    const apiKeys = settings.settingValue as ApiKeyConfig[]
    const activeKeys = apiKeys.filter((key) => key.status === "active")

    const uniqueByProvider = new Map<string, ApiKeyConfig>()
    for (const key of activeKeys) {
      if (!uniqueByProvider.has(key.provider)) {
        uniqueByProvider.set(key.provider, key)
      }
    }

    const entries = Array.from(uniqueByProvider.entries())
    const results = await Promise.all(
      entries.map(async ([provider, key]) => {
        const cacheKey = `${MODEL_CACHE_PREFIX}${provider}:${key.id}`
        const cached =
          await context.redis.getCache<{ id: string; name: string }[]>(cacheKey)

        if (cached) {
          return { provider, models: cached }
        }

        try {
          const decryptedKey = decryptApiKey(key.apiKey)
          const result = await fetchModelsForProvider(
            provider as ApiKeyConfig["provider"],
            decryptedKey,
          )
          if (result.success) {
            await context.redis.setCache(cacheKey, result.data, MODEL_CACHE_TTL)
            return { provider, models: result.data }
          }
          logger.error(
            `Failed to fetch models for ${provider}: ${result.error.message}`,
          )
          return { provider, models: [] as { id: string; name: string }[] }
        } catch (error) {
          logger.error(
            `Failed to fetch models for ${provider}: ${formatError(error)}`,
          )
          return { provider, models: [] as { id: string; name: string }[] }
        }
      }),
    )

    const allModels: { id: string; name: string; provider: string }[] = []
    for (const { provider, models } of results) {
      for (const model of models) {
        allModels.push({ ...model, provider })
      }
    }

    return allModels
  }),

  getAssetSettings: adminProcedure.handler(async ({ context }) => {
    const cacheKey = `settings:${ASSETS_MAX_SIZE_KEY}`
    const cached = await context.redis.getCache<number>(cacheKey)

    if (cached !== null) {
      return { maxUploadSizeMB: cached }
    }

    const settings = await adminService.getSetting(ASSETS_MAX_SIZE_KEY)

    const maxUploadSizeMB =
      settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : 50

    await context.redis.setCache(cacheKey, maxUploadSizeMB, SETTINGS_CACHE_TTL)

    return { maxUploadSizeMB }
  }),

  updateAssetSettings: adminProcedure
    .input(z.object({ maxUploadSizeMB: z.number().min(1).max(500) }))
    .handler(async ({ context, input }) => {
      await adminService.upsertSetting(
        ASSETS_MAX_SIZE_KEY,
        input.maxUploadSizeMB,
      )

      await context.redis.deleteCache(`settings:${ASSETS_MAX_SIZE_KEY}`)

      return { success: true }
    }),

  getWebhookMetrics: adminProcedure
    .input(
      z.object({
        eventType: z.enum(["order.paid", "order.refunded"]).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const redisClient = await context.redis.getRedisClient()
      const metricsTracker = new WebhookMetrics(redisClient)

      const eventTypes = input.eventType
        ? [input.eventType]
        : ["order.paid", "order.refunded"]

      const metricsPromises = eventTypes.map((eventType) =>
        metricsTracker.getMetricsSummary(eventType).then((summary) => ({
          eventType,
          ...summary,
        })),
      )

      const metrics = await Promise.all(metricsPromises)

      return { metrics }
    }),

  getWebhookMetricsHistory: adminProcedure
    .input(
      z.object({
        eventType: z.enum(["order.paid", "order.refunded"]).optional(),
        timeRange: z.enum(["24h", "7d"]),
      }),
    )
    .handler(async ({ context, input }) => {
      const redisClient = await context.redis.getRedisClient()

      if (!redisClient) {
        return {
          dataPoints: [],
          summary: {
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            avgProcessingTime: 0,
          },
        }
      }

      const endDate = new Date()
      const startDate =
        input.timeRange === "24h"
          ? new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
          : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

      const eventTypes = input.eventType
        ? [input.eventType]
        : ["order.paid", "order.refunded"]

      const dataPointsMap = new Map<
        string,
        {
          successCount: number
          failureCount: number
          totalTime: number
          totalCount: number
        }
      >()

      for (const eventType of eventTypes) {
        let currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0]

          const existing = dataPointsMap.get(dateStr) ?? {
            successCount: 0,
            failureCount: 0,
            totalTime: 0,
            totalCount: 0,
          }

          const [successCount, failureCount, totalTime, totalCount] =
            await Promise.all([
              redisClient
                .get(`webhook:metrics:${eventType}:success:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:failure:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:processing_time:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
              redisClient
                .get(`webhook:metrics:${eventType}:processing_count:${dateStr}`)
                .then((v) => Number.parseInt(v ?? "0", 10)),
            ])

          dataPointsMap.set(dateStr, {
            successCount: existing.successCount + successCount,
            failureCount: existing.failureCount + failureCount,
            totalTime: existing.totalTime + totalTime,
            totalCount: existing.totalCount + totalCount,
          })

          currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
        }
      }

      const dataPoints = Array.from(dataPointsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          successCount: data.successCount,
          failureCount: data.failureCount,
          avgProcessingTime:
            data.totalCount > 0 ? data.totalTime / data.totalCount : 0,
        }))

      const totalProcessed = dataPoints.reduce(
        (sum, dp) => sum + dp.successCount + dp.failureCount,
        0,
      )
      const successCount = dataPoints.reduce(
        (sum, dp) => sum + dp.successCount,
        0,
      )
      const failureCount = dataPoints.reduce(
        (sum, dp) => sum + dp.failureCount,
        0,
      )
      const totalAvgTime = dataPoints.reduce(
        (sum, dp) => sum + dp.avgProcessingTime,
        0,
      )
      const avgProcessingTime =
        dataPoints.length > 0 ? totalAvgTime / dataPoints.length : 0

      return {
        dataPoints,
        summary: {
          totalProcessed,
          successCount,
          failureCount,
          successRate:
            totalProcessed > 0 ? (successCount / totalProcessed) * 100 : 0,
          avgProcessingTime,
        },
      }
    }),

  getActivityFeed: adminProcedure
    .output(activityFeedOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:activity_feed"
      const cached =
        await context.redis.getCache<
          {
            type: string
            message: string
            timestamp: Date
          }[]
        >(cacheKey)

      if (cached) {
        return cached
      }

      const recentPayments = await adminService.getActivityFeed(10)

      const activities = recentPayments.map((payment) => {
        const userIdentifier =
          payment.userName ?? `User #${payment.userId.slice(0, 8)}`
        return {
          type: "payment",
          message: `${userIdentifier} purchased ${payment.creditsGranted} credits for ${payment.currency} ${payment.amount}`,
          timestamp: payment.createdAt ?? new Date(),
        }
      })

      await context.redis.setCache(cacheKey, activities, MODEL_CACHE_TTL)

      return activities
    }),

  getUptimeMetrics: adminProcedure
    .output(uptimeMetricsOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:uptime:metrics"
      const cached =
        await context.redis.getCache<z.infer<typeof uptimeMetricsOutputSchema>>(
          cacheKey,
        )

      if (cached) {
        return cached
      }

      const rawMetrics = await adminService.getUptimeMetrics()

      const totalSeconds = 30 * 24 * 60 * 60
      const downtimeSeconds = rawMetrics.totalDowntime
      const uptimePercentage =
        ((totalSeconds - downtimeSeconds) / totalSeconds) * 100

      const metrics = {
        uptimePercentage: Math.round(uptimePercentage * 10) / 10,
        totalDuration: totalSeconds - downtimeSeconds,
        lastDowntime: rawMetrics.lastDowntime,
        downtimeCount: rawMetrics.downtimeCount,
      }

      await context.redis.setCache(cacheKey, metrics, MODEL_CACHE_TTL)

      return metrics
    }),

  getActivityLogs: adminProcedure
    .input(
      z.object({
        eventType: z
          .enum(["auth", "system", "payment", "tool", "api", "webhook"])
          .optional(),
        severity: z
          .enum(["critical", "error", "warning", "info", "debug"])
          .optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .output(activityLogsOutputSchema)
    .handler(async ({ context, input }) => {
      const cacheKey = `admin:activity-logs:${input.eventType ?? "all"}:${input.severity ?? "all"}:${input.startDate?.toISOString() ?? "all"}:${input.endDate?.toISOString() ?? "all"}:${input.cursor ?? "initial"}`
      const cached =
        await context.redis.getCache<z.infer<typeof activityLogsOutputSchema>>(
          cacheKey,
        )

      if (cached) {
        return cached
      }

      const rawResult = await adminService.getActivityLogs({
        limit: input.limit,
        cursor: input.cursor,
        eventType: input.eventType,
        severity: input.severity,
        startDate: input.startDate,
        endDate: input.endDate,
      })

      const result = {
        logs: rawResult.logs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          eventType: log.eventType,
          severity: log.severity,
          description: log.description,
          metadata: log.metadata as Record<string, unknown> | null,
        })),
        nextCursor: rawResult.nextCursor,
        totalCount: rawResult.totalCount,
      }

      await context.redis.setCache(cacheKey, result, MODEL_CACHE_TTL)

      return result
    }),

  getUptimeHistory: adminProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d"]).default("7d"),
      }),
    )
    .output(uptimeHistoryOutputSchema)
    .handler(async ({ context, input }) => {
      const cacheKey = `admin:uptime:history:${input.timeRange}`
      const cached =
        await context.redis.getCache<z.infer<typeof uptimeHistoryOutputSchema>>(
          cacheKey,
        )

      if (cached) {
        return cached
      }

      const now = new Date()
      const days = input.timeRange === "7d" ? 7 : 30
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      const dataPointsMap = new Map<
        string,
        { date: string; uptimePercentage: number; downtimeSeconds: number }
      >()

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]
        dataPointsMap.set(dateStr, {
          date: dateStr,
          uptimePercentage: 100,
          downtimeSeconds: 0,
        })
      }

      const downtimeEvents = await adminService.getUptimeHistory({
        days,
        startDate,
        now,
      })

      for (const event of downtimeEvents) {
        const dateStr = event.startedAt.toISOString().split("T")[0]
        const existing = dataPointsMap.get(dateStr)
        if (existing) {
          const duration = event.durationSeconds ?? 0
          existing.downtimeSeconds += duration
          const totalSeconds = 24 * 60 * 60
          existing.uptimePercentage =
            Math.round(
              ((totalSeconds - existing.downtimeSeconds) / totalSeconds) *
                100 *
                10,
            ) / 10
        }
      }

      const dataPoints = Array.from(dataPointsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      )

      const result = { dataPoints }
      await context.redis.setCache(cacheKey, result, MODEL_CACHE_TTL)

      return result
    }),

  getSystemMetrics: adminProcedure
    .output(systemMetricsOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:system"
      const cached =
        await context.redis.getCache<z.infer<typeof systemMetricsOutputSchema>>(
          cacheKey,
        )

      if (cached) {
        return cached
      }

      const rawMetrics = await adminService.getSystemMetrics()

      const revenueChange = calculateTrend(
        rawMetrics.revenue.current,
        rawMetrics.revenue.previous,
      )
      const activeUsersChange = calculateTrend(
        rawMetrics.activeUsers.current,
        rawMetrics.activeUsers.previous,
      )
      const aiRequestsChange = calculateTrend(
        rawMetrics.aiRequests.current,
        rawMetrics.aiRequests.previous,
      )

      const totalSeconds = 30 * 24 * 60 * 60
      const downtimeSeconds = rawMetrics.downtimeSeconds
      const uptimePercentage =
        ((totalSeconds - downtimeSeconds) / totalSeconds) * 100
      const uptimeChange =
        downtimeSeconds > 0
          ? `-${((downtimeSeconds / totalSeconds) * 100).toFixed(1)}%`
          : "+0.0%"

      const metrics = {
        revenue: rawMetrics.revenue.current,
        revenueChange,
        activeUsers: rawMetrics.activeUsers.current,
        activeUsersChange,
        aiRequests: rawMetrics.aiRequests.current,
        aiRequestsChange,
        systemUptime: `${uptimePercentage.toFixed(1)}%`,
        systemUptimeChange: uptimeChange,
      }

      await context.redis.setCache(cacheKey, metrics, MODEL_CACHE_TTL)

      return metrics
    }),

  getAiRequestsHistory: adminProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d"]).default("7d"),
      }),
    )
    .output(
      z.object({
        dataPoints: z.array(
          z.object({
            date: z.string(),
            requests: z.number(),
          }),
        ),
      }),
    )
    .handler(async ({ context, input }) => {
      const cacheKey = `admin:metrics:ai_requests_history:${input.timeRange}`
      const cached = await context.redis.getCache<{
        dataPoints: { date: string; requests: number }[]
      }>(cacheKey)

      if (cached) {
        return cached
      }

      const now = new Date()
      const days = input.timeRange === "7d" ? 7 : 30
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      const dataPointsMap = new Map<
        string,
        { date: string; requests: number }
      >()

      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]
        dataPointsMap.set(dateStr, { date: dateStr, requests: 0 })
      }

      const runs = await adminService.getAiRequestsHistory({ startDate })

      for (const run of runs) {
        if (run.createdAt) {
          const dateStr = run.createdAt.toISOString().split("T")[0]
          const existing = dataPointsMap.get(dateStr)
          if (existing) {
            existing.requests += 1
          }
        }
      }

      const dataPoints = Array.from(dataPointsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      )

      const result = { dataPoints }
      await context.redis.setCache(cacheKey, result, MODEL_CACHE_TTL)

      return result
    }),
}

function calculateTrend(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "N/A"
  }
  const trend = ((current - previous) / previous) * 100
  return trend >= 0 ? `+${trend.toFixed(1)}%` : `${trend.toFixed(1)}%`
}

async function fetchModelsForProvider(
  provider: ApiKeyConfig["provider"],
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  switch (provider) {
    case "openai":
      return await fetchOpenAIModels(apiKey)
    case "openrouter":
      return await fetchOpenRouterModels(apiKey)
    default:
      return success([])
  }
}

async function fetchOpenAIModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) {
      return failure({
        provider: "openai",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      })
    }
    const data = await response.json()
    const allModels =
      data.data?.map((m: { id: string }) => ({
        id: m.id,
        name: m.id.toUpperCase().replace(/-/g, " "),
      })) ?? []

    return success(allModels)
  } catch (error) {
    return failure({
      provider: "openai",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function fetchOpenRouterModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) {
      return failure({
        provider: "openrouter",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      })
    }
    const data = await response.json()
    const models =
      data.data?.map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name ?? m.id,
      })) ?? []
    return success(models)
  } catch (error) {
    return failure({
      provider: "openrouter",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
