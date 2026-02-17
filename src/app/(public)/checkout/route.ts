import { Polar } from "@polar-sh/sdk"
import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { auth } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { polarCheckoutSessionsTable, userSettingsTable } from "@/lib/db/schema"
import { siteDomain } from "@/lib/env/client"
import { appEnv, polarAccessToken, polarProductId } from "@/lib/env/server"
import { validateTopupAmount } from "@/lib/payments/credit-calculation"
import { createCustomId } from "@/lib/utils/custom-id"
import { logger } from "@/lib/utils/logger"

export const GET = async (req: NextRequest) => {
  try {
    const session = await auth()

    if (!session) {
      return new Response("Unauthorized", { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const amount = searchParams.get("amount")
    const autoTopup = searchParams.get("auto_topup") === "true"
    const successUrl =
      searchParams.get("successUrl") ??
      `https://${siteDomain}/dashboard/credits`

    if (!amount) {
      return new Response("Missing amount parameter", { status: 400 })
    }

    const amountNum = Number.parseFloat(amount)
    const validation = validateTopupAmount(amountNum)

    if (!validation.isValid) {
      return new Response(validation.error, { status: 400 })
    }

    const serverConfig = appEnv === "development" ? "sandbox" : "production"

    const polar = new Polar({
      accessToken: polarAccessToken,
      server: serverConfig,
    })

    let polarCustomerId: string | null = null

    try {
      const [userSettings] = await db
        .select()
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, session.id))
        .limit(1)

      if (userSettings?.polarCustomerId) {
        polarCustomerId = userSettings.polarCustomerId
      } else {
        const customer = await polar.customers.create({
          email: session.email,
          externalId: session.id,
        })

        polarCustomerId = customer.id

        if (userSettings) {
          await db
            .update(userSettingsTable)
            .set({
              polarCustomerId,
              updatedAt: new Date(),
            })
            .where(eq(userSettingsTable.userId, session.id))
        } else {
          await db.insert(userSettingsTable).values({
            id: createCustomId(),
            userId: session.id,
            polarCustomerId,
          })
        }
      }
    } catch (error) {
      logger.error(
        `Failed to create/get Polar customer: userId=${session.id}, error=${error instanceof Error ? error.message : String(error)}`,
      )
    }

    const checkout = await polar.checkouts.create({
      products: [polarProductId],
      amount: Math.round(amountNum * 100),
      successUrl,
      customerId: polarCustomerId ?? undefined,
      metadata: {
        userId: session.id,
        userName: session.username ?? session.name ?? session.email,
        amount: String(amountNum),
        auto_topup: String(autoTopup),
      },
    })

    await db.insert(polarCheckoutSessionsTable).values({
      id: createCustomId(),
      userId: session.id,
      checkoutId: checkout.id,
      productId: polarProductId,
      checkoutUrl: checkout.url,
      amount: String(amountNum),
    })

    return Response.redirect(checkout.url, 303)
  } catch (error) {
    logger.error(
      `Checkout error: ${error instanceof Error ? error.message : String(error)}`,
    )

    return new Response(
      `Internal Server Error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 },
    )
  }
}
