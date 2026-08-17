import { describe, expect, test } from "vite-plus/test"

import { formatCurrency } from "utils/format-currency"

describe("formatCurrency", () => {
  test("formats amount in USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })

  test("formats amount in specified currency", () => {
    expect(formatCurrency(100, "EUR")).toBe("€100.00")
  })

  test("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  test("handles large numbers", () => {
    expect(formatCurrency(1_000_000)).toBe("$1,000,000.00")
  })
})
