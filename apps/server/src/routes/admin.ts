import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import {
  addApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "server/llm/api-keys-schema"
import { testApiKey } from "server/llm/test-key"
import { requireAdmin, requireAuth } from "server/middleware"
import { decryptApiKey, encryptApiKey, maskApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
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

import { idParamSchema, jsonOkResponse, cursorQuerySchema } from "./common"

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

export const adminApp = new OpenAPIHono<AppContext>()

adminApp.use("*", requireAuth, requireAdmin)

const apiKeysRoute = createRoute({
  method: "get",
  path: "/api-keys",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(apiKeysRoute, async (c) => {
  const apiKeys = await getOrCompute(
    redisCache,
    `settings:${API_KEYS_SETTING_KEY}`,
    async () => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)
      return (settings?.settingValue as ApiKeyConfig[] | undefined) ?? []
    },
    SETTINGS_CACHE_TTL,
  )

  return c.json(apiKeys.map(formatApiKey), 200)
})

const addApiKeyRoute = createRoute({
  method: "post",
  path: "/api-keys",
  tags: ["admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addApiKeyInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean(), id: z.string() })),
  },
})

adminApp.openapi(addApiKeyRoute, async (c) => {
  const input = c.req.valid("json")
  const settings = await getSetting(API_KEYS_SETTING_KEY)
  const existingKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []

  const encryptedKey = encryptApiKey(input.apiKey)
  if (!encryptedKey) {
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: "Failed to encrypt API key",
    })
  }

  if (!input.skipValidation) {
    const validation = await testApiKey(input.provider, input.apiKey)
    if (!validation.valid) {
      throw new ApiError("BAD_REQUEST", {
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
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: `Failed to update settings: ${String(e)}`,
    })
  }

  void redisCache.invalidatePattern("models:*")
  void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

  return c.json({ success: true, id: newKey.id }, 200)
})

const updateApiKeyRoute = createRoute({
  method: "patch",
  path: "/api-keys/:id",
  tags: ["admin"],
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateApiKeyInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

adminApp.openapi(updateApiKeyRoute, async (c) => {
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")
  const settings = await getSetting(API_KEYS_SETTING_KEY)

  if (!settings?.settingValue) {
    throw new ApiError("NOT_FOUND", { message: "No API keys found" })
  }

  const existingKeys = settings.settingValue as ApiKeyConfig[]
  const keyIndex = existingKeys.findIndex((key) => key.id === id)

  if (keyIndex === -1) {
    throw new ApiError("NOT_FOUND", {
      message: `API key not found: ${id}`,
    })
  }

  let newApiKey: string | undefined
  if (input.apiKey) {
    const encryptResult = encryptApiKey(input.apiKey)
    if (!encryptResult) {
      throw new ApiError("INTERNAL_SERVER_ERROR", {
        message: "Failed to encrypt API key",
      })
    }
    newApiKey = encryptResult

    if (!input.skipValidation) {
      const provider = input.provider ?? existingKeys[keyIndex].provider
      const validation = await testApiKey(provider, input.apiKey)
      if (!validation.valid) {
        throw new ApiError("BAD_REQUEST", {
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
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: `Failed to update settings: ${String(e)}`,
    })
  }

  void redisCache.invalidatePattern("models:*")
  void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

  return c.json({ success: true }, 200)
})

const deleteApiKeyRoute = createRoute({
  method: "delete",
  path: "/api-keys/:id",
  tags: ["admin"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

adminApp.openapi(deleteApiKeyRoute, async (c) => {
  const { id } = c.req.valid("param")
  const settings = await getSetting(API_KEYS_SETTING_KEY)

  if (!settings?.settingValue) {
    throw new ApiError("NOT_FOUND", { message: "No API keys found" })
  }

  const existingKeys = settings.settingValue as ApiKeyConfig[]
  const updatedKeys = existingKeys.filter((key) => key.id !== id)

  try {
    await upsertSetting(API_KEYS_SETTING_KEY, updatedKeys)
  } catch (e) {
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: `Failed to update settings: ${String(e)}`,
    })
  }

  void redisCache.invalidatePattern("models:*")
  void redisCache.deleteCache(`settings:${API_KEYS_SETTING_KEY}`)

  return c.json({ success: true }, 200)
})

const apiKeyStatsRoute = createRoute({
  method: "get",
  path: "/api-keys/stats",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(apiKeyStatsRoute, async (c) => {
  const cacheKey = "admin:metrics:api_key_stats"
  const cached = await redisCache.getCache<{
    totalRequests: number
    activeKeys: number
    monthlyCost: number
    requestsThisMonth: number
    costChange: string
  }>(cacheKey)

  if (cached) {
    return c.json(cached, 200)
  }

  const [settings, rawStats] = await Promise.all([
    getSetting(API_KEYS_SETTING_KEY),
    getApiKeyStats(),
  ])

  const apiKeys = (settings?.settingValue as ApiKeyConfig[]) ?? []
  const activeKeys = apiKeys.filter((key) => key.status === "active").length

  const { totalRequests, requestsThisMonth, monthlyCost, previousMonthCost } =
    rawStats

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

  return c.json(stats, 200)
})

const modelsRoute = createRoute({
  method: "get",
  path: "/models",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(modelsRoute, (c) => {
  return c.json(listAIModels(), 200)
})

const addModelInputSchema = z.object({
  provider: z.string(),
  modelId: z.string().min(1),
  displayName: z.string().min(1),
  isEnabled: z.boolean().default(true),
})

const addModelRoute = createRoute({
  method: "post",
  path: "/models",
  tags: ["admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addModelInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(addModelRoute, async (c) => {
  const input = c.req.valid("json")
  const existing = await findAIModelByProviderAndModelId(
    input.provider,
    input.modelId,
  )

  if (existing) {
    throw new ApiError("CONFLICT", {
      message: `Model "${input.modelId}" already exists for provider "${input.provider}"`,
    })
  }

  return c.json(await createAIModel(input), 200)
})

const updateModelInputSchema = z.object({
  provider: z.string().optional(),
  modelId: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
})

const updateModelRoute = createRoute({
  method: "patch",
  path: "/models/:id",
  tags: ["admin"],
  request: {
    params: idParamSchema,
    body: {
      content: {
        "application/json": {
          schema: updateModelInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(updateModelRoute, async (c) => {
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")
  const existing = await findAIModelById(id)

  if (!existing) {
    throw new ApiError("NOT_FOUND", {
      message: `AI model not found: ${id}`,
    })
  }

  return c.json(
    await updateAIModelById(id, {
      provider: input.provider,
      modelId: input.modelId,
      displayName: input.displayName,
      isEnabled: input.isEnabled,
    }),
    200,
  )
})

const deleteModelRoute = createRoute({
  method: "delete",
  path: "/models/:id",
  tags: ["admin"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

adminApp.openapi(deleteModelRoute, async (c) => {
  const { id } = c.req.valid("param")
  const existing = await findAIModelById(id)

  if (!existing) {
    throw new ApiError("NOT_FOUND", {
      message: `AI model not found: ${id}`,
    })
  }

  await deleteAIModelById(id)
  return c.json({ success: true }, 200)
})

const assetSettingsRoute = createRoute({
  method: "get",
  path: "/asset-settings",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(assetSettingsRoute, async (c) => {
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

  return c.json({ maxUploadSizeMB }, 200)
})

const updateAssetSettingsInputSchema = z.object({
  maxUploadSizeMB: z.number().min(1).max(500),
})

const updateAssetSettingsRoute = createRoute({
  method: "patch",
  path: "/asset-settings",
  tags: ["admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateAssetSettingsInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean() })),
  },
})

adminApp.openapi(updateAssetSettingsRoute, async (c) => {
  const { maxUploadSizeMB } = c.req.valid("json")

  await upsertSetting(ASSETS_MAX_SIZE_KEY, maxUploadSizeMB)

  void redisCache.deleteCache(`settings:${ASSETS_MAX_SIZE_KEY}`)

  return c.json({ success: true }, 200)
})

const activityRoute = createRoute({
  method: "get",
  path: "/activity",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(activityRoute, async (c) => {
  const cacheKey = "admin:metrics:activity_feed"
  const cached = await redisCache.getCache<
    {
      type: string
      message: string
      timestamp: Date
    }[]
  >(cacheKey)

  if (cached) {
    return c.json(cached, 200)
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

  void redisCache.setCache(cacheKey, activities, MODEL_CACHE_TTL)

  return c.json(activities, 200)
})

const aiRequestsHistoryQuerySchema = z.object({
  timeRange: z.enum(["7d", "30d"]).default("7d"),
})

const aiRequestsHistoryRoute = createRoute({
  method: "get",
  path: "/ai-requests-history",
  tags: ["admin"],
  request: {
    query: aiRequestsHistoryQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(aiRequestsHistoryRoute, async (c) => {
  const { timeRange } = c.req.valid("query")
  const cacheKey = `admin:metrics:ai_requests_history:${timeRange}`
  const cached = await redisCache.getCache<{
    dataPoints: { date: string; requests: number }[]
  }>(cacheKey)

  if (cached) {
    return c.json(cached, 200)
  }

  const now = new Date()
  const days = timeRange === "7d" ? 7 : 30
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const dataPointsMap = new Map<string, { date: string; requests: number }>()

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
  void redisCache.setCache(cacheKey, result, MODEL_CACHE_TTL)

  return c.json(result, 200)
})

const subscriptionStatsRoute = createRoute({
  method: "get",
  path: "/subscription-stats",
  tags: ["admin"],
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(subscriptionStatsRoute, async (c) => {
  const [stats, revenue] = await Promise.all([
    getSubscriptionStats(),
    getRevenueStats(),
  ])

  return c.json({ ...stats, revenue }, 200)
})

const subscriptionsQuerySchema = cursorQuerySchema.extend({
  status: z.enum(["active", "cancelled", "past_due", "expired"]).optional(),
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
})

const subscriptionsRoute = createRoute({
  method: "get",
  path: "/subscriptions",
  tags: ["admin"],
  request: {
    query: subscriptionsQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

adminApp.openapi(subscriptionsRoute, async (c) => {
  const { limit, cursor, status, tier } = c.req.valid("query")

  return c.json(
    await getSubscriptionsList({
      limit: limit ?? 20,
      cursor,
      status,
      tier,
    }),
    200,
  )
})
