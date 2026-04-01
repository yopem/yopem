import { Polar } from "@polar-sh/sdk"
import { TaggedError } from "better-result"
import { Hono } from "hono"

import type { SessionUser } from "auth/types"
import {
  getUserSettings,
  insertCheckoutSession,
  upsertPolarCustomer,
} from "db/services/user"
import { logger } from "logger"
import { validateTopupAmount } from "payments/credit-calculation"

export class CheckoutError extends TaggedError("CheckoutError")<{
  message: string
  cause?: unknown
}>() {}

export class CustomerCreationError extends TaggedError(
  "CustomerCreationError",
)<{
  message: string
  cause?: unknown
}>() {}

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

      await upsertPolarCustomer(session.id, customer.id)
      polarCustomerId = customer.id
    }
  } catch (error) {
    logger.error(
      `Failed to create/get Polar customer: userId=${session.id}, error=${error instanceof Error ? error.message : String(error)}`,
    )
  }

  try {
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
      logger.error("Checkout URL not available")
      return c.text("Internal Server Error", 500)
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
    logger.error(
      `Checkout error: ${error instanceof Error ? error.message : String(error)}`,
    )
    return c.text("Internal Server Error", 500)
  }
})

export { checkoutRoute }
