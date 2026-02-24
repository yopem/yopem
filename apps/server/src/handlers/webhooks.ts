import { Webhooks } from "@polar-sh/hono"
import { redisCache } from "@repo/cache"
import { db } from "@repo/db"
import {
  polarCheckoutSessionsTable,
  polarPaymentEventsTable,
} from "@repo/db/schema"
import { formatError, logger } from "@repo/logger"
import { calculateCreditsFromAmount } from "@repo/payments/credit-calculation"
import { grantCredits } from "@repo/payments/grant-credits"
import { refundCredits } from "@repo/payments/refund-credits"
import { WebhookMonitor } from "@repo/payments/webhook-monitor"
import { createCustomId } from "@repo/shared/custom-id"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

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
    WebhookMonitor.setRedisClient(redis)
    redisInitialized = true
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

        const metadataParse = webhookOrderMetadataSchema.safeParse(
          order.metadata,
        )
        if (!metadataParse.success) {
          logger.error(
            { orderId: order.id, error: metadataParse.error.format() },
            "Invalid webhook order metadata",
          )
          return
        }

        const productId = order.productId ?? ""
        const {
          userId,
          amount: amountFromMetadata,
          userName,
        } = metadataParse.data

        const amountInDollars = Number.parseFloat(amountFromMetadata)

        const creditsGranted = calculateCreditsFromAmount(amountInDollars)

        const result = await grantCredits({
          userId,
          userName,
          polarPaymentId: order.id,
          polarCustomerId: order.customerId ?? undefined,
          amount: String(order.totalAmount / 100),
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
          `Error processing order paid webhook: orderId=${order.id}, error=${formatError(error)}`,
        )
        throw error
      }
    },
  )
}

async function handleOrderRefunded(payload: PolarWebhookPayload) {
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
          `Error processing order refunded webhook: orderId=${order.id}, error=${formatError(error)}`,
        )
        throw error
      }
    },
  )
}

const webhooksRoute = new Hono()

webhooksRoute.post(
  "/polar",
  Webhooks({
    webhookSecret: polarWebhookSecret,
    onOrderPaid: handleOrderPaid,
    onOrderRefunded: handleOrderRefunded,
  }),
)

export { webhooksRoute }
