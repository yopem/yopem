import { Webhooks } from "@polar-sh/nextjs"
import { eq } from "drizzle-orm"

import { createRedisCache } from "@/lib/cache/client"
import { db } from "@/lib/db"
import {
  polarCheckoutSessionsTable,
  polarPaymentEventsTable,
} from "@/lib/db/schema"
import { polarWebhookSecret } from "@/lib/env/server"
import { grantCredits } from "@/lib/payments/grant-credits"
import { validateAndGetCredits } from "@/lib/payments/product-credits-map"
import { refundCredits } from "@/lib/payments/refund-credits"
import { WebhookMonitor } from "@/lib/payments/webhook-monitor"
import { createCustomId } from "@/lib/utils/custom-id"
import { logger } from "@/lib/utils/logger"

let redisInitialized = false

async function ensureRedisInitialized() {
  if (!redisInitialized) {
    const redis = await createRedisCache().getRedisClient()
    WebhookMonitor.setRedisClient(redis)
    redisInitialized = true
  }
}

export interface PolarWebhookPayload {
  data: {
    id: string
    customerId: string | null
    productId: string | null
    totalAmount: number
    refundedAmount: number | null
    currency: string
    metadata: Record<string, unknown> | null
    checkoutId: string | null
  }
}

export async function handlePolarOrderPaid(payload: PolarWebhookPayload) {
  await ensureRedisInitialized()
  const order = payload.data

  await WebhookMonitor.trackWebhookExecution(
    "order.paid",
    { orderId: order.id, productId: order.productId },
    async () => {
      try {
        await db.insert(polarPaymentEventsTable).values({
          id: createCustomId(),
          eventType: "order.paid",
          polarEventId: createCustomId(),
          payload: JSON.stringify(payload),
        })

        const productId = order.productId ?? ""
        const userIdFromMetadata = order.metadata?.["userId"]
        const userId =
          typeof userIdFromMetadata === "string"
            ? userIdFromMetadata
            : (order.customerId ?? "")

        if (!userId) {
          logger.error(
            `No userId found in order metadata or customerId: orderId=${order.id}`,
          )
          return
        }

        const creditsGranted = validateAndGetCredits(
          productId,
          order.metadata as Record<string, string> | undefined,
        )

        if (!creditsGranted) {
          logger.error(
            `Failed to validate credits for product: orderId=${order.id}, productId=${productId}`,
          )
          return
        }

        const result = await grantCredits({
          userId,
          polarPaymentId: order.id,
          polarCustomerId: order.customerId ?? undefined,
          amount: String(order.totalAmount),
          currency: order.currency,
          productId,
          creditsGranted,
        })

        if (result.alreadyProcessed) {
          WebhookMonitor.detectDuplicateWebhook({
            eventType: "order.paid",
            orderId: order.id,
            isProcessed: true,
          })
          logger.info(
            `Order already processed (idempotent): orderId=${order.id}`,
          )
          return
        }

        if (order.checkoutId) {
          await db
            .update(polarCheckoutSessionsTable)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(polarCheckoutSessionsTable.checkoutId, order.checkoutId))
        }

        logger.info(
          `Order paid processed successfully: orderId=${order.id}, userId=${userId}, credits=${creditsGranted}`,
        )
      } catch (error) {
        logger.error(
          `Error processing order paid webhook: orderId=${order.id}, error=${error instanceof Error ? error.message : String(error)}`,
        )
        throw error
      }
    },
  )
}

export async function handlePolarOrderRefunded(payload: PolarWebhookPayload) {
  await ensureRedisInitialized()
  const order = payload.data

  await WebhookMonitor.trackWebhookExecution(
    "order.refunded",
    { orderId: order.id, refundedAmount: order.refundedAmount },
    async () => {
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

        const result = await refundCredits({
          polarPaymentId: order.id,
          refundAmount: order.refundedAmount ?? 0,
        })

        if (!result) {
          logger.error(
            `Failed to process refund, payment not found: orderId=${order.id}`,
          )
          return
        }

        if (result.alreadyProcessed) {
          WebhookMonitor.detectDuplicateWebhook({
            eventType: "order.refunded",
            orderId: order.id,
            isProcessed: true,
          })
          logger.info(
            `Order refund already processed (idempotent): orderId=${order.id}`,
          )
          return
        }

        const refundType = result.isPartialRefund ? "partial" : "full"
        logger.info(
          `Order ${refundType} refund processed successfully: orderId=${order.id}, credits=${result.creditsRefunded}`,
        )
      } catch (error) {
        logger.error(
          `Error processing order refunded webhook: orderId=${order.id}, error=${error instanceof Error ? error.message : String(error)}`,
        )
        throw error
      }
    },
  )
}

export const POST = Webhooks({
  webhookSecret: polarWebhookSecret,
  onOrderPaid: handlePolarOrderPaid,
  onOrderRefunded: handlePolarOrderRefunded,
})
