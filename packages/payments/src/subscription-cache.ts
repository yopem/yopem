import { Result } from "better-result"

import { redisCache } from "cache"
import type { SelectSubscription } from "db/schema"

const SUBSCRIPTION_CACHE_TTL = 60

const getSubscriptionCacheKey = (userId: string): string => {
  return `subscription:${userId}`
}

export const getCachedSubscription = async (
  userId: string,
): Promise<Result<SelectSubscription | null, Error>> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  return await redisCache.getCache<SelectSubscription>(cacheKey)
}

export const setCachedSubscription = async (
  userId: string,
  subscription: SelectSubscription,
): Promise<Result<void, Error>> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  return await redisCache.setCache(
    cacheKey,
    subscription,
    SUBSCRIPTION_CACHE_TTL,
  )
}

export const invalidateSubscriptionCache = async (
  userId: string,
): Promise<Result<void, Error>> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  return await redisCache.deleteCache(cacheKey)
}

export const invalidateAllSubscriptionsCache = async (): Promise<
  Result<void, Error>
> => {
  return await redisCache.invalidatePattern("subscription:*")
}
