import { describe, expect, test } from "vite-plus/test"

import { formatNumberToFixed } from "utils/format-number-to-fixed"

describe("formatNumberToFixed", () => {
  test("returns string for small numbers", () => {
    expect(formatNumberToFixed(42)).toBe("42")
  })

  test("formats thousands with k suffix", () => {
    expect(formatNumberToFixed(1500)).toBe("1.5k")
  })

  test("formats millions with M suffix", () => {
    expect(formatNumberToFixed(2_500_000)).toBe("2.5M")
  })

  test("handles exact thousand boundary", () => {
    expect(formatNumberToFixed(1000)).toBe("1.0k")
  })

  test("handles exact million boundary", () => {
    expect(formatNumberToFixed(1_000_000)).toBe("1.0M")
  })

  test("handles zero", () => {
    expect(formatNumberToFixed(0)).toBe("0")
  })
})
