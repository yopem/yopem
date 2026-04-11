import { ORPCError } from "@orpc/server"
import { adminProcedure, protectedProcedure } from "server/orpc"
import { checkRateLimit, RATE_LIMITS } from "server/rate-limit"
import { z } from "zod"

import * as subscriptionService from "db/services/subscriptions"
import * as userService from "db/services/user"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "shared/api-keys-schema"
import { decryptApiKey, encryptApiKey, maskApiKey } from "shared/crypto"
import { createCustomId } from "shared/custom-id"

import { getEntitlements } from "../payments/entitlements"
import {
  createCustomerPortalSession,
  createSubscriptionCheckout,
} from "../payments/subscription-checkout"
import { getPlanConfig, listPlans } from "../payments/subscription-plans"

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

  getStats: protectedProcedure.handler(async ({ context }) => {
    const result = await userService.getUserStats(context.session.id)
    return result
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
    .handler(async ({ context, input }) => {
      const result = await userService.getUserRuns(context.session.id, {
        limit: input?.limit ?? 20,
        cursor: input?.cursor,
      })
      return result
    }),

  getCredits: protectedProcedure.handler(async ({ context }) => {
    const result = await userService.getUserCredits(context.session.id)
    return result
  }),

  getSubscription: protectedProcedure.handler(async ({ context }) => {
    try {
      const result = await getEntitlements(context.session.id)
      return result
    } catch (error) {
      console.error(
        `Failed to get subscription for user ${context.session.id}: ${error instanceof Error ? error.message : String(error)}`,
      )
      const freePlan = getPlanConfig("free")
      return {
        tier: "free" as const,
        status: "active" as const,
        limits: freePlan.limits,
        features: freePlan.features,
        isPaid: false,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      }
    }
  }),

  getSubscriptionPlans: protectedProcedure.handler(() => {
    const plans = listPlans()
    return plans.map((plan) => ({
      tier: plan.tier,
      name: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      limits: plan.limits,
      features: plan.features,
    }))
  }),

  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["pro", "enterprise"]),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const result = await createSubscriptionCheckout(
          context.session.id,
          context.session.email,
          null,
          input.tier,
        )
        return {
          url: result.url,
          checkoutId: result.checkoutId,
        }
      } catch (error) {
        console.error(
          `Failed to create checkout for user ${context.session.id}: ${error instanceof Error ? error.message : String(error)}`,
        )
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to create checkout session",
        })
      }
    }),

  createBillingPortal: protectedProcedure.handler(async ({ context }) => {
    const subscription = await subscriptionService.getSubscription(
      context.session.id,
    )

    if (!subscription) {
      throw new ORPCError("BAD_REQUEST", {
        message: "No subscription found",
      })
    }

    if (!subscription.polarCustomerId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "No customer ID found",
      })
    }

    try {
      const result = await createCustomerPortalSession(
        subscription.polarCustomerId,
      )
      return { url: result }
    } catch (error) {
      console.error(
        `Failed to create billing portal for user ${context.session.id}: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw new ORPCError("BAD_REQUEST", {
        message: "Failed to create billing portal",
      })
    }
  }),

  getTransactions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const result = await userService.getUserTransactions(context.session.id, {
        limit: input?.limit ?? 20,
      })
      return result
    }),

  getPurchases: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const result = await userService.getPaymentHistory(context.session.id, {
        limit: input?.limit ?? 20,
      })
      return result
    }),

  getPendingCheckouts: protectedProcedure.handler(async ({ context }) => {
    const result = await userService.getPendingCheckouts(context.session.id)
    return result
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
        apiKey: decrypted ? maskApiKey(decrypted) : "Error: Failed to decrypt",
      }
    })

    return processedKeys
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const rateLimitKey = `${context.session.id}:api-key:add`
      const rateLimitResult = await checkRateLimit(
        () => context.redis.getRedisClient(),
        rateLimitKey,
        RATE_LIMITS.API_KEY_ADD.maxRequests,
        RATE_LIMITS.API_KEY_ADD.windowMs,
      )

      const rateLimitCheck = rateLimitResult.ok
        ? rateLimitResult.value
        : { isLimited: false, remaining: RATE_LIMITS.API_KEY_ADD.maxRequests }

      if (rateLimitCheck?.isLimited) {
        throw new ORPCError("FORBIDDEN", {
          message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_ADD.windowMs / 60000)} minutes.`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      const encryptedKey = encryptApiKey(input.apiKey)
      if (!encryptedKey) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to encrypt API key",
        })
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
      const rateLimitResult = await checkRateLimit(
        () => context.redis.getRedisClient(),
        rateLimitKey,
        RATE_LIMITS.API_KEY_UPDATE.maxRequests,
        RATE_LIMITS.API_KEY_UPDATE.windowMs,
      )

      const rateLimitCheck = rateLimitResult.ok
        ? rateLimitResult.value
        : {
            isLimited: false,
            remaining: RATE_LIMITS.API_KEY_UPDATE.maxRequests,
          }

      if (rateLimitCheck?.isLimited) {
        throw new ORPCError("FORBIDDEN", {
          message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_UPDATE.windowMs / 60000)} minutes.`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      if (!settings?.apiKeys) {
        throw new ORPCError("NOT_FOUND", {
          message: "No API keys found",
        })
      }

      let existingKeys: ApiKeyConfig[]
      try {
        existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
      } catch (e) {
        console.error(`Error parsing existing API keys:`, e)
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to parse existing API keys",
        })
      }

      const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

      if (keyIndex === -1) {
        throw new ORPCError("NOT_FOUND", {
          message: `API key not found: ${input.id}`,
        })
      }

      let encryptedApiKey: string = existingKeys[keyIndex].apiKey
      if (input.apiKey) {
        const encryptResult = encryptApiKey(input.apiKey)
        if (!encryptResult) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to encrypt API key",
          })
        }
        encryptedApiKey = encryptResult
      }

      const updatedKey: ApiKeyConfig = {
        ...existingKeys[keyIndex],
        ...input,
        apiKey: encryptedApiKey,
        updatedAt: new Date().toISOString(),
      }

      const updatedKeys = [...existingKeys]
      updatedKeys[keyIndex] = updatedKey

      await userService.upsertUserSettings(context.session.id, {
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

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const rateLimitKey = `${context.session.id}:api-key:delete`
      const rateLimitResult = await checkRateLimit(
        () => context.redis.getRedisClient(),
        rateLimitKey,
        RATE_LIMITS.API_KEY_DELETE.maxRequests,
        RATE_LIMITS.API_KEY_DELETE.windowMs,
      )

      const rateLimitCheck = rateLimitResult.ok
        ? rateLimitResult.value
        : {
            isLimited: false,
            remaining: RATE_LIMITS.API_KEY_DELETE.maxRequests,
          }

      if (rateLimitCheck?.isLimited) {
        throw new ORPCError("FORBIDDEN", {
          message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_DELETE.windowMs / 60000)} minutes.`,
        })
      }

      const settings = await userService.getUserSettings(context.session.id)

      if (!settings?.apiKeys) {
        throw new ORPCError("NOT_FOUND", {
          message: "No API keys found",
        })
      }

      let existingKeys: ApiKeyConfig[]
      try {
        existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
      } catch (e) {
        console.error(`Error parsing API keys:`, e)
        throw new ORPCError("BAD_REQUEST", {
          message: "Failed to parse API keys",
        })
      }

      const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

      if (updatedKeys.length === existingKeys.length) {
        throw new ORPCError("NOT_FOUND", {
          message: `API key not found: ${input.id}`,
        })
      }

      await userService.upsertUserSettings(context.session.id, {
        apiKeys: updatedKeys,
      })

      return { success: true, id: input.id }
    }),

  getApiKeyStats: adminProcedure.handler(async ({ context }) => {
    const settings = await userService.getUserSettings(context.session.id)

    let activeKeys = 0

    if (settings?.apiKeys) {
      try {
        const parsedKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        activeKeys = parsedKeys.filter((key) => key.status === "active").length
      } catch {
        console.error("Error parsing API keys")
      }
    }

    return { activeKeys }
  }),

  cancelSubscription: protectedProcedure.handler(async ({ context }) => {
    const subscription = await subscriptionService.getSubscription(
      context.session.id,
    )

    if (!subscription || subscription.tier === "free") {
      throw new ORPCError("BAD_REQUEST", {
        message: "No active paid subscription found",
      })
    }

    if (subscription.status !== "active") {
      throw new ORPCError("BAD_REQUEST", {
        message: `Subscription is already ${subscription.status}`,
      })
    }

    if (subscription.cancelAtPeriodEnd) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Subscription is already set to cancel at period end",
      })
    }

    try {
      const cancelResult = await subscriptionService.cancelSubscription(
        context.session.id,
      )

      console.info(
        `Subscription cancelled for user ${context.session.id}, will end on ${cancelResult.currentPeriodEnd}`,
      )

      return {
        success: true,
        message:
          "Your subscription has been cancelled and will end at the end of the current billing period",
        currentPeriodEnd: cancelResult.currentPeriodEnd,
      }
    } catch (error) {
      console.error(
        `Failed to cancel subscription for user ${context.session.id}: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to cancel subscription",
      })
    }
  }),
}
