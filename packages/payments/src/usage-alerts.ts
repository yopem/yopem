import { redisCache } from "cache"

const USAGE_ALERT_PREFIX = "usage_alert:"
const ALERT_THRESHOLDS = [0.8, 0.9, 0.95, 1.0]

const getAlertCacheKey = (userId: string, threshold: number): string => {
  return `${USAGE_ALERT_PREFIX}${userId}:${threshold}`
}

export const shouldSendUsageAlert = async (
  userId: string,
  usagePercentage: number,
): Promise<boolean> => {
  for (const threshold of ALERT_THRESHOLDS) {
    if (usagePercentage >= threshold * 100) {
      const cacheKey = getAlertCacheKey(userId, threshold)
      const existingAlert = await redisCache.getCache<string>(cacheKey)

      if (!existingAlert) {
        await redisCache.setCache(cacheKey, "1", 86400)
        return true
      }

      return false
    }
  }

  return false
}

export const getPendingAlerts = async (userId: string): Promise<number[]> => {
  const pendingAlerts: number[] = []

  for (const threshold of ALERT_THRESHOLDS) {
    const cacheKey = getAlertCacheKey(userId, threshold)
    const exists = await redisCache.getCache<string>(cacheKey)

    if (exists) {
      pendingAlerts.push(threshold)
    }
  }

  return pendingAlerts
}

export const clearUsageAlerts = async (userId: string): Promise<void> => {
  for (const threshold of ALERT_THRESHOLDS) {
    const cacheKey = getAlertCacheKey(userId, threshold)
    await redisCache.deleteCache(cacheKey)
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
