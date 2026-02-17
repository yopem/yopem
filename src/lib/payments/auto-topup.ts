import { Polar } from "@polar-sh/sdk"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { userCreditsTable, userSettingsTable } from "@/lib/db/schema"
import { siteDomain } from "@/lib/env/client"
import { appEnv, polarAccessToken, polarProductId } from "@/lib/env/server"
import { createCustomId } from "@/lib/utils/custom-id"
import { logger } from "@/lib/utils/logger"

import { validateTopupAmount } from "./credit-calculation"

export async function getAutoTopupSettings(userId: string) {
  const [credits] = await db
    .select({
      autoTopupEnabled: userCreditsTable.autoTopupEnabled,
      autoTopupThreshold: userCreditsTable.autoTopupThreshold,
      autoTopupAmount: userCreditsTable.autoTopupAmount,
    })
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  if (!credits) {
    return {
      enabled: false,
      threshold: null,
      amount: null,
    }
  }

  return {
    enabled: credits.autoTopupEnabled,
    threshold: credits.autoTopupThreshold
      ? Number(credits.autoTopupThreshold)
      : null,
    amount: credits.autoTopupAmount ? Number(credits.autoTopupAmount) : null,
  }
}

export async function updateAutoTopupSettings(
  userId: string,
  settings: {
    enabled: boolean
    threshold?: number
    amount?: number
  },
) {
  if (settings.enabled) {
    if (!settings.threshold || !settings.amount) {
      throw new Error(
        "Both threshold and amount are required when enabling auto-topup",
      )
    }

    if (settings.threshold >= settings.amount) {
      throw new Error("Threshold must be less than top-up amount")
    }

    const thresholdValidation = validateTopupAmount(settings.threshold)
    if (!thresholdValidation.isValid) {
      throw new Error(`Invalid threshold: ${thresholdValidation.error}`)
    }

    const amountValidation = validateTopupAmount(settings.amount)
    if (!amountValidation.isValid) {
      throw new Error(`Invalid amount: ${amountValidation.error}`)
    }
  }

  const [existingCredits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, userId))

  if (existingCredits) {
    await db
      .update(userCreditsTable)
      .set({
        autoTopupEnabled: settings.enabled,
        autoTopupThreshold: settings.threshold
          ? String(settings.threshold)
          : null,
        autoTopupAmount: settings.amount ? String(settings.amount) : null,
        updatedAt: new Date(),
      })
      .where(eq(userCreditsTable.userId, userId))
  } else {
    await db.insert(userCreditsTable).values({
      id: createCustomId(),
      userId,
      balance: "0",
      totalPurchased: "0",
      totalUsed: "0",
      autoTopupEnabled: settings.enabled,
      autoTopupThreshold: settings.threshold
        ? String(settings.threshold)
        : null,
      autoTopupAmount: settings.amount ? String(settings.amount) : null,
    })
  }

  logger.info(
    `Auto-topup settings updated: userId=${userId}, enabled=${settings.enabled}, threshold=${settings.threshold}, amount=${settings.amount}`,
  )

  return {
    success: true,
    enabled: settings.enabled,
    threshold: settings.threshold ?? null,
    amount: settings.amount ?? null,
  }
}

export async function checkAndTriggerAutoTopup(
  userId: string,
  userEmail: string,
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
        externalId: userId,
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
      successUrl: `https://${siteDomain}/dashboard/credits?auto_topup=true`,
      customerId: polarCustomerId ?? undefined,
      metadata: {
        userId,
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
