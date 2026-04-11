import { Result } from "better-result"

import { db } from "db"
import { polarPaymentEventsTable } from "db/schema"
import {
  createSubscription,
  getSubscription,
  updateSubscriptionByPolarId,
} from "db/services/subscriptions"
import { logger } from "logger"
import { invalidateSubscriptionCache } from "payments/subscription-cache"
import { createCustomId } from "shared/custom-id"

import type { SubscriptionStatus, SubscriptionTier } from "./subscription-plans"

interface SubscriptionMetadata {
  userId: string
  tier?: SubscriptionTier
}

interface SubscriptionData {
  id: string
  customerId: string
  productId: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt?: string
  metadata: Record<string, unknown>
}

interface SubscriptionWebhookPayload {
  data: SubscriptionData
}

const parseSubscriptionMetadata = (
  metadata: Record<string, unknown>,
): SubscriptionMetadata | null => {
  const userId = metadata["userId"]
  if (typeof userId !== "string") {
    return null
  }

  return {
    userId,
    tier: (metadata["tier"] as SubscriptionTier) ?? undefined,
  }
}

const mapPolarStatus = (status: string): SubscriptionStatus => {
  switch (status) {
    case "active":
    case "trialing":
      return "active"
    case "canceled":
      return "cancelled"
    case "incomplete":
    case "incomplete_expired":
    case "past_due":
    case "paused":
      return "past_due"
    case "unpaid":
      return "expired"
    default:
      return "past_due"
  }
}

const tierFromProductId = (productId: string): SubscriptionTier => {
  const proProductId = process.env["POLAR_PRO_PRODUCT_ID"]
  const enterpriseProductId = process.env["POLAR_ENTERPRISE_PRODUCT_ID"]

  if (productId === enterpriseProductId) {
    return "enterprise"
  }
  if (productId === proProductId) {
    return "pro"
  }
  return "free"
}

export const handleSubscriptionCreated = async (
  payload: SubscriptionWebhookPayload,
): Promise<Result<void, Error>> => {
  const subscription = payload.data

  return Result.tryPromise({
    try: async () => {
      await db.insert(polarPaymentEventsTable).values({
        id: createCustomId(),
        eventType: "subscription.created",
        polarEventId: subscription.id,
        payload: JSON.stringify(payload),
      })

      const metadata = parseSubscriptionMetadata(subscription.metadata)
      if (!metadata) {
        logger.error(
          { subscriptionId: subscription.id },
          "Missing userId in subscription metadata",
        )
        return
      }

      const existingResult = await getSubscription(metadata.userId)
      if (existingResult.isOk() && existingResult.value) {
        const existing = existingResult.value
        if (existing.polarSubscriptionId === subscription.id) {
          logger.info(
            `Subscription already exists: subscriptionId=${subscription.id}`,
          )
          return
        }
      }

      const tier = metadata.tier ?? tierFromProductId(subscription.productId)

      const createResult = await createSubscription({
        userId: metadata.userId,
        polarSubscriptionId: subscription.id,
        polarCustomerId: subscription.customerId,
        tier,
        status: mapPolarStatus(subscription.status),
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : null,
        source: "polar",
      })

      if (createResult.isErr()) {
        throw createResult.error
      }

      await invalidateSubscriptionCache(metadata.userId)

      logger.info(
        `Subscription created: subscriptionId=${subscription.id}, userId=${metadata.userId}, tier=${tier}`,
      )
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to create subscription"),
  })
}

export const handleSubscriptionUpdated = async (
  payload: SubscriptionWebhookPayload,
): Promise<Result<void, Error>> => {
  const subscription = payload.data

  return Result.tryPromise({
    try: async () => {
      await db.insert(polarPaymentEventsTable).values({
        id: createCustomId(),
        eventType: "subscription.updated",
        polarEventId: subscription.id,
        payload: JSON.stringify(payload),
      })

      const updateResult = await updateSubscriptionByPolarId(subscription.id, {
        status: mapPolarStatus(subscription.status),
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : null,
      })

      if (updateResult.isErr()) {
        if (updateResult.error instanceof Error) {
          throw updateResult.error
        }
        throw new Error("Failed to update subscription")
      }

      const updated = updateResult.value
      await invalidateSubscriptionCache(updated.userId)

      logger.info(
        `Subscription updated: subscriptionId=${subscription.id}, status=${subscription.status}`,
      )
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to update subscription"),
  })
}

export const handleSubscriptionCancelled = async (
  payload: SubscriptionWebhookPayload,
): Promise<Result<void, Error>> => {
  const subscription = payload.data

  return Result.tryPromise({
    try: async () => {
      await db.insert(polarPaymentEventsTable).values({
        id: createCustomId(),
        eventType: "subscription.cancelled",
        polarEventId: subscription.id,
        payload: JSON.stringify(payload),
      })

      const updateResult = await updateSubscriptionByPolarId(subscription.id, {
        status: "cancelled",
        cancelAtPeriodEnd: true,
        cancelledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : new Date(),
      })

      if (updateResult.isErr()) {
        if (updateResult.error instanceof Error) {
          throw updateResult.error
        }
        throw new Error("Failed to cancel subscription")
      }

      const updated = updateResult.value
      await invalidateSubscriptionCache(updated.userId)

      logger.info(`Subscription cancelled: subscriptionId=${subscription.id}`)
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to cancel subscription"),
  })
}

export const handleSubscriptionPaymentFailed = async (
  payload: SubscriptionWebhookPayload,
): Promise<Result<void, Error>> => {
  const subscription = payload.data

  return Result.tryPromise({
    try: async () => {
      await db.insert(polarPaymentEventsTable).values({
        id: createCustomId(),
        eventType: "subscription.payment_failed",
        polarEventId: subscription.id,
        payload: JSON.stringify(payload),
      })

      const updateResult = await updateSubscriptionByPolarId(subscription.id, {
        status: "past_due",
      })

      if (updateResult.isErr()) {
        if (updateResult.error instanceof Error) {
          throw updateResult.error
        }
        throw new Error("Failed to update subscription payment status")
      }

      const updated = updateResult.value
      await invalidateSubscriptionCache(updated.userId)

      logger.warn(
        `Subscription payment failed: subscriptionId=${subscription.id}, userId=${updated.userId}`,
      )
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to handle payment failure"),
  })
}
