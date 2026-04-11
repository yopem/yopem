import type { SelectSubscription } from "db/schema"

import { redisCache } from "../cache"

const SUBSCRIPTION_CACHE_TTL = 60

const getSubscriptionCacheKey = (userId: string): string => {
  return `subscription:${userId}`
}

export const getCachedSubscription = async (
  userId: string,
): Promise<SelectSubscription | null> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  return await redisCache.getCache<SelectSubscription>(cacheKey)
}

export const setCachedSubscription = async (
  userId: string,
  subscription: SelectSubscription,
): Promise<void> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  await redisCache.setCache(cacheKey, subscription, SUBSCRIPTION_CACHE_TTL)
}

export const invalidateSubscriptionCache = async (
  userId: string,
): Promise<void> => {
  const cacheKey = getSubscriptionCacheKey(userId)
  await redisCache.deleteCache(cacheKey)
}

export const invalidateAllSubscriptionsCache = async (): Promise<void> => {
  await redisCache.invalidatePattern("subscription:*")
}
