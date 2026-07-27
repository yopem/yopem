import type { ApiKeyConfig } from "server/llm/api-keys-schema"

import { ORPCError } from "@orpc/server"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  updateApiKeyInputSchema,
} from "server/llm/api-keys-schema"
import { testApiKey } from "server/llm/test-key"
import { enforceRateLimit } from "server/rate-limit"
import { decryptApiKey, encryptApiKey, maskApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
import {
  getUserRuns,
  getUserSettings,
  getUserStats,
  upsertUserSettings,
} from "db/services/user"
import { createCustomId } from "utils/custom-id"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const userMeOutputSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  username: z.string(),
  image: z.string().nullable(),
})

const userUpdateInputSchema = z.object({
  name: z.string().optional(),
  image: z.string().optional(),
})

const userStatsOutputSchema = z.object({
  balance: z.string(),
  overflowBalance: z.string(),
  totalUsed: z.union([z.string(), z.null()]),
  totalPurchased: z.union([z.string(), z.null()]),
  totalRuns: z.number(),
})

const userRunsInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
})

const apiKeyIdInputSchema = z.object({ id: z.string() })

const apiKeyStatsOutputSchema = z.object({ activeKeys: z.number() })

const apiKeyDeleteOutputSchema = z.object({
  success: z.boolean(),
  id: z.string(),
})

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
        const settings = await getUserSettings(context.session.id)

        if (!settings?.apiKeys) {
          return []
        }

        let apiKeys: ApiKeyConfig[]
        try {
          apiKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        } catch {
          console.error("Error parsing API keys")
          return []
        }

        const processedKeys = apiKeys.map((key) => {
          const decrypted = decryptApiKey(key.apiKey)
          return {
            ...key,
            apiKey: decrypted
              ? maskApiKey(decrypted)
              : "Error: Failed to decrypt",
          }
        })

        return processedKeys
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

        const settings = await getUserSettings(context.session.id)

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

        let existingKeys: ApiKeyConfig[] = []

        if (settings?.apiKeys) {
          try {
            existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
          } catch {
            console.error("Error parsing existing API keys")
          }
        }

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

        const settings = await getUserSettings(context.session.id)

        if (!settings?.apiKeys) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        let existingKeys: ApiKeyConfig[]
        try {
          existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        } catch (e) {
          console.error("Error parsing existing API keys:", e)
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Failed to parse existing API keys",
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
          ...input,
          apiKey: encryptedApiKey,
          updatedAt: new Date().toISOString(),
        }

        const updatedKeys = [...existingKeys]
        updatedKeys[keyIndex] = updatedKey

        await upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        const decryptedKey = decryptApiKey(
          input.apiKey ?? existingKeys[keyIndex].apiKey,
        )
        const maskedKey = decryptedKey
          ? maskApiKey(decryptedKey)
          : "Error: Failed to decrypt"

        return {
          ...updatedKey,
          apiKey: maskedKey,
        }
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

        const settings = await getUserSettings(context.session.id)

        if (!settings?.apiKeys) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "No API keys found",
          })
        }

        let existingKeys: ApiKeyConfig[]
        try {
          existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        } catch (e) {
          console.error("Error parsing API keys:", e)
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Failed to parse API keys",
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
        const settings = await getUserSettings(context.session.id)

        let activeKeys = 0

        if (settings?.apiKeys) {
          try {
            const parsedKeys = apiKeyConfigSchema
              .array()
              .parse(settings.apiKeys)
            activeKeys = parsedKeys.filter(
              (key) => key.status === "active",
            ).length
          } catch {
            console.error("Error parsing API keys")
          }
        }

        return { activeKeys }
      }),
  },
}
