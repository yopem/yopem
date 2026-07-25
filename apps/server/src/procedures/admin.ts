import { ORPCError } from "@orpc/server"
import {
  addApiKeyInputSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "server/llm/api-keys-schema"
import { testApiKey } from "server/llm/test-key"
import { adminProcedure } from "server/orpc"
import { decryptApiKey, encryptApiKey, maskApiKey } from "server/utils/crypto"
import { z } from "zod"

import { getOrCompute } from "cache/services/with-cache"
import {
  createAIModel,
  deleteAIModelById,
  findAIModelById,
  findAIModelByProviderAndModelId,
  getActivityFeed,
  getAiRequestsHistory,
  getApiKeyStats,
  getSetting,
  listAIModels,
  updateAIModelById,
  upsertSetting,
} from "db/services/admin"
import {
  getRevenueStats,
  getSubscriptionStats,
  getSubscriptionsList,
} from "db/services/subscription-admin"
import { createCustomId } from "utils/custom-id"

const API_KEYS_SETTING_KEY = "api_keys"
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const MODEL_CACHE_TTL = 300
const SETTINGS_CACHE_TTL = 300

const activityFeedItemSchema = z.object({
  type: z.string(),
  message: z.string(),
  timestamp: z.date(),
})

const activityFeedOutputSchema = z.array(activityFeedItemSchema)

const apiKeyStatsOutputSchema = z.object({
  totalRequests: z.number(),
  activeKeys: z.number(),
  monthlyCost: z.number(),
  requestsThisMonth: z.number(),
  costChange: z.string(),
})

const formatApiKey = (key: ApiKeyConfig) => ({
  ...key,
  apiKey: (() => {
    const decrypted = decryptApiKey(key.apiKey)
    return decrypted ? maskApiKey(decrypted) : "Error: Failed to decrypt"
  })(),
})

export const adminRouter = {
  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const apiKeys = await getOrCompute(
      context.redis,
      `settings:${API_KEYS_SETTING_KEY}`,
      async () => {
        const settings = await getSetting(API_KEYS_SETTING_KEY)
        return (settings?.settingValue as ApiKeyConfig[] | undefined) ?? []
      },
      SETTINGS_CACHE_TTL,
    )

    return apiKeys.map(formatApiKey)
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)
      const existingKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []

      const encryptedKey = encryptApiKey(input.apiKey)
      if (!encryptedKey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to encrypt API key",
        })
      }

      if (!input.skipValidation) {
        const validation = await testApiKey(input.provider, input.apiKey)
        if (!validation.valid) {
          throw new ORPCError("BAD_REQUEST", {
            message: validation.error ?? "API key validation failed",
          })
        }
      }

      const newKey: ApiKeyConfig = {
        id: createCustomId(),
        provider: input.provider,
        name: input.name,
        description: input.description,
        apiKey: encryptedKey,
        status: input.status ?? "active",
        restrictions: input.restrictions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedKeys = [...existingKeys, newKey]

      try {
        await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
      } catch (e) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to update settings: ${String(e)}`,
        })
      }

      void context.redis.invalidatePattern("models:*")
      void context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

      return { success: true, id: newKey.id }
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)

      if (!settings?.settingValue) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

      if (keyIndex === -1) {
        throw new ORPCError("NOT_FOUND", {
          message: `API key not found: ${input.id}`,
        })
      }

      let newApiKey: string | undefined
      if (input.apiKey) {
        const encryptResult = encryptApiKey(input.apiKey)
        if (!encryptResult) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to encrypt API key",
          })
        }
        newApiKey = encryptResult

        if (!input.skipValidation) {
          const provider = input.provider ?? existingKeys[keyIndex].provider
          const validation = await testApiKey(provider, input.apiKey)
          if (!validation.valid) {
            throw new ORPCError("BAD_REQUEST", {
              message: validation.error ?? "API key validation failed",
            })
          }
        }
      }

      const updatedKey: ApiKeyConfig = {
        ...existingKeys[keyIndex],
        ...(input.provider && { provider: input.provider }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(newApiKey && { apiKey: newApiKey }),
        ...(input.status && { status: input.status }),
        ...(input.restrictions !== undefined && {
          restrictions: input.restrictions,
        }),
        updatedAt: new Date().toISOString(),
      }

      const updatedKeys = [...existingKeys]
      updatedKeys[keyIndex] = updatedKey

      try {
        await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
      } catch (e) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to update settings: ${String(e)}`,
        })
      }

      void context.redis.invalidatePattern("models:*")
      void context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

      return { success: true }
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)

      if (!settings?.settingValue) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

      try {
        await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
      } catch (e) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to update settings: ${String(e)}`,
        })
      }

      void context.redis.invalidatePattern("models:*")
      void context.redis.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

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
        getSetting(API_KEYS_SETTING_KEY),
        getApiKeyStats(),
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

      void context.redis.setCache(cacheKey, stats, MODEL_CACHE_TTL)

      return stats
    }),

  getAIModels: adminProcedure.handler(() => listAIModels()),

  addAIModel: adminProcedure
    .input(
      z.object({
        provider: z.string(),
        modelId: z.string().min(1),
        displayName: z.string().min(1),
        isEnabled: z.boolean().default(true),
      }),
    )
    .handler(async ({ input }) => {
      const existing = await findAIModelByProviderAndModelId(
        input.provider,
        input.modelId,
      )

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: `Model "${input.modelId}" already exists for provider "${input.provider}"`,
        })
      }

      return createAIModel(input)
    }),

  updateAIModel: adminProcedure
    .input(
      z.object({
        id: z.string(),
        provider: z.string().optional(),
        modelId: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        isEnabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const existing = await findAIModelById(input.id)

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: `AI model not found: ${input.id}`,
        })
      }

      return updateAIModelById(input.id, {
        provider: input.provider,
        modelId: input.modelId,
        displayName: input.displayName,
        isEnabled: input.isEnabled,
      })
    }),

  deleteAIModel: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const existing = await findAIModelById(input.id)

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: `AI model not found: ${input.id}`,
        })
      }

      await deleteAIModelById(input.id)

      return { success: true }
    }),

  getAssetSettings: adminProcedure.handler(async ({ context }) => {
    const maxUploadSizeMB = await getOrCompute(
      context.redis,
      `settings:${ASSETS_MAX_SIZE_KEY}`,
      async () => {
        const settings = await getSetting(ASSETS_MAX_SIZE_KEY)
        return settings && typeof settings.settingValue === "number"
          ? settings.settingValue
          : 50
      },
      SETTINGS_CACHE_TTL,
    )

    return { maxUploadSizeMB }
  }),

  updateAssetSettings: adminProcedure
    .input(z.object({ maxUploadSizeMB: z.number().min(1).max(500) }))
    .handler(async ({ context, input }) => {
      await upsertSetting(ASSETS_MAX_SIZE_KEY, input.maxUploadSizeMB)

      void context.redis.deleteCache(`settings:${ASSETS_MAX_SIZE_KEY}`)

      return { success: true }
    }),

  getActivityFeed: adminProcedure
    .output(activityFeedOutputSchema)
    .handler(async ({ context }) => {
      const cacheKey = "admin:metrics:activity_feed"
      const cached = await context.redis.getCache<
        {
          type: string
          message: string
          timestamp: Date
        }[]
      >(cacheKey)

      if (cached) {
        return cached
      }

      const recentPayments = await getActivityFeed(10)

      const activities = recentPayments.map((payment) => {
        const userIdentifier =
          payment.userName ?? `User #${payment.userId.slice(0, 8)}`
        return {
          type: "payment",
          message: `${userIdentifier} purchased ${payment.creditsGranted} credits for ${payment.currency} ${payment.amount}`,
          timestamp: payment.createdAt ?? new Date(),
        }
      })

      void context.redis.setCache(cacheKey, activities, MODEL_CACHE_TTL)

      return activities
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

      const runs = await getAiRequestsHistory({ startDate })

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
      void context.redis.setCache(cacheKey, result, MODEL_CACHE_TTL)

      return result
    }),

  getSubscriptionStats: adminProcedure.handler(async () => {
    const [stats, revenue] = await Promise.all([
      getSubscriptionStats(),
      getRevenueStats(),
    ])

    return {
      ...stats,
      revenue,
    }
  }),

  getSubscriptionsList: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z
          .enum(["active", "cancelled", "past_due", "expired"])
          .optional(),
        tier: z.enum(["free", "pro", "enterprise"]).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await getSubscriptionsList(input)

      return result
    }),
}
