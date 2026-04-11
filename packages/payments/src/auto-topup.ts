import { Polar } from "@polar-sh/sdk"
import { eq } from "drizzle-orm"

import { db } from "db"
import { userCreditsTable, userSettingsTable } from "db/schema"
import { appEnv, polarAccessToken, polarProductId, siteDomain } from "env/hono"
import { createCustomId } from "shared/custom-id"

interface AutoTopupResult {
  triggered: boolean
  checkoutUrl?: string
}

export async function checkAndTriggerAutoTopup(
  userId: string,
  userEmail: string,
  userName?: string,
): Promise<AutoTopupResult> {
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

  console.info(
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

    const checkout = await polar.checkouts.create({
      products: [polarProductId],
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

    console.info(
      `Auto-topup checkout created: userId=${userId}, checkoutId=${checkout.id}, amount=${amount}`,
    )

    return {
      triggered: true,
      checkoutUrl: checkout.url,
    }
  } catch (e) {
    console.error(`Auto-topup failed for user ${userId}:`, e)
    throw e instanceof Error ? e : new Error(String(e))
  }
}
