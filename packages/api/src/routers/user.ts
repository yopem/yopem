import { ORPCError } from "@orpc/server"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@repo/api/schemas/api-keys"
import {
  creditTransactionsTable,
  polarCheckoutSessionsTable,
  polarPaymentsTable,
  toolRunsTable,
  toolsTable,
  userCreditsTable,
  userSettingsTable,
} from "@repo/db/schema"
import { logger } from "@repo/logger"
import {
  MAX_TOPUP_AMOUNT,
  MIN_TOPUP_AMOUNT,
} from "@repo/payments/credit-calculation"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@repo/utils/crypto"
import { createCustomId } from "@repo/utils/custom-id"
import { checkRateLimit, RATE_LIMITS } from "@repo/utils/rate-limit"
import { desc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure, protectedProcedure } from "../orpc"

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
    const [credits] = await context.db
      .select({
        balance: userCreditsTable.balance,
        totalUsed: userCreditsTable.totalUsed,
        totalPurchased: userCreditsTable.totalPurchased,
      })
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, context.session.id))

    const runs = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(toolRunsTable)
      .where(eq(toolRunsTable.userId, context.session.id))

    return {
      balance: credits ? credits.balance : "0",
      totalUsed: credits ? credits.totalUsed : "0",
      totalPurchased: credits ? credits.totalPurchased : "0",
      totalRuns: Number(runs[0] ? runs[0].count : 0),
    }
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
      const limit = input?.limit ?? 20

      const runs = await context.db
        .select({
          id: toolRunsTable.id,
          toolId: toolRunsTable.toolId,
          status: toolRunsTable.status,
          cost: toolRunsTable.cost,
          createdAt: toolRunsTable.createdAt,
          toolName: toolsTable.name,
        })
        .from(toolRunsTable)
        .leftJoin(toolsTable, eq(toolRunsTable.toolId, toolsTable.id))
        .where(eq(toolRunsTable.userId, context.session.id))
        .orderBy(desc(toolRunsTable.createdAt))
        .limit(limit + 1)

      let nextCursor: string | undefined = undefined
      if (runs.length > limit) {
        const nextItem = runs.pop()
        nextCursor = nextItem?.id
      }

      return { runs, nextCursor }
    }),

  getCredits: protectedProcedure.handler(async ({ context }) => {
    const [credits] = await context.db
      .select()
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, context.session.id))

    return credits ? credits : null
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
      const limit = input?.limit ?? 20

      const transactions = await context.db
        .select({
          id: creditTransactionsTable.id,
          amount: creditTransactionsTable.amount,
          type: creditTransactionsTable.type,
          description: creditTransactionsTable.description,
          createdAt: creditTransactionsTable.createdAt,
        })
        .from(creditTransactionsTable)
        .where(eq(creditTransactionsTable.userId, context.session.id))
        .orderBy(desc(creditTransactionsTable.createdAt))
        .limit(limit)

      return transactions
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
      const limit = input?.limit ?? 20

      const purchases = await context.db
        .select({
          id: polarPaymentsTable.id,
          polarPaymentId: polarPaymentsTable.polarPaymentId,
          amount: polarPaymentsTable.amount,
          currency: polarPaymentsTable.currency,
          status: polarPaymentsTable.status,
          productId: polarPaymentsTable.productId,
          creditsGranted: polarPaymentsTable.creditsGranted,
          refundedAmount: polarPaymentsTable.refundedAmount,
          createdAt: polarPaymentsTable.createdAt,
          updatedAt: polarPaymentsTable.updatedAt,
        })
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.userId, context.session.id))
        .orderBy(desc(polarPaymentsTable.createdAt))
        .limit(limit)

      return purchases
    }),

  getPendingCheckouts: protectedProcedure.handler(async ({ context }) => {
    const checkouts = await context.db
      .select({
        id: polarCheckoutSessionsTable.id,
        checkoutId: polarCheckoutSessionsTable.checkoutId,
        productId: polarCheckoutSessionsTable.productId,
        checkoutUrl: polarCheckoutSessionsTable.checkoutUrl,
        amount: polarCheckoutSessionsTable.amount,
        status: polarCheckoutSessionsTable.status,
        createdAt: polarCheckoutSessionsTable.createdAt,
      })
      .from(polarCheckoutSessionsTable)
      .where(eq(polarCheckoutSessionsTable.userId, context.session.id))
      .orderBy(desc(polarCheckoutSessionsTable.createdAt))
      .limit(10)

    return checkouts
  }),

  addCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      let [credits] = await context.db
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, context.session.id))

      if (credits) {
        await context.db
          .update(userCreditsTable)
          .set({
            balance: sql`${userCreditsTable.balance} + ${input.amount}`,
            totalPurchased: sql`${userCreditsTable.totalPurchased} + ${input.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, context.session.id))
      } else {
        const newCredits = {
          id: createCustomId(),
          userId: context.session.id,
          balance: String(input.amount),
          totalPurchased: String(input.amount),
          totalUsed: "0",
        }
        await context.db.insert(userCreditsTable).values(newCredits)
        credits = newCredits as typeof credits
      }

      await context.db.insert(creditTransactionsTable).values({
        id: createCustomId(),
        userId: context.session.id,
        amount: String(input.amount),
        type: "purchase",
        description: `Purchased ${input.amount} credits`,
      })

      return { success: true, amount: input.amount }
    }),

  getApiKeys: adminProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, context.session.id))

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
      logger.error(`Error parsing API keys: ${String(error)}`)
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

      const [settings] = await context.db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, context.session.id))

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
          logger.error(`Error parsing existing API keys: ${String(error)}`)
        }
      }

      const updatedKeys = [...existingKeys, newKey]

      if (settings) {
        await context.db
          .update(userSettingsTable)
          .set({
            apiKeys: updatedKeys,
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.userId, context.session.id))
      } else {
        await context.db.insert(userSettingsTable).values({
          id: createCustomId(),
          userId: context.session.id,
          apiKeys: updatedKeys,
        })
      }

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

      const [settings] = await context.db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, context.session.id))

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

        await context.db
          .update(userSettingsTable)
          .set({
            apiKeys: updatedKeys,
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.userId, context.session.id))

        return {
          ...updatedKey,
          apiKey: maskApiKey(
            input.apiKey ?? decryptApiKey(existingKeys[keyIndex].apiKey),
          ),
        }
      } catch (error) {
        logger.error(`Error updating API key: ${String(error)}`)
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

      const [settings] = await context.db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, context.session.id))

      if (!settings?.apiKeys) {
        throw new ORPCError("NOT_FOUND", { message: "No API keys found" })
      }

      try {
        const existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

        if (updatedKeys.length === existingKeys.length) {
          throw new ORPCError("NOT_FOUND", { message: "API key not found" })
        }

        await context.db
          .update(userSettingsTable)
          .set({
            apiKeys: updatedKeys,
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.userId, context.session.id))

        return { success: true, id: input.id }
      } catch (error) {
        logger.error(`Error deleting API key: ${String(error)}`)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to delete API key",
        })
      }
    }),

  getApiKeyStats: adminProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, context.session.id))

    let activeKeys = 0

    if (settings?.apiKeys) {
      try {
        const apiKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        activeKeys = apiKeys.filter((key) => key.status === "active").length
      } catch (error) {
        logger.error(`Error parsing API keys: ${String(error)}`)
      }
    }

    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    )
    const endOfPreviousMonth = startOfCurrentMonth

    const [totalRequestsResult] = await context.db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(toolRunsTable)
      .where(eq(toolRunsTable.userId, context.session.id))

    const totalRequests = Number(totalRequestsResult?.count ?? 0)

    const [currentMonthResult] = await context.db
      .select({
        count: sql<number>`COUNT(*)`,
        cost: sql<number>`COALESCE(SUM(CAST(${toolRunsTable.cost} AS DECIMAL)), 0)`,
      })
      .from(toolRunsTable)
      .where(
        sql`${toolRunsTable.userId} = ${context.session.id} AND ${toolRunsTable.createdAt} >= ${startOfCurrentMonth}`,
      )

    const requestsThisMonth = Number(currentMonthResult?.count ?? 0)
    const monthlyCost = Number(currentMonthResult?.cost ?? 0)

    const [previousMonthResult] = await context.db
      .select({
        cost: sql<number>`COALESCE(SUM(CAST(${toolRunsTable.cost} AS DECIMAL)), 0)`,
      })
      .from(toolRunsTable)
      .where(
        sql`${toolRunsTable.userId} = ${context.session.id} AND ${toolRunsTable.createdAt} >= ${startOfPreviousMonth} AND ${toolRunsTable.createdAt} < ${endOfPreviousMonth}`,
      )

    const previousMonthCost = Number(previousMonthResult?.cost ?? 0)

    let costChange = "0%"
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

    return {
      totalRequests,
      activeKeys,
      monthlyCost,
      requestsThisMonth,
      costChange,
    }
  }),

  getAutoTopupSettings: protectedProcedure.handler(async ({ context }) => {
    const [credits] = await context.db
      .select({
        autoTopupEnabled: userCreditsTable.autoTopupEnabled,
        autoTopupThreshold: userCreditsTable.autoTopupThreshold,
        autoTopupAmount: userCreditsTable.autoTopupAmount,
      })
      .from(userCreditsTable)
      .where(eq(userCreditsTable.userId, context.session.id))

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

      const [credits] = await context.db
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, context.session.id))

      if (credits) {
        await context.db
          .update(userCreditsTable)
          .set({
            autoTopupEnabled: input.enabled,
            autoTopupThreshold: input.threshold
              ? String(input.threshold)
              : null,
            autoTopupAmount: input.amount ? String(input.amount) : null,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, context.session.id))
      } else {
        // Create credits record if it doesn't exist
        await context.db.insert(userCreditsTable).values({
          id: createCustomId(),
          userId: context.session.id,
          balance: "0",
          totalPurchased: "0",
          totalUsed: "0",
          autoTopupEnabled: input.enabled,
          autoTopupThreshold: input.threshold ? String(input.threshold) : null,
          autoTopupAmount: input.amount ? String(input.amount) : null,
        })
      }

      return {
        success: true,
        enabled: input.enabled,
        threshold: input.threshold ?? null,
        amount: input.amount ?? null,
      }
    }),
}
