import { Polar } from "@polar-sh/sdk"
import { db } from "@repo/db"
import { userCreditsTable, userSettingsTable } from "@repo/db/schema"
import {
  appEnv,
  polarAccessToken,
  polarProductId,
  siteDomain,
} from "@repo/env/hono"
import { logger } from "@repo/logger"
import { createCustomId } from "@repo/utils/custom-id"
import { eq } from "drizzle-orm"

export async function checkAndTriggerAutoTopup(
  userId: string,
  userEmail: string,
  userName?: string,
): Promise<{ triggered: boolean; checkoutUrl?: string }> {
  const [credits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  if (!credits) {
    return { triggered: false }
  }

  if (
    !credits.autoTopupEnabled ||
    !credits.autoTopupThreshold ||
    !credits.autoTopupAmount
  ) {
    return { triggered: false }
  }

  const balance = Number(credits.balance)
  const threshold = Number(credits.autoTopupThreshold)
  const amount = Number(credits.autoTopupAmount)

  if (balance >= threshold) {
    return { triggered: false }
  }

  logger.info(
    `Auto-topup triggered: userId=${userId}, balance=${balance}, threshold=${threshold}, amount=${amount}`,
  )

  try {
    const serverConfig = appEnv === "development" ? "sandbox" : "production"
    const polar = new Polar({
      accessToken: polarAccessToken,
      server: serverConfig,
    })

    let polarCustomerId: string | null = null

    const [userSettings] = await db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, userId))
      .limit(1)

    if (userSettings?.polarCustomerId) {
      polarCustomerId = userSettings.polarCustomerId
    } else {
      const customer = await polar.customers.create({
        email: userEmail,
        metadata: { externalId: userId },
      })

      polarCustomerId = customer.id

      if (userSettings) {
        await db
          .update(userSettingsTable)
          .set({
            polarCustomerId,
            updatedAt: new Date(),
          })
          .where(eq(userSettingsTable.userId, userId))
      } else {
        await db.insert(userSettingsTable).values({
          id: createCustomId(),
          userId,
          polarCustomerId,
        })
      }
    }

    const checkout = await polar.checkouts.custom.create({
      productId: polarProductId,
      amount: Math.round(amount * 100),
      successUrl: `https://${siteDomain}/dashboard/credits?auto_topup=true`,
      customerId: polarCustomerId ?? undefined,
      metadata: {
        userId,
        ...(userName && { userName }),
        amount: String(amount),
        auto_topup: "true",
      },
    })

    logger.info(
      `Auto-topup checkout created: userId=${userId}, checkoutId=${checkout.id}, amount=${amount}`,
    )

    return {
      triggered: true,
      checkoutUrl: checkout.url,
    }
  } catch (error) {
    logger.error(
      `Failed to trigger auto-topup: userId=${userId}, error=${error instanceof Error ? error.message : String(error)}`,
    )
    return { triggered: false }
  }
}
