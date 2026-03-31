import { Polar } from "@polar-sh/sdk"
import { Result, TaggedError } from "better-result"
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

  const customerResult = await Result.tryPromise({
    try: async () => {
      const userSettings = await getUserSettings(session.id)

      if (userSettings?.polarCustomerId) {
        return userSettings.polarCustomerId
      }

      const customer = await polar.customers.create({
        email: session.email,
        metadata: { externalId: session.id },
      })

      await upsertPolarCustomer(session.id, customer.id)
      return customer.id
    },
    catch: (error) =>
      new CustomerCreationError({
        message: "Failed to create/get Polar customer",
        cause: error,
      }),
  })

  const polarCustomerId = customerResult.isOk() ? customerResult.value : null

  if (customerResult.isErr()) {
    logger.error(
      `Failed to create/get Polar customer: userId=${session.id}, error=${customerResult.error.message}`,
    )
  }

  const checkoutResult = await Result.tryPromise({
    try: async () => {
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
        throw new CheckoutError({ message: "Checkout URL not available" })
      }

      await insertCheckoutSession({
        userId: session.id,
        checkoutId: checkout.id,
        productId: polarProductId,
        checkoutUrl,
        amount: String(amountNum),
      })

      return checkoutUrl
    },
    catch: (error) =>
      error instanceof CheckoutError
        ? error
        : new CheckoutError({
            message: "Failed to create checkout",
            cause: error,
          }),
  })

  if (checkoutResult.isOk()) {
    return c.redirect(checkoutResult.value, 303)
  }

  logger.error(`Checkout error: ${checkoutResult.error.message}`)
  return c.text("Internal Server Error", 500)
})

export { checkoutRoute }
