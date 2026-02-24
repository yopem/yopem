import { db } from "@repo/db"
import {
  creditTransactionsTable,
  polarPaymentsTable,
  userCreditsTable,
} from "@repo/db/schema"
import { logger } from "@repo/logger"
import { createCustomId } from "@repo/shared/custom-id"
import { eq, sql } from "drizzle-orm"

interface RefundCreditsParams {
  polarPaymentId: string
  refundAmount?: number
}

export async function refundCredits(params: RefundCreditsParams) {
  const { polarPaymentId, refundAmount } = params

  return await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(polarPaymentsTable)
      .where(eq(polarPaymentsTable.polarPaymentId, polarPaymentId))
      .limit(1)

    if (!payment) {
      logger.error(`Payment not found for refund: ${polarPaymentId}`)
      return null
    }

    const totalAmount = Number.parseFloat(payment.amount)
    const currentRefundedAmount = Number.parseFloat(payment.refundedAmount)

    if (payment.status === "refunded") {
      logger.info(`Payment already fully refunded: ${polarPaymentId}`)
      return {
        alreadyProcessed: true,
        creditsRefunded: 0,
        isPartialRefund: false,
      }
    }

    const amountToRefund = refundAmount
      ? refundAmount / 100 - currentRefundedAmount
      : totalAmount - currentRefundedAmount

    if (amountToRefund <= 0) {
      logger.info(
        `Payment refund already processed (cumulative): ${polarPaymentId}, currentRefunded=${currentRefundedAmount}, webhookRefunded=${refundAmount ? refundAmount / 100 : "N/A"}`,
      )
      return {
        alreadyProcessed: true,
        creditsRefunded: 0,
        isPartialRefund: false,
      }
    }

    const newRefundedAmount = currentRefundedAmount + amountToRefund

    if (newRefundedAmount > totalAmount) {
      logger.error(
        `Refund amount exceeds payment total: ${newRefundedAmount} > ${totalAmount} for payment ${polarPaymentId}`,
      )
      return null
    }

    const isFullyRefunded = newRefundedAmount >= totalAmount

    const refundRatio = amountToRefund / totalAmount
    const creditsToDeduct = Math.floor(payment.creditsGranted * refundRatio)

    if (creditsToDeduct === 0) {
      logger.warn(
        `Refund amount too small to deduct credits: ${amountToRefund} for payment ${polarPaymentId}`,
      )
    }

    await tx
      .update(polarPaymentsTable)
      .set({
        status: isFullyRefunded ? "refunded" : payment.status,
        refundedAmount: newRefundedAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(polarPaymentsTable.polarPaymentId, polarPaymentId))

    if (creditsToDeduct > 0) {
      await tx
        .update(userCreditsTable)
        .set({
          balance: sql`${userCreditsTable.balance} - ${creditsToDeduct}`,
          updatedAt: new Date(),
        })
        .where(eq(userCreditsTable.userId, payment.userId))

      await tx.insert(creditTransactionsTable).values({
        id: createCustomId(),
        userId: payment.userId,
        amount: String(-creditsToDeduct),
        type: "refund",
        description: `Refunded ${creditsToDeduct} credits ${isFullyRefunded ? "(Full" : "(Partial"} refund - Polar payment ${polarPaymentId})`,
      })
    }

    logger.info(
      `Credits ${isFullyRefunded ? "fully" : "partially"} refunded successfully: userId=${payment.userId}, polarPaymentId=${polarPaymentId}, credits=${creditsToDeduct}, refundAmount=${amountToRefund}, totalRefunded=${newRefundedAmount}`,
    )

    return {
      alreadyProcessed: false,
      creditsRefunded: creditsToDeduct,
      isPartialRefund: !isFullyRefunded,
    }
  })
}
