import { Result } from "better-result"

import { redisCache } from "cache"

const USAGE_ALERT_PREFIX = "usage_alert:"
const ALERT_THRESHOLDS = [0.8, 0.9, 0.95, 1.0]

const getAlertCacheKey = (userId: string, threshold: number): string => {
  return `${USAGE_ALERT_PREFIX}${userId}:${threshold}`
}

export const shouldSendUsageAlert = async (
  userId: string,
  usagePercentage: number,
): Promise<Result<boolean, Error>> => {
  try {
    for (const threshold of ALERT_THRESHOLDS) {
      if (usagePercentage >= threshold * 100) {
        const cacheKey = getAlertCacheKey(userId, threshold)
        const existingAlert = await redisCache.getCache<string>(cacheKey)

        if (Result.isError(existingAlert) || !existingAlert.value) {
          await redisCache.setCache(cacheKey, "1", 86400)
          return Result.ok(true)
        }

        return Result.ok(false)
      }
    }

    return Result.ok(false)
  } catch (e) {
    return Result.err(
      e instanceof Error ? e : new Error("Failed to check usage alert"),
    )
  }
}

export const getPendingAlerts = async (
  userId: string,
): Promise<Result<number[], Error>> => {
  try {
    const pendingAlerts: number[] = []

    for (const threshold of ALERT_THRESHOLDS) {
      const cacheKey = getAlertCacheKey(userId, threshold)
      const exists = await redisCache.getCache<string>(cacheKey)

      if (Result.isOk(exists) && exists.value) {
        pendingAlerts.push(threshold)
      }
    }

    return Result.ok(pendingAlerts)
  } catch (e) {
    return Result.err(
      e instanceof Error ? e : new Error("Failed to get pending alerts"),
    )
  }
}

export const clearUsageAlerts = async (
  userId: string,
): Promise<Result<void, Error>> => {
  try {
    for (const threshold of ALERT_THRESHOLDS) {
      const cacheKey = getAlertCacheKey(userId, threshold)
      await redisCache.deleteCache(cacheKey)
    }

    return Result.ok(undefined)
  } catch (e) {
    return Result.err(
      e instanceof Error ? e : new Error("Failed to clear usage alerts"),
    )
  }
}

export const formatUsageAlertMessage = (
  usagePercentage: number,
  used: number,
  limit: number,
): string => {
  if (usagePercentage >= 100) {
    return `You've reached your monthly limit (${used}/${limit} requests). Upgrade to continue using tools.`
  }

  if (usagePercentage >= 95) {
    return `Warning: You've used ${usagePercentage.toFixed(0)}% of your monthly limit (${used}/${limit} requests).`
  }

  if (usagePercentage >= 90) {
    return `You've used ${usagePercentage.toFixed(0)}% of your monthly limit (${used}/${limit} requests). Consider upgrading soon.`
  }

  if (usagePercentage >= 80) {
    return `You've used ${usagePercentage.toFixed(0)}% of your monthly limit (${used}/${limit} requests).`
  }

  return ""
}
