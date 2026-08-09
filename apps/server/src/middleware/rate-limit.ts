import type { RedisClient } from "bun"

import { ORPCError } from "@orpc/server"
import { RateLimitError } from "server/lib/errors"

export const RATE_LIMITS = {
  API_KEY_ADD: {
    maxRequests: 5,
    windowMs: 60000,
  },
  API_KEY_UPDATE: {
    maxRequests: 10,
    windowMs: 60000,
  },
  API_KEY_DELETE: {
    maxRequests: 5,
    windowMs: 60000,
  },
  PRODUCT_EXECUTE: {
    maxRequests: 30,
    windowMs: 60000,
  },
} as const

const limitsForAction = (
  action: "add" | "update" | "delete" | "execute",
): (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS] => {
  switch (action) {
    case "add":
      return RATE_LIMITS.API_KEY_ADD
    case "update":
      return RATE_LIMITS.API_KEY_UPDATE
    case "delete":
      return RATE_LIMITS.API_KEY_DELETE
    case "execute":
      return RATE_LIMITS.PRODUCT_EXECUTE
  }
}

export async function checkRateLimit(
  getRedisClient: () => Promise<RedisClient | null>,
  key: string,
  maxRequests: number,
  windowMs: number,
  options?: { failClosed?: boolean },
): Promise<{
  ok: boolean
  value?: { isLimited: boolean; remaining: number }
  error?: RateLimitError
}> {
  const redis = await getRedisClient()

  if (!redis) {
    return {
      ok: true,
      value: {
        isLimited: options?.failClosed ?? false,
        remaining: options?.failClosed ? 0 : maxRequests,
      },
    }
  }

  const now = Date.now()
  const windowStart = now - windowMs
  const redisKey = `ratelimit:${key}`

  try {
    await redis.send("ZREMRANGEBYSCORE", [redisKey, "0", String(windowStart)])
    const count = Number(await redis.send("ZCARD", [redisKey]))

    if (count >= maxRequests) {
      return {
        ok: true,
        value: {
          isLimited: true,
          remaining: 0,
        },
      }
    }

    await redis.send("ZADD", [redisKey, String(now), `${now}-${Math.random()}`])
    await redis.send("PEXPIRE", [redisKey, String(windowMs)])

    return {
      ok: true,
      value: {
        isLimited: false,
        remaining: maxRequests - count - 1,
      },
    }
  } catch (e) {
    return {
      ok: false,
      error: new RateLimitError({ operation: "check", cause: e }),
    }
  }
}

export async function enforceRateLimit(
  getRedisClient: () => Promise<RedisClient | null>,
  sessionId: string,
  action: "add" | "update" | "delete" | "execute",
): Promise<void> {
  const limits = limitsForAction(action)

  const result = await checkRateLimit(
    getRedisClient,
    `${sessionId}:api-key:${action}`,
    limits.maxRequests,
    limits.windowMs,
  )

  const isLimited = result.ok ? result.value?.isLimited : false

  if (isLimited) {
    throw new ORPCError("FORBIDDEN", {
      status: 403,
      message: `Rate limit exceeded. Try again in ${Math.ceil(limits.windowMs / 60000)} minutes.`,
    })
  }
}
