import { Result } from "better-result"

import { logger } from "logger"
import { checkQuota, type QuotaCheck } from "payments/quota-check"
import { recordUsage } from "payments/usage-tracking"

export interface SubscriptionCheckResult {
  allowed: boolean
  reason?: string
  quotaCheck: QuotaCheck
}

export const requireSubscriptionForTool = async (
  userId: string,
  estimatedTokens: number,
): Promise<Result<SubscriptionCheckResult, Error>> => {
  const quotaResult = await checkQuota(userId, estimatedTokens)

  if (quotaResult.isErr()) {
    logger.error(
      { userId, error: quotaResult.error.message },
      "Failed to check subscription quota",
    )
    return Result.err(quotaResult.error)
  }

  const quotaCheck = quotaResult.value

  if (!quotaCheck.allowed) {
    return Result.ok({
      allowed: false,
      reason: quotaCheck.reason,
      quotaCheck,
    })
  }

  return Result.ok({
    allowed: true,
    quotaCheck,
  })
}

export const trackToolExecution = async (
  userId: string,
  tokensUsed: number,
): Promise<Result<void, Error>> => {
  const recordResult = await recordUsage(userId, tokensUsed)

  if (recordResult.isErr()) {
    logger.error(
      { userId, tokensUsed, error: recordResult.error.message },
      "Failed to record tool usage",
    )
    return Result.err(recordResult.error)
  }

  return Result.ok()
}

export const formatQuotaError = (reason: string): string => {
  switch (reason) {
    case "subscription_expired":
      return "Your subscription has expired. Please renew to continue using tools."
    case "payment_overdue":
      return "Your subscription payment is overdue. Please update your payment method."
    case "monthly_quota_exceeded":
      return "You have reached your monthly usage limit. Upgrade your plan for more requests."
    case "token_limit_exceeded":
      return "This request exceeds your plan's token limit. Try a shorter input or upgrade your plan."
    default:
      return "Subscription check failed. Please contact support."
  }
}
