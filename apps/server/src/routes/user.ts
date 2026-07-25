import type { AppContext } from "server/context"

import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { ApiError } from "server/errors"
import {
  addApiKeyInputSchema,
  apiKeyConfigSchema,
  updateApiKeyInputSchema,
  type ApiKeyConfig,
} from "server/llm/api-keys-schema"
import { testApiKey } from "server/llm/test-key"
import { requireAdmin, requireAuth } from "server/middleware"
import { assertSession } from "server/middleware"
import { getEntitlements } from "server/payments/entitlements"
import { createOverflowCreditCheckout } from "server/payments/overflow-checkout"
import {
  createCustomerPortalSession,
  createSubscriptionCheckout,
} from "server/payments/subscription-checkout"
import { getPlanConfig, listPlans } from "server/payments/subscription-plans"
import { checkRateLimit, RATE_LIMITS } from "server/rate-limit"
import { decryptApiKey, encryptApiKey, maskApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
import { cancelSubscription, getSubscription } from "db/services/subscriptions"
import {
  addCredits,
  getPaymentHistory,
  getPendingCheckouts,
  getUserCredits,
  getUserRuns,
  getUserSettings,
  getUserStats,
  getUserTransactions,
  upsertUserSettings,
} from "db/services/user"
import { createCustomId } from "utils/custom-id"

import {
  cursorQuerySchema,
  idParamSchema,
  jsonOkResponse,
  paginationQuerySchema,
} from "./common"

export const userProtectedApp = new OpenAPIHono<AppContext>()

userProtectedApp.use("*", requireAuth)

const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(meRoute, (c) => {
  const session = assertSession(c)

  return c.json(
    {
      id: session.id,
      email: session.email,
      name: session.name,
      username: session.username,
      image: session.image,
    },
    200,
  )
})

const updateMeInputSchema = z.object({
  name: z.string().optional(),
  image: z.string().optional(),
})

const updateMeRoute = createRoute({
  method: "patch",
  path: "/me",
  tags: ["user"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateMeInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(updateMeRoute, (c) => {
  const session = assertSession(c)
  const input = c.req.valid("json")

  return c.json(
    {
      id: session.id,
      email: session.email,
      ...input,
    },
    200,
  )
})

const statsRoute = createRoute({
  method: "get",
  path: "/stats",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(statsRoute, async (c) => {
  const session = assertSession(c)
  return c.json(await getUserStats(session.id), 200)
})

const runsQuerySchema = cursorQuerySchema.extend({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
})

const runsRoute = createRoute({
  method: "get",
  path: "/runs",
  tags: ["user"],
  request: {
    query: runsQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(runsRoute, async (c) => {
  const session = assertSession(c)
  const { limit, cursor } = c.req.valid("query")

  return c.json(
    await getUserRuns(session.id, {
      limit: limit ?? 20,
      cursor,
    }),
    200,
  )
})

const creditsRoute = createRoute({
  method: "get",
  path: "/credits",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(creditsRoute, async (c) => {
  const session = assertSession(c)
  return c.json(await getUserCredits(session.id), 200)
})

const subscriptionRoute = createRoute({
  method: "get",
  path: "/subscription",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(subscriptionRoute, async (c) => {
  const session = assertSession(c)

  try {
    return c.json(await getEntitlements(session.id), 200)
  } catch (error) {
    console.error(
      `Failed to get subscription for user ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
    )
    const freePlan = getPlanConfig("free")
    return c.json(
      {
        tier: "free" as const,
        status: "active" as const,
        limits: freePlan.limits,
        features: freePlan.features,
        isPaid: false,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      },
      200,
    )
  }
})

const plansRoute = createRoute({
  method: "get",
  path: "/plans",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(plansRoute, (c) => {
  const plans = listPlans()
  return c.json(
    plans.map((plan) => ({
      tier: plan.tier,
      name: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      limits: plan.limits,
      features: plan.features,
    })),
    200,
  )
})

const checkoutInputSchema = z.object({
  tier: z.enum(["pro", "enterprise"]),
})

const checkoutRoute = createRoute({
  method: "post",
  path: "/checkout",
  tags: ["user"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: checkoutInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(checkoutRoute, async (c) => {
  const session = assertSession(c)
  const { tier } = c.req.valid("json")

  try {
    const result = await createSubscriptionCheckout(
      session.id,
      session.email,
      null,
      tier,
    )
    return c.json(
      {
        url: result.url,
        checkoutId: result.checkoutId,
      },
      200,
    )
  } catch (error) {
    console.error(
      `Failed to create checkout for user ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw new ApiError("BAD_REQUEST", {
      message: "Failed to create checkout session",
    })
  }
})

const portalRoute = createRoute({
  method: "post",
  path: "/portal",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(portalRoute, async (c) => {
  const session = assertSession(c)
  const subscription = await getSubscription(session.id)

  if (!subscription) {
    throw new ApiError("BAD_REQUEST", {
      message: "No subscription found",
    })
  }

  if (!subscription.polarCustomerId) {
    throw new ApiError("BAD_REQUEST", {
      message: "No customer ID found",
    })
  }

  try {
    const result = await createCustomerPortalSession(
      subscription.polarCustomerId,
    )
    return c.json({ url: result }, 200)
  } catch (error) {
    console.error(
      `Failed to create billing portal for user ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw new ApiError("BAD_REQUEST", {
      message: "Failed to create billing portal",
    })
  }
})

const overflowCheckoutInputSchema = z.object({
  packSize: z.enum(["100", "500"]),
})

const overflowCheckoutRoute = createRoute({
  method: "post",
  path: "/credits/checkout",
  tags: ["user"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: overflowCheckoutInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(overflowCheckoutRoute, async (c) => {
  const session = assertSession(c)
  const { packSize } = c.req.valid("json")
  const subscription = await getSubscription(session.id)

  try {
    const result = await createOverflowCreditCheckout(
      session.id,
      session.email,
      subscription?.polarCustomerId ?? null,
      packSize,
    )
    return c.json(
      {
        url: result.url,
        checkoutId: result.checkoutId,
      },
      200,
    )
  } catch (error) {
    console.error(
      `Failed to create overflow credit checkout: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw new ApiError("BAD_REQUEST", {
      message: "Failed to create overflow credit checkout",
    })
  }
})

const addCreditsInputSchema = z.object({
  amount: z.number().min(1),
})

const addCreditsRoute = createRoute({
  method: "post",
  path: "/credits",
  tags: ["user"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addCreditsInputSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean(), amount: z.number() })),
  },
})

userProtectedApp.openapi(addCreditsRoute, async (c) => {
  const session = assertSession(c)
  const { amount } = c.req.valid("json")
  await addCredits(session.id, amount)
  return c.json({ success: true, amount }, 200)
})

const transactionsRoute = createRoute({
  method: "get",
  path: "/transactions",
  tags: ["user"],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(transactionsRoute, async (c) => {
  const session = assertSession(c)
  const { limit } = c.req.valid("query")

  return c.json(
    await getUserTransactions(session.id, {
      limit: limit ?? 20,
    }),
    200,
  )
})

const purchasesRoute = createRoute({
  method: "get",
  path: "/purchases",
  tags: ["user"],
  request: {
    query: paginationQuerySchema,
  },
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(purchasesRoute, async (c) => {
  const session = assertSession(c)
  const { limit } = c.req.valid("query")

  return c.json(
    await getPaymentHistory(session.id, {
      limit: limit ?? 20,
    }),
    200,
  )
})

const pendingCheckoutsRoute = createRoute({
  method: "get",
  path: "/checkouts",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(pendingCheckoutsRoute, async (c) => {
  const session = assertSession(c)
  return c.json(await getPendingCheckouts(session.id), 200)
})

const cancelSubscriptionRoute = createRoute({
  method: "delete",
  path: "/subscription",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userProtectedApp.openapi(cancelSubscriptionRoute, async (c) => {
  const session = assertSession(c)
  const subscription = await getSubscription(session.id)

  if (!subscription || subscription.tier === "free") {
    throw new ApiError("BAD_REQUEST", {
      message: "No active paid subscription found",
    })
  }

  if (subscription.status !== "active") {
    throw new ApiError("BAD_REQUEST", {
      message: `Subscription is already ${subscription.status}`,
    })
  }

  if (subscription.cancelAtPeriodEnd) {
    throw new ApiError("BAD_REQUEST", {
      message: "Subscription is already set to cancel at period end",
    })
  }

  try {
    const cancelResult = await cancelSubscription(session.id)

    console.info(
      `Subscription cancelled for user ${session.id}, will end on ${cancelResult.currentPeriodEnd?.toISOString() ?? "null"}`,
    )

    return c.json(
      {
        success: true,
        message:
          "Your subscription has been cancelled and will end at the end of the current billing period",
        currentPeriodEnd: cancelResult.currentPeriodEnd,
      },
      200,
    )
  } catch (error) {
    console.error(
      `Failed to cancel subscription for user ${session.id}: ${error instanceof Error ? error.message : String(error)}`,
    )
    throw new ApiError("INTERNAL_SERVER_ERROR", {
      message: "Failed to cancel subscription",
    })
  }
})

export const userAdminApp = new OpenAPIHono<AppContext>()

userAdminApp.use("*", requireAuth, requireAdmin)

const apiKeysRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userAdminApp.openapi(apiKeysRoute, async (c) => {
  const session = assertSession(c)
  const settings = await getUserSettings(session.id)

  if (!settings?.apiKeys) {
    return c.json([], 200)
  }

  let apiKeys: ApiKeyConfig[]
  try {
    apiKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
  } catch {
    console.error("Error parsing API keys")
    return c.json([], 200)
  }

  const processedKeys = apiKeys.map((key) => {
    const decrypted = decryptApiKey(key.apiKey)
    return {
      ...key,
      apiKey: decrypted ? maskApiKey(decrypted) : "Error: Failed to decrypt",
    }
  })

  return c.json(processedKeys, 200)
})

const addApiKeyRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["user"],
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
    200: jsonOkResponse(),
  },
})

userAdminApp.openapi(addApiKeyRoute, async (c) => {
  const session = assertSession(c)
  const input = c.req.valid("json")

  const rateLimitKey = `${session.id}:api-key:add`
  const rateLimitResult = await checkRateLimit(
    () => redisCache.getRedisClient(),
    rateLimitKey,
    RATE_LIMITS.API_KEY_ADD.maxRequests,
    RATE_LIMITS.API_KEY_ADD.windowMs,
  )

  const rateLimitCheck = rateLimitResult.ok
    ? rateLimitResult.value
    : { isLimited: false, remaining: RATE_LIMITS.API_KEY_ADD.maxRequests }

  if (rateLimitCheck?.isLimited) {
    throw new ApiError("FORBIDDEN", {
      message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_ADD.windowMs / 60000)} minutes.`,
    })
  }

  const settings = await getUserSettings(session.id)

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

  await upsertUserSettings(session.id, {
    apiKeys: updatedKeys,
  })

  return c.json(
    {
      ...newKey,
      apiKey: maskApiKey(input.apiKey),
    },
    200,
  )
})

const updateApiKeyRoute = createRoute({
  method: "patch",
  path: "/:id",
  tags: ["user"],
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
    200: jsonOkResponse(),
  },
})

userAdminApp.openapi(updateApiKeyRoute, async (c) => {
  const session = assertSession(c)
  const { id } = c.req.valid("param")
  const input = c.req.valid("json")

  const rateLimitKey = `${session.id}:api-key:update`
  const rateLimitResult = await checkRateLimit(
    () => redisCache.getRedisClient(),
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
    throw new ApiError("FORBIDDEN", {
      message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_UPDATE.windowMs / 60000)} minutes.`,
    })
  }

  const settings = await getUserSettings(session.id)

  if (!settings?.apiKeys) {
    throw new ApiError("NOT_FOUND", {
      message: "No API keys found",
    })
  }

  let existingKeys: ApiKeyConfig[]
  try {
    existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
  } catch (e) {
    console.error("Error parsing existing API keys:", e)
    throw new ApiError("BAD_REQUEST", {
      message: "Failed to parse existing API keys",
    })
  }

  const keyIndex = existingKeys.findIndex((key) => key.id === id)

  if (keyIndex === -1) {
    throw new ApiError("NOT_FOUND", {
      message: `API key not found: ${id}`,
    })
  }

  let encryptedApiKey: string = existingKeys[keyIndex].apiKey
  if (input.apiKey) {
    const encryptResult = encryptApiKey(input.apiKey)
    if (!encryptResult) {
      throw new ApiError("INTERNAL_SERVER_ERROR", {
        message: "Failed to encrypt API key",
      })
    }
    encryptedApiKey = encryptResult

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
    ...input,
    apiKey: encryptedApiKey,
    updatedAt: new Date().toISOString(),
  }

  const updatedKeys = [...existingKeys]
  updatedKeys[keyIndex] = updatedKey

  await upsertUserSettings(session.id, {
    apiKeys: updatedKeys,
  })

  const decryptedKey = decryptApiKey(
    input.apiKey ?? existingKeys[keyIndex].apiKey,
  )
  const maskedKey = decryptedKey
    ? maskApiKey(decryptedKey)
    : "Error: Failed to decrypt"

  return c.json(
    {
      ...updatedKey,
      apiKey: maskedKey,
    },
    200,
  )
})

const deleteApiKeyRoute = createRoute({
  method: "delete",
  path: "/:id",
  tags: ["user"],
  request: {
    params: idParamSchema,
  },
  responses: {
    200: jsonOkResponse(z.object({ success: z.boolean(), id: z.string() })),
  },
})

userAdminApp.openapi(deleteApiKeyRoute, async (c) => {
  const session = assertSession(c)
  const { id } = c.req.valid("param")

  const rateLimitKey = `${session.id}:api-key:delete`
  const rateLimitResult = await checkRateLimit(
    () => redisCache.getRedisClient(),
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
    throw new ApiError("FORBIDDEN", {
      message: `Rate limit exceeded. Try again in ${Math.ceil(RATE_LIMITS.API_KEY_DELETE.windowMs / 60000)} minutes.`,
    })
  }

  const settings = await getUserSettings(session.id)

  if (!settings?.apiKeys) {
    throw new ApiError("NOT_FOUND", {
      message: "No API keys found",
    })
  }

  let existingKeys: ApiKeyConfig[]
  try {
    existingKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
  } catch (e) {
    console.error("Error parsing API keys:", e)
    throw new ApiError("BAD_REQUEST", {
      message: "Failed to parse API keys",
    })
  }

  const updatedKeys = existingKeys.filter((key) => key.id !== id)

  if (updatedKeys.length === existingKeys.length) {
    throw new ApiError("NOT_FOUND", {
      message: `API key not found: ${id}`,
    })
  }

  await upsertUserSettings(session.id, {
    apiKeys: updatedKeys,
  })

  return c.json({ success: true, id }, 200)
})

const apiKeyStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  tags: ["user"],
  responses: {
    200: jsonOkResponse(),
  },
})

userAdminApp.openapi(apiKeyStatsRoute, async (c) => {
  const session = assertSession(c)
  const settings = await getUserSettings(session.id)

  let activeKeys = 0

  if (settings?.apiKeys) {
    try {
      const parsedKeys = apiKeyConfigSchema.array().parse(settings.apiKeys)
      activeKeys = parsedKeys.filter((key) => key.status === "active").length
    } catch {
      console.error("Error parsing API keys")
    }
  }

  return c.json({ activeKeys }, 200)
})
