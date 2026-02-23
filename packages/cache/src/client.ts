import type { Redis } from "ioredis"

import { redisKeyPrefix, redisUrl } from "@repo/env/hono"
import { formatError, logger } from "@repo/logger"

export function createRedisCache() {
  let redis: Redis | null = null
  const prefix = redisKeyPrefix

  async function initRedis(): Promise<Redis | null> {
    if (redis) return redis

    if (!redisUrl) {
      logger.warn("Redis URL not found. Caching will be disabled.")
      return null
    }

    try {
      const { default: RedisClient } = await import("ioredis")
      redis = new RedisClient(redisUrl)

      redis.on("error", (error: Error) => {
        logger.error(`Redis connection error: ${error.message}`)
      })

      redis.on("connect", () => {
        logger.info("Redis connected successfully")
      })

      return redis
    } catch (error) {
      logger.error(`Failed to create Redis client: ${formatError(error)}`)
      return null
    }
  }

  function markDatesForSerialization(obj: unknown): unknown {
    if (obj instanceof Date) {
      return { __type: "Date", value: obj.toISOString() }
    }

    if (Array.isArray(obj)) {
      return obj.map(markDatesForSerialization)
    }

    if (obj && typeof obj === "object" && obj.constructor === Object) {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = markDatesForSerialization(value)
      }
      return result
    }

    return obj
  }

  async function setCache<T>(
    key: string,
    value: T,
    ttlSeconds = 3601,
  ): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const processedValue = markDatesForSerialization(value)
      const serialized = JSON.stringify(processedValue)
      const prefixedKey = `${prefix}${key}`
      await client.setex(prefixedKey, ttlSeconds, serialized)
    } catch (error) {
      logger.error(`Failed to set cache: ${formatError(error)}`)
    }
  }

  async function getCache<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()
    if (!client) return null

    try {
      const prefixedKey = `${prefix}${key}`
      const value = await client.get(prefixedKey)
      if (!value) return null

      return JSON.parse(value, (_key, val) => {
        if (val && typeof val === "object" && val.__type === "Date") {
          return new Date(val.value)
        }
        return val
      })
    } catch (error) {
      logger.error(`Failed to get cache: ${formatError(error)}`)
      return null
    }
  }

  async function deleteCache(key: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const prefixedKey = `${prefix}${key}`
      await client.del(prefixedKey)
    } catch (error) {
      logger.error(`Failed to delete cache: ${formatError(error)}`)
    }
  }

  async function invalidatePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const prefixedPattern = `${prefix}${pattern}`
      const keys = await client.keys(prefixedPattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache pattern: ${formatError(error)}`)
    }
  }

  async function getRedisClient(): Promise<Redis | null> {
    if (typeof process === "undefined") {
      return null
    }
    redis ??= await initRedis()
    return redis
  }

  async function close(): Promise<void> {
    if (redis) {
      try {
        await redis.quit()
        logger.info("Redis connection closed successfully")
        redis = null
      } catch (error) {
        logger.error(`Failed to close Redis connection: ${formatError(error)}`)
        if (redis) {
          redis.disconnect()
          redis = null
        }
      }
    }
  }

  return {
    setCache,
    getCache,
    deleteCache,
    invalidatePattern,
    getRedisClient,
    close,
  }
}
