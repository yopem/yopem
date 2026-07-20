import { getUserCredits, deductOverflowCredit } from "db/services/user"

import { checkQuota, type QuotaCheck } from "./quota-check"
import { recordUsage } from "./usage-tracking"

export interface SubscriptionCheckResult {
  allowed: boolean
  reason?: string
  quotaCheck?: QuotaCheck
}

export const requireSubscriptionForProduct = async (
  userId: string,
  estimatedTokens: number,
): Promise<SubscriptionCheckResult> => {
  const quotaCheck = await checkQuota(userId, estimatedTokens)

  if (!quotaCheck.allowed) {
    if (quotaCheck.reason === "monthly_quota_exceeded") {
      const credits = await getUserCredits(userId)
      const overflowBalance = Number(credits?.overflowBalance ?? 0)

      if (overflowBalance > 0) {
        const deducted = await deductOverflowCredit(userId, "product-run")

        if (deducted) {
          return {
            allowed: true,
            reason: "overflow_credit_used",
            quotaCheck,
          }
        }
      }

      return {
        allowed: false,
        reason: "overflow_credits_exhausted",
        quotaCheck,
      }
    }

    return {
      allowed: false,
      reason: quotaCheck.reason,
      quotaCheck,
    }
  }

  return {
    allowed: true,
    quotaCheck,
  }
}

export const trackProductExecution = async (
  userId: string,
  tokensUsed: number,
): Promise<void> => {
  await recordUsage(userId, tokensUsed)
}

export const formatQuotaError = (reason: string): string => {
  switch (reason) {
    case "subscription_expired":
      return "Your subscription has expired. Please renew to continue using products."
    case "payment_overdue":
      return "Your subscription payment is overdue. Please update your payment method."
    case "monthly_quota_exceeded":
      return "You have reached your monthly usage limit. Upgrade your plan for more requests."
    case "token_limit_exceeded":
      return "This request exceeds your plan's token limit. Try a shorter input or upgrade your plan."
    case "overflow_credits_exhausted":
      return "You have used all your extra runs. Purchase more or upgrade your plan for additional monthly requests."
    default:
      return "Subscription check failed. Please contact support."
  }
}
