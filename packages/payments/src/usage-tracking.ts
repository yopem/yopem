import { Result } from "better-result"

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
): Promise<Result<number, Error>> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existingResult = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existingResult.isOk() && existingResult.value) {
    data = existingResult.value
    data.requestCount += 1
    data.lastUpdated = new Date().toISOString()
  } else {
    data = {
      requestCount: 1,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const setResult = await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  if (setResult.isErr()) {
    return Result.err(setResult.error)
  }

  return Result.ok(data.requestCount)
}

export const incrementTokenCount = async (
  userId: string,
  tokens: number,
): Promise<Result<number, Error>> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existingResult = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existingResult.isOk() && existingResult.value) {
    data = existingResult.value
    data.tokenCount += tokens
    data.lastUpdated = new Date().toISOString()
  } else {
    data = {
      requestCount: 0,
      tokenCount: tokens,
      lastUpdated: new Date().toISOString(),
    }
  }

  const setResult = await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  if (setResult.isErr()) {
    return Result.err(setResult.error)
  }

  return Result.ok(data.tokenCount)
}

export const recordUsage = async (
  userId: string,
  tokens: number,
): Promise<Result<UsageData, Error>> => {
  const cacheKey = getCurrentUsageKey(userId)

  const existingResult = await redisCache.getCache<UsageData>(cacheKey)

  let data: UsageData
  if (existingResult.isOk() && existingResult.value) {
    data = existingResult.value
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

  const setResult = await redisCache.setCache(cacheKey, data, USAGE_CACHE_TTL)

  if (setResult.isErr()) {
    return Result.err(setResult.error)
  }

  return Result.ok(data)
}

export const getCurrentUsage = async (
  userId: string,
): Promise<Result<UsageData, Error>> => {
  const cacheKey = getCurrentUsageKey(userId)

  const result = await redisCache.getCache<UsageData>(cacheKey)

  if (result.isErr()) {
    return Result.err(result.error)
  }

  return Result.ok(
    result.value ?? {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    },
  )
}

export const getUsageForMonth = async (
  userId: string,
  year: number,
  month: number,
): Promise<Result<UsageData, Error>> => {
  const cacheKey = getUsageKey(userId, year, month)

  const result = await redisCache.getCache<UsageData>(cacheKey)

  if (result.isErr()) {
    return Result.err(result.error)
  }

  return Result.ok(
    result.value ?? {
      requestCount: 0,
      tokenCount: 0,
      lastUpdated: new Date().toISOString(),
    },
  )
}

export const resetUsage = async (
  userId: string,
): Promise<Result<void, Error>> => {
  const cacheKey = getCurrentUsageKey(userId)
  return await redisCache.deleteCache(cacheKey)
}
