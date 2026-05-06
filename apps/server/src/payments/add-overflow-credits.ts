import { eq, sql } from "drizzle-orm"

import { db } from "db"
import {
  creditTransactionsTable,
  polarPaymentsTable,
  userCreditsTable,
} from "db/schema"
import { createCustomId } from "shared/custom-id"

interface AddOverflowCreditsParams {
  userId: string
  userName?: string
  polarPaymentId: string
  polarCustomerId?: string | null
  amount: string
  currency: string
  productId: string
  creditsGranted: number
}

export type AddOverflowCreditsResult =
  | { alreadyProcessed: true }
  | { alreadyProcessed: false; creditsGranted: number }

export async function addOverflowCredits(
  params: AddOverflowCreditsParams,
): Promise<AddOverflowCreditsResult> {
  const {
    userId,
    userName,
    polarPaymentId,
    polarCustomerId,
    amount,
    currency,
    productId,
    creditsGranted,
  } = params

  try {
    return await db.transaction(async (tx) => {
      const existingPayment = await tx
        .select()
        .from(polarPaymentsTable)
        .where(eq(polarPaymentsTable.polarPaymentId, polarPaymentId))
        .limit(1)

      if (existingPayment.length > 0) {
        console.info(`Overflow payment already processed: ${polarPaymentId}`)
        return { alreadyProcessed: true as const }
      }

      await tx.insert(polarPaymentsTable).values({
        id: createCustomId(),
        userId,
        userName,
        polarPaymentId,
        polarCustomerId,
        amount,
        currency,
        status: "succeeded",
        productId,
        creditsGranted,
      })

      const [existingCredits] = await tx
        .select()
        .from(userCreditsTable)
        .where(eq(userCreditsTable.userId, userId))
        .limit(1)

      if (existingCredits) {
        await tx
          .update(userCreditsTable)
          .set({
            overflowBalance: sql`${userCreditsTable.overflowBalance} + ${creditsGranted}`,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsTable.userId, userId))
      } else {
        await tx.insert(userCreditsTable).values({
          id: createCustomId(),
          userId,
          balance: "0",
          totalPurchased: "0",
          totalUsed: "0",
          overflowBalance: String(creditsGranted),
        })
      }

      await tx.insert(creditTransactionsTable).values({
        id: createCustomId(),
        userId,
        amount: String(creditsGranted),
        type: "overflow_purchase",
        description: `Purchased ${creditsGranted} overflow credits via Polar`,
      })

      console.info(
        `Overflow credits granted: userId=${userId}, polarPaymentId=${polarPaymentId}, credits=${creditsGranted}`,
      )

      return { alreadyProcessed: false as const, creditsGranted }
    })
  } catch (e) {
    console.error(
      `Failed to grant overflow credits: userId=${userId}, polarPaymentId=${polarPaymentId}, error=${e}`,
    )
    throw e instanceof Error ? e : new Error(String(e))
  }
}
