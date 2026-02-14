import type { Redis } from "ioredis"

import { logger } from "@/lib/utils/logger"

export async function checkRateLimit(
  getRedisClient: () => Promise<Redis | null>,
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ isLimited: boolean; remaining: number }> {
  const redis = await getRedisClient()

  if (!redis) {
    return {
      isLimited: false,
      remaining: maxRequests,
    }
  }

  const now = Date.now()
  const windowStart = now - windowMs
  const redisKey = `ratelimit:${key}`

  try {
    await redis.zremrangebyscore(redisKey, 0, windowStart)
    const count = await redis.zcard(redisKey)

    if (count >= maxRequests) {
      return {
        isLimited: true,
        remaining: 0,
      }
    }

    await redis.zadd(redisKey, now, `${now}-${Math.random()}`)
    await redis.pexpire(redisKey, windowMs)

    return {
      isLimited: false,
      remaining: maxRequests - count - 1,
    }
  } catch (error) {
    logger.error(`Rate limit check failed: ${String(error)}`)
    return {
      isLimited: false,
      remaining: maxRequests,
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
