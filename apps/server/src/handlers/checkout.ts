import type { SessionUser } from "@repo/auth/types"

import { Polar } from "@polar-sh/sdk"
import {
  getUserSettings,
  insertCheckoutSession,
  upsertPolarCustomer,
} from "@repo/db/services/user"
import { formatError, logger } from "@repo/logger"
import { validateTopupAmount } from "@repo/payments/credit-calculation"
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
      const userSettings = await getUserSettings(session.id)

      if (userSettings?.polarCustomerId) {
        polarCustomerId = userSettings.polarCustomerId
      } else {
        const customer = await polar.customers.create({
          email: session.email,
          metadata: { externalId: session.id },
        })

        polarCustomerId = customer.id
        await upsertPolarCustomer(session.id, polarCustomerId)
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

    await insertCheckoutSession({
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
