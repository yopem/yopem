import { describe, expect, test } from "vite-plus/test"

import { formatFileSize } from "utils/format-file-size"

describe("formatFileSize", () => {
  test("returns 0 B for zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B")
  })

  test("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B")
  })

  test("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2 KB")
  })

  test("formats megabytes", () => {
    expect(formatFileSize(5_242_880)).toBe("5 MB")
  })

  test("formats gigabytes", () => {
    expect(formatFileSize(1_073_741_824)).toBe("1 GB")
  })

  test("handles decimal values", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })
})
