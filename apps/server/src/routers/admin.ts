import { ORPCError } from "@orpc/server"
import { testApiKey } from "server/llm/test-key"
import { decryptApiKey, encryptApiKey, maskApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
import { getOrCompute } from "cache/services/with-cache"
import { aiModelSchema } from "db/schema/ai-models"
import {
  createAIModel,
  deleteAIModelById,
  deleteAIModelsByProvider,
  findAIModelById,
  findAIModelByProviderAndModelId,
  getAiRequestsHistory,
  getApiKeyStats,
  getSetting,
  listAIModels,
  updateAIModelById,
  upsertSetting,
} from "db/services/admin"
import {
  type ApiKeyConfig,
  type ApiKeyProvider,
  addApiKeyInputSchema,
  apiKeyProviderSchema,
  updateApiKeyInputSchema,
} from "utils/api-input"
import { createCustomId } from "utils/custom-id"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const API_KEYS_SETTING_KEY = "api_keys"
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const MODEL_CACHE_TTL = 300
const SETTINGS_CACHE_TTL = 300

const formatApiKey = (key: ApiKeyConfig) => ({
  ...key,
  apiKey: (() => {
    const decrypted = decryptApiKey(key.apiKey)
    return decrypted ? maskApiKey(decrypted) : "Error: Failed to decrypt"
  })(),
})

const apiKeyCreateOutputSchema = z.object({
  success: z.boolean(),
  id: z.string(),
})

const successOutputSchema = z.object({ success: z.boolean() })

const apiKeyStatsOutputSchema = z.object({
  totalRequests: z.number(),
  activeKeys: z.number(),
  monthlyCost: z.number(),
  requestsThisMonth: z.number(),
  costChange: z.string(),
})

const assetSettingsOutputSchema = z.object({
  maxUploadSizeMB: z.number(),
})

export const hasActiveKeyForProvider = (
  keys: ApiKeyConfig[],
  provider: ApiKeyProvider,
): boolean =>
  keys.some((key) => key.provider === provider && key.status === "active")

const updateAssetSettingsInputSchema = z.object({
  maxUploadSizeMB: z.number().min(1).max(500),
})

const adminModelCreateInputSchema = z.object({
  provider: apiKeyProviderSchema,
  modelId: z.string().min(1),
  displayName: z.string().min(1),
  isEnabled: z.boolean().default(true),
})

const adminModelUpdateInputSchema = z.object({
  id: z.string(),
  provider: apiKeyProviderSchema.optional(),
  modelId: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
})

const adminAiRequestsHistoryInputSchema = z.object({
  timeRange: z.enum(["7d", "30d"]).default("7d"),
})

export const adminRouter = {
  admin: {
    apiKeyList: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .handler(async () => {
        const apiKeys = await getOrCompute(
          redisCache,
          `settings:${API_KEYS_SETTING_KEY}`,
          async () => {
            const settings = await getSetting(API_KEYS_SETTING_KEY)
            return (settings?.settingValue as ApiKeyConfig[] | undefined) ?? []
          },
          SETTINGS_CACHE_TTL,
        )

        return apiKeys.map(formatApiKey)
      }),

    apiKeyCreate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(addApiKeyInputSchema)
      .output(apiKeyCreateOutputSchema)
      .handler(async ({ input }) => {
        const settings = await getSetting(API_KEYS_SETTING_KEY)
        const existingKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []

        const encryptedKey = encryptApiKey(input.apiKey)
        if (!encryptedKey) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: "Failed to encrypt API key",
          })
        }

        if (!input.skipValidation) {
          const validation = await testApiKey(input.provider, input.apiKey)
          if (!validation.valid) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
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
            status: 500,
            message: `Failed to update settings: ${String(e)}`,
          })
        }

        void redisCache.invalidatePattern("models:*")
        void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

        return { success: true, id: newKey.id }
      }),

    apiKeyUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(updateApiKeyInputSchema)
      .output(successOutputSchema)
      .handler(async ({ input }) => {
        const { id } = input
        const settings = await getSetting(API_KEYS_SETTING_KEY)

        if (!settings?.settingValue) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        const existingKeys = settings.settingValue as ApiKeyConfig[]
        const keyIndex = existingKeys.findIndex((key) => key.id === id)

        if (keyIndex === -1) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `API key not found: ${id}`,
          })
        }

        let newApiKey: string | undefined
        if (input.apiKey) {
          const encryptResult = encryptApiKey(input.apiKey)
          if (!encryptResult) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              status: 500,
              message: "Failed to encrypt API key",
            })
          }
          newApiKey = encryptResult

          if (!input.skipValidation) {
            const provider = input.provider ?? existingKeys[keyIndex].provider
            const validation = await testApiKey(provider, input.apiKey)
            if (!validation.valid) {
              throw new ORPCError("BAD_REQUEST", {
                status: 400,
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

        const originalProvider = existingKeys[keyIndex].provider
        const providerChanged =
          input.provider !== undefined && input.provider !== originalProvider
        const statusSetInactive = input.status === "inactive"

        const updatedKeys = [...existingKeys]
        updatedKeys[keyIndex] = updatedKey

        if (providerChanged || statusSetInactive) {
          if (!hasActiveKeyForProvider(updatedKeys, originalProvider)) {
            await deleteAIModelsByProvider(originalProvider)
          }
        }

        try {
          await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
        } catch (e) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: `Failed to update settings: ${String(e)}`,
          })
        }

        void redisCache.invalidatePattern("models:*")
        void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

        return { success: true }
      }),

    apiKeyDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .output(successOutputSchema)
      .handler(async ({ input }) => {
        const { id } = input
        const settings = await getSetting(API_KEYS_SETTING_KEY)

        if (!settings?.settingValue) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        const existingKeys = settings.settingValue as ApiKeyConfig[]
        const deletedKey = existingKeys.find((key) => key.id === id)
        const updatedKeys = existingKeys.filter((key) => key.id !== id)

        if (deletedKey) {
          if (!hasActiveKeyForProvider(updatedKeys, deletedKey.provider)) {
            await deleteAIModelsByProvider(deletedKey.provider)
          }
        }

        try {
          await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
        } catch (e) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: `Failed to update settings: ${String(e)}`,
          })
        }

        void redisCache.invalidatePattern("models:*")
        void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

        return { success: true }
      }),

    apiKeyStats: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .output(apiKeyStatsOutputSchema)
      .handler(async () => {
        const cacheKey = "admin:metrics:api_key_stats"
        const cached = await redisCache.getCache<{
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
        const activeKeys = apiKeys.filter(
          (key) => key.status === "active",
        ).length

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

        void redisCache.setCache(cacheKey, stats, MODEL_CACHE_TTL)

        return stats
      }),

    modelList: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .output(z.array(aiModelSchema))
      .handler(() => listAIModels()),

    modelCreate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(adminModelCreateInputSchema)
      .output(aiModelSchema)
      .handler(async ({ input }) => {
        const existing = await findAIModelByProviderAndModelId(
          input.provider,
          input.modelId,
        )

        if (existing) {
          throw new ORPCError("CONFLICT", {
            status: 409,
            message: `Model "${input.modelId}" already exists for provider "${input.provider}"`,
          })
        }

        return createAIModel(input)
      }),

    modelUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(adminModelUpdateInputSchema)
      .output(aiModelSchema)
      .handler(async ({ input }) => {
        const { id, ...data } = input
        const existing = await findAIModelById(id)

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `AI model not found: ${id}`,
          })
        }

        return updateAIModelById(id, {
          provider: data.provider,
          modelId: data.modelId,
          displayName: data.displayName,
          isEnabled: data.isEnabled,
        })
      }),

    modelDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .output(successOutputSchema)
      .handler(async ({ input }) => {
        const { id } = input
        const existing = await findAIModelById(id)

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `AI model not found: ${id}`,
          })
        }

        await deleteAIModelById(id)
        return { success: true }
      }),

    assetSettingsGet: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .output(assetSettingsOutputSchema)
      .handler(async () => {
        const maxUploadSizeMB = await getOrCompute(
          redisCache,
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

    assetSettingsUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(updateAssetSettingsInputSchema)
      .output(successOutputSchema)
      .handler(async ({ input }) => {
        const { maxUploadSizeMB } = input

        await upsertSetting(ASSETS_MAX_SIZE_KEY, maxUploadSizeMB)

        void redisCache.deleteCache(`settings:${ASSETS_MAX_SIZE_KEY}`)

        return { success: true }
      }),

    activity: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .handler(async () => {
        const cacheKey = "admin:metrics:activity_feed"
        const cached = await redisCache.getCache<
          {
            type: string
            message: string
            timestamp: Date
          }[]
        >(cacheKey)

        if (cached) {
          return cached
        }

        void redisCache.setCache(cacheKey, [], MODEL_CACHE_TTL)

        return []
      }),

    aiRequestsHistory: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(adminAiRequestsHistoryInputSchema)
      .handler(async ({ input }) => {
        const { timeRange } = input
        const cacheKey = `admin:metrics:ai_requests_history:${timeRange}`
        const cached = await redisCache.getCache<{
          dataPoints: { date: string; requests: number }[]
        }>(cacheKey)

        if (cached) {
          return cached
        }

        const now = new Date()
        const days = timeRange === "7d" ? 7 : 30
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

        const dataPointsMap = new Map<
          string,
          { date: string; requests: number }
        >()

        for (let i = 0; i < days; i++) {
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
        void redisCache.setCache(cacheKey, result, MODEL_CACHE_TTL)

        return result
      }),
  },
}
