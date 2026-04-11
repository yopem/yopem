import { Webhooks } from "@polar-sh/hono"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { db } from "db"
import { polarCheckoutSessionsTable, polarPaymentEventsTable } from "db/schema"
import { createCustomId } from "shared/custom-id"

import { redisCache } from "../cache"
import { WebhookHandlerError } from "../errors"
import { calculateCreditsFromAmount } from "../payments/credit-calculation"
import { grantCredits } from "../payments/grant-credits"
import { refundCredits } from "../payments/refund-credits"
import {
  handleSubscriptionCancelled,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
} from "../payments/subscription-webhooks"
import { WebhookMonitor } from "../payments/webhook-monitor"

const webhookOrderMetadataSchema = z.object({
  userId: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  auto_topup: z.string().optional(),
  userName: z.string().optional(),
})

const polarWebhookSecret = process.env["POLAR_WEBHOOK_SECRET"] ?? ""

let redisInitialized = false

async function ensureRedisInitialized() {
  if (!redisInitialized) {
    const redis = await redisCache.getRedisClient()
    if (redis) {
      WebhookMonitor.setRedisClient(redis)
      redisInitialized = true
    }
  }
}

interface PolarOrderData {
  id: string
  customerId: string | null
  productId: string | null
  totalAmount: number
  refundedAmount: number | null
  currency: string
  metadata: Record<string, unknown> | null
  checkoutId: string | null
}

interface PolarWebhookPayload {
  data: PolarOrderData
}

async function handleOrderPaid(payload: PolarWebhookPayload) {
  await ensureRedisInitialized()
  const order = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "order.paid",
      polarEventId: createCustomId(),
      payload: JSON.stringify(payload),
    })

    const metadataParse = webhookOrderMetadataSchema.safeParse(order.metadata)
    if (!metadataParse.success) {
      console.error(
        { orderId: order.id, error: metadataParse.error.format() },
        "Invalid webhook order metadata",
      )
      return
    }

    const productId = order.productId ?? ""
    const { userId, amount: amountFromMetadata, userName } = metadataParse.data

    const amountInDollars = Number.parseFloat(amountFromMetadata)
    const creditsGranted = calculateCreditsFromAmount(amountInDollars)

    const grantResult = await grantCredits({
      userId,
      userName,
      polarPaymentId: order.id,
      polarCustomerId: order.customerId ?? undefined,
      amount: String(order.totalAmount / 100),
      currency: order.currency,
      productId,
      creditsGranted,
    })

    if ("alreadyProcessed" in grantResult && grantResult.alreadyProcessed) {
      WebhookMonitor.detectDuplicateWebhook({
        eventType: "order.paid",
        orderId: order.id,
        isProcessed: true,
      })
      console.info(`Order already processed (idempotent): orderId=${order.id}`)
      return
    }

    if (order.checkoutId) {
      await db
        .update(polarCheckoutSessionsTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(polarCheckoutSessionsTable.checkoutId, order.checkoutId))
    }

    console.info(
      `Order paid processed successfully: orderId=${order.id}, userId=${userId}, credits=${creditsGranted}`,
    )
  } catch (error) {
    const err = new WebhookHandlerError({
      operation: "order.paid",
      cause: error,
    })
    console.error(
      `Error processing order paid webhook: orderId=${order.id}, error=${err.message}`,
    )
  }
}

async function handleOrderRefunded(payload: PolarWebhookPayload) {
  await ensureRedisInitialized()
  const order = payload.data

  try {
    await db.insert(polarPaymentEventsTable).values({
      id: createCustomId(),
      eventType: "order.refunded",
      polarEventId: createCustomId(),
      payload: JSON.stringify(payload),
    })

    WebhookMonitor.detectAnomalousRefund({
      refundAmount: (order.refundedAmount ?? 0) / 100,
      totalAmount: order.totalAmount / 100,
      orderId: order.id,
    })

    const refundResult = await refundCredits({
      polarPaymentId: order.id,
      refundAmount: order.refundedAmount ?? 0,
    })

    if (refundResult.alreadyProcessed) {
      WebhookMonitor.detectDuplicateWebhook({
        eventType: "order.refunded",
        orderId: order.id,
        isProcessed: true,
      })
      console.info(
        `Order refund already processed (idempotent): orderId=${order.id}`,
      )
      return
    }

    const refundType = refundResult.isPartialRefund ? "partial" : "full"
    console.info(
      `Order ${refundType} refund processed successfully: orderId=${order.id}, credits=${refundResult.creditsRefunded}`,
    )
  } catch (error) {
    const err = new WebhookHandlerError({
      operation: "order.refunded",
      cause: error,
    })
    console.error(
      `Error processing order refunded webhook: orderId=${order.id}, error=${err.message}`,
    )
  }
}

async function handleSubscriptionCreatedWrapper(payload: unknown) {
  await handleSubscriptionCreated({ data: payload as never })
}

async function handleSubscriptionUpdatedWrapper(payload: unknown) {
  await handleSubscriptionUpdated({ data: payload as never })
}

async function handleSubscriptionCanceledWrapper(payload: unknown) {
  await handleSubscriptionCancelled({ data: payload as never })
}

const webhooksRoute = new Hono()

webhooksRoute.post(
  "/polar",
  Webhooks({
    webhookSecret: polarWebhookSecret,
    onOrderPaid: handleOrderPaid,
    onOrderRefunded: handleOrderRefunded,
    onSubscriptionCreated: handleSubscriptionCreatedWrapper,
    onSubscriptionUpdated: handleSubscriptionUpdatedWrapper,
    onSubscriptionCanceled: handleSubscriptionCanceledWrapper,
  }),
)

export { webhooksRoute }
