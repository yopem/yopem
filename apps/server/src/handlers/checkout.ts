import { Polar } from "@polar-sh/sdk"
import type { SessionUser } from "@repo/auth/types"
import { db } from "@repo/db"
import { polarCheckoutSessionsTable, userSettingsTable } from "@repo/db/schema"
import { formatError, logger } from "@repo/logger"
import { validateTopupAmount } from "@repo/payments/credit-calculation"
import { createCustomId } from "@repo/utils/custom-id"
import { eq } from "drizzle-orm"
import { Hono } from "hono"

interface Env {
  Variables: {
    session: SessionUser | null
  }
}

const appEnv = process.env["APP_ENV"] ?? "development"
const polarAccessToken = process.env["POLAR_ACCESS_TOKEN"] ?? ""
const polarProductId = process.env["POLAR_PRODUCT_ID"] ?? ""
const webOrigin = process.env["WEB_ORIGIN"] ?? "http://localhost:3000"

const polar = new Polar({
  accessToken: polarAccessToken,
  server: appEnv === "development" ? "sandbox" : "production",
})

const checkoutRoute = new Hono<Env>()

checkoutRoute.get("/", async (c) => {
  const session = c.get("session")

  if (!session) {
    return c.text("Unauthorized", 401)
  }

  const amount = c.req.query("amount")
  const autoTopup = c.req.query("auto_topup") === "true"
  const successUrl =
    c.req.query("successUrl") ?? `${webOrigin}/dashboard/credits`

  if (!amount) {
    return c.text("Missing amount parameter", 400)
  }

  const amountNum = Number.parseFloat(amount)
  const validation = validateTopupAmount(amountNum)

  if (!validation.isValid) {
    return c.text(validation.error ?? "Invalid amount", 400)
  }

  try {
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
          metadata: { externalId: session.id },
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
        `Failed to create/get Polar customer: userId=${session.id}, error=${formatError(error)}`,
      )
    }

    const checkout = await polar.checkouts.custom.create({
      productId: polarProductId,
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

    const checkoutUrl = checkout.url
    if (!checkoutUrl) {
      return c.text("Checkout URL not available", 500)
    }

    await db.insert(polarCheckoutSessionsTable).values({
      userId: session.id,
      checkoutId: checkout.id,
      productId: polarProductId,
      checkoutUrl,
      amount: String(amountNum),
    })

    return c.redirect(checkoutUrl, 303)
  } catch (error) {
    logger.error(`Checkout error: ${formatError(error)}`)
    return c.text(`Internal Server Error: ${formatError(error)}`, 500)
  }
})

export { checkoutRoute }
