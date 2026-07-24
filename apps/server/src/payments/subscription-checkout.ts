import { Polar } from "@polar-sh/sdk"

import {
  isDev,
  polarAccessToken,
  polarEnterpriseProductId,
  polarProProductId,
  webOrigin,
} from "env"

import type { SubscriptionTier } from "./subscription-plans"

const polar = new Polar({
  accessToken: polarAccessToken,
  server: isDev ? "sandbox" : "production",
})

const TIER_TO_PRODUCT_ID: Record<SubscriptionTier, string | undefined> = {
  free: undefined,
  pro: polarProProductId,
  enterprise: polarEnterpriseProductId,
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
): Promise<CheckoutSession> => {
  if (tier === "free") {
    throw new Error("Cannot create checkout for free tier")
  }

  const productId = TIER_TO_PRODUCT_ID[tier]

  if (!productId) {
    throw new Error(`Product ID not configured for tier: ${tier}`)
  }

  try {
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
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to create subscription checkout")
  }
}

export const createCustomerPortalSession = async (
  customerId: string,
): Promise<string> => {
  try {
    const session = await polar.customerSessions.create({
      customerId,
    })

    const url = session.customerPortalUrl
    if (!url) {
      throw new Error("Customer portal URL not available")
    }

    return url
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to create customer portal session")
  }
}
