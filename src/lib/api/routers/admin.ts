import { eq } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure } from "@/lib/api/orpc"
import { adminSettingsTable } from "@/lib/db/schema"
import {
  addApiKeyInputSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@/lib/schemas/api-keys"
import { failure, success, type Result } from "@/lib/types/result"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/utils/crypto"
import { createCustomId } from "@/lib/utils/custom-id"

const API_KEYS_SETTING_KEY = "api_keys"
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const MODEL_CACHE_PREFIX = "models:"
const MODEL_CACHE_TTL = 300

export const adminRouter = {
  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

    if (!settings?.settingValue) {
      return []
    }

    const apiKeys = settings.settingValue as ApiKeyConfig[]

    return apiKeys.map((key) => {
      try {
        const decrypted = decryptApiKey(key.apiKey)
        return {
          ...key,
          apiKey: maskApiKey(decrypted),
        }
      } catch (error) {
        console.error(`Failed to decrypt API key ${key.id}:`, error)
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
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

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

      if (settings) {
        await context.db
          .update(adminSettingsTable)
          .set({
            settingValue: updatedKeys,
            updatedAt: new Date(),
          })
          .where(eq(adminSettingsTable.id, settings.id))
      } else {
        await context.db.insert(adminSettingsTable).values({
          settingKey: API_KEYS_SETTING_KEY,
          settingValue: updatedKeys,
        })
      }

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)

      return { success: true, id: newKey.id }
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

      if (!settings?.settingValue) {
        throw new Error("No API keys found")
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

      if (keyIndex === -1) {
        throw new Error("API key not found")
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

      await context.db
        .update(adminSettingsTable)
        .set({
          settingValue: updatedKeys,
          updatedAt: new Date(),
        })
        .where(eq(adminSettingsTable.id, settings.id))

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)

      return { success: true }
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

      if (!settings?.settingValue) {
        throw new Error("No API keys found")
      }

      const existingKeys = settings.settingValue as ApiKeyConfig[]
      const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

      await context.db
        .update(adminSettingsTable)
        .set({
          settingValue: updatedKeys,
          updatedAt: new Date(),
        })
        .where(eq(adminSettingsTable.id, settings.id))

      await context.redis.invalidatePattern(`${MODEL_CACHE_PREFIX}*`)

      return { success: true }
    }),

  getApiKeyStats: adminProcedure.handler(() => {
    return {
      totalRequests: 0,
      activeKeys: 0,
      monthlyCost: 0,
      requestsThisMonth: 0,
      costChange: 0,
    }
  }),

  getAvailableModels: adminProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, API_KEYS_SETTING_KEY))

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
          console.error(`Failed to fetch models for ${provider}:`, result.error)
          return { provider, models: [] as { id: string; name: string }[] }
        } catch (error) {
          console.error(`Failed to fetch models for ${provider}:`, error)
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
    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY))

    return {
      maxUploadSizeMB:
        settings && typeof settings.settingValue === "number"
          ? settings.settingValue
          : 50,
    }
  }),

  updateAssetSettings: adminProcedure
    .input(z.object({ maxUploadSizeMB: z.number().min(1).max(500) }))
    .handler(async ({ context, input }) => {
      const [existing] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY))

      if (existing) {
        await context.db
          .update(adminSettingsTable)
          .set({
            settingValue: input.maxUploadSizeMB,
            updatedAt: new Date(),
          })
          .where(eq(adminSettingsTable.id, existing.id))
      } else {
        await context.db.insert(adminSettingsTable).values({
          settingKey: ASSETS_MAX_SIZE_KEY,
          settingValue: input.maxUploadSizeMB,
        })
      }

      return { success: true }
    }),
}

async function fetchModelsForProvider(
  provider: ApiKeyConfig["provider"],
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  switch (provider) {
    case "openai":
      return await fetchOpenAIModels(apiKey)
    case "anthropic":
      return await fetchAnthropicModels(apiKey)
    case "google":
      return await fetchGoogleModels(apiKey)
    case "mistral":
      return await fetchMistralModels(apiKey)
    case "azure":
      return fetchAzureModels(apiKey)
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
    const filteredModels =
      data.data
        ?.filter(
          (m: { id: string }) =>
            m.id.includes("gpt") && !m.id.includes("instruct"),
        )
        .map((m: { id: string }) => ({
          id: m.id,
          name: m.id.toUpperCase().replace(/-/g, " "),
        })) ?? []

    const sortedModels = filteredModels.sort(
      (a: { id: string }, b: { id: string }) => {
        if (a.id === "gpt-4o") return -1
        if (b.id === "gpt-4o") return 1
        if (a.id === "gpt-4o-mini") return -1
        if (b.id === "gpt-4o-mini") return 1
        if (a.id.startsWith("gpt-4") && !b.id.startsWith("gpt-4")) return 1
        if (b.id.startsWith("gpt-4") && !a.id.startsWith("gpt-4")) return -1
        return 0
      },
    )

    return success(sortedModels)
  } catch (error) {
    return failure({
      provider: "openai",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function fetchAnthropicModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })
    if (!response.ok) {
      return failure({
        provider: "anthropic",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      })
    }
    const data = await response.json()
    const models =
      data.data?.map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name ?? m.id,
      })) ?? []
    return success(models)
  } catch (error) {
    return failure({
      provider: "anthropic",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function fetchGoogleModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (!response.ok) {
      return failure({
        provider: "google",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      })
    }
    const data = await response.json()
    const models =
      data.models
        ?.filter(
          (m: { name: string; supportedGenerationMethods?: string[] }) =>
            m.name.includes("gemini") &&
            m.supportedGenerationMethods?.includes("generateContent"),
        )
        .map((m: { name: string; displayName?: string }) => {
          const id = m.name.replace("models/", "")
          return {
            id,
            name: m.displayName ?? id,
          }
        }) ?? []
    return success(models)
  } catch (error) {
    return failure({
      provider: "google",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

async function fetchMistralModels(
  apiKey: string,
): Promise<Result<{ id: string; name: string }[]>> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) {
      return failure({
        provider: "mistral",
        errorType: response.status === 401 ? "auth" : "network",
        message: `API request failed with status ${response.status}`,
      })
    }
    const data = await response.json()
    const models =
      data.data?.map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
      })) ?? []
    return success(models)
  } catch (error) {
    return failure({
      provider: "mistral",
      errorType: "network",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

function fetchAzureModels(
  _apiKey: string,
): Result<{ id: string; name: string }[]> {
  return success([])
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
