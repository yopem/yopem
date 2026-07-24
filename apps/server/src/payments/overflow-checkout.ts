import { Polar } from "@polar-sh/sdk"

import { isDev, polarAccessToken, webOrigin } from "env"

const polar = new Polar({
  accessToken: polarAccessToken,
  server: isDev ? "sandbox" : "production",
})

const PACK_SIZE_TO_PRODUCT_ID: Record<string, string | undefined> = {
  "100": "100",
  "500": "500",
}

export interface OverflowCheckoutSession {
  url: string
  checkoutId: string
  packSize: string
}

export const createOverflowCreditCheckout = async (
  userId: string,
  email: string,
  customerId: string | null,
  packSize: string,
): Promise<OverflowCheckoutSession> => {
  const productId = PACK_SIZE_TO_PRODUCT_ID[packSize]

  if (!productId) {
    throw new Error(
      `Overflow product ID not configured for pack size: ${packSize}`,
    )
  }

  try {
    const successUrl = `${webOrigin}/dashboard/subscription?success=credits`

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl,
      customerId: customerId ?? undefined,
      customerEmail: customerId ? undefined : email,
      metadata: {
        userId,
        type: "overflow_credits",
        packSize,
      },
    })

    const checkoutUrl = checkout.url
    if (!checkoutUrl) {
      throw new Error("Checkout URL not available")
    }

    return {
      url: checkoutUrl,
      checkoutId: checkout.id,
      packSize,
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Failed to create overflow credit checkout")
  }
}
