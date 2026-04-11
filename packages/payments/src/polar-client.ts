import { Polar } from "@polar-sh/sdk"

import type { SelectSubscription } from "db/schema"

const appEnv = process.env["APP_ENV"] ?? "development"
const polarAccessToken = process.env["POLAR_ACCESS_TOKEN"] ?? ""

const polar = new Polar({
  accessToken: polarAccessToken,
  server: appEnv === "development" ? "sandbox" : "production",
})

export interface PolarSubscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  productId: string
  product: {
    id: string
    name: string
    metadata?: Record<string, string | number | boolean>
  }
}

export const fetchPolarSubscription = async (
  polarSubscriptionId: string,
): Promise<PolarSubscription | null> => {
  try {
    const subscription = await polar.subscriptions.get({
      id: polarSubscriptionId,
    })

    if (!subscription) {
      return null
    }

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt ?? undefined,
      productId: subscription.productId,
      product: {
        id: subscription.product.id,
        name: subscription.product.name,
        metadata: subscription.product.metadata ?? undefined,
      },
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch Polar subscription")
  }
}

interface SubscriptionUpdateData {
  status: SelectSubscription["status"]
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  cancelledAt?: Date
}

export const syncSubscriptionFromPolar = async (
  subscription: SelectSubscription,
): Promise<SubscriptionUpdateData | null> => {
  if (!subscription.polarSubscriptionId) {
    return null
  }

  const polarData = await fetchPolarSubscription(
    subscription.polarSubscriptionId,
  )

  if (!polarData) {
    return null
  }

  const updateData: SubscriptionUpdateData = {
    status: mapPolarStatus(polarData.status),
    currentPeriodStart: new Date(polarData.currentPeriodStart),
    currentPeriodEnd: new Date(polarData.currentPeriodEnd),
    cancelAtPeriodEnd: polarData.cancelAtPeriodEnd,
    cancelledAt: polarData.canceledAt
      ? new Date(polarData.canceledAt)
      : undefined,
  }

  return updateData
}

const mapPolarStatus = (polarStatus: string): SelectSubscription["status"] => {
  switch (polarStatus) {
    case "active":
      return "active"
    case "canceled":
      return "cancelled"
    case "incomplete":
    case "incomplete_expired":
      return "past_due"
    case "past_due":
      return "past_due"
    case "unpaid":
      return "expired"
    case "trialing":
      return "active"
    case "paused":
      return "past_due"
    default:
      return "past_due"
  }
}
