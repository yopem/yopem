import {
  polarProductBasicId,
  polarProductEnterpriseId,
  polarProductProId,
  polarProductStarterId,
} from "@/lib/env/server"
import { logger } from "@/lib/utils/logger"

export const PRODUCT_CREDITS_MAP: Record<string, number> = {
  [polarProductStarterId]: 100,
  [polarProductBasicId]: 500,
  [polarProductProId]: 2000,
  [polarProductEnterpriseId]: 10000,
}

export const PRODUCT_SLUGS: Record<string, string> = {
  starter: polarProductStarterId,
  basic: polarProductBasicId,
  pro: polarProductProId,
  enterprise: polarProductEnterpriseId,
}

export function getProductIdFromSlug(slug: string): string | null {
  return PRODUCT_SLUGS[slug] ?? null
}

export function validateAndGetCredits(
  productId: string,
  metadata?: Record<string, string>,
): number | null {
  const mappedCredits = PRODUCT_CREDITS_MAP[productId]

  if (!mappedCredits) {
    logger.error(`Unknown product ID: ${productId}`)
    return null
  }

  if (metadata?.["credits"]) {
    const metadataCredits = Number.parseInt(metadata["credits"], 10)

    if (Number.isNaN(metadataCredits) || metadataCredits <= 0) {
      logger.error(`Invalid credits in metadata: ${metadata["credits"]}`)
      return null
    }

    if (metadataCredits !== mappedCredits) {
      logger.error(
        `Credits mismatch: metadata=${metadataCredits}, expected=${mappedCredits}`,
      )
      return null
    }
  }

  return mappedCredits
}
