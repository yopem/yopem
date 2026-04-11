import type { Redis } from "ioredis"

import { redisKeyPrefix, redisUrl } from "env/hono"

export function createRedisCache() {
  let redis: Redis | null = null
  const prefix = redisKeyPrefix

  async function initRedis(): Promise<Redis | null> {
    if (redis) return redis

    if (!redisUrl) {
      console.warn("Redis URL not found. Caching will be disabled.")
      return null
    }

    try {
      const { default: RedisClient } = await import("ioredis")
      const client = new RedisClient(redisUrl)

      client.on("error", (error: Error) => {
        console.error(`Redis connection error: ${error.message}`)
      })

      client.on("connect", () => {
        console.info("Redis connected successfully")
      })

      redis = client
      return client
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Redis connection failed: ${msg}`)
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache set failed for key ${key}: ${msg}`)
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
      }) as T
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache get failed for key ${key}: ${msg}`)
    }
  }

  async function deleteCache(key: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const prefixedKey = `${prefix}${key}`
      await client.del(prefixedKey)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache delete failed for key ${key}: ${msg}`)
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache invalidate failed for pattern ${pattern}: ${msg}`)
    }
  }

  async function getRedisClient(): Promise<Redis | null> {
    if (typeof process === "undefined") {
      return null
    }

    if (!redis) {
      redis = await initRedis()
    }

    return redis
  }

  async function close(): Promise<void> {
    if (!redis) {
      return
    }

    try {
      await redis.quit()
      console.info("Redis connection closed successfully")
      redis = null
    } catch (e) {
      if (redis) {
        redis.disconnect()
        redis = null
      }
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache close failed: ${msg}`)
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
