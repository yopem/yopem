import { Polar } from "@polar-sh/sdk"
import { Result } from "better-result"

import type { SubscriptionTier } from "./subscription-plans"

const appEnv = process.env["APP_ENV"] ?? "development"
const polarAccessToken = process.env["POLAR_ACCESS_TOKEN"] ?? ""
const webOrigin = process.env["WEB_ORIGIN"] ?? "http://localhost:3000"

const polar = new Polar({
  accessToken: polarAccessToken,
  server: appEnv === "development" ? "sandbox" : "production",
})

const TIER_TO_PRODUCT_ID: Record<SubscriptionTier, string | undefined> = {
  free: undefined,
  pro: process.env["POLAR_PRO_PRODUCT_ID"],
  enterprise: process.env["POLAR_ENTERPRISE_PRODUCT_ID"],
}

export interface CheckoutSession {
  url: string
  checkoutId: string
  tier: SubscriptionTier
}

export const createSubscriptionCheckout = async (
  userId: string,
  email: string,
  customerId: string | null,
  tier: SubscriptionTier,
): Promise<Result<CheckoutSession, Error>> => {
  if (tier === "free") {
    return Result.err(new Error("Cannot create checkout for free tier"))
  }

  const productId = TIER_TO_PRODUCT_ID[tier]

  if (!productId) {
    return Result.err(new Error(`Product ID not configured for tier: ${tier}`))
  }

  return Result.tryPromise({
    try: async () => {
      const successUrl = `${webOrigin}/dashboard/subscription?success=true`

      const checkout = await polar.checkouts.create({
        products: [productId],
        successUrl,
        customerId: customerId ?? undefined,
        customerEmail: customerId ? undefined : email,
        metadata: {
          userId,
          tier,
          type: "subscription",
        },
      })

      const checkoutUrl = checkout.url
      if (!checkoutUrl) {
        throw new Error("Checkout URL not available")
      }

      return {
        url: checkoutUrl,
        checkoutId: checkout.id,
        tier,
      }
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to create subscription checkout"),
  })
}

export const createCustomerPortalSession = async (
  customerId: string,
): Promise<Result<string, Error>> => {
  return Result.tryPromise({
    try: async () => {
      const session = await polar.customerSessions.create({
        customerId,
      })

      const url = session.customerPortalUrl
      if (!url) {
        throw new Error("Customer portal URL not available")
      }

      return url
    },
    catch: (error) =>
      error instanceof Error
        ? error
        : new Error("Failed to create customer portal session"),
  })
}
