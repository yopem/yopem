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

export const incrementRequestCount = async (
  userId: string,
): Promise<number> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existing = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existing) {
    data = existing
    data.requestCount += 1
    data.lastUpdated = new Date().toISOString()
  } else {
    data = {
      requestCount: 1,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  return data.requestCount
}

export const incrementTokenCount = async (
  userId: string,
  tokens: number,
): Promise<number> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existing = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existing) {
    data = existing
    data.tokenCount += tokens
    data.lastUpdated = new Date().toISOString()
  } else {
    data = {
      requestCount: 0,
      tokenCount: tokens,
      lastUpdated: new Date().toISOString(),
    }
  }

  await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  return data.tokenCount
}

export const recordUsage = async (
  userId: string,
  tokens: number,
): Promise<UsageData> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existing = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existing) {
    data = existing
    data.requestCount += 1
    data.tokenCount += tokens
    data.lastUpdated = new Date().toISOString()
  } else {
    data = {
      requestCount: 1,
      tokenCount: tokens,
      lastUpdated: new Date().toISOString(),
    }
  }

  await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  return data
}

export const getCurrentUsage = async (userId: string): Promise<UsageData> => {
  const cacheKey = getCurrentUsageKey(userId)

  const result = await redisCache.getCache<UsageData>(cacheKey)

  return (
    result ?? {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  )
}

export const getUsageForMonth = async (
  userId: string,
  year: number,
  month: number,
): Promise<UsageData> => {
  const cacheKey = getUsageKey(userId, year, month)

  const result = await redisCache.getCache<UsageData>(cacheKey)

  return (
    result ?? {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  )
}

export const resetUsage = async (userId: string): Promise<void> => {
  const cacheKey = getCurrentUsageKey(userId)
  await redisCache.deleteCache(cacheKey)
}
