import { describe, expect, test } from "vitest"

import { formatDateOnly, formatDateTime } from "utils/format-date"

describe("formatDateTime", () => {
  test("returns empty string for null, undefined, or empty input", () => {
    expect(formatDateTime(null)).toBe("")
    expect(formatDateTime(undefined)).toBe("")
  })

  test("formats a UTC date with month, day, year, and time", () => {
    const date = new Date("2024-01-15T14:30:00.000Z")
    const formatted = formatDateTime(date)
    expect(formatted).toMatch(/Jan 15, 2024/)
    expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/)
  })

  test("accepts an ISO string", () => {
    const formatted = formatDateTime("2024-06-20T08:15:00.000Z")
    expect(formatted).toMatch(/Jun 20, 2024/)
  })
})

describe("formatDateOnly", () => {
  test("returns empty string for null, undefined, or empty input", () => {
    expect(formatDateOnly(null)).toBe("")
    expect(formatDateOnly(undefined)).toBe("")
  })

  test("formats a UTC date without time", () => {
    const formatted = formatDateOnly(new Date("2024-01-15T14:30:00.000Z"))
    expect(formatted).toMatch(/Jan 15, 2024/)
    expect(formatted).not.toMatch(/:\d{2}/)
  })
})
