import type { Redis } from "ioredis"

import { Result } from "better-result"

import { redisKeyPrefix, redisUrl } from "env/hono"
import { logger } from "logger"

import {
  CacheOperationError,
  CacheSerializationError,
  RedisConnectionError,
} from "./errors.ts"

export function createRedisCache() {
  let redis: Redis | null = null
  const prefix = redisKeyPrefix

  function initRedis(): Promise<Result<Redis | null, RedisConnectionError>> {
    if (redis) return Promise.resolve(Result.ok(redis))

    if (!redisUrl) {
      logger.warn("Redis URL not found. Caching will be disabled.")
      return Promise.resolve(Result.ok(null))
    }

    return Result.tryPromise({
      try: async () => {
        const { default: RedisClient } = await import("ioredis")
        const client = new RedisClient(redisUrl)

        client.on("error", (error: Error) => {
          logger.error(`Redis connection error: ${error.message}`)
        })

        client.on("connect", () => {
          logger.info("Redis connected successfully")
        })

        redis = client
        return client
      },
      catch: (e) => new RedisConnectionError({ cause: e }),
    })
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
  ): Promise<Result<void, CacheOperationError | CacheSerializationError>> {
    const clientResult = await getRedisClient()

    if (clientResult.isErr()) {
      return Result.err(
        new CacheOperationError({
          operation: "set",
          key,
          cause: clientResult.error,
        }),
      )
    }

    const client = clientResult.value
    if (!client) return Result.ok(undefined)

    return Result.tryPromise({
      try: async () => {
        const processedValue = markDatesForSerialization(value)
        const serialized = JSON.stringify(processedValue)
        const prefixedKey = `${prefix}${key}`
        await client.setex(prefixedKey, ttlSeconds, serialized)
      },
      catch: (e) =>
        e instanceof CacheSerializationError
          ? e
          : new CacheOperationError({ operation: "set", key, cause: e }),
    })
  }

  async function getCache<T>(
    key: string,
  ): Promise<Result<T | null, CacheOperationError | CacheSerializationError>> {
    const clientResult = await getRedisClient()

    if (clientResult.isErr()) {
      return Result.err(
        new CacheOperationError({
          operation: "get",
          key,
          cause: clientResult.error,
        }),
      )
    }

    const client = clientResult.value
    if (!client) return Result.ok(null)

    return Result.tryPromise({
      try: async () => {
        const prefixedKey = `${prefix}${key}`
        const value = await client.get(prefixedKey)
        if (!value) return null

        return JSON.parse(value, (_key, val) => {
          if (val && typeof val === "object" && val.__type === "Date") {
            return new Date(val.value)
          }
          return val
        }) as T
      },
      catch: (e) =>
        e instanceof CacheSerializationError
          ? e
          : new CacheOperationError({ operation: "get", key, cause: e }),
    })
  }

  async function deleteCache(
    key: string,
  ): Promise<Result<void, CacheOperationError>> {
    const clientResult = await getRedisClient()

    if (clientResult.isErr()) {
      return Result.err(
        new CacheOperationError({
          operation: "delete",
          key,
          cause: clientResult.error,
        }),
      )
    }

    const client = clientResult.value
    if (!client) return Result.ok(undefined)

    return Result.tryPromise({
      try: async () => {
        const prefixedKey = `${prefix}${key}`
        await client.del(prefixedKey)
      },
      catch: (e) =>
        new CacheOperationError({ operation: "delete", key, cause: e }),
    })
  }

  async function invalidatePattern(
    pattern: string,
  ): Promise<Result<void, CacheOperationError>> {
    const clientResult = await getRedisClient()

    if (clientResult.isErr()) {
      return Result.err(
        new CacheOperationError({
          operation: "invalidate",
          key: pattern,
          cause: clientResult.error,
        }),
      )
    }

    const client = clientResult.value
    if (!client) return Result.ok(undefined)

    return Result.tryPromise({
      try: async () => {
        const prefixedPattern = `${prefix}${pattern}`
        const keys = await client.keys(prefixedPattern)
        if (keys.length > 0) {
          await client.del(...keys)
        }
      },
      catch: (e) =>
        new CacheOperationError({
          operation: "invalidate",
          key: pattern,
          cause: e,
        }),
    })
  }

  async function getRedisClient(): Promise<
    Result<Redis | null, RedisConnectionError>
  > {
    if (typeof process === "undefined") {
      return Result.ok(null)
    }

    if (!redis) {
      const initResult = await initRedis()
      if (initResult.isErr()) {
        return Result.err(initResult.error)
      }
      redis = initResult.value
    }

    return Result.ok(redis)
  }

  async function close(): Promise<Result<void, CacheOperationError>> {
    if (!redis) {
      return Result.ok(undefined)
    }

    const result = await Result.tryPromise({
      try: async () => {
        await redis!.quit()
        logger.info("Redis connection closed successfully")
        redis = null
      },
      catch: (e) => new CacheOperationError({ operation: "close", cause: e }),
    })

    if (result.isErr()) {
      if (redis) {
        redis.disconnect()
        redis = null
      }
    }

    return result
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
