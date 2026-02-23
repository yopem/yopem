import { ORPCError } from "@orpc/server"
import * as userService from "@repo/db/services/user"
import { formatError, logger } from "@repo/logger"
import {
  MAX_TOPUP_AMOUNT,
  MIN_TOPUP_AMOUNT,
} from "@repo/payments/credit-calculation"
import { adminProcedure, protectedProcedure } from "@repo/server/orpc"
import { checkRateLimit, RATE_LIMITS } from "@repo/server/rate-limit"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@repo/utils/api-keys-schema"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@repo/utils/crypto"
import { createCustomId } from "@repo/utils/custom-id"
import { z } from "zod"

export const userRouter = {
  getProfile: protectedProcedure.handler(({ context }) => {
    return {
      id: context.session.id,
      email: context.session.email,
      name: context.session.name,
      username: context.session.username,
      image: context.session.image,
    }
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .handler(({ context, input }) => {
      return {
        id: context.session.id,
        email: context.session.email,
        ...input,
      }
    }),

  getStats: protectedProcedure.handler(({ context }) => {
    return userService.getUserStats(context.session.id)
  }),

  getRuns: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .handler(({ context, input }) => {
      return userService.getUserRuns(context.session.id, {
        limit: input?.limit ?? 20,
        cursor: input?.cursor,
      })
    }),

  getCredits: protectedProcedure.handler(({ context }) => {
    return userService.getUserCredits(context.session.id)
  }),

  getTransactions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional(),
    )
    .handler(({ context, input }) => {
      return userService.getUserTransactions(context.session.id, {
        limit: input?.limit ?? 20,
      })
    }),

  getPurchases: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional(),
    )
    .handler(({ context, input }) => {
      return userService.getPaymentHistory(context.session.id, {
        limit: input?.limit ?? 20,
      })
    }),

  getPendingCheckouts: protectedProcedure.handler(({ context }) => {
    return userService.getPendingCheckouts(context.session.id)
  }),

  addCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await userService.addCredits(context.session.id, input.amount)
      return { success: true, amount: input.amount }
    }),

  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const settings = await userService.getUserSettings(context.session.id)

    if (!settings?.apiKeys) {
      return []
    }

    try {
      const apiKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)

      return apiKeys.map((key) => ({
        ...key,
        apiKey: maskApiKey(decryptApiKey(key.apiKey)),
      }))
    } catch (error) {
      logger.error(`Error parsing API keys: ${formatError(error)}`)
      return []
    }
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const rateLimitKey = `${context.session.id}:api-key:add`
      const redisClient = await context.redis.getRedisClient()
      const { isLimited, remaining } = await checkRateLimit(
        () => Promise.resolve(redisClient),
        rateLimitKey,
        RATE_LIMITS.API_KEY_ADD.maxRequests,
        RATE_LIMITS.API_KEY_ADD.windowMs,
      )

      if (isLimited) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      const newKey: ApiKeyConfig = {
        id: createCustomId(),
        provider: input.provider,
        name: input.name,
        description: input.description,
        apiKey: encryptApiKey(input.apiKey),
        status: input.status,
        restrictions: input.restrictions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      let existingKeys: ApiKeyConfig[] = []

      if (settings?.apiKeys) {
        try {
          existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        } catch (error) {
          logger.error(`Error parsing existing API keys: ${formatError(error)}`)
        }
      }

      const updatedKeys = [...existingKeys, newKey]

      await userService.upsertUserSettings(context.session.id, {
        apiKeys: updatedKeys,
      })

      return {
        ...newKey,
        apiKey: maskApiKey(input.apiKey),
      }
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const rateLimitKey = `${context.session.id}:api-key:update`
      const redisClient = await context.redis.getRedisClient()
      const { isLimited, remaining } = await checkRateLimit(
        () => Promise.resolve(redisClient),
        rateLimitKey,
        RATE_LIMITS.API_KEY_UPDATE.maxRequests,
        RATE_LIMITS.API_KEY_UPDATE.windowMs,
      )

      if (isLimited) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      if (!settings?.apiKeys) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      try {
        const existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

        if (keyIndex === -1) {
          throw new ORPCError("NOT_FOUND", { message: "API key not found" })
        }

        const updatedKey: ApiKeyConfig = {
          ...existingKeys[keyIndex],
          ...input,
          apiKey: input.apiKey
            ? encryptApiKey(input.apiKey)
            : existingKeys[keyIndex].apiKey,
          updatedAt: new Date().toISOString(),
        }

        const updatedKeys = [...existingKeys]
        updatedKeys[keyIndex] = updatedKey

        await userService.upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        return {
          ...updatedKey,
          apiKey: maskApiKey(
            input.apiKey ?? decryptApiKey(existingKeys[keyIndex].apiKey),
          ),
        }
      } catch (error) {
        logger.error(`Error updating API key: ${formatError(error)}`)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update API key",
        })
      }
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const rateLimitKey = `${context.session.id}:api-key:delete`
      const redisClient = await context.redis.getRedisClient()
      const { isLimited, remaining } = await checkRateLimit(
        () => Promise.resolve(redisClient),
        rateLimitKey,
        RATE_LIMITS.API_KEY_DELETE.maxRequests,
        RATE_LIMITS.API_KEY_DELETE.windowMs,
      )

      if (isLimited) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      if (!settings?.apiKeys) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      try {
        const existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

        if (updatedKeys.length === existingKeys.length) {
          throw new ORPCError("NOT_FOUND", { message: "API key not found" })
        }

        await userService.upsertUserSettings(context.session.id, {
          apiKeys: updatedKeys,
        })

        return { success: true, id: input.id }
      } catch (error) {
        logger.error(`Error deleting API key: ${formatError(error)}`)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to delete API key",
        })
      }
    }),

  getApiKeyStats: adminProcedure.handler(async ({ context }) => {
    const settings = await userService.getUserSettings(context.session.id)

    let activeKeys = 0

    if (settings?.apiKeys) {
      try {
        const apiKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        activeKeys = apiKeys.filter((key) => key.status === "active").length
      } catch (error) {
        logger.error(`Error parsing API keys: ${formatError(error)}`)
      }
    }

    return { activeKeys }
  }),

  getAutoTopupSettings: protectedProcedure.handler(async ({ context }) => {
    const credits = await userService.getUserCredits(context.session.id)

    return credits
      ? {
          enabled: credits.autoTopupEnabled,
          threshold: credits.autoTopupThreshold
            ? Number(credits.autoTopupThreshold)
            : null,
          amount: credits.autoTopupAmount
            ? Number(credits.autoTopupAmount)
            : null,
        }
      : {
          enabled: false,
          threshold: null,
          amount: null,
        }
  }),

  updateAutoTopupSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        threshold: z
          .number()
          .min(MIN_TOPUP_AMOUNT)
          .max(MAX_TOPUP_AMOUNT)
          .optional(),
        amount: z
          .number()
          .min(MIN_TOPUP_AMOUNT)
          .max(MAX_TOPUP_AMOUNT)
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      if (input.enabled && (!input.threshold || !input.amount)) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Both threshold and amount are required when enabling auto-topup",
        })
      }

      if (
        input.enabled &&
        input.threshold &&
        input.amount &&
        input.threshold >= input.amount
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Threshold must be less than top-up amount",
        })
      }

      await userService.updateAutoTopup(context.session.id, {
        enabled: input.enabled,
        threshold: input.threshold,
        amount: input.amount,
      })

      return {
        success: true,
        enabled: input.enabled,
        threshold: input.threshold ?? null,
        amount: input.amount ?? null,
      }
    }),
}
