import { PRODUCT_CREDITS_MAP, PRODUCT_SLUGS } from "./product-credits-map"

export interface ProductInfo {
  productId: string
  slug: string
  credits: number
  price: number
  currency: string
}

export const PRODUCT_PRICING_MAP: Record<
  string,
  { price: number; currency: string }
> = {
  starter: { price: 10, currency: "USD" },
  basic: { price: 40, currency: "USD" },
  pro: { price: 75, currency: "USD" },
  enterprise: { price: 350, currency: "USD" },
}

export function getProductsList(): ProductInfo[] {
  return Object.keys(PRODUCT_SLUGS).map((slug) => {
    const productId = PRODUCT_SLUGS[slug]
    return {
      productId,
      slug,
      credits: PRODUCT_CREDITS_MAP[productId] ?? 0,
      price: PRODUCT_PRICING_MAP[slug]?.price ?? 0,
      currency: PRODUCT_PRICING_MAP[slug]?.currency ?? "USD",
    }
  })
}
