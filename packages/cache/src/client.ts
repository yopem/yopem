import { RedisClient } from "bun"

import { redisKeyPrefix, redisUrl } from "env"

export type RedisCache = ReturnType<typeof createRedisCache>

export function createRedisCache() {
  let redis: RedisClient | null = null
  const prefix = redisKeyPrefix || ""

  const prefixed = (key: string) => `${prefix}${key}`

  function initRedis(): RedisClient | null {
    if (redis) return redis

    if (!redisUrl) {
      console.warn("Redis URL not found. Caching will be disabled.")
      return null
    }

    const client = new RedisClient(redisUrl)
    client.onconnect = () => {
      console.info("Redis connected successfully")
    }
    client.onclose = (error) => {
      console.error(
        `Redis connection closed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    redis = client
    return client
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
      await client.send("SETEX", [
        prefixed(key),
        String(ttlSeconds),
        serialized,
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache set failed for key ${key}: ${msg}`)
    }
  }

  async function getCache<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()
    if (!client) return null

    try {
      const value = await client.get(prefixed(key))
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
      await client.del(prefixed(key))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache delete failed for key ${key}: ${msg}`)
    }
  }

  async function hasCache(key: string): Promise<boolean> {
    const client = await getRedisClient()
    if (!client) return false

    try {
      return await client.exists(prefixed(key))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache exists failed for key ${key}: ${msg}`)
    }
  }

  async function expireCache(
    key: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    const client = await getRedisClient()
    if (!client) return false

    try {
      return (await client.expire(prefixed(key), ttlSeconds)) > 0
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache expire failed for key ${key}: ${msg}`)
    }
  }

  async function invalidatePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return

    try {
      const keys = await scanKeys(client, prefixed(pattern))
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => client.del(key)))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`Cache invalidate failed for pattern ${pattern}: ${msg}`)
    }
  }

  async function scanKeys(
    client: RedisClient,
    pattern: string,
  ): Promise<string[]> {
    let cursor = "0"
    const keys: string[] = []

    do {
      const [next, batch] = (await client.send("SCAN", [
        cursor,
        "MATCH",
        pattern,
      ])) as [string, string[]]
      keys.push(...batch)
      cursor = next
    } while (cursor !== "0")

    return keys
  }

  function getRedisClient(): Promise<RedisClient | null> {
    if (typeof process === "undefined") {
      return Promise.resolve(null)
    }

    redis ??= initRedis()

    return Promise.resolve(redis)
  }

  function close(): void {
    if (!redis) {
      return
    }

    redis.close()
    console.info("Redis connection closed successfully")
    redis = null
  }

  return {
    setCache,
    getCache,
    deleteCache,
    hasCache,
    expireCache,
    invalidatePattern,
    getRedisClient,
    close,
  }
}
