const CREDITS_PER_DOLLAR = 10

export const MIN_TOPUP_AMOUNT = 1

export const MAX_TOPUP_AMOUNT = 1000

export function calculateCreditsFromAmount(amountInDollars: number): number {
  return Math.floor(amountInDollars * CREDITS_PER_DOLLAR)
}

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

  const decimalPlaces = (amount.toString().split(".")[1] || "").length
  if (decimalPlaces > 2) {
    return {
      isValid: false,
      error: "Amount must have at most 2 decimal places",
    }
  }

  return { isValid: true }
}
