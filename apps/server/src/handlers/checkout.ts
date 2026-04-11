import { Polar } from "@polar-sh/sdk"
import { Hono } from "hono"

import type { SessionUser } from "auth/types"
import {
  getUserSettings,
  insertCheckoutSession,
  upsertPolarCustomer,
} from "db/services/user"

import { validateTopupAmount } from "../payments/credit-calculation"

interface Env {
  Variables: {
    session: SessionUser | null
  }
}

const appEnv = process.env["APP_ENV"] ?? "development"
const polarAccessToken = process.env["POLAR_ACCESS_TOKEN"] ?? ""
const polarProductId = process.env["POLAR_PRODUCT_ID"] ?? ""
const polarProPriceId = process.env["POLAR_PRO_PRICE_ID"] ?? ""
const polarEnterprisePriceId = process.env["POLAR_ENTERPRISE_PRICE_ID"] ?? ""
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

  const tier = c.req.query("tier")
  const billingCycle = c.req.query("billing") ?? "monthly"
  const amount = c.req.query("amount")
  const autoTopup = c.req.query("auto_topup") === "true"

  if (tier) {
    const successUrl =
      c.req.query("successUrl") ??
      `${webOrigin}/dashboard/subscription?success=true`

    let priceId: string
    if (tier === "pro") {
      priceId = polarProPriceId
    } else if (tier === "enterprise") {
      priceId = polarEnterprisePriceId
    } else {
      return c.text("Invalid tier. Must be 'pro' or 'enterprise'", 400)
    }

    if (!priceId) {
      console.error(`Price ID not configured for tier: ${tier}`)
      return c.text("Subscription tier not available", 500)
    }

    let polarCustomerId: string
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
      console.error(
        `Failed to create/get Polar customer: userId=${session.id}, error=${error instanceof Error ? error.message : String(error)}`,
      )
      return c.text("Internal Server Error", 500)
    }

    let checkoutUrl: string
    try {
      const checkout = await polar.checkouts.create({
        products: [priceId],
        successUrl,
        customerId: polarCustomerId,
        metadata: {
          userId: session.id,
          userName: session.username ?? session.name ?? session.email,
          tier,
          billingCycle,
          type: "subscription",
        },
      })

      if (!checkout.url) {
        throw new Error("Checkout URL not available")
      }
      checkoutUrl = checkout.url

      await insertCheckoutSession({
        userId: session.id,
        checkoutId: checkout.id,
        productId: priceId,
        checkoutUrl,
        amount: "0",
      })
    } catch (error) {
      console.error(
        `Checkout error: ${error instanceof Error ? error.message : String(error)}`,
      )
      return c.text("Internal Server Error", 500)
    }

    return c.redirect(checkoutUrl, 303)
  }

  if (amount) {
    const successUrl =
      c.req.query("successUrl") ?? `${webOrigin}/dashboard/credits`

    const amountNum = Number.parseFloat(amount)
    const validation = validateTopupAmount(amountNum)

    if (!validation.isValid) {
      return c.text(validation.error ?? "Invalid amount", 400)
    }

    let polarCustomerId: string
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
      console.error(
        `Failed to create/get Polar customer: userId=${session.id}, error=${error instanceof Error ? error.message : String(error)}`,
      )
      return c.text("Internal Server Error", 500)
    }

    let checkoutUrl: string
    try {
      const checkout = await polar.checkouts.create({
        products: [polarProductId],
        amount: Math.round(amountNum * 100),
        successUrl,
        customerId: polarCustomerId,
        metadata: {
          userId: session.id,
          userName: session.username ?? session.name ?? session.email,
          amount: String(amountNum),
          auto_topup: String(autoTopup),
        },
      })

      if (!checkout.url) {
        throw new Error("Checkout URL not available")
      }
      checkoutUrl = checkout.url

      await insertCheckoutSession({
        userId: session.id,
        checkoutId: checkout.id,
        productId: polarProductId,
        checkoutUrl,
        amount: String(amountNum),
      })
    } catch (error) {
      console.error(
        `Checkout error: ${error instanceof Error ? error.message : String(error)}`,
      )
      return c.text("Internal Server Error", 500)
    }

    return c.redirect(checkoutUrl, 303)
  }

  return c.text("Missing required parameter: 'tier' or 'amount'", 400)
})

export { checkoutRoute }
