import { eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  creditTransactionsTable,
  polarPaymentsTable,
  userCreditsTable,
} from "@/lib/db/schema"
import { createCustomId } from "@/lib/utils/custom-id"
import { logger } from "@/lib/utils/logger"

interface GrantCreditsParams {
  userId: string
  userName?: string
  polarPaymentId: string
  polarCustomerId?: string | null
  amount: string
  currency: string
  productId: string
  creditsGranted: number
}

export async function grantCredits(params: GrantCreditsParams) {
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

  return await db.transaction(async (tx) => {
    const existingPayment = await tx
      .select()
      .from(polarPaymentsTable)
      .where(eq(polarPaymentsTable.polarPaymentId, polarPaymentId))
      .limit(1)

    if (existingPayment.length > 0) {
      logger.info(`Payment already processed: ${polarPaymentId}`)
      return { alreadyProcessed: true }
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
          balance: sql`${userCreditsTable.balance} + ${creditsGranted}`,
          totalPurchased: sql`${userCreditsTable.totalPurchased} + ${creditsGranted}`,
          updatedAt: new Date(),
        })
        .where(eq(userCreditsTable.userId, userId))
    } else {
      await tx.insert(userCreditsTable).values({
        id: createCustomId(),
        userId,
        balance: String(creditsGranted),
        totalPurchased: String(creditsGranted),
        totalUsed: "0",
      })
    }

    await tx.insert(creditTransactionsTable).values({
      id: createCustomId(),
      userId,
      amount: String(creditsGranted),
      type: "purchase",
      description: `Purchased ${creditsGranted} credits via Polar`,
    })

    logger.info(
      `Credits granted successfully: userId=${userId}, polarPaymentId=${polarPaymentId}, credits=${creditsGranted}`,
    )

    return { alreadyProcessed: false, creditsGranted }
  })
}
