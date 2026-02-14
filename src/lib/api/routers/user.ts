import { desc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure, protectedProcedure } from "@/lib/api/orpc"
import {
  creditTransactionsTable,
  toolRunsTable,
  toolsTable,
  userCreditsTable,
  userSettingsTable,
} from "@/lib/db/schema"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  deleteApiKeyInputSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "@/lib/schemas/api-keys"
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/utils/crypto"
import { createCustomId } from "@/lib/utils/custom-id"
import { logger } from "@/lib/utils/logger"
import { checkRateLimit, RATE_LIMITS } from "@/lib/utils/rate-limit"

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
      logger.error(`Error parsing API keys: ${error}`)
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
        throw new Error(
          `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        )
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
          logger.error(`Error parsing existing API keys: ${error}`)
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
        throw new Error(
          `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        )
      }

      const [settings] = await context.db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, context.session.id))

      if (!settings?.apiKeys) {
        throw new Error("No API keys found")
      }

      try {
        const existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        const keyIndex = existingKeys.findIndex((key) => key.id === input.id)

        if (keyIndex === -1) {
          throw new Error("API key not found")
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
        logger.error(`Error updating API key: ${error}`)
        throw new Error("Failed to update API key")
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
        throw new Error(
          `Rate limit exceeded. Please try again later. (${remaining} requests remaining)`,
        )
      }

      const [settings] = await context.db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, context.session.id))

      if (!settings?.apiKeys) {
        throw new Error("No API keys found")
      }

      try {
        const existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
        const updatedKeys = existingKeys.filter((key) => key.id !== input.id)

        if (updatedKeys.length === existingKeys.length) {
          throw new Error("API key not found")
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
        logger.error(`Error deleting API key: ${error}`)
        throw new Error("Failed to delete API key")
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
        logger.error(`Error parsing API keys: ${error}`)
      }
    }

    return {
      totalRequests: 1200000,
      activeKeys,
      monthlyCost: 2405,
      requestsThisMonth: 150000,
      costChange: -5,
    }
  }),
}
