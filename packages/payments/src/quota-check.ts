import { getEntitlements, type Entitlements } from "./entitlements"
import { getCurrentUsage, type UsageData } from "./usage-tracking"

export interface QuotaCheck {
  allowed: boolean
  reason?: string
  currentUsage: UsageData
  entitlements: Entitlements
  quotaRemaining: {
    requests: number
    tokens: number
  }
}

export const checkQuota = async (
  userId: string,
  requestedTokens: number,
): Promise<QuotaCheck> => {
  const [usage, entitlements] = await Promise.all([
    getCurrentUsage(userId),
    getEntitlements(userId),
  ])

  const maxRequests = entitlements.limits.maxRequestsPerMonth
  const maxTokens = entitlements.limits.maxTokensPerRequest

  const requestsRemaining = maxRequests - usage.requestCount
  const tokensRemaining = maxTokens - requestedTokens

  const quotaCheck: QuotaCheck = {
    allowed: true,
    currentUsage: usage,
    entitlements,
    quotaRemaining: {
      requests: Math.max(0, requestsRemaining),
      tokens: Math.max(0, tokensRemaining),
    },
  }

  if (entitlements.status === "expired") {
    quotaCheck.allowed = false
    quotaCheck.reason = "subscription_expired"
    return quotaCheck
  }

  if (entitlements.status === "past_due") {
    const gracePeriodEnd = entitlements.currentPeriodEnd
    if (gracePeriodEnd) {
      const threeDaysFromEnd = new Date(gracePeriodEnd)
      threeDaysFromEnd.setDate(threeDaysFromEnd.getDate() + 3)
      if (new Date() > threeDaysFromEnd) {
        quotaCheck.allowed = false
        quotaCheck.reason = "payment_overdue"
        return quotaCheck
      }
    }
  }

  if (usage.requestCount >= maxRequests) {
    quotaCheck.allowed = false
    quotaCheck.reason = "monthly_quota_exceeded"
    return quotaCheck
  }

  if (requestedTokens > maxTokens) {
    quotaCheck.allowed = false
    quotaCheck.reason = "token_limit_exceeded"
    return quotaCheck
  }

  return quotaCheck
}

export const canExecuteTool = async (
  userId: string,
  requestedTokens: number,
): Promise<boolean> => {
  const check = await checkQuota(userId, requestedTokens)
  return check.allowed
}
