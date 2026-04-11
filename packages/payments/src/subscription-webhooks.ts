import { db } from "db"
import { polarPaymentEventsTable } from "db/schema"
import {
  createSubscription,
  getSubscription,
  updateSubscriptionByPolarId,
} from "db/services/subscriptions"
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
): Promise<void> => {
  const subscription = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "subscription.created",
      polarEventId: subscription.id,
      payload: JSON.stringify(payload),
    })

    const metadata = parseSubscriptionMetadata(subscription.metadata)
    if (!metadata) {
      console.error(
        { subscriptionId: subscription.id },
        "Missing userId in subscription metadata",
      )
      return
    }

    const existing = await getSubscription(metadata.userId)
    if (existing && existing.polarSubscriptionId === subscription.id) {
      console.info(
        `Subscription already exists: subscriptionId=${subscription.id}`,
      )
      return
    }

    const tier = metadata.tier ?? tierFromProductId(subscription.productId)

    await createSubscription({
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

    await invalidateSubscriptionCache(metadata.userId)

    console.info(
      `Subscription created: subscriptionId=${subscription.id}, userId=${metadata.userId}, tier=${tier}`,
    )
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to create subscription")
  }
}

export const handleSubscriptionUpdated = async (
  payload: SubscriptionWebhookPayload,
): Promise<void> => {
  const subscription = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "subscription.updated",
      polarEventId: subscription.id,
      payload: JSON.stringify(payload),
    })

    const updated = await updateSubscriptionByPolarId(subscription.id, {
      status: mapPolarStatus(subscription.status),
      currentPeriodStart: new Date(subscription.currentPeriodStart),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.canceledAt
        ? new Date(subscription.canceledAt)
        : null,
    })

    await invalidateSubscriptionCache(updated.userId)

    console.info(
      `Subscription updated: subscriptionId=${subscription.id}, status=${subscription.status}`,
    )
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to update subscription")
  }
}

export const handleSubscriptionCancelled = async (
  payload: SubscriptionWebhookPayload,
): Promise<void> => {
  const subscription = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "subscription.cancelled",
      polarEventId: subscription.id,
      payload: JSON.stringify(payload),
    })

    const updated = await updateSubscriptionByPolarId(subscription.id, {
      status: "cancelled",
      cancelAtPeriodEnd: true,
      cancelledAt: subscription.canceledAt
        ? new Date(subscription.canceledAt)
        : new Date(),
    })

    await invalidateSubscriptionCache(updated.userId)

    console.info(`Subscription cancelled: subscriptionId=${subscription.id}`)
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to cancel subscription")
  }
}

export const handleSubscriptionPaymentFailed = async (
  payload: SubscriptionWebhookPayload,
): Promise<void> => {
  const subscription = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "subscription.payment_failed",
      polarEventId: subscription.id,
      payload: JSON.stringify(payload),
    })

    const updated = await updateSubscriptionByPolarId(subscription.id, {
      status: "past_due",
    })

    await invalidateSubscriptionCache(updated.userId)

    console.warn(
      `Subscription payment failed: subscriptionId=${subscription.id}, userId=${updated.userId}`,
    )
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to handle payment failure")
  }
}
