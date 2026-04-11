import { Result } from "better-result"

import { getOrCreateSubscription } from "db/services/subscriptions"

import type { SubscriptionTier } from "./subscription-plans"

import { getPlanConfig, getTierLimits } from "./subscription-plans"

export interface Entitlements {
  tier: SubscriptionTier
  status: "active" | "cancelled" | "past_due" | "expired"
  limits: {
    maxRequestsPerMonth: number
    maxTokensPerRequest: number
    maxCustomTools: number | null
  }
  features: string[]
  isPaid: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
}

export const getEntitlements = async (
  userId: string,
): Promise<Result<Entitlements, Error>> => {
  const subscriptionResult = await getOrCreateSubscription(userId)

  if (subscriptionResult.isErr()) {
    return Result.err(subscriptionResult.error)
  }

  const subscription = subscriptionResult.value
  const planConfig = getPlanConfig(subscription.tier)
  const limits = getTierLimits(subscription.tier)

  const entitlements: Entitlements = {
    tier: subscription.tier,
    status: subscription.status,
    limits,
    features: planConfig.features,
    isPaid: subscription.tier !== "free",
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
  }

  return Result.ok(entitlements)
}

export const checkFeatureAccess = (
  entitlements: Entitlements,
  feature: string,
): boolean => {
  return entitlements.features.includes(feature)
}

export const isSubscriptionActive = (entitlements: Entitlements): boolean => {
  if (entitlements.status === "active") {
    return true
  }

  if (entitlements.status === "cancelled" && !entitlements.cancelAtPeriodEnd) {
    return true
  }

  if (entitlements.status === "past_due") {
    const gracePeriodEnd = entitlements.currentPeriodEnd
    if (gracePeriodEnd) {
      const threeDaysFromEnd = new Date(gracePeriodEnd)
      threeDaysFromEnd.setDate(threeDaysFromEnd.getDate() + 3)
      return new Date() < threeDaysFromEnd
    }
  }

  return false
}
