import type { Redis } from "ioredis"

import { RateLimitError } from "./errors.ts"

export async function checkRateLimit(
  getRedisClient: () => Promise<Redis | null>,
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
    if (options?.failClosed) {
      return { ok: true, value: { isLimited: true, remaining: 0 } }
    }
    return { ok: true, value: { isLimited: false, remaining: maxRequests } }
  }

  const now = Date.now()
  const windowStart = now - windowMs
  const redisKey = `ratelimit:${key}`

  try {
    await redis.zremrangebyscore(redisKey, 0, windowStart)
    const count = await redis.zcard(redisKey)

    if (count >= maxRequests) {
      return {
        ok: true,
        value: {
          isLimited: true,
          remaining: 0,
        },
      }
    }

    await redis.zadd(redisKey, now, `${now}-${Math.random()}`)
    await redis.pexpire(redisKey, windowMs)

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
} as const
