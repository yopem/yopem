/**
 * Credit calculation utilities for the pay-what-you-want credit system
 */

/**
 * Number of credits per dollar
 * Ratio: $10 → 100 credits
 */
const CREDITS_PER_DOLLAR = 10

/**
 * Minimum top-up amount in dollars
 */
export const MIN_TOPUP_AMOUNT = 1

/**
 * Maximum top-up amount in dollars
 */
export const MAX_TOPUP_AMOUNT = 1000

/**
 * Calculate credits from a dollar amount
 * @param amountInDollars - The amount in dollars
 * @returns The number of credits (floored to integer)
 */
export function calculateCreditsFromAmount(amountInDollars: number): number {
  return Math.floor(amountInDollars * CREDITS_PER_DOLLAR)
}

/**
 * Validate a top-up amount
 * @param amount - The amount to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateTopupAmount(amount: number): {
  isValid: boolean
  error?: string
} {
  if (Number.isNaN(amount)) {
    return { isValid: false, error: "Amount must be a valid number" }
  }

  if (amount < MIN_TOPUP_AMOUNT) {
    return {
      isValid: false,
      error: `Amount must be at least $${MIN_TOPUP_AMOUNT}`,
    }
  }

  if (amount > MAX_TOPUP_AMOUNT) {
    return {
      isValid: false,
      error: `Amount must not exceed $${MAX_TOPUP_AMOUNT}`,
    }
  }

  // Check for reasonable decimal precision (2 decimal places max)
  const decimalPlaces = (amount.toString().split(".")[1] || "").length
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: "Amount must have at most 2 decimal places",
    }
  }

  return { isValid: true }
}
