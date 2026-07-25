import { Webhooks } from "@polar-sh/hono"
import { Hono } from "hono"
import { WebhookHandlerError } from "server/errors"
import { calculateCreditsFromAmount } from "server/payments/credit-calculation"
import {
  handleSubscriptionCancelled,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
} from "server/payments/subscription-webhooks"
import { z } from "zod"

import {
  addOverflowCredits,
  grantCredits,
  refundCredits,
} from "db/services/credits"
import {
  completePolarCheckoutSession,
  recordPolarPaymentEvent,
} from "db/services/payments"
import { polarWebhookSecret } from "env"

const webhookOrderMetadataSchema = z.object({
  userId: z.string().min(1),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  userName: z.string().optional(),
  type: z.enum(["subscription", "overflow_credits", "credit_topup"]).optional(),
  packSize: z.string().optional(),
})

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
  const order = payload.data

  try {
    await recordPolarPaymentEvent({
      eventType: "order.paid",
      payload,
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
    const {
      userId,
      amount: amountFromMetadata,
      userName,
      type,
    } = metadataParse.data

    const creditsToGrant = metadataParse.data.packSize
      ? Number.parseInt(metadataParse.data.packSize)
      : 0

    if (type === "overflow_credits") {
      const overflowResult = await addOverflowCredits({
        userId,
        userName,
        polarPaymentId: order.id,
        polarCustomerId: order.customerId ?? undefined,
        amount: String(order.totalAmount / 100),
        currency: order.currency,
        productId,
        creditsGranted: creditsToGrant,
      })

      if (
        "alreadyProcessed" in overflowResult &&
        overflowResult.alreadyProcessed
      ) {
        console.info(
          `Overflow order already processed (idempotent): orderId=${order.id}`,
        )
        return
      }

      if (order.checkoutId) {
        await completePolarCheckoutSession(order.checkoutId)
      }

      console.info(
        `Overflow credits granted: orderId=${order.id}, userId=${userId}, packSize=${metadataParse.data.packSize}, credits=${creditsToGrant}`,
      )
      return
    }

    const amountInDollars = Number.parseFloat(amountFromMetadata ?? "0")
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
      console.info(`Order already processed (idempotent): orderId=${order.id}`)
      return
    }

    if (order.checkoutId) {
      await completePolarCheckoutSession(order.checkoutId)
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
  const order = payload.data

  try {
    await recordPolarPaymentEvent({
      eventType: "order.refunded",
      payload,
    })

    const refundResult = await refundCredits({
      polarPaymentId: order.id,
      refundAmount: order.refundedAmount ?? 0,
    })

    if (refundResult.alreadyProcessed) {
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
