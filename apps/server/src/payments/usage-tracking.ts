import { redisCache } from "cache"

const USAGE_CACHE_TTL = 35 * 24 * 60 * 60

const getUsageKey = (userId: string, year: number, month: number): string => {
  return `usage:${userId}:${year}:${month}`
}

const getCurrentUsageKey = (userId: string): string => {
  const now = new Date()
  return getUsageKey(userId, now.getFullYear(), now.getMonth() + 1)
}

export interface UsageData {
  requestCount: number
  tokenCount: number
  lastUpdated: string
}

const fromHash = (raw: Record<string, string>): UsageData => ({
  requestCount: Number.parseInt(raw["requestCount"] ?? "0", 10),
  tokenCount: Number.parseInt(raw["tokenCount"] ?? "0", 10),
  lastUpdated: raw["lastUpdated"] ?? new Date().toISOString(),
})

// Atomic increment using Redis HINCRBY. Avoids the lost-update race where
// concurrent requests each read the same snapshot and overwrite each other.
const atomicIncrement = async (
  cacheKey: string,
  requestDelta: number,
  tokenDelta: number,
): Promise<UsageData> => {
  const client = await redisCache.getRedisClient()
  if (!client) {
    return {
      requestCount: requestDelta,
      tokenCount: tokenDelta,
      lastUpdated: new Date().toISOString(),
    }
  }

  const now = new Date().toISOString()
  const commands: ["requestCount" | "tokenCount", number][] = []
  const pipeline = client.pipeline()
  if (requestDelta) {
    commands.push(["requestCount", requestDelta])
    pipeline.hincrby(cacheKey, "requestCount", requestDelta)
  }
  if (tokenDelta) {
    commands.push(["tokenCount", tokenDelta])
    pipeline.hincrby(cacheKey, "tokenCount", tokenDelta)
  }
  pipeline.hset(cacheKey, "lastUpdated", now)
  pipeline.expire(cacheKey, USAGE_CACHE_TTL)
  const results = (await pipeline.exec()) ?? []

  // results: [[err, val], ...] in the order commands were queued.
  // hincrby returns the new field value after increment.
  let requestCount = 0
  let tokenCount = 0
  commands.forEach(([_field, _delta], i) => {
    const val = Number(results[i]?.[1] ?? 0)
    if (_field === "requestCount") requestCount = val
    else tokenCount = val
  })

  return {
    requestCount,
    tokenCount,
    lastUpdated: now,
  }
}

export const incrementRequestCount = async (
  userId: string,
): Promise<number> => {
  const data = await atomicIncrement(getCurrentUsageKey(userId), 1, 0)
  return data.requestCount
}

export const incrementTokenCount = async (
  userId: string,
  tokens: number,
): Promise<number> => {
  const data = await atomicIncrement(getCurrentUsageKey(userId), 0, tokens)
  return data.tokenCount
}

export const recordUsage = (
  userId: string,
  tokens: number,
): Promise<UsageData> => {
  return atomicIncrement(getCurrentUsageKey(userId), 1, tokens)
}

export const getCurrentUsage = async (userId: string): Promise<UsageData> => {
  const cacheKey = getCurrentUsageKey(userId)
  const client = await redisCache.getRedisClient()
  if (!client) {
    return {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const raw = await client.hgetall(cacheKey)
  if (!raw || Object.keys(raw).length === 0) {
    return {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  return fromHash(raw)
}

export const getUsageForMonth = async (
  userId: string,
  year: number,
  month: number,
): Promise<UsageData> => {
  const cacheKey = getUsageKey(userId, year, month)
  const client = await redisCache.getRedisClient()
  if (!client) {
    return {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const raw = await client.hgetall(cacheKey)
  if (!raw || Object.keys(raw).length === 0) {
    return {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  return fromHash(raw)
}

export const resetUsage = async (userId: string): Promise<void> => {
  const cacheKey = getCurrentUsageKey(userId)
  await redisCache.deleteCache(cacheKey)
}
