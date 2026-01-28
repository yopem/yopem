/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/require-await */
import { eq } from "drizzle-orm"

import { adminProcedure } from "@/lib/api/orpc"
import { adminSettingsTable } from "@/lib/db/schema"
import {
  addApiKeyInputSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@/lib/schemas/api-keys"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/utils/crypto"
import { createCustomId } from "@/lib/utils/custom-id"

const API_KEYS_SETTING_KEY = "api_keys"
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

  getApiKeyStats: adminProcedure.handler(async () => {
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

    const modelsByProvider: Record<string, { id: string; name: string }[]> = {}

    for (const key of activeKeys) {
      if (!modelsByProvider[key.provider]) {
        const cacheKey = `${MODEL_CACHE_PREFIX}${key.provider}:${key.id}`
        const cached =
          await context.redis.getCache<{ id: string; name: string }[]>(cacheKey)

        if (cached) {
          modelsByProvider[key.provider] = cached
        } else {
          try {
            const decryptedKey = decryptApiKey(key.apiKey)
            const models = await fetchModelsForProvider(
              key.provider,
              decryptedKey,
            )
            modelsByProvider[key.provider] = models
            await context.redis.setCache(cacheKey, models, MODEL_CACHE_TTL)
          } catch (error) {
            console.error(`Failed to fetch models for ${key.provider}:`, error)
            modelsByProvider[key.provider] = []
          }
        }
      }
    }

    const allModels: { id: string; name: string; provider: string }[] = []
    for (const [provider, models] of Object.entries(modelsByProvider)) {
      for (const model of models) {
        allModels.push({ ...model, provider })
      }
    }

    return allModels
  }),
}

async function fetchModelsForProvider(
  provider: ApiKeyConfig["provider"],
  apiKey: string,
): Promise<{ id: string; name: string }[]> {
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
      return await fetchAzureModels(apiKey)
    case "openrouter":
      return await fetchOpenRouterModels(apiKey)
    default:
      return []
  }
}

async function fetchOpenAIModels(apiKey: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) return []
    const data = await response.json()
    return (
      data.data
        ?.filter(
          (m: { id: string }) =>
            m.id.includes("gpt") && !m.id.includes("instruct"),
        )
        .map((m: { id: string }) => ({
          id: m.id,
          name: m.id.toUpperCase().replace(/-/g, " "),
        })) ?? []
    )
  } catch {
    return []
  }
}

async function fetchAnthropicModels(apiKey: string) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })
    if (!response.ok) return []
    const data = await response.json()
    return (
      data.data?.map((m: { id: string; display_name?: string }) => ({
        id: m.id,
        name: m.display_name ?? m.id,
      })) ?? []
    )
  } catch {
    return []
  }
}

async function fetchGoogleModels(apiKey: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (!response.ok) return []
    const data = await response.json()
    return (
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
    )
  } catch {
    return []
  }
}

async function fetchMistralModels(apiKey: string) {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) return []
    const data = await response.json()
    return (
      data.data?.map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
      })) ?? []
    )
  } catch {
    return []
  }
}

async function fetchAzureModels(_apiKey: string) {
  return []
}

async function fetchOpenRouterModels(apiKey: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) return []
    const data = await response.json()
    return (
      data.data?.map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name ?? m.id,
      })) ?? []
    )
  } catch {
    return []
  }
}
