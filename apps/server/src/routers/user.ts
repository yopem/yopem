import { ORPCError } from "@orpc/server"
import { encryptApiKey, maskApiKey, maskApiKeyConfig } from "server/lib/crypto"
import { testApiKey } from "server/llm/test-key"
import { enforceRateLimit } from "server/middleware/rate-limit"
import * as v from "valibot"

import { redisCache } from "cache"
import {
  getUserRuns,
  getUserSettings,
  getUserStats,
  upsertUserSettings,
} from "db/services/user"
import {
  type ApiKeyConfig,
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  updateApiKeyInputSchema,
} from "utils/api-input"
import { createCustomId } from "utils/custom-id"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const userMeOutputSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.nullable(v.string()),
  username: v.string(),
  image: v.nullable(v.string()),
})

const userUpdateInputSchema = v.object({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
})

const userStatsOutputSchema = v.object({
  balance: v.string(),
  overflowBalance: v.string(),
  totalUsed: v.union([v.string(), v.null()]),
  totalPurchased: v.union([v.string(), v.null()]),
  totalRuns: v.number(),
})

const userRunsInputSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  cursor: v.optional(v.string()),
})

const apiKeyIdInputSchema = v.object({ id: v.string() })

const apiKeyStatsOutputSchema = v.object({ activeKeys: v.number() })

const apiKeyDeleteOutputSchema = v.object({
  success: v.boolean(),
  id: v.string(),
})

const getSessionApiKeys = async (
  sessionId: string,
): Promise<{ keys: ApiKeyConfig[]; exists: boolean }> => {
  const settings = await getUserSettings(sessionId)

  if (!settings?.apiKeys) {
    return { keys: [], exists: false }
  }

  try {
    const keys = v.parse(v.array(apiKeyConfigSchema), settings.apiKeys)
    return { keys, exists: true }
  } catch {
    console.error("Error parsing API keys")
    return { keys: [], exists: false }
  }
}

export const userRouter = {
  user: {
    me: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .output(userMeOutputSchema)
      .handler(({ context }) => ({
        id: context.session.id,
        email: context.session.email,
        name: context.session.name,
        username: context.session.username,
        image: context.session.image,
      })),

    update: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .input(userUpdateInputSchema)
      .handler(({ context, input }) => ({
        id: context.session.id,
        email: context.session.email,
        ...input,
      })),

    stats: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .output(userStatsOutputSchema)
      .handler(({ context }) => getUserStats(context.session.id)),

    runs: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .input(userRunsInputSchema)
      .handler(({ context, input }) =>
        getUserRuns(context.session.id, {
          limit: input.limit ?? 20,
          cursor: input.cursor,
        }),
      ),

    apiKeyList: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .handler(async ({ context }) => {
        const { keys } = await getSessionApiKeys(context.session.id)
        return keys.map(maskApiKeyConfig)
      }),

    apiKeyCreate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(addApiKeyInputSchema)
      .handler(async ({ context, input }) => {
        await enforceRateLimit(
          redisCache.getRedisClient,
          context.session.id,
          "add",
        )

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
          status: input.status,
          restrictions: input.restrictions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const { keys: existingKeys } = await getSessionApiKeys(
          context.session.id,
        )
        const updatedKeys = [...existingKeys, newKey]

        await upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        return {
          ...newKey,
          apiKey: maskApiKey(input.apiKey),
        }
      }),

    apiKeyUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(updateApiKeyInputSchema)
      .handler(async ({ context, input }) => {
        const { id } = input

        await enforceRateLimit(
          redisCache.getRedisClient,
          context.session.id,
          "update",
        )

        const { keys: existingKeys, exists } = await getSessionApiKeys(
          context.session.id,
        )

        if (!exists) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        const keyIndex = existingKeys.findIndex((key) => key.id === id)

        if (keyIndex === -1) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `API key not found: ${id}`,
          })
        }

        let encryptedApiKey: string = existingKeys[keyIndex].apiKey
        if (input.apiKey) {
          const encryptResult = encryptApiKey(input.apiKey)
          if (!encryptResult) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              status: 500,
              message: "Failed to encrypt API key",
            })
          }
          encryptedApiKey = encryptResult

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
          ...(input.provider !== undefined && {
            provider: input.provider,
          }),
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.restrictions !== undefined && {
            restrictions: input.restrictions,
          }),
          apiKey: encryptedApiKey,
          updatedAt: new Date().toISOString(),
        }

        const updatedKeys = [...existingKeys]
        updatedKeys[keyIndex] = updatedKey

        await upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        return maskApiKeyConfig(updatedKey)
      }),

    apiKeyDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(apiKeyIdInputSchema)
      .output(apiKeyDeleteOutputSchema)
      .handler(async ({ context, input }) => {
        const { id } = input

        await enforceRateLimit(
          redisCache.getRedisClient,
          context.session.id,
          "delete",
        )

        const { keys: existingKeys, exists } = await getSessionApiKeys(
          context.session.id,
        )

        if (!exists) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        const updatedKeys = existingKeys.filter((key) => key.id !== id)

        if (updatedKeys.length === existingKeys.length) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `API key not found: ${id}`,
          })
        }

        await upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        return { success: true, id }
      }),

    apiKeyStats: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .output(apiKeyStatsOutputSchema)
      .handler(async ({ context }) => {
        const { keys } = await getSessionApiKeys(context.session.id)
        return {
          activeKeys: keys.filter((key) => key.status === "active").length,
        }
      }),
  },
}
