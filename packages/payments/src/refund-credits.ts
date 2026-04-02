import { Result } from "better-result"
import { eq, sql } from "drizzle-orm"

import { db } from "db"
import {
  creditTransactionsTable,
  polarPaymentsTable,
  userCreditsTable,
} from "db/schema"
import { logger } from "logger"
import { createCustomId } from "shared/custom-id"

import {
  DatabaseTransactionError,
  PaymentNotFoundError,
  RefundValidationError,
} from "./errors.ts"

interface RefundCreditsParams {
  polarPaymentId: string
  refundAmount?: number
}

export interface RefundCreditsResult {
  alreadyProcessed: boolean
  creditsRefunded: number
  isPartialRefund: boolean
}

export async function refundCredits(
  params: RefundCreditsParams,
): Promise<
  Result<
    RefundCreditsResult,
    PaymentNotFoundError | RefundValidationError | DatabaseTransactionError
  >
> {
  const { polarPaymentId, refundAmount } = params

  return await Result.tryPromise({
    try: async () => {
      const [payment] = await db
        .select()
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.polarPaymentId, polarPaymentId))
        .limit(1)

      if (!payment) {
        throw new PaymentNotFoundError({ polarPaymentId })
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
        throw new RefundValidationError({
          polarPaymentId,
          message: `Refund amount exceeds payment total: ${newRefundedAmount} > ${totalAmount}`,
        })
      }

      const isFullyRefunded = newRefundedAmount >= totalAmount

      const refundRatio = amountToRefund / totalAmount
      const creditsToDeduct = Math.floor(payment.creditsGranted * refundRatio)

      if (creditsToDeduct === 0) {
        logger.warn(
          `Refund amount too small to deduct credits: ${amountToRefund} for payment ${polarPaymentId}`,
        )
      }

      await db.transaction(async (tx) => {
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
            description: `Refund ${isFullyRefunded ? "(Full)" : "(Partial)"} - Polar payment ${polarPaymentId}`,
          })
        }
      })

      logger.info(
        `Credits ${isFullyRefunded ? "fully" : "partially"} refunded successfully: userId=${payment.userId}, polarPaymentId=${polarPaymentId}, credits=${creditsToDeduct}, refundAmount=${amountToRefund}, totalRefunded=${newRefundedAmount}`,
      )

      return {
        alreadyProcessed: false,
        creditsRefunded: creditsToDeduct,
        isPartialRefund: !isFullyRefunded,
      }
    },
    catch: (e: unknown) => {
      logger.error(
        `Failed to refund credits: polarPaymentId=${polarPaymentId}, error=${e}`,
      )
      if (e instanceof PaymentNotFoundError) {
        return e
      }
      if (e instanceof RefundValidationError) {
        return e
      }
      return new DatabaseTransactionError({
        operation: "refundCredits",
        cause: e instanceof Error ? e : new Error(String(e)),
      })
    },
  })
}
