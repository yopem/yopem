import { Polar } from "@polar-sh/sdk"
import { Result } from "better-result"

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
): Promise<Result<PolarSubscription | null, Error>> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to fetch Polar subscription"),
  })
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
): Promise<Result<SubscriptionUpdateData | null, Error>> => {
  if (!subscription.polarSubscriptionId) {
    return Result.ok(null)
  }

  const polarResult = await fetchPolarSubscription(
    subscription.polarSubscriptionId,
  )

  if (polarResult.isErr()) {
    return Result.err(polarResult.error)
  }

  const polarData = polarResult.value

  if (!polarData) {
    return Result.ok(null)
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

  return Result.ok(updateData)
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
