import { Webhooks } from "@polar-sh/hono"
import { Result, TaggedError } from "better-result"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { redisCache } from "cache"
import { db } from "db"
import { polarCheckoutSessionsTable, polarPaymentEventsTable } from "db/schema"
import { logger } from "logger"
import { calculateCreditsFromAmount } from "payments/credit-calculation"
import { grantCredits } from "payments/grant-credits"
import { refundCredits } from "payments/refund-credits"
import { WebhookMonitor } from "payments/webhook-monitor"
import { createCustomId } from "shared/custom-id"

class WebhookHandlerError extends TaggedError("WebhookHandlerError")<{
  operation: string
  message: string
  cause: unknown
}>() {
  constructor(args: { operation: string; cause: unknown }) {
    const msg =
      args.cause instanceof Error ? args.cause.message : String(args.cause)
    super({ ...args, message: `Webhook ${args.operation} failed: ${msg}` })
  }
}

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
    const redisResult = await redisCache.getRedisClient()
    if (redisResult.isOk()) {
      WebhookMonitor.setRedisClient(redisResult.value)
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

  const result = await Result.tryPromise({
    try: async () => {
      await db.insert(polarPaymentEventsTable).values({
        id: createCustomId(),
        eventType: "order.paid",
        polarEventId: createCustomId(),
        payload: JSON.stringify(payload),
      })

      const metadataParse = webhookOrderMetadataSchema.safeParse(order.metadata)
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

      if (grantResult.alreadyProcessed) {
        WebhookMonitor.detectDuplicateWebhook({
          eventType: "order.paid",
          orderId: order.id,
          isProcessed: true,
        })
        logger.info(`Order already processed (idempotent): orderId=${order.id}`)
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
    },
    catch: (error) =>
      new WebhookHandlerError({
        operation: "order.paid",
        cause: error,
      }),
  })

  if (Result.isError(result)) {
    logger.error(
      `Error processing order paid webhook: orderId=${order.id}, error=${result.error.message}`,
    )
  }
}

async function handleOrderRefunded(payload: PolarWebhookPayload) {
  await ensureRedisInitialized()
  const order = payload.data

  const result = await Result.tryPromise({
    try: async () => {
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

      if (!refundResult) {
        logger.error(
          `Failed to process refund, payment not found: orderId=${order.id}`,
        )
        return
      }

      if (refundResult.alreadyProcessed) {
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

      const refundType = refundResult.isPartialRefund ? "partial" : "full"
      logger.info(
        `Order ${refundType} refund processed successfully: orderId=${order.id}, credits=${refundResult.creditsRefunded}`,
      )
    },
    catch: (error) =>
      new WebhookHandlerError({
        operation: "order.refunded",
        cause: error,
      }),
  })

  if (Result.isError(result)) {
    logger.error(
      `Error processing order refunded webhook: orderId=${order.id}, error=${result.error.message}`,
    )
  }
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
