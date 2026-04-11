import { Result } from "better-result"

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
): Promise<Result<QuotaCheck, Error>> => {
  const [usageResult, entitlementsResult] = await Promise.all([
    getCurrentUsage(userId),
    getEntitlements(userId),
  ])

  if (usageResult.isErr()) {
    return Result.err(usageResult.error)
  }

  if (entitlementsResult.isErr()) {
    return Result.err(entitlementsResult.error)
  }

  const usage = usageResult.value
  const entitlements = entitlementsResult.value

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
    return Result.ok(quotaCheck)
  }

  if (entitlements.status === "past_due") {
    const gracePeriodEnd = entitlements.currentPeriodEnd
    if (gracePeriodEnd) {
      const threeDaysFromEnd = new Date(gracePeriodEnd)
      threeDaysFromEnd.setDate(threeDaysFromEnd.getDate() + 3)
      if (new Date() > threeDaysFromEnd) {
        quotaCheck.allowed = false
        quotaCheck.reason = "payment_overdue"
        return Result.ok(quotaCheck)
      }
    }
  }

  if (usage.requestCount >= maxRequests) {
    quotaCheck.allowed = false
    quotaCheck.reason = "monthly_quota_exceeded"
    return Result.ok(quotaCheck)
  }

  if (requestedTokens > maxTokens) {
    quotaCheck.allowed = false
    quotaCheck.reason = "token_limit_exceeded"
    return Result.ok(quotaCheck)
  }

  return Result.ok(quotaCheck)
}

export const canExecuteTool = async (
  userId: string,
  requestedTokens: number,
): Promise<Result<boolean, Error>> => {
  const checkResult = await checkQuota(userId, requestedTokens)

  if (checkResult.isErr()) {
    return Result.err(checkResult.error)
  }

  return Result.ok(checkResult.value.allowed)
}
