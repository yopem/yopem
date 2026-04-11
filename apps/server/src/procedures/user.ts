import { Result } from "better-result"
import { adminProcedure, protectedProcedure } from "server/orpc"
import { checkRateLimit, RATE_LIMITS } from "server/rate-limit"
import { z } from "zod"

import * as subscriptionService from "db/services/subscriptions"
import * as userService from "db/services/user"
import { formatError, logger } from "logger"
import { getEntitlements } from "payments/entitlements"
import {
  createCustomerPortalSession,
  createSubscriptionCheckout,
} from "payments/subscription-checkout"
import { getPlanConfig, listPlans } from "payments/subscription-plans"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "shared/api-keys-schema"
import { decryptApiKey, encryptApiKey, maskApiKey } from "shared/crypto"
import { createCustomId } from "shared/custom-id"

import { handleProcedureError } from "./error-handler"
import {
  ApiKeyNotFoundError,
  ApiKeyValidationError,
  CryptoOperationError,
  RateLimitExceededError,
  ValidationError,
} from "./procedure-errors"

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

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
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

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getCredits: protectedProcedure.handler(async ({ context }) => {
    const result = await userService.getUserCredits(context.session.id)

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  getSubscription: protectedProcedure.handler(async ({ context }) => {
    const result = await getEntitlements(context.session.id)

    if (result.isErr()) {
      logger.error(
        `Failed to get subscription for user ${context.session.id}: ${result.error.message}`,
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

    return result.value
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
      const result = await createSubscriptionCheckout(
        context.session.id,
        context.session.email,
        null,
        input.tier,
      )

      if (result.isErr()) {
        logger.error(
          `Failed to create checkout for user ${context.session.id}: ${result.error.message}`,
        )
        return handleProcedureError(
          Result.err(
            new ValidationError({
              field: "tier",
              message: "Failed to create checkout session",
            }),
          ),
        )
      }

      return {
        url: result.value.url,
        checkoutId: result.value.checkoutId,
      }
    }),

  createBillingPortal: protectedProcedure.handler(async ({ context }) => {
    const subscriptionResult = await subscriptionService.getSubscription(
      context.session.id,
    )

    if (subscriptionResult.isErr()) {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "subscription",
            message: "No subscription found",
          }),
        ),
      )
    }

    const subscription = subscriptionResult.value

    if (!subscription) {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "subscription",
            message: "No subscription found",
          }),
        ),
      )
    }

    if (!subscription.polarCustomerId) {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "customer",
            message: "No customer ID found",
          }),
        ),
      )
    }

    const result = await createCustomerPortalSession(
      subscription.polarCustomerId,
    )

    if (result.isErr()) {
      logger.error(
        `Failed to create billing portal for user ${context.session.id}: ${result.error.message}`,
      )
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "portal",
            message: "Failed to create billing portal",
          }),
        ),
      )
    }

    return { url: result.value }
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

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
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

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getPendingCheckouts: protectedProcedure.handler(async ({ context }) => {
    const result = await userService.getPendingCheckouts(context.session.id)

    if (result.isErr()) {
      return handleProcedureError(result)
    }

    return result.value
  }),

  addCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const result = await userService.addCredits(
        context.session.id,
        input.amount,
      )

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return { success: true, amount: input.amount }
    }),

  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const settingsResult = await userService.getUserSettings(context.session.id)

    if (settingsResult.isErr()) {
      return []
    }

    const settings = settingsResult.value

    if (!settings.apiKeys) {
      return []
    }

    const parseResult = Result.try({
      try: () => apiKeyConfigSchema.array().parse(settings.apiKeys),
      catch: (e) => {
        logger.error(`Error parsing API keys: ${formatError(e)}`)
        return []
      },
    })

    if (parseResult.isErr()) {
      return []
    }

    const apiKeys = parseResult.value

    const processedKeys = apiKeys.map((key) => {
      const decryptResult = decryptApiKey(key.apiKey)
      return {
        ...key,
        apiKey: Result.isOk(decryptResult)
          ? maskApiKey(decryptResult.value)
          : "Error: Failed to decrypt",
      }
    })

    return processedKeys
  }),

  addApiKey: adminProcedure
    .input(addApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      const result = await Result.gen(async function* () {
        const rateLimitKey = `${context.session.id}:api-key:add`
        const rateLimitResult = await checkRateLimit(
          () => context.redis.getRedisClient(),
          rateLimitKey,
          RATE_LIMITS.API_KEY_ADD.maxRequests,
          RATE_LIMITS.API_KEY_ADD.windowMs,
        )

        const rateLimitCheck = rateLimitResult.match({
          ok: (v) => v,
          err: () => ({
            isLimited: false,
            remaining: RATE_LIMITS.API_KEY_ADD.maxRequests,
          }),
        })

        if (rateLimitCheck.isLimited) {
          return Result.err(
            new RateLimitExceededError({
              operation: "add-api-key",
              remaining: rateLimitCheck.remaining,
            }),
          )
        }

        const settingsResult = await userService.getUserSettings(
          context.session.id,
        )

        const settings = settingsResult.match({
          ok: (v) => v,
          err: () => null,
        })

        const encryptedKey = yield* encryptApiKey(input.apiKey).mapError(
          () =>
            new CryptoOperationError({
              operation: "encrypt",
              message: "Failed to encrypt API key",
            }),
        )

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
          const parseResult = Result.try({
            try: () => apiKeyConfigSchema.array().parse(settings.apiKeys),
            catch: () => null,
          })

          if (parseResult.isOk() && parseResult.value) {
            existingKeys = parseResult.value
          } else {
            logger.error("Error parsing existing API keys")
          }
        }

        const updatedKeys = [...existingKeys, newKey]

        const upsertResult = await userService.upsertUserSettings(
          context.session.id,
          {
            apiKeys: updatedKeys,
          },
        )

        if (upsertResult.isErr()) {
          return Result.err(
            new ApiKeyValidationError({
              message: "Failed to save API key",
            }),
          )
        }

        return Result.ok({
          ...newKey,
          apiKey: maskApiKey(input.apiKey),
        })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  updateApiKey: adminProcedure
    .input(updateApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      // eslint-disable-next-line require-yield
      const result = await Result.gen(async function* () {
        const rateLimitKey = `${context.session.id}:api-key:update`
        const rateLimitResult = await checkRateLimit(
          () => context.redis.getRedisClient(),
          rateLimitKey,
          RATE_LIMITS.API_KEY_UPDATE.maxRequests,
          RATE_LIMITS.API_KEY_UPDATE.windowMs,
        )

        const rateLimitCheck = rateLimitResult.match({
          ok: (v) => v,
          err: () => ({
            isLimited: false,
            remaining: RATE_LIMITS.API_KEY_UPDATE.maxRequests,
          }),
        })

        if (rateLimitCheck.isLimited) {
          return Result.err(
            new RateLimitExceededError({
              operation: "update-api-key",
              remaining: rateLimitCheck.remaining,
            }),
          )
        }

        const settingsResult = await userService.getUserSettings(
          context.session.id,
        )

        const settings = settingsResult.match({
          ok: (v) => v,
          err: () => null,
        })

        if (!settings?.apiKeys) {
          return Result.err(
            new ApiKeyNotFoundError({
              message: "No API keys found",
            }),
          )
        }

        const existingKeys = Result.try({
          try: () => apiKeyConfigSchema.array().parse(settings.apiKeys),
          catch: (e) => {
            logger.error(`Error parsing existing API keys: ${formatError(e)}`)
            return Result.err(
              new ApiKeyValidationError({
                message: "Failed to parse existing API keys",
              }),
            )
          },
        })

        if (existingKeys.isErr()) {
          return Result.err(existingKeys.error)
        }

        const keyIndex = existingKeys.value.findIndex(
          (key) => key.id === input.id,
        )

        if (keyIndex === -1) {
          return Result.err(
            new ApiKeyNotFoundError({
              keyId: input.id,
            }),
          )
        }

        let encryptedApiKey: string = existingKeys.value[keyIndex].apiKey
        if (input.apiKey) {
          const encryptResult = encryptApiKey(input.apiKey)
          if (encryptResult.isErr()) {
            return Result.err(
              new CryptoOperationError({
                operation: "encrypt",
                message: "Failed to encrypt API key",
              }),
            )
          }
          encryptedApiKey = encryptResult.value
        }

        const updatedKey: ApiKeyConfig = {
          ...existingKeys.value[keyIndex],
          ...input,
          apiKey: encryptedApiKey,
          updatedAt: new Date().toISOString(),
        }

        const updatedKeys = [...existingKeys.value]
        updatedKeys[keyIndex] = updatedKey

        const upsertResult = await userService.upsertUserSettings(
          context.session.id,
          {
            apiKeys: updatedKeys,
          },
        )

        if (upsertResult.isErr()) {
          return Result.err(
            new ApiKeyValidationError({
              message: "Failed to update API key",
            }),
          )
        }

        const decryptResult = decryptApiKey(
          input.apiKey ?? existingKeys.value[keyIndex].apiKey,
        )
        const maskedKey = Result.isOk(decryptResult)
          ? maskApiKey(decryptResult.value)
          : "Error: Failed to decrypt"

        return Result.ok({
          ...updatedKey,
          apiKey: maskedKey,
        })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  deleteApiKey: adminProcedure
    .input(deleteApiKeyInputSchema)
    .handler(async ({ context, input }) => {
      // eslint-disable-next-line require-yield
      const result = await Result.gen(async function* () {
        const rateLimitKey = `${context.session.id}:api-key:delete`
        const rateLimitResult = await checkRateLimit(
          () => context.redis.getRedisClient(),
          rateLimitKey,
          RATE_LIMITS.API_KEY_DELETE.maxRequests,
          RATE_LIMITS.API_KEY_DELETE.windowMs,
        )

        const rateLimitCheck = rateLimitResult.match({
          ok: (v) => v,
          err: () => ({
            isLimited: false,
            remaining: RATE_LIMITS.API_KEY_DELETE.maxRequests,
          }),
        })

        if (rateLimitCheck.isLimited) {
          return Result.err(
            new RateLimitExceededError({
              operation: "delete-api-key",
              remaining: rateLimitCheck.remaining,
            }),
          )
        }

        const settingsResult = await userService.getUserSettings(
          context.session.id,
        )

        const settings = settingsResult.match({
          ok: (v) => v,
          err: () => null,
        })

        if (!settings?.apiKeys) {
          return Result.err(
            new ApiKeyNotFoundError({
              message: "No API keys found",
            }),
          )
        }

        const existingKeys = Result.try({
          try: () => apiKeyConfigSchema.array().parse(settings.apiKeys),
          catch: (e) => {
            logger.error(`Error parsing API keys: ${formatError(e)}`)
            return Result.err(
              new ApiKeyValidationError({
                message: "Failed to parse API keys",
              }),
            )
          },
        })

        if (existingKeys.isErr()) {
          return Result.err(existingKeys.error)
        }

        const updatedKeys = existingKeys.value.filter(
          (key) => key.id !== input.id,
        )

        if (updatedKeys.length === existingKeys.value.length) {
          return Result.err(
            new ApiKeyNotFoundError({
              keyId: input.id,
            }),
          )
        }

        const upsertResult = await userService.upsertUserSettings(
          context.session.id,
          {
            apiKeys: updatedKeys,
          },
        )

        if (upsertResult.isErr()) {
          return Result.err(
            new ApiKeyValidationError({
              message: "Failed to delete API key",
            }),
          )
        }

        return Result.ok({ success: true, id: input.id })
      })

      if (result.isErr()) {
        return handleProcedureError(result)
      }

      return result.value
    }),

  getApiKeyStats: adminProcedure.handler(async ({ context }) => {
    const settingsResult = await userService.getUserSettings(context.session.id)

    const settings = settingsResult.match({
      ok: (v) => v,
      err: () => null,
    })

    let activeKeys = 0

    if (settings?.apiKeys) {
      const parseResult = Result.try({
        try: () => apiKeyConfigSchema.array().parse(settings.apiKeys),
        catch: () => null,
      })

      if (parseResult.isOk() && parseResult.value) {
        activeKeys = parseResult.value.filter(
          (key) => key.status === "active",
        ).length
      } else {
        logger.error("Error parsing API keys")
      }
    }

    return { activeKeys }
  }),

  cancelSubscription: protectedProcedure.handler(async ({ context }) => {
    const subscriptionResult = await subscriptionService.getSubscription(
      context.session.id,
    )

    if (subscriptionResult.isErr()) {
      return handleProcedureError(subscriptionResult)
    }

    const subscription = subscriptionResult.value

    if (!subscription || subscription.tier === "free") {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "subscription",
            message: "No active paid subscription found",
          }),
        ),
      )
    }

    if (subscription.status !== "active") {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "subscription",
            message: `Subscription is already ${subscription.status}`,
          }),
        ),
      )
    }

    if (subscription.cancelAtPeriodEnd) {
      return handleProcedureError(
        Result.err(
          new ValidationError({
            field: "subscription",
            message: "Subscription is already set to cancel at period end",
          }),
        ),
      )
    }

    const cancelResult = await subscriptionService.cancelSubscription(
      context.session.id,
    )

    if (cancelResult.isErr()) {
      logger.error(
        `Failed to cancel subscription for user ${context.session.id}: ${cancelResult.error.message}`,
      )
      return handleProcedureError(cancelResult)
    }

    logger.info(
      `Subscription cancelled for user ${context.session.id}, will end on ${cancelResult.value.currentPeriodEnd}`,
    )

    return {
      success: true,
      message:
        "Your subscription has been cancelled and will end at the end of the current billing period",
      currentPeriodEnd: cancelResult.value.currentPeriodEnd,
    }
  }),
}
